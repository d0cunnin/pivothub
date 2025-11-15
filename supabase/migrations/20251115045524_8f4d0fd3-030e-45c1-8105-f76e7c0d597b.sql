-- Create view for minute-by-minute AI usage analytics
CREATE OR REPLACE VIEW v_ai_usage_by_minute AS
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

-- Create view for current rate (last 60 seconds)
CREATE OR REPLACE VIEW v_ai_current_rate AS
SELECT 
  COUNT(*) as requests_last_minute,
  COUNT(DISTINCT user_id) as active_users,
  SUM(credits_used) as credits_last_minute,
  array_agg(DISTINCT tool_name) as active_tools
FROM tool_usage_analytics
WHERE created_at >= NOW() - INTERVAL '1 minute';

-- Create rate limit alerts table
CREATE TABLE IF NOT EXISTS rate_limit_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_level TEXT NOT NULL,
  requests_per_minute INTEGER NOT NULL,
  rate_limit INTEGER NOT NULL,
  percentage_used NUMERIC NOT NULL,
  active_tools JSONB,
  resolved_at TIMESTAMPTZ,
  notes TEXT
);

-- Enable RLS
ALTER TABLE rate_limit_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view alerts"
  ON rate_limit_alerts FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert alerts"
  ON rate_limit_alerts FOR INSERT
  WITH CHECK (true);

-- Grant access to views
GRANT SELECT ON v_ai_usage_by_minute TO authenticated;
GRANT SELECT ON v_ai_current_rate TO authenticated;