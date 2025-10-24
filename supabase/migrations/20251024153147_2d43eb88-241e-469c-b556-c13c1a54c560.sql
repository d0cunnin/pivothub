-- Fix security definer view warning
-- Recreate view with SECURITY INVOKER to respect RLS policies

DROP VIEW IF EXISTS public.v_side_income_assessments;

CREATE VIEW public.v_side_income_assessments
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  assessment_data,
  CASE 
    WHEN payment_status = 'paid' THEN 'paid'
    WHEN payment_status = 'pending' THEN 'pending'
    ELSE 'unpaid'
  END as payment_status,
  created_at,
  updated_at
FROM public.side_income_assessments;

-- Ensure authenticated users can query the view
GRANT SELECT ON public.v_side_income_assessments TO authenticated;