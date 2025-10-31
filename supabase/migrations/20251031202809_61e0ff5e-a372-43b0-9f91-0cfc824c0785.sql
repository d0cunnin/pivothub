-- Deactivate old package-based pricing plans
UPDATE pricing_plans 
SET is_active = false 
WHERE plan_code IN ('assess_prep_learn', 'build_teach_launch', 'fund_it');

-- Update All Access plan
UPDATE pricing_plans 
SET 
  price_cents = 7900,
  credit_limit = 250,
  features = '["250 credits per month", "Unused credits roll over (up to 2× monthly limit)", "Access to all tools", "Priority support", "Early access to new features", "Dedicated account manager"]'::jsonb
WHERE plan_code = 'all_access' AND is_active = true;

-- Insert new tiered subscription plans
INSERT INTO pricing_plans (
  plan_code, 
  display_name, 
  price_cents, 
  credit_limit, 
  rollover_cap_multiplier,
  features,
  currency,
  is_active
) VALUES
('starter', 'Starter', 1900, 40, 2.0, 
 '["40 credits per month", "Unused credits roll over (up to 2× monthly limit)", "Access to all tools", "Email support", "Community access"]'::jsonb,
 'USD', true),
 
('pro', 'Pro', 3900, 100, 2.0,
 '["100 credits per month", "Unused credits roll over (up to 2× monthly limit)", "Access to all tools", "Priority email support", "Early access to new features"]'::jsonb,
 'USD', true)
ON CONFLICT (plan_code) DO UPDATE SET
  price_cents = EXCLUDED.price_cents,
  credit_limit = EXCLUDED.credit_limit,
  rollover_cap_multiplier = EXCLUDED.rollover_cap_multiplier,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;