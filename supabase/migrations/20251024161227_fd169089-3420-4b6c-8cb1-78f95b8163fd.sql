-- Drop view first before dropping columns it depends on
DROP VIEW IF EXISTS public.v_side_income_assessments;

-- Phase 1: Remove deprecated payment columns from side_income_assessments
ALTER TABLE public.side_income_assessments 
  DROP COLUMN IF EXISTS payment_status,
  DROP COLUMN IF EXISTS stripe_session_id;

-- Update credits_used default to 2 (correct cost)
ALTER TABLE public.side_income_assessments 
  ALTER COLUMN credits_used SET DEFAULT 2;

-- Add comment explaining the credit system
COMMENT ON TABLE public.side_income_assessments IS 
  'Side Income assessments use the credit system. Each assessment costs 2 credits. Report generation is free after assessment completion.';

-- Phase 4: Recreate view without payment_status column
CREATE VIEW public.v_side_income_assessments
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  assessment_data,
  credits_used,
  created_at,
  updated_at
FROM public.side_income_assessments;

-- Grant access to authenticated users
GRANT SELECT ON public.v_side_income_assessments TO authenticated;