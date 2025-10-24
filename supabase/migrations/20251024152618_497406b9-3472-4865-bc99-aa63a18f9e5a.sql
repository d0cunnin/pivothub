-- Fix security linter warnings - correct policy syntax

-- Enable RLS on processed_stripe_events (service-role only access)
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Service role can manage event deduplication
CREATE POLICY "processed_stripe_events: service role all"
ON public.processed_stripe_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable RLS on webhook_audit_log (admin view only)
ALTER TABLE public.webhook_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view webhook audit logs
CREATE POLICY "webhook_audit_log: admin read"
ON public.webhook_audit_log
FOR SELECT
TO authenticated
USING (public.has_role('admin'));

-- Service role can insert audit logs
CREATE POLICY "webhook_audit_log: service insert"
ON public.webhook_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);