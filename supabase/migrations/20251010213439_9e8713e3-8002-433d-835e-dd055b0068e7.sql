-- Fix Analytics Database Security
-- First, delete any analytics records with null user_id (anonymous/invalid data)
DELETE FROM public.tool_usage_analytics WHERE user_id IS NULL;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Analytics insertable by all" ON public.tool_usage_analytics;

-- Create policy that requires authenticated users and enforces user_id matching
CREATE POLICY "Users can insert their own analytics"
  ON public.tool_usage_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Now make user_id required
ALTER TABLE public.tool_usage_analytics 
  ALTER COLUMN user_id SET NOT NULL;

-- Fix Feedback System Security
-- First, delete any feedback records with null user_id (anonymous/spam data)
DELETE FROM public.result_feedback WHERE user_id IS NULL;

-- Drop the anonymous insert policy
DROP POLICY IF EXISTS "Feedback insertable by all" ON public.result_feedback;

-- Create policy that requires authenticated users and enforces ownership
CREATE POLICY "Users can insert their own feedback"
  ON public.result_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Now make user_id required
ALTER TABLE public.result_feedback 
  ALTER COLUMN user_id SET NOT NULL;