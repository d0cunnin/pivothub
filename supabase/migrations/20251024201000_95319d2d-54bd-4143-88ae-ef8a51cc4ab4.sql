-- Table for tracking per-user rate limits
CREATE TABLE IF NOT EXISTS public.api_user_usage (
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, endpoint, window_start)
);

-- Index for cleanup queries
CREATE INDEX idx_api_user_usage_window ON public.api_user_usage(window_start);

-- Enable RLS
ALTER TABLE public.api_user_usage ENABLE ROW LEVEL SECURITY;

-- Service role can manage all records (needed for edge functions)
CREATE POLICY api_user_usage_service ON public.api_user_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create throttle_user RPC function
CREATE OR REPLACE FUNCTION public.throttle_user(
  p_user_id UUID,
  p_endpoint TEXT,
  p_window_seconds INTEGER,
  p_max_reqs INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_start TIMESTAMPTZ;
  cur_count INTEGER;
BEGIN
  -- Calculate window start (rounds down to nearest minute)
  w_start := floor_to_window(NOW(), p_window_seconds);
  
  -- Atomically increment counter (race-condition safe)
  INSERT INTO public.api_user_usage(user_id, endpoint, window_start, count)
  VALUES (p_user_id, p_endpoint, w_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET count = public.api_user_usage.count + 1
  RETURNING public.api_user_usage.count INTO cur_count;
  
  -- Check if limit exceeded
  IF cur_count > p_max_reqs THEN
    RAISE EXCEPTION 'USER_RATE_LIMIT_EXCEEDED';
  END IF;
  
  -- Cleanup old windows (keep last 24 hours only)
  DELETE FROM public.api_user_usage
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;