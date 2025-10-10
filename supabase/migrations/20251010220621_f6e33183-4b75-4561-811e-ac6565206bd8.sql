-- Fix RLS policies to prevent anonymous access

-- Fix tool_usage_analytics policy - remove user_id IS NULL condition
DROP POLICY IF EXISTS "Analytics readable by owner" ON public.tool_usage_analytics;
CREATE POLICY "Analytics readable by owner" 
ON public.tool_usage_analytics
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix result_feedback policy - remove user_id IS NULL condition
DROP POLICY IF EXISTS "Feedback readable by owner" ON public.result_feedback;
CREATE POLICY "Feedback readable by owner" 
ON public.result_feedback
FOR SELECT 
USING (auth.uid() = user_id);

-- Add service role policy for subscribers_secure
CREATE POLICY "Service role can manage secure data"
ON public.subscribers_secure
FOR ALL
TO service_role
USING (true);