
-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  name_part text;
  domain_part text;
  masked_name text;
BEGIN
  IF p_email IS NULL THEN RETURN NULL; END IF;
  name_part := split_part(p_email, '@', 1);
  domain_part := split_part(p_email, '@', 2);
  IF length(name_part) <= 2 THEN
    masked_name := left(name_part, 1) || '*';
  ELSE
    masked_name := left(name_part, 2) || repeat('*', greatest(length(name_part) - 2, 1));
  END IF;
  RETURN masked_name || '@' || domain_part;
END;
$$;

CREATE OR REPLACE FUNCTION public.floor_to_window(ts timestamp with time zone, seconds integer)
RETURNS timestamp with time zone LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT date_trunc('second', ts) - make_interval(secs => (extract('epoch' from ts)::int % seconds))
$$;

-- ============================================================================
-- USERS, PROFILES, ROLES
-- ============================================================================
CREATE TABLE public.users (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'explore',
  subscription_package TEXT,
  subscription_status TEXT DEFAULT 'active',
  subscribed BOOLEAN DEFAULT false,
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  ai_credits_total INTEGER DEFAULT 5,
  ai_credits_used INTEGER DEFAULT 0,
  ai_credits_remaining INTEGER DEFAULT 5,
  ai_usage_year INTEGER,
  ai_usage_month INTEGER,
  next_billing_date TIMESTAMPTZ,
  billing_cycle_start TIMESTAMPTZ,
  grace_period_end TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  granted_by UUID,
  granted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role functions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_role(_role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = (SELECT auth.uid()) AND role = _role::app_role)
$$;

-- ============================================================================
-- SUBSCRIBERS / BILLING
-- ============================================================================
CREATE TABLE public.subscribers_public (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_package TEXT,
  subscription_end TIMESTAMPTZ,
  subscription_start_date TIMESTAMPTZ,
  billing_cycle_start TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  free_tier_start_date TIMESTAMPTZ,
  ai_request_limit INTEGER DEFAULT 5,
  monthly_ai_requests INTEGER DEFAULT 0,
  extra_credits INTEGER DEFAULT 0,
  rollover_credits INTEGER DEFAULT 0,
  last_request_reset TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  payment_retry_count INTEGER DEFAULT 0,
  account_status TEXT DEFAULT 'active',
  grace_period_end TIMESTAMPTZ,
  abuse_flags INTEGER DEFAULT 0,
  moderation_flags INTEGER DEFAULT 0,
  last_flag_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscribers_public ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subscribers_secure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscribers_secure ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  credit_limit INTEGER NOT NULL DEFAULT 0,
  rollover_cap_multiplier NUMERIC NOT NULL DEFAULT 2.0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AI USAGE / ANALYTICS / RATE LIMITING
-- ============================================================================
CREATE TABLE public.tool_usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  estimated_tokens INTEGER,
  estimated_cost_usd NUMERIC,
  month_year TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tool_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_month_year()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.month_year := to_char(NEW.created_at, 'YYYY-MM');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_month_year_trigger BEFORE INSERT ON public.tool_usage_analytics
  FOR EACH ROW EXECUTE FUNCTION public.set_month_year();

CREATE TABLE public.api_user_usage (
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, window_start)
);
ALTER TABLE public.api_user_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.api_ip_usage (
  ip INET NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, endpoint, window_start)
);
ALTER TABLE public.api_ip_usage ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.api_request_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  endpoint TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  request_duration_ms INTEGER,
  credits_charged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.api_request_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.credit_deduction_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  endpoint TEXT NOT NULL,
  credits_deducted INTEGER NOT NULL,
  request_hash TEXT,
  deducted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.credit_deduction_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.ai_service_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL,
  response_time_ms INTEGER,
  error_message TEXT,
  workspace_paused BOOLEAN DEFAULT false,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ai_service_status ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rate_limit_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_level TEXT NOT NULL,
  requests_per_minute INTEGER NOT NULL,
  rate_limit INTEGER NOT NULL,
  percentage_used NUMERIC NOT NULL,
  active_tools JSONB,
  notes TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
ALTER TABLE public.rate_limit_alerts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.moderation_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  function_name TEXT NOT NULL,
  input_text TEXT NOT NULL,
  flagged BOOLEAN NOT NULL,
  categories JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TOOL DATA
-- ============================================================================
CREATE TABLE public.assessment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL,
  results JSONB NOT NULL,
  detailed_analysis JSONB,
  action_plan JSONB,
  score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.side_income_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  credits_used INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.side_income_assessments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.side_income_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  report_content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.side_income_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  assessment_type TEXT NOT NULL,
  progress_data JSONB NOT NULL,
  milestone TEXT,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  tool_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  context_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.result_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  result_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  feedback_text TEXT,
  improvement_suggestions TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.result_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COURSE SYSTEM
-- ============================================================================
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress NUMERIC DEFAULT 0
);
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.activity_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  submission_text TEXT,
  submission_file_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AUDIT / SECURITY
-- ============================================================================
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  target_user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (admin_user_id, action_type, window_start)
);
ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.subscription_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.subscription_audit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.signup_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  flagged_as_suspicious BOOLEAN NOT NULL DEFAULT false,
  fraud_reason TEXT,
  accounts_from_ip INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.signup_audit ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.auth_failed_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.auth_failed_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.auth_lockouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  locked_until TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.auth_lockouts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.storage_access_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bucket_id TEXT NOT NULL,
  object_name TEXT NOT NULL,
  access_granted BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.storage_access_audit ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.checkout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  stripe_session_id TEXT NOT NULL,
  session_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.processed_stripe_events (
  event_id TEXT NOT NULL PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_successfully BOOLEAN NOT NULL DEFAULT true,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.webhook_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  signature_valid BOOLEAN NOT NULL,
  processing_status TEXT NOT NULL,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.webhook_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- Reset monthly AI requests
CREATE OR REPLACE FUNCTION public.reset_monthly_ai_requests()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_record RECORD;
  v_months_passed INTEGER;
  v_next_reset_date TIMESTAMPTZ;
BEGIN
  UPDATE public.subscribers_public
  SET 
    rollover_credits = LEAST(
      ai_request_limit * 2,
      GREATEST(0, (ai_request_limit + extra_credits + rollover_credits) - monthly_ai_requests)
    ),
    monthly_ai_requests = 0,
    last_request_reset = now(),
    next_billing_date = next_billing_date + INTERVAL '1 month'
  WHERE subscribed = true 
    AND next_billing_date IS NOT NULL
    AND next_billing_date <= now();
  
  FOR v_record IN 
    SELECT user_id, free_tier_start_date, last_request_reset
    FROM public.subscribers_public
    WHERE subscribed = false AND free_tier_start_date IS NOT NULL
  LOOP
    v_months_passed := FLOOR(EXTRACT(EPOCH FROM (now() - v_record.free_tier_start_date)) / (30.44 * 24 * 60 * 60))::INTEGER;
    v_next_reset_date := v_record.free_tier_start_date + (v_months_passed || ' months')::INTERVAL;
    IF now() >= v_next_reset_date AND v_record.last_request_reset < v_next_reset_date THEN
      UPDATE public.subscribers_public
      SET rollover_credits = 0, monthly_ai_requests = 0, last_request_reset = now()
      WHERE user_id = v_record.user_id;
    END IF;
  END LOOP;
END;
$$;

-- Check and increment AI usage
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid, p_tool_name text DEFAULT 'generic', p_credits_to_use integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_subscriber RECORD;
  v_can_use BOOLEAN := false;
  v_reason TEXT := '';
  v_total_available INTEGER;
  v_estimated_tokens INTEGER := 1500;
  v_estimated_cost NUMERIC := 0;
BEGIN
  PERFORM reset_monthly_ai_requests();
  SELECT * INTO v_subscriber FROM public.subscribers_public WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_use', false, 'reason', 'no_subscription', 'remaining', 0, 'total_used', 0, 'total_available', 0, 'rollover_credits', 0, 'credits_charged', 0);
  END IF;
  
  IF v_subscriber.account_status = 'suspended' THEN
    RETURN jsonb_build_object('can_use', false, 'reason', 'account_suspended', 'remaining', 0, 'total_used', v_subscriber.monthly_ai_requests, 'total_available', 0, 'rollover_credits', v_subscriber.rollover_credits, 'credits_charged', 0);
  END IF;
  
  v_total_available := COALESCE(v_subscriber.ai_request_limit, 5) + COALESCE(v_subscriber.extra_credits, 0) + COALESCE(v_subscriber.rollover_credits, 0);
  
  IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_available THEN
    UPDATE public.subscribers_public SET monthly_ai_requests = monthly_ai_requests + p_credits_to_use WHERE user_id = p_user_id;
    INSERT INTO public.tool_usage_analytics (user_id, tool_name, credits_used, estimated_tokens, estimated_cost_usd)
    VALUES (p_user_id, p_tool_name, p_credits_to_use, v_estimated_tokens, v_estimated_cost);
    v_can_use := true;
  ELSE
    v_reason := 'limit_exceeded';
  END IF;
  
  RETURN jsonb_build_object(
    'can_use', v_can_use, 'reason', v_reason,
    'remaining', GREATEST(0, v_total_available - v_subscriber.monthly_ai_requests - CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END),
    'total_used', v_subscriber.monthly_ai_requests + CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END,
    'total_available', v_total_available,
    'rollover_credits', v_subscriber.rollover_credits,
    'credits_charged', CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.check_and_increment_ai_usage(p_user_id, 'generic', 1);
END;
$$;

-- Throttling
CREATE OR REPLACE FUNCTION public.throttle_user(p_user_id uuid, p_endpoint text, p_window_seconds integer, p_max_reqs integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w_start TIMESTAMPTZ;
  cur_count INTEGER;
BEGIN
  w_start := floor_to_window(NOW(), p_window_seconds);
  INSERT INTO public.api_user_usage(user_id, endpoint, window_start, count)
  VALUES (p_user_id, p_endpoint, w_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET count = public.api_user_usage.count + 1
  RETURNING public.api_user_usage.count INTO cur_count;
  IF cur_count > p_max_reqs THEN RAISE EXCEPTION 'USER_RATE_LIMIT_EXCEEDED'; END IF;
  DELETE FROM public.api_user_usage WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;

CREATE OR REPLACE FUNCTION public.throttle_ip(p_ip text, p_endpoint text, p_window_seconds integer, p_max_reqs integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w_start timestamptz;
  ip_inet inet;
  cur_count int;
BEGIN
  w_start := floor_to_window(now(), p_window_seconds);
  ip_inet := p_ip::inet;
  INSERT INTO public.api_ip_usage(ip, endpoint, window_start, count)
  VALUES (ip_inet, p_endpoint, w_start, 1)
  ON CONFLICT (ip, endpoint, window_start)
  DO UPDATE SET count = public.api_ip_usage.count + 1
  RETURNING public.api_ip_usage.count INTO cur_count;
  IF cur_count > p_max_reqs THEN RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED'; END IF;
  DELETE FROM public.api_ip_usage WHERE window_start < now() - interval '24 hours';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(p_admin_user_id uuid, p_action_type text, p_max_actions integer DEFAULT 100, p_window_minutes integer DEFAULT 60)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_action_count INTEGER;
BEGIN
  v_window_start := date_trunc('hour', now() - (p_window_minutes || ' minutes')::INTERVAL);
  INSERT INTO public.admin_rate_limits (admin_user_id, action_type, window_start, action_count)
  VALUES (p_admin_user_id, p_action_type, v_window_start, 1)
  ON CONFLICT (admin_user_id, action_type, window_start)
  DO UPDATE SET action_count = admin_rate_limits.action_count + 1
  RETURNING action_count INTO v_action_count;
  IF v_action_count > p_max_actions THEN RETURN FALSE; END IF;
  DELETE FROM public.admin_rate_limits WHERE window_start < now() - INTERVAL '24 hours';
  RETURN TRUE;
END;
$$;

-- Account lockout
CREATE OR REPLACE FUNCTION public.check_account_lockout(p_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_lockout RECORD;
  v_failed_attempts INT;
  v_lockout_until timestamptz;
BEGIN
  SELECT * INTO v_lockout FROM public.auth_lockouts WHERE email = p_email AND locked_until > now();
  IF FOUND THEN
    RETURN jsonb_build_object('locked', true, 'locked_until', v_lockout.locked_until, 'reason', v_lockout.reason);
  END IF;
  SELECT COUNT(*) INTO v_failed_attempts FROM public.auth_failed_attempts WHERE email = p_email AND attempted_at > now() - interval '15 minutes';
  IF v_failed_attempts >= 5 THEN
    v_lockout_until := now() + interval '30 minutes';
    INSERT INTO public.auth_lockouts (email, locked_until, reason)
    VALUES (p_email, v_lockout_until, 'Too many failed login attempts')
    ON CONFLICT (email) DO UPDATE SET locked_until = v_lockout_until, created_at = now();
    RETURN jsonb_build_object('locked', true, 'locked_until', v_lockout_until, 'reason', 'Account temporarily locked due to multiple failed login attempts');
  END IF;
  RETURN jsonb_build_object('locked', false, 'remaining_attempts', 5 - v_failed_attempts);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_failed_login(p_email text, p_ip inet, p_user_agent text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.auth_failed_attempts (email, ip_address, user_agent) VALUES (p_email, p_ip, p_user_agent);
  DELETE FROM public.auth_failed_attempts WHERE attempted_at < now() - interval '24 hours';
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_account_lockout(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.auth_lockouts WHERE email = p_email;
  DELETE FROM public.auth_failed_attempts WHERE email = p_email;
END;
$$;

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_old_health_checks()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN DELETE FROM ai_service_status WHERE checked_at < NOW() - INTERVAL '24 hours'; END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_contexts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN DELETE FROM public.conversation_context WHERE expires_at < now(); END;
$$;

-- Admin helper functions
CREATE OR REPLACE FUNCTION public.get_subscriber_secure_data(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(user_id uuid, email_masked text, has_stripe_customer boolean, has_stripe_subscription boolean, created_at timestamptz, updated_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY
  SELECT s.user_id, mask_email(s.email), (s.stripe_customer_id IS NOT NULL), (s.stripe_subscription_id IS NOT NULL), s.created_at, s.updated_at
  FROM subscribers_secure s
  WHERE target_user_id IS NULL OR s.user_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_billing_profile()
RETURNS TABLE(user_id uuid, email_masked text, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, public.mask_email(s.email), s.created_at, s.updated_at
  FROM public.subscribers_secure s WHERE s.user_id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.get_admin_cost_analysis()
RETURNS TABLE(email text, subscription_package text, subscribed boolean, month_year text, total_credits bigint, total_cost_usd numeric, monthly_revenue numeric, profit_margin numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Access denied. Admin privileges required.'; END IF;
  RETURN QUERY
  SELECT ss.email, sp.subscription_package, sp.subscribed, to_char(now(), 'YYYY-MM'),
    0::bigint, 0::numeric, 0::numeric, 0::numeric
  FROM subscribers_public sp
  JOIN subscribers_secure ss ON ss.user_id = sp.user_id
  WHERE sp.subscribed = true;
END;
$$;

-- ============================================================================
-- AUTH TRIGGERS (handle_new_user + auto admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.users (id, email, display_name, subscription_tier, ai_credits_remaining, ai_credits_total)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)), 'explore', 5, 5)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.subscribers_public (user_id, subscribed, ai_request_limit, monthly_ai_requests, extra_credits, rollover_credits, account_status, free_tier_start_date, last_request_reset)
  VALUES (NEW.id, false, 5, 0, 0, 0, 'active', now(), now())
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.subscribers_secure (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.auto_grant_first_user_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role, granted_by) VALUES (NEW.id, 'admin', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_grant_first_user_admin();

-- updated_at triggers
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subscribers_public_updated_at BEFORE UPDATE ON public.subscribers_public FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subscribers_secure_updated_at BEFORE UPDATE ON public.subscribers_secure FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pricing_plans_updated_at BEFORE UPDATE ON public.pricing_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_assessment_results_updated_at BEFORE UPDATE ON public.assessment_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_side_income_assessments_updated_at BEFORE UPDATE ON public.side_income_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_conversation_context_updated_at BEFORE UPDATE ON public.conversation_context FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_activity_submissions_updated_at BEFORE UPDATE ON public.activity_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- users
CREATE POLICY "Users view own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins view all users" ON public.users FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all users" ON public.users FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role users" ON public.users FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- profiles
CREATE POLICY "Users view own profile or admin" ON public.profiles FOR SELECT USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles or admin" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- subscribers_public
CREATE POLICY "Users view own sub or admin" ON public.subscribers_public FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own sub" ON public.subscribers_public FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sub" ON public.subscribers_public FOR UPDATE USING (auth.uid() = user_id);

-- subscribers_secure
CREATE POLICY "subscribers_secure: deny anon" ON public.subscribers_secure FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "subscribers_secure: owner read" ON public.subscribers_secure FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "subscribers_secure: owner delete" ON public.subscribers_secure FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "subscribers_secure: admin update" ON public.subscribers_secure FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "subscribers_secure: service all" ON public.subscribers_secure FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pricing_plans
CREATE POLICY "pricing_plans public read" ON public.pricing_plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "pricing_plans admin write" ON public.pricing_plans FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- tool_usage_analytics
CREATE POLICY "Users view own usage" ON public.tool_usage_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all usage" ON public.tool_usage_analytics FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert usage" ON public.tool_usage_analytics FOR INSERT TO service_role WITH CHECK (true);

-- api_user_usage
CREATE POLICY "User view own api usage" ON public.api_user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin view api usage" ON public.api_user_usage FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service all api usage" ON public.api_user_usage FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- api_ip_usage
CREATE POLICY "Service all api ip" ON public.api_ip_usage FOR ALL TO service_role USING (true) WITH CHECK (true);

-- api_request_log
CREATE POLICY "User view own request log" ON public.api_request_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin view request log" ON public.api_request_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert request log" ON public.api_request_log FOR INSERT TO service_role WITH CHECK (true);

-- credit_deduction_log
CREATE POLICY "User view own credit log" ON public.credit_deduction_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service all credit log" ON public.credit_deduction_log FOR ALL USING (auth.role() = 'service_role');

-- ai_service_status
CREATE POLICY "Admin view ai status" ON public.ai_service_status FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert ai status" ON public.ai_service_status FOR INSERT TO service_role WITH CHECK (true);

-- rate_limit_alerts
CREATE POLICY "Admin view alerts" ON public.rate_limit_alerts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert alerts" ON public.rate_limit_alerts FOR INSERT TO service_role WITH CHECK (true);

-- moderation_log
CREATE POLICY "Admin view moderation" ON public.moderation_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert moderation" ON public.moderation_log FOR INSERT TO service_role WITH CHECK (true);

-- assessment_results
CREATE POLICY "Users view own assessments" ON public.assessment_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all assessments" ON public.assessment_results FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own assessments" ON public.assessment_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own assessments" ON public.assessment_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own assessments" ON public.assessment_results FOR DELETE USING (auth.uid() = user_id);

-- side_income_assessments
CREATE POLICY "Users manage own side income" ON public.side_income_assessments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- side_income_reports
CREATE POLICY "Users view own reports" ON public.side_income_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service insert reports" ON public.side_income_reports FOR INSERT TO service_role WITH CHECK (true);

-- user_progress
CREATE POLICY "Users manage own progress" ON public.user_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_preferences
CREATE POLICY "Users manage own prefs" ON public.user_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- conversation_context
CREATE POLICY "Users manage own context" ON public.conversation_context FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- result_feedback
CREATE POLICY "Users view own feedback" ON public.result_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own feedback" ON public.result_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own feedback" ON public.result_feedback FOR DELETE USING (auth.uid() = user_id);

-- course_enrollments
CREATE POLICY "Users manage own enrollments" ON public.course_enrollments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lesson_progress
CREATE POLICY "Users view own lesson progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own lesson progress" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own lesson progress" ON public.lesson_progress FOR DELETE USING (auth.uid() = user_id);

-- quiz_results
CREATE POLICY "Users view own quiz" ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own quiz" ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own quiz" ON public.quiz_results FOR DELETE USING (auth.uid() = user_id);

-- activity_submissions
CREATE POLICY "Users manage own submissions" ON public.activity_submissions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- admin_audit_log
CREATE POLICY "Admins view audit" ON public.admin_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert audit" ON public.admin_audit_log FOR INSERT TO service_role WITH CHECK (true);

-- admin_rate_limits
CREATE POLICY "Service all admin rate" ON public.admin_rate_limits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- subscription_audit_log
CREATE POLICY "Admins view sub audit" ON public.subscription_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert sub audit" ON public.subscription_audit_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- signup_audit
CREATE POLICY "Admins view signup audit" ON public.signup_audit FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert signup audit" ON public.signup_audit FOR INSERT TO service_role WITH CHECK (true);

-- auth_failed_attempts
CREATE POLICY "Admins view failed" ON public.auth_failed_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert failed" ON public.auth_failed_attempts FOR INSERT TO service_role WITH CHECK (true);

-- auth_lockouts
CREATE POLICY "Service all lockouts" ON public.auth_lockouts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- storage_access_audit
CREATE POLICY "Admins view storage audit" ON public.storage_access_audit FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert storage audit" ON public.storage_access_audit FOR INSERT TO service_role WITH CHECK (true);

-- checkout_sessions
CREATE POLICY "checkout owner read" ON public.checkout_sessions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "checkout owner insert" ON public.checkout_sessions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- processed_stripe_events
CREATE POLICY "Service all stripe events" ON public.processed_stripe_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- webhook_audit_log
CREATE POLICY "Admin view webhook audit" ON public.webhook_audit_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service insert webhook audit" ON public.webhook_audit_log FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-media', 'course-media', false),
  ('course-materials', 'course-materials', false),
  ('student-submissions', 'student-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins manage course-media" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'course-media' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'course-media' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read course-media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'course-media');

CREATE POLICY "Admins manage course-materials" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'course-materials' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'course-materials' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read course-materials" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'course-materials');

CREATE POLICY "Users upload own submissions" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own submissions" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-submissions' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users update own submissions" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own submissions" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-submissions' AND (auth.uid()::text = (storage.foldername(name))[1] OR has_role(auth.uid(), 'admin'::app_role)));
