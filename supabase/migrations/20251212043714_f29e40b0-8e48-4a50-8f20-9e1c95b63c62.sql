-- Drop the overly permissive policy
DROP POLICY IF EXISTS "api_user_usage_service" ON public.api_user_usage;

-- Create proper RLS policies

-- Service role can manage all usage records (for edge functions)
CREATE POLICY "api_user_usage_service_role"
ON public.api_user_usage
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can only view their own usage data
CREATE POLICY "api_user_usage_user_view"
ON public.api_user_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all usage data
CREATE POLICY "api_user_usage_admin_view"
ON public.api_user_usage
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));