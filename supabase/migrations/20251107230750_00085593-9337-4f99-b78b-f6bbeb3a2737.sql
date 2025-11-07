-- Allow admins to view all tool usage analytics
CREATE POLICY "Admins can view all tool usage"
ON public.tool_usage_analytics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all assessment results
CREATE POLICY "Admins can view all assessments"
ON public.assessment_results
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));