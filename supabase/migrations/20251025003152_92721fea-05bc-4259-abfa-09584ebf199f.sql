-- ==========================================
-- PHASE 1: CRITICAL RLS POLICY FIXES FOR VIEWS
-- ==========================================

-- Fix 1: Set security_barrier on monthly_usage_summary view
-- (RLS is inherited from underlying tool_usage_analytics table)
ALTER VIEW public.monthly_usage_summary SET (security_barrier = true);

-- Fix 2: Set security_barrier on v_side_income_assessments view
-- (RLS is inherited from underlying side_income_assessments table)
ALTER VIEW public.v_side_income_assessments SET (security_barrier = true);

-- ==========================================
-- PHASE 2: STRIPE DATA SECURITY HARDENING
-- ==========================================

-- Fix 3: Create Email Masking Function
CREATE OR REPLACE FUNCTION public.mask_email(p_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
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

GRANT EXECUTE ON FUNCTION public.mask_email(text) TO authenticated;

-- Fix 4: Create Secure Billing Profile RPC
CREATE OR REPLACE FUNCTION public.get_my_billing_profile()
RETURNS TABLE (
  user_id uuid,
  email_masked text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.user_id,
    public.mask_email(s.email) as email_masked,
    s.created_at,
    s.updated_at
  FROM public.subscribers_secure s
  WHERE s.user_id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.get_my_billing_profile() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_billing_profile() TO authenticated;

-- Fix 5: Remove owner read policy from subscribers_secure to hide Stripe ID
-- Only admins and service role can access full data
DROP POLICY IF EXISTS "subscribers_secure: owner read" ON public.subscribers_secure;

COMMENT ON TABLE public.subscribers_secure IS 
  'Sensitive billing data. Users must access via get_my_billing_profile() RPC for masked data. Only admins and service role can read full data.';

-- ==========================================
-- PHASE 3: FUNCTION SECURITY HARDENING
-- ==========================================

-- Fix 6: Add search_path to trigger functions to prevent schema injection attacks

CREATE OR REPLACE FUNCTION public.set_month_year()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.month_year := to_char(NEW.created_at, 'YYYY-MM');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_contexts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.conversation_context 
  WHERE expires_at < now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;