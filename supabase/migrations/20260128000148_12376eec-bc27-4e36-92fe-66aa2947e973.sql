
-- Fix overly permissive RLS policies by restricting to service_role
-- These tables are meant to be written only by backend edge functions

-- 1. admin_audit_log - INSERT policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.admin_audit_log;
CREATE POLICY "Service role can insert audit logs" 
ON public.admin_audit_log 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 2. admin_rate_limits - ALL policy
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.admin_rate_limits;
CREATE POLICY "Service role manages rate limits" 
ON public.admin_rate_limits 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 3. ai_service_status - INSERT policy
DROP POLICY IF EXISTS "Service role can insert health checks" ON public.ai_service_status;
CREATE POLICY "Service role can insert health checks" 
ON public.ai_service_status 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 4. api_ip_usage - ALL policy
DROP POLICY IF EXISTS "api_ip_usage_service" ON public.api_ip_usage;
CREATE POLICY "api_ip_usage_service" 
ON public.api_ip_usage 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 5. api_request_log - INSERT policy
DROP POLICY IF EXISTS "api_request_log_service_insert" ON public.api_request_log;
CREATE POLICY "api_request_log_service_insert" 
ON public.api_request_log 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 6. auth_failed_attempts - INSERT policy
DROP POLICY IF EXISTS "Service role can insert failed attempts" ON public.auth_failed_attempts;
CREATE POLICY "Service role can insert failed attempts" 
ON public.auth_failed_attempts 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 7. auth_lockouts - ALL policy
DROP POLICY IF EXISTS "Service role manages lockouts" ON public.auth_lockouts;
CREATE POLICY "Service role manages lockouts" 
ON public.auth_lockouts 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 8. moderation_log - INSERT policy
DROP POLICY IF EXISTS "Service role can insert moderation logs" ON public.moderation_log;
CREATE POLICY "Service role can insert moderation logs" 
ON public.moderation_log 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 9. processed_stripe_events - ALL policy
DROP POLICY IF EXISTS "processed_stripe_events: service role all" ON public.processed_stripe_events;
CREATE POLICY "processed_stripe_events: service role all" 
ON public.processed_stripe_events 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 10. rate_limit_alerts - INSERT policy
DROP POLICY IF EXISTS "Service role can insert alerts" ON public.rate_limit_alerts;
CREATE POLICY "Service role can insert alerts" 
ON public.rate_limit_alerts 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 11. side_income_reports - INSERT policy
DROP POLICY IF EXISTS "Service role can insert reports" ON public.side_income_reports;
CREATE POLICY "Service role can insert reports" 
ON public.side_income_reports 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 12. signup_audit - INSERT policy
DROP POLICY IF EXISTS "Service role can insert signup audits" ON public.signup_audit;
CREATE POLICY "Service role can insert signup audits" 
ON public.signup_audit 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 13. storage_access_audit - INSERT policy
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.storage_access_audit;
CREATE POLICY "Service role can insert audit logs" 
ON public.storage_access_audit 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 14. tool_usage_analytics - INSERT policy
DROP POLICY IF EXISTS "Service role can insert usage" ON public.tool_usage_analytics;
CREATE POLICY "Service role can insert usage" 
ON public.tool_usage_analytics 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- 15. webhook_audit_log - INSERT policy
DROP POLICY IF EXISTS "webhook_audit_log: service insert" ON public.webhook_audit_log;
CREATE POLICY "webhook_audit_log: service insert" 
ON public.webhook_audit_log 
FOR INSERT 
TO service_role
WITH CHECK (true);
