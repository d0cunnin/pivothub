-- Fix security definer view issue
-- Set monthly_usage_summary to use security_invoker mode to respect RLS

ALTER VIEW public.monthly_usage_summary SET (security_invoker = on);

-- Verify the view respects RLS by adding a comment
COMMENT ON VIEW public.monthly_usage_summary IS 'Aggregates tool usage analytics with security_invoker=on to respect RLS policies';