-- Remove dangerous owner policies that allow users to modify payment data
DROP POLICY IF EXISTS "subscribers_secure: owner insert" ON public.subscribers_secure;
DROP POLICY IF EXISTS "subscribers_secure: owner write" ON public.subscribers_secure;

-- Keep owner delete for account deletion functionality
-- Keep admin read/write policies

-- Add service role policy for edge functions to manage payment data
CREATE POLICY "subscribers_secure: service_role_all"
ON public.subscribers_secure
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Allow users to view only their own record (read-only)
CREATE POLICY "subscribers_secure: owner_read"
ON public.subscribers_secure
FOR SELECT
USING (user_id = auth.uid());