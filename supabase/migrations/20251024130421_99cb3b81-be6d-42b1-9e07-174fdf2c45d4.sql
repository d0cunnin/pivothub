
-- Drop the existing view that exposes auth.users
DROP VIEW IF EXISTS public.admin_cost_analysis;

-- Recreate the view using subscribers_secure instead of auth.users
CREATE VIEW public.admin_cost_analysis AS
SELECT 
  ss.email,
  sp.subscription_package,
  sp.subscribed,
  COALESCE(mus.month_year, to_char(now(), 'YYYY-MM')) AS month_year,
  COALESCE(mus.total_credits, 0::bigint) AS total_credits,
  COALESCE(mus.total_cost_usd, 0::numeric) AS total_cost_usd,
  CASE
    WHEN sp.subscription_package = 'all-access' THEN 29.00
    WHEN sp.subscription_package = 'assess-prep-learn' THEN 18.00
    WHEN sp.subscription_package = 'build-teach-launch' THEN 18.00
    WHEN sp.subscription_package = 'fund-it' THEN 15.00
    ELSE 0::numeric
  END AS monthly_revenue,
  (
    CASE
      WHEN sp.subscription_package = 'all-access' THEN 29.00
      WHEN sp.subscription_package = 'assess-prep-learn' THEN 18.00
      WHEN sp.subscription_package = 'build-teach-launch' THEN 18.00
      WHEN sp.subscription_package = 'fund-it' THEN 15.00
      ELSE 0::numeric
    END - COALESCE(mus.total_cost_usd, 0::numeric)
  ) AS profit_margin
FROM subscribers_public sp
JOIN subscribers_secure ss ON ss.user_id = sp.user_id
LEFT JOIN monthly_usage_summary mus ON sp.user_id = mus.user_id 
  AND mus.month_year = to_char(now(), 'YYYY-MM')
WHERE sp.subscribed = true
ORDER BY profit_margin;

-- Revoke public access to the view (only admins should see this)
REVOKE ALL ON public.admin_cost_analysis FROM anon, authenticated;
