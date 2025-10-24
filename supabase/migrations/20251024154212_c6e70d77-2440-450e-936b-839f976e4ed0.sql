-- Phase 1: Security Infrastructure Tables & Functions

-- ==========================================
-- IP-based Rate Limiting Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.api_ip_usage (
  ip inet NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, endpoint, window_start)
);

-- Index for efficient cleanup of old windows
CREATE INDEX IF NOT EXISTS idx_api_ip_usage_window 
ON public.api_ip_usage(window_start);

-- ==========================================
-- Comprehensive API Request Audit Log
-- ==========================================
CREATE TABLE IF NOT EXISTS public.api_request_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  endpoint text NOT NULL,
  ip_address inet NOT NULL,
  user_agent text,
  credits_charged int DEFAULT 0,
  success boolean NOT NULL,
  error_message text,
  request_duration_ms int,
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_api_request_log_created 
ON public.api_request_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_log_endpoint 
ON public.api_request_log(endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_log_user 
ON public.api_request_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_api_request_log_ip 
ON public.api_request_log(ip_address, created_at DESC);

-- ==========================================
-- Helper: Floor timestamp to rate limit window
-- ==========================================
CREATE OR REPLACE FUNCTION public.floor_to_window(ts timestamptz, seconds int)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('second', ts) - make_interval(secs => (extract('epoch' from ts)::int % seconds))
$$;

-- ==========================================
-- IP-based Rate Limiter (per endpoint)
-- ==========================================
CREATE OR REPLACE FUNCTION public.throttle_ip(
  p_ip text,
  p_endpoint text,
  p_window_seconds int,
  p_max_reqs int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  w_start timestamptz;
  ip_inet inet;
  cur_count int;
BEGIN
  -- Calculate window start
  w_start := floor_to_window(now(), p_window_seconds);
  ip_inet := p_ip::inet;
  
  -- Increment counter atomically
  INSERT INTO public.api_ip_usage(ip, endpoint, window_start, count)
  VALUES (ip_inet, p_endpoint, w_start, 1)
  ON CONFLICT (ip, endpoint, window_start)
  DO UPDATE SET count = public.api_ip_usage.count + 1
  RETURNING public.api_ip_usage.count INTO cur_count;
  
  -- Check limit
  IF cur_count > p_max_reqs THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';
  END IF;
  
  -- Cleanup old windows (keep last 24 hours)
  DELETE FROM public.api_ip_usage
  WHERE window_start < now() - interval '24 hours';
END;
$$;

-- Grant execute to authenticated users
REVOKE ALL ON FUNCTION public.throttle_ip(text, text, int, int) FROM public;
GRANT EXECUTE ON FUNCTION public.throttle_ip(text, text, int, int) TO authenticated, anon;

-- ==========================================
-- RLS Policies for Audit Tables
-- ==========================================
ALTER TABLE public.api_ip_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_request_log ENABLE ROW LEVEL SECURITY;

-- Service role can do anything
CREATE POLICY "api_ip_usage_service"
ON public.api_ip_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can view all logs
CREATE POLICY "api_request_log_admin_view"
ON public.api_request_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Users can view their own logs
CREATE POLICY "api_request_log_user_view"
ON public.api_request_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Service role can insert logs
CREATE POLICY "api_request_log_service_insert"
ON public.api_request_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- ==========================================
-- Phase 5: Secure Storage Bucket
-- ==========================================

-- Make course-materials bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'course-materials';

-- RLS on storage.objects for course materials
CREATE POLICY "course_materials_enrolled_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-materials'
  AND (
    -- User is enrolled in this course
    EXISTS (
      SELECT 1 FROM public.course_enrollments e
      WHERE e.user_id = auth.uid()
        AND e.course_id::text = split_part(storage.objects.name, '/', 1)
    )
    -- OR user is admin
    OR has_role(auth.uid(), 'admin')
  )
);

-- Only admins can upload/delete course materials
CREATE POLICY "course_materials_admin_write"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'course-materials' 
  AND has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'course-materials'
  AND has_role(auth.uid(), 'admin')
);