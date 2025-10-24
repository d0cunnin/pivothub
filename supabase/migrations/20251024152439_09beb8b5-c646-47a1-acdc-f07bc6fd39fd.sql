-- ==========================================
-- PHASE 1: Fix subscribers_secure RLS
-- ==========================================

-- 1.1: Create has_role(text) overload for easier policy syntax
CREATE OR REPLACE FUNCTION public.has_role(_role text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = (SELECT auth.uid())
      AND role = _role::app_role
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_role(text) TO authenticated;

-- 1.2: Add integrity constraints to subscribers_secure
CREATE UNIQUE INDEX IF NOT EXISTS ux_subscribers_secure_user_id
  ON public.subscribers_secure (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_subscribers_secure_stripe_customer_id
  ON public.subscribers_secure (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Add constraint with DO block for conditional check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_stripe_cus_format' 
    AND conrelid = 'public.subscribers_secure'::regclass
  ) THEN
    ALTER TABLE public.subscribers_secure
      ADD CONSTRAINT chk_stripe_cus_format
      CHECK (stripe_customer_id IS NULL OR stripe_customer_id ~ '^cus_[A-Za-z0-9]+$');
  END IF;
END $$;

-- 1.3: Drop restrictive policies and create proper RLS policies
DROP POLICY IF EXISTS "No direct select access to secure data" ON public.subscribers_secure;
DROP POLICY IF EXISTS "No direct insert access to secure data" ON public.subscribers_secure;
DROP POLICY IF EXISTS "No direct update access to secure data" ON public.subscribers_secure;
DROP POLICY IF EXISTS "No direct delete access to secure data" ON public.subscribers_secure;
DROP POLICY IF EXISTS "Service role can manage secure data" ON public.subscribers_secure;

-- Owner can SELECT their own row
CREATE POLICY "subscribers_secure: owner read"
ON public.subscribers_secure
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Owner can UPDATE their own row
CREATE POLICY "subscribers_secure: owner write"
ON public.subscribers_secure
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Owner can DELETE their own row
CREATE POLICY "subscribers_secure: owner delete"
ON public.subscribers_secure
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Owner can INSERT their own row
CREATE POLICY "subscribers_secure: owner insert"
ON public.subscribers_secure
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Admin can read all rows
CREATE POLICY "subscribers_secure: admin read"
ON public.subscribers_secure
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- Admin can update all rows (for support)
CREATE POLICY "subscribers_secure: admin write"
ON public.subscribers_secure
FOR UPDATE
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- ==========================================
-- PHASE 2: Reduce Payment Data Exposure
-- ==========================================

-- 2.1: Create view that excludes sensitive Stripe fields
CREATE OR REPLACE VIEW public.v_side_income_assessments AS
SELECT
  id,
  user_id,
  assessment_data,
  CASE 
    WHEN payment_status = 'paid' THEN 'paid'
    WHEN payment_status = 'pending' THEN 'pending'
    ELSE 'unpaid'
  END as payment_status,
  created_at,
  updated_at
FROM public.side_income_assessments;

-- Grant access to the view
GRANT SELECT ON public.v_side_income_assessments TO authenticated;

-- 2.2: Create checkout_sessions table for short-lived session tracking
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_session_id text NOT NULL,
  session_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Owner-only policies
CREATE POLICY "checkout_sessions: owner read"
ON public.checkout_sessions
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "checkout_sessions: owner insert"
ON public.checkout_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS ix_checkout_sessions_expire
  ON public.checkout_sessions (created_at);

-- ==========================================
-- PHASE 3: Webhook Hardening - Replay Protection
-- ==========================================

-- 3.1: Create processed_stripe_events table for idempotency
CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_successfully boolean NOT NULL DEFAULT true
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS ix_processed_stripe_events_cleanup
  ON public.processed_stripe_events (received_at);

-- ==========================================
-- PHASE 4: Client-Server Payment Pattern
-- ==========================================

-- 4.1: Create RPC function for secure payment status retrieval
CREATE OR REPLACE FUNCTION public.get_my_payment_status(assessment_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status text;
BEGIN
  SELECT 
    CASE 
      WHEN payment_status = 'paid' THEN 'paid'
      WHEN payment_status = 'pending' THEN 'pending'
      ELSE 'unpaid'
    END
  INTO status
  FROM public.side_income_assessments
  WHERE id = assessment_id
    AND user_id = (SELECT auth.uid());

  IF status IS NULL THEN
    RAISE EXCEPTION 'Assessment not found or access denied';
  END IF;

  RETURN status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_payment_status(uuid) TO authenticated;

-- ==========================================
-- PHASE 6: Monitoring Support
-- ==========================================

-- Create audit log for webhook events
CREATE TABLE IF NOT EXISTS public.webhook_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  event_type text NOT NULL,
  signature_valid boolean NOT NULL,
  processing_status text NOT NULL,
  error_message text,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_webhook_audit_log_received
  ON public.webhook_audit_log (received_at DESC);

CREATE INDEX IF NOT EXISTS ix_webhook_audit_log_status
  ON public.webhook_audit_log (processing_status, received_at DESC);