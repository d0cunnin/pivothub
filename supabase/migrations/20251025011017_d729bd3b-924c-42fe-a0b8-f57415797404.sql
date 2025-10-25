-- Update All Access Pass credit limit from 150 to 125
UPDATE public.pricing_plans 
SET 
  credit_limit = 125,
  features = jsonb_set(
    features, 
    '{0}', 
    '"125 credits/month"'
  ),
  updated_at = now()
WHERE plan_code = 'all_access';