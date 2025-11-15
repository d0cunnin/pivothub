-- Create AI service health status table
CREATE TABLE IF NOT EXISTS ai_service_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('operational', 'paused', 'degraded')),
  response_time_ms INTEGER,
  error_message TEXT,
  workspace_paused BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_service_status_checked_at 
ON ai_service_status(checked_at DESC);

-- Enable RLS
ALTER TABLE ai_service_status ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view health status
CREATE POLICY "Admins can view AI service health"
ON ai_service_status FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Policy: Service role can insert health checks
CREATE POLICY "Service role can insert health checks"
ON ai_service_status FOR INSERT
WITH CHECK (true);

-- Function to cleanup old health checks (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_health_checks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM ai_service_status 
  WHERE checked_at < NOW() - INTERVAL '24 hours';
END;
$$;