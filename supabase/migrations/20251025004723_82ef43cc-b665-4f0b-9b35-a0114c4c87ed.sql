-- Fix view security by recreating with built-in row filtering

-- Step 1: Recreate v_side_income_assessments with auth filtering
DROP VIEW IF EXISTS public.v_side_income_assessments;

CREATE VIEW public.v_side_income_assessments
WITH (security_barrier = true) AS
SELECT
  id,
  user_id,
  assessment_data,
  credits_used,
  created_at,
  updated_at
FROM public.side_income_assessments
WHERE 
  user_id = (SELECT auth.uid())
  OR public.has_role('admin');

-- Revoke direct table access from regular users
REVOKE ALL ON TABLE public.side_income_assessments FROM anon, authenticated;

-- Grant view access to authenticated users
GRANT SELECT ON public.v_side_income_assessments TO authenticated;

-- Step 2: Recreate monthly_usage_summary with auth filtering
DROP VIEW IF EXISTS public.monthly_usage_summary;

CREATE VIEW public.monthly_usage_summary
WITH (security_barrier = true) AS
SELECT 
  user_id,
  month_year,
  COUNT(*) AS total_uses,
  SUM(credits_used) AS total_credits,
  SUM(estimated_cost_usd) AS total_cost_usd
FROM public.tool_usage_analytics
WHERE 
  user_id = (SELECT auth.uid())
  OR public.has_role('admin')
GROUP BY user_id, month_year;

-- Grant view access to authenticated users
GRANT SELECT ON public.monthly_usage_summary TO authenticated;