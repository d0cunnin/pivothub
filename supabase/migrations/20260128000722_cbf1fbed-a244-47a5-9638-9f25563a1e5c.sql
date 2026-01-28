
-- Fix subscribers_secure RLS policies for defense-in-depth
-- Add explicit denial for anonymous access and proper SELECT policy

-- 1. Drop the overly broad service_role_all policy that uses 'public' role
DROP POLICY IF EXISTS "subscribers_secure: service_role_all" ON public.subscribers_secure;

-- 2. Recreate service role policy restricted to service_role only
CREATE POLICY "subscribers_secure: service_role_all" 
ON public.subscribers_secure 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- 3. Add explicit denial for anonymous users (defense-in-depth)
CREATE POLICY "subscribers_secure: deny_anon_access" 
ON public.subscribers_secure 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- 4. Add SELECT policy for users to view their own secure data
-- (Currently missing - users can delete but not select their own data)
CREATE POLICY "subscribers_secure: owner_read" 
ON public.subscribers_secure 
FOR SELECT 
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 5. Add INSERT policy for service role to create records
-- (Needed for new user signup flow)
CREATE POLICY "subscribers_secure: service_insert" 
ON public.subscribers_secure 
FOR INSERT 
TO service_role
WITH CHECK (true);
