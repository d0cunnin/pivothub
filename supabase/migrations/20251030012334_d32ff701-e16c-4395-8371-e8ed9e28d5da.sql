-- Fix SECURITY DEFINER warnings by converting all views to security_invoker
-- Views will now respect base table RLS policies, which already enforce proper access control

BEGIN;

-- Step 1: Convert all views to security_invoker (fixes linter warnings)
ALTER VIEW public.monthly_usage_summary SET (security_invoker = true);
ALTER VIEW public.v_side_income_assessments SET (security_invoker = true);
ALTER VIEW public.v_public_pricing SET (security_invoker = true);
ALTER VIEW public.v_subscribers_masked SET (security_invoker = true);
ALTER VIEW public.v_assessment_summary SET (security_invoker = true);
ALTER VIEW public.v_webhook_failures SET (security_invoker = true);
ALTER VIEW public.v_suspicious_credit_usage SET (security_invoker = true);
ALTER VIEW public.v_failed_login_monitoring SET (security_invoker = true);
ALTER VIEW public.v_storage_access_monitoring SET (security_invoker = true);

-- Step 2: Grant SELECT permissions
-- Admin-only views: grant to authenticated (base table RLS enforces admin-only access)
GRANT SELECT ON public.monthly_usage_summary TO authenticated;
GRANT SELECT ON public.v_subscribers_masked TO authenticated;
GRANT SELECT ON public.v_assessment_summary TO authenticated;
GRANT SELECT ON public.v_webhook_failures TO authenticated;
GRANT SELECT ON public.v_suspicious_credit_usage TO authenticated;
GRANT SELECT ON public.v_failed_login_monitoring TO authenticated;
GRANT SELECT ON public.v_storage_access_monitoring TO authenticated;

-- Public pricing view: accessible to everyone
GRANT SELECT ON public.v_public_pricing TO authenticated, anon;

-- Side income assessments: users can see their own data
GRANT SELECT ON public.v_side_income_assessments TO authenticated;

COMMIT;