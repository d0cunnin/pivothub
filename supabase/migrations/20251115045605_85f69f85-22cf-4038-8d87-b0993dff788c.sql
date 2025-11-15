-- Fix security definer views to respect RLS policies
DROP VIEW IF EXISTS v_ai_usage_by_minute;
DROP VIEW IF EXISTS v_ai_current_rate;

-- Recreate views with SECURITY INVOKER (respects querying user's RLS)
CREATE VIEW v_ai_usage_by_minute 
WITH (security_invoker = true) AS
SELECT 
  date_trunc('minute', created_at) as minute,
  COUNT(*) as request_count,
  SUM(credits_used) as total_credits,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT tool_name) as tools_used
FROM tool_usage_analytics
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY date_trunc('minute', created_at)
ORDER BY minute DESC;

CREATE VIEW v_ai_current_rate
WITH (security_invoker = true) AS
SELECT 
  COUNT(*) as requests_last_minute,
  COUNT(DISTINCT user_id) as active_users,
  SUM(credits_used) as credits_last_minute,
  array_agg(DISTINCT tool_name) as active_tools
FROM tool_usage_analytics
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Grant access to views
GRANT SELECT ON v_ai_usage_by_minute TO authenticated;
GRANT SELECT ON v_ai_current_rate TO authenticated;