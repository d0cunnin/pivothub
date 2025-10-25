-- ==========================================
-- PRIORITY 1: PRICING PLANS TABLE (Single Source of Truth)
-- ==========================================

-- Create pricing plans table
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  plan_code text PRIMARY KEY,
  display_name text NOT NULL,
  price_cents int NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  credit_limit int NOT NULL DEFAULT 0,
  rollover_cap_multiplier numeric NOT NULL DEFAULT 2.0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  stripe_price_id text,
  effective_from timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert current pricing (matching existing system)
INSERT INTO public.pricing_plans (plan_code, display_name, price_cents, credit_limit, features, stripe_price_id) VALUES
('explore', 'Explore Mode', 0, 5, '["5 credits per month", "Monthly reset (no rollover)", "Access to all tools"]'::jsonb, NULL),
('assess_prep_learn', 'Assess It + Prep It + Learn It', 1800, 75, '["75 credits/month", "Rollover up to 2× monthly limit", "Career assessments", "Resume & interview coaching", "Learning modules"]'::jsonb, 'price_1QQ6smP2s1zvDPzaHzTNdZp6'),
('build_teach_launch', 'Build It + Teach It + Launch It', 1800, 75, '["75 credits/month", "Rollover up to 2× monthly limit", "Business plan generator", "Teaching materials", "Marketing strategy"]'::jsonb, 'price_1QQ6t5P2s1zvDPzaWqzSMGnY'),
('fund_it', 'Fund It Package', 1500, 60, '["60 credits/month", "Rollover up to 2× monthly limit", "Grant finder", "Grant content generator", "Business resources"]'::jsonb, 'price_1QQ6tIP2s1zvDPzaWf6SQoYy'),
('all_access', 'All Access Pass', 2900, 150, '["150 credits/month", "Rollover up to 2× monthly limit", "All tools & features", "Priority support", "Early access to new features"]'::jsonb, 'price_1QQ6twP2s1zvDPzaWlJ4YJXz');

-- Create public read-only view with security_barrier (views inherit RLS from base table)
CREATE OR REPLACE VIEW public.v_public_pricing
WITH (security_barrier = true) AS
SELECT plan_code, display_name, price_cents, currency, credit_limit, rollover_cap_multiplier, features
FROM public.pricing_plans
WHERE is_active = true
ORDER BY price_cents ASC;

-- Enable RLS on base table (view inherits this)
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pricing_plans: public read"
ON public.pricing_plans
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "pricing_plans: admin write"
ON public.pricing_plans
FOR ALL
TO authenticated
USING (has_role('admin'))
WITH CHECK (has_role('admin'));

COMMENT ON TABLE public.pricing_plans IS 'Single source of truth for pricing. Frontend must fetch from v_public_pricing view.';

-- ==========================================
-- PRIORITY 1: HARDEN REMAINING SECURITY DEFINER FUNCTIONS
-- ==========================================

-- Fix: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', new.email));
  RETURN new;
END;
$$;

-- Fix: check_admin_rate_limit
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(p_admin_user_id uuid, p_action_type text, p_max_actions integer DEFAULT 100, p_window_minutes integer DEFAULT 60)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_action_count INTEGER;
BEGIN
  v_window_start := date_trunc('hour', now() - (p_window_minutes || ' minutes')::INTERVAL);
  
  INSERT INTO public.admin_rate_limits (admin_user_id, action_type, window_start, action_count)
  VALUES (p_admin_user_id, p_action_type, v_window_start, 1)
  ON CONFLICT (admin_user_id, action_type, window_start)
  DO UPDATE SET action_count = admin_rate_limits.action_count + 1
  RETURNING action_count INTO v_action_count;
  
  IF v_action_count > p_max_actions THEN
    RETURN FALSE;
  END IF;
  
  DELETE FROM public.admin_rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
  
  RETURN TRUE;
END;
$$;

-- Fix: check_and_increment_ai_usage (single param version)
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.check_and_increment_ai_usage(p_user_id, 'generic', 1);
END;
$$;

-- Fix: check_and_increment_ai_usage (main version)
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid, p_tool_name text DEFAULT 'generic', p_credits_to_use integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscriber RECORD;
  v_can_use BOOLEAN := false;
  v_reason TEXT := '';
  v_total_limit INTEGER;
  v_total_available INTEGER;
  v_estimated_tokens INTEGER := 0;
  v_estimated_cost DECIMAL(10, 4) := 0;
BEGIN
  PERFORM reset_monthly_ai_requests();
  
  SELECT * INTO v_subscriber
  FROM public.subscribers_public
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_use', false,
      'reason', 'no_subscription',
      'remaining', 0,
      'total_used', 0,
      'total_available', 0,
      'rollover_credits', 0,
      'credits_charged', 0
    );
  END IF;
  
  IF v_subscriber.account_status = 'suspended' THEN
    RETURN jsonb_build_object(
      'can_use', false,
      'reason', 'account_suspended',
      'remaining', 0,
      'total_used', v_subscriber.monthly_ai_requests,
      'total_available', v_subscriber.ai_request_limit + v_subscriber.extra_credits + v_subscriber.rollover_credits,
      'rollover_credits', v_subscriber.rollover_credits,
      'credits_charged', 0
    );
  END IF;
  
  v_total_limit := v_subscriber.ai_request_limit + v_subscriber.extra_credits;
  v_total_available := v_total_limit + v_subscriber.rollover_credits;
  
  v_estimated_tokens := CASE p_tool_name
    WHEN 'teaching-materials' THEN 10000
    WHEN 'business-plan' THEN 8000
    WHEN 'grant-content' THEN 8000
    WHEN 'pitch-deck' THEN 6000
    WHEN 'marketing-strategy' THEN 6000
    WHEN 'legal-docs' THEN 6000
    WHEN 'business-idea' THEN 4000
    WHEN 'social-media' THEN 3000
    WHEN 'resume-analyzer' THEN 3000
    WHEN 'interview-feedback' THEN 3000
    WHEN 'business-foundation' THEN 3000
    WHEN 'grant-finder' THEN 2000
    ELSE 1500
  END;
  
  v_estimated_cost := (v_estimated_tokens * 0.2 * 2.50 / 1000000) + 
                      (v_estimated_tokens * 0.8 * 10.00 / 1000000);
  
  IF v_subscriber.subscribed OR v_subscriber.grace_period_end IS NOT NULL THEN
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_available THEN
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + p_credits_to_use
      WHERE user_id = p_user_id;
      
      INSERT INTO public.tool_usage_analytics (
        user_id, 
        tool_name, 
        credits_used, 
        estimated_tokens,
        estimated_cost_usd
      ) VALUES (
        p_user_id, 
        p_tool_name, 
        p_credits_to_use,
        v_estimated_tokens,
        v_estimated_cost
      );
      
      v_can_use := true;
    ELSE
      v_reason := 'limit_exceeded';
    END IF;
  ELSE
    v_total_available := 5;
    
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_available THEN
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + p_credits_to_use
      WHERE user_id = p_user_id;
      
      INSERT INTO public.tool_usage_analytics (
        user_id, 
        tool_name, 
        credits_used,
        estimated_tokens,
        estimated_cost_usd
      ) VALUES (
        p_user_id, 
        p_tool_name, 
        p_credits_to_use,
        v_estimated_tokens,
        v_estimated_cost
      );
      
      v_can_use := true;
    ELSE
      v_reason := 'free_limit_exceeded';
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'can_use', v_can_use,
    'reason', v_reason,
    'remaining', GREATEST(0, v_total_available - v_subscriber.monthly_ai_requests - CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END),
    'total_used', v_subscriber.monthly_ai_requests + CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END,
    'total_available', v_total_available,
    'rollover_credits', v_subscriber.rollover_credits,
    'credits_charged', CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END
  );
END;
$$;

-- Fix: get_admin_cost_analysis
CREATE OR REPLACE FUNCTION public.get_admin_cost_analysis()
RETURNS TABLE(email text, subscription_package text, subscribed boolean, month_year text, total_credits bigint, total_cost_usd numeric, monthly_revenue numeric, profit_margin numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    ss.email,
    sp.subscription_package,
    sp.subscribed,
    COALESCE(mus.month_year, to_char(now(), 'YYYY-MM')) AS month_year,
    COALESCE(mus.total_credits, 0::bigint) AS total_credits,
    COALESCE(mus.total_cost_usd, 0::numeric) AS total_cost_usd,
    CASE
      WHEN sp.subscription_package = 'all-access' THEN 29.00
      WHEN sp.subscription_package = 'assess-prep-learn' THEN 18.00
      WHEN sp.subscription_package = 'build-teach-launch' THEN 18.00
      WHEN sp.subscription_package = 'fund-it' THEN 15.00
      ELSE 0::numeric
    END AS monthly_revenue,
    (
      CASE
        WHEN sp.subscription_package = 'all-access' THEN 29.00
        WHEN sp.subscription_package = 'assess-prep-learn' THEN 18.00
        WHEN sp.subscription_package = 'build-teach-launch' THEN 18.00
        WHEN sp.subscription_package = 'fund-it' THEN 15.00
        ELSE 0::numeric
      END - COALESCE(mus.total_cost_usd, 0::numeric)
    ) AS profit_margin
  FROM subscribers_public sp
  JOIN subscribers_secure ss ON ss.user_id = sp.user_id
  LEFT JOIN monthly_usage_summary mus ON sp.user_id = mus.user_id 
    AND mus.month_year = to_char(now(), 'YYYY-MM')
  WHERE sp.subscribed = true
  ORDER BY profit_margin;
END;
$$;

-- Fix: auto_grant_first_user_admin
CREATE OR REPLACE FUNCTION public.auto_grant_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (NEW.id, 'admin', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix: reset_monthly_ai_requests
CREATE OR REPLACE FUNCTION public.reset_monthly_ai_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_months_passed INTEGER;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
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
    WHERE subscribed = false
      AND free_tier_start_date IS NOT NULL
  LOOP
    v_months_passed := FLOOR(
      EXTRACT(EPOCH FROM (now() - v_record.free_tier_start_date)) / (30.44 * 24 * 60 * 60)
    )::INTEGER;
    
    v_next_reset_date := v_record.free_tier_start_date + (v_months_passed || ' months')::INTERVAL;
    
    IF now() >= v_next_reset_date 
       AND v_record.last_request_reset < v_next_reset_date THEN
      
      UPDATE public.subscribers_public
      SET 
        rollover_credits = 0,
        monthly_ai_requests = 0,
        last_request_reset = now()
      WHERE user_id = v_record.user_id;
      
    END IF;
  END LOOP;
  
  UPDATE public.subscribers_public
  SET 
    subscribed = false,
    subscription_end = NULL,
    subscription_package = NULL,
    subscription_tier = NULL,
    subscription_start_date = NULL,
    billing_cycle_start = NULL,
    next_billing_date = NULL,
    ai_request_limit = 5,
    rollover_credits = 0,
    monthly_ai_requests = 0,
    extra_credits = 0,
    free_tier_start_date = now(),
    last_request_reset = now(),
    payment_retry_count = 0,
    account_status = 'active',
    grace_period_end = NULL
  WHERE grace_period_end IS NOT NULL
    AND grace_period_end <= now()
    AND subscribed = true;
END;
$$;

-- Fix: get_my_payment_status
CREATE OR REPLACE FUNCTION public.get_my_payment_status(assessment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status text;
BEGIN
  SELECT 
    CASE 
      WHEN payment_status = 'paid' THEN 'paid'
      WHEN payment_status = 'pending' THEN 'pending'
      ELSE 'unpaid'
    END
  INTO status
  FROM public.side_income_assessments
  WHERE id = assessment_id
    AND user_id = (SELECT auth.uid());

  IF status IS NULL THEN
    RAISE EXCEPTION 'Assessment not found or access denied';
  END IF;

  RETURN status;
END;
$$;

-- Fix: throttle_ip
CREATE OR REPLACE FUNCTION public.throttle_ip(p_ip text, p_endpoint text, p_window_seconds integer, p_max_reqs integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  IF cur_count > p_max_reqs THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';
  END IF;
  
  DELETE FROM public.api_ip_usage
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Fix: throttle_user
CREATE OR REPLACE FUNCTION public.throttle_user(p_user_id uuid, p_endpoint text, p_window_seconds integer, p_max_reqs integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  IF cur_count > p_max_reqs THEN
    RAISE EXCEPTION 'USER_RATE_LIMIT_EXCEEDED';
  END IF;
  
  DELETE FROM public.api_user_usage
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;