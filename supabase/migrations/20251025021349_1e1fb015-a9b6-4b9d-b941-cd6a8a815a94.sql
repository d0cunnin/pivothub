-- Phase 4: Database Security Fixes

-- Fix 1: Update has_role function to explicitly set search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix 2: Update has_role(text) overload to set search_path
CREATE OR REPLACE FUNCTION public.has_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND role = _role::app_role
  );
$$;

-- Fix 3: Ensure throttle_ip has explicit search_path
CREATE OR REPLACE FUNCTION public.throttle_ip(p_ip text, p_endpoint text, p_window_seconds integer, p_max_reqs integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Fix 4: Ensure throttle_user has explicit search_path
CREATE OR REPLACE FUNCTION public.throttle_user(p_user_id uuid, p_endpoint text, p_window_seconds integer, p_max_reqs integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Fix 5: Update mask_email to be IMMUTABLE and use explicit schema
CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  name_part text;
  domain_part text;
  masked_name text;
BEGIN
  IF p_email IS NULL THEN
    RETURN NULL;
  END IF;

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

-- Fix 6: Create security barrier view for subscribers_secure (protect sensitive data)
DROP VIEW IF EXISTS public.v_subscribers_masked CASCADE;

CREATE VIEW public.v_subscribers_masked
WITH (security_barrier = true)
AS
SELECT 
  user_id,
  public.mask_email(email) as email_masked,
  created_at,
  updated_at,
  stripe_customer_id IS NOT NULL as has_stripe_account
FROM public.subscribers_secure;

-- Grant appropriate access
GRANT SELECT ON public.v_subscribers_masked TO authenticated;

-- Fix 7: Create security barrier view for sensitive assessment data
DROP VIEW IF EXISTS public.v_assessment_summary CASCADE;

CREATE VIEW public.v_assessment_summary
WITH (security_barrier = true)
AS
SELECT 
  id,
  user_id,
  assessment_type,
  score,
  created_at,
  updated_at
FROM public.assessment_results
WHERE user_id = (SELECT auth.uid());

-- Grant appropriate access
GRANT SELECT ON public.v_assessment_summary TO authenticated;

COMMENT ON VIEW public.v_subscribers_masked IS 'Security barrier view: Masks sensitive subscriber email addresses';
COMMENT ON VIEW public.v_assessment_summary IS 'Security barrier view: User can only see their own assessment summaries without full results';