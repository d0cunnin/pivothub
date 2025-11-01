-- Fix the Service role full access policy for users table
-- Issue: Missing WITH CHECK clause was blocking INSERT operations

DROP POLICY IF EXISTS "Service role full access" ON public.users;

CREATE POLICY "Service role full access" ON public.users
  FOR ALL 
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');