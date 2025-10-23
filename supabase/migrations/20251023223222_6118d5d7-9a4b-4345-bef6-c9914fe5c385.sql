-- Create admin audit log table for tracking all admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_admin_audit_log_admin_user ON public.admin_audit_log(admin_user_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log(action);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- System can insert audit logs (through service role)
CREATE POLICY "Service role can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create rate limiting table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_user_id, action_type, window_start)
);

-- Create index for rate limit queries
CREATE INDEX idx_admin_rate_limits_lookup ON public.admin_rate_limits(admin_user_id, action_type, window_start);

-- Enable RLS
ALTER TABLE public.admin_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role manages rate limits"
  ON public.admin_rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to check and enforce rate limits
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(
  p_admin_user_id UUID,
  p_action_type TEXT,
  p_max_actions INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_action_count INTEGER;
BEGIN
  -- Calculate window start (rounded down to the hour/minute)
  v_window_start := date_trunc('hour', now() - (p_window_minutes || ' minutes')::INTERVAL);
  
  -- Get or create rate limit record
  INSERT INTO public.admin_rate_limits (admin_user_id, action_type, window_start, action_count)
  VALUES (p_admin_user_id, p_action_type, v_window_start, 1)
  ON CONFLICT (admin_user_id, action_type, window_start)
  DO UPDATE SET action_count = admin_rate_limits.action_count + 1
  RETURNING action_count INTO v_action_count;
  
  -- Check if limit exceeded
  IF v_action_count > p_max_actions THEN
    RETURN FALSE;
  END IF;
  
  -- Clean up old rate limit records (older than 24 hours)
  DELETE FROM public.admin_rate_limits
  WHERE window_start < now() - INTERVAL '24 hours';
  
  RETURN TRUE;
END;
$$;

COMMENT ON TABLE public.admin_audit_log IS 'Tracks all admin actions for security and compliance';
COMMENT ON TABLE public.admin_rate_limits IS 'Rate limiting for admin actions to prevent abuse';
COMMENT ON FUNCTION public.check_admin_rate_limit IS 'Checks if admin user has exceeded rate limit for specific action type';