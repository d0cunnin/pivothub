-- ============================================
-- COMPREHENSIVE SECURITY HARDENING MIGRATION (FIXED)
-- ============================================

-- PART 1: ACCOUNT LOCKOUT SYSTEM
-- ============================================

-- Create failed login attempts tracking table
CREATE TABLE IF NOT EXISTS public.auth_failed_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address inet NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  user_agent text
);

ALTER TABLE public.auth_failed_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert failed attempts"
ON public.auth_failed_attempts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view failed attempts"
ON public.auth_failed_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create account lockout table
CREATE TABLE IF NOT EXISTS public.auth_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  locked_until timestamptz NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.auth_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages lockouts"
ON public.auth_lockouts
FOR ALL
WITH CHECK (true);

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.check_account_lockout(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lockout RECORD;
  v_failed_attempts INT;
  v_lockout_until timestamptz;
BEGIN
  -- Check existing lockout
  SELECT * INTO v_lockout
  FROM public.auth_lockouts
  WHERE email = p_email
    AND locked_until > now();
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', v_lockout.locked_until,
      'reason', v_lockout.reason
    );
  END IF;
  
  -- Count recent failed attempts (last 15 minutes)
  SELECT COUNT(*) INTO v_failed_attempts
  FROM public.auth_failed_attempts
  WHERE email = p_email
    AND attempted_at > now() - interval '15 minutes';
  
  -- Lock account if >= 5 attempts
  IF v_failed_attempts >= 5 THEN
    v_lockout_until := now() + interval '30 minutes';
    
    INSERT INTO public.auth_lockouts (email, locked_until, reason)
    VALUES (p_email, v_lockout_until, 'Too many failed login attempts')
    ON CONFLICT (email) 
    DO UPDATE SET 
      locked_until = v_lockout_until,
      created_at = now();
    
    RETURN jsonb_build_object(
      'locked', true,
      'locked_until', v_lockout_until,
      'reason', 'Account temporarily locked due to multiple failed login attempts'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'locked', false,
    'remaining_attempts', 5 - v_failed_attempts
  );
END;
$$;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(
  p_email text,
  p_ip inet,
  p_user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auth_failed_attempts (email, ip_address, user_agent)
  VALUES (p_email, p_ip, p_user_agent);
  
  -- Clean up old attempts (> 24 hours)
  DELETE FROM public.auth_failed_attempts
  WHERE attempted_at < now() - interval '24 hours';
END;
$$;

-- Function to clear lockout (for admin use or after timeout)
CREATE OR REPLACE FUNCTION public.clear_account_lockout(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.auth_lockouts WHERE email = p_email;
  DELETE FROM public.auth_failed_attempts WHERE email = p_email;
END;
$$;

-- PART 2: STORAGE ACCESS AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS public.storage_access_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bucket_id text NOT NULL,
  object_name text NOT NULL,
  access_granted boolean NOT NULL,
  attempted_at timestamptz DEFAULT now()
);

ALTER TABLE public.storage_access_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert audit logs"
ON public.storage_access_audit
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view audit logs"
ON public.storage_access_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- PART 3: LOCK DOWN COURSE-MEDIA BUCKET
-- ============================================
-- Note: Storage bucket policies are managed via Supabase Dashboard or CLI
-- This creates an admin-only policy on storage.objects

-- Drop any existing course-media policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "course_media_public_read" ON storage.objects;
    DROP POLICY IF EXISTS "course_media_authenticated_read" ON storage.objects;
    DROP POLICY IF EXISTS "course_media_admin_only" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create strict admin-only policy
CREATE POLICY "course_media_admin_only"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'course-media' 
  AND has_role(auth.uid(), 'admin')
);

-- PART 4: MONITORING VIEWS
-- ============================================

-- Failed login attempts monitoring (last hour)
CREATE OR REPLACE VIEW public.v_failed_login_monitoring AS
SELECT 
  email,
  COUNT(*) as attempt_count,
  MAX(attempted_at) as last_attempt,
  ARRAY_AGG(DISTINCT ip_address::text) as ip_addresses
FROM public.auth_failed_attempts
WHERE attempted_at > now() - interval '1 hour'
GROUP BY email
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC;

-- Webhook failures monitoring (last 24 hours)
CREATE OR REPLACE VIEW public.v_webhook_failures AS
SELECT 
  event_type,
  COUNT(*) as failure_count,
  MAX(received_at) as last_failure
FROM public.webhook_audit_log
WHERE processing_status = 'failed'
  AND received_at > now() - interval '24 hours'
GROUP BY event_type
ORDER BY failure_count DESC;

-- Suspicious credit usage monitoring
CREATE OR REPLACE VIEW public.v_suspicious_credit_usage AS
SELECT 
  user_id,
  tool_name,
  COUNT(*) as request_count,
  SUM(credits_used) as total_credits,
  SUM(estimated_cost_usd) as total_cost
FROM public.tool_usage_analytics
WHERE created_at > now() - interval '1 hour'
GROUP BY user_id, tool_name
HAVING SUM(credits_used) > 50
ORDER BY total_credits DESC;

-- Storage access monitoring
CREATE OR REPLACE VIEW public.v_storage_access_monitoring AS
SELECT 
  user_id,
  bucket_id,
  COUNT(*) as access_attempts,
  SUM(CASE WHEN access_granted THEN 1 ELSE 0 END) as granted_count,
  SUM(CASE WHEN NOT access_granted THEN 1 ELSE 0 END) as denied_count,
  MAX(attempted_at) as last_attempt
FROM public.storage_access_audit
WHERE attempted_at > now() - interval '24 hours'
GROUP BY user_id, bucket_id
ORDER BY denied_count DESC;