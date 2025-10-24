-- Remove payment_status requirement from side_income_assessments
-- Users no longer need to pay separately - uses credit system instead

-- Make payment_status optional for new assessments
ALTER TABLE public.side_income_assessments 
  ALTER COLUMN payment_status DROP NOT NULL,
  ALTER COLUMN payment_status DROP DEFAULT;

-- Add comment to clarify new behavior
COMMENT ON COLUMN public.side_income_assessments.payment_status IS 
  'DEPRECATED: Payment status no longer used. Assessment uses credit system instead.';

-- Add a new column to track credit usage
ALTER TABLE public.side_income_assessments 
  ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 1;

COMMENT ON COLUMN public.side_income_assessments.credits_used IS 
  'Number of credits used for this assessment (always 1)';

-- Ensure stripe_session_id is optional (should already be, but being explicit)
ALTER TABLE public.side_income_assessments 
  ALTER COLUMN stripe_session_id DROP NOT NULL;