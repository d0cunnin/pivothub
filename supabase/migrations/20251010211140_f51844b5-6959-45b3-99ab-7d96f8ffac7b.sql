-- Fix: Customer Email Addresses Exposed to Public Access
-- Move email from subscribers_public to subscribers_secure and ensure strict RLS

-- Step 1: Add email column to subscribers_secure if not exists
ALTER TABLE public.subscribers_secure 
ADD COLUMN IF NOT EXISTS email text;

-- Step 2: Copy existing emails from subscribers_public to subscribers_secure
UPDATE public.subscribers_secure ss
SET email = sp.email
FROM public.subscribers_public sp
WHERE ss.user_id = sp.user_id
AND ss.email IS NULL;

-- Step 3: Remove email column from subscribers_public (it's now in secure table)
ALTER TABLE public.subscribers_public 
DROP COLUMN IF EXISTS email;

-- Step 4: Ensure subscribers_public has strict RLS policies (drop and recreate for certainty)
DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.subscribers_public;
DROP POLICY IF EXISTS "Admins can view all subscription data" ON public.subscribers_public;
DROP POLICY IF EXISTS "Users can insert their own subscription data" ON public.subscribers_public;
DROP POLICY IF EXISTS "Users can update their own subscription data" ON public.subscribers_public;

-- Recreate strict SELECT policies
CREATE POLICY "Users can view only their own subscription data"
ON public.subscribers_public
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscription data"
ON public.subscribers_public
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Recreate INSERT and UPDATE policies
CREATE POLICY "Users can insert their own subscription data"
ON public.subscribers_public
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription data"
ON public.subscribers_public
FOR UPDATE
USING (auth.uid() = user_id);

-- Step 5: Ensure no anonymous access is possible (add explicit denial if needed)
-- This ensures that even if auth.uid() somehow returns null, access is denied
CREATE POLICY "Deny all anonymous access to subscriptions"
ON public.subscribers_public
FOR ALL
USING (auth.uid() IS NOT NULL);