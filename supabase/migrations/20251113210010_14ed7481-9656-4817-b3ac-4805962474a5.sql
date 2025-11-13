-- Fix security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.v_suspicious_signups;

CREATE OR REPLACE VIEW public.v_suspicious_signups
WITH (security_invoker = on) AS
SELECT 
  ip_address,
  COUNT(DISTINCT user_id) as account_count,
  COUNT(*) as signup_count,
  ARRAY_AGG(DISTINCT email) as emails,
  MAX(created_at) as last_signup,
  MIN(created_at) as first_signup,
  BOOL_OR(flagged_as_suspicious) as has_flags
FROM public.signup_audit
GROUP BY ip_address
HAVING COUNT(DISTINCT user_id) > 1
ORDER BY COUNT(DISTINCT user_id) DESC;