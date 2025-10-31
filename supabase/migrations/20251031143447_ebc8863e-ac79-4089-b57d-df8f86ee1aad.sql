-- Clean up orphaned subscriber records and add cascade delete constraints

-- 1. Delete orphaned subscribers_public records (no matching auth.users)
DELETE FROM public.subscribers_public
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 2. Delete orphaned subscribers_secure records (no matching auth.users)
DELETE FROM public.subscribers_secure
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 3. Add foreign key constraint with CASCADE DELETE to subscribers_public
-- This will automatically delete subscriber records when auth user is deleted
ALTER TABLE public.subscribers_public
DROP CONSTRAINT IF EXISTS subscribers_public_user_id_fkey,
ADD CONSTRAINT subscribers_public_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 4. Add foreign key constraint with CASCADE DELETE to subscribers_secure
ALTER TABLE public.subscribers_secure
DROP CONSTRAINT IF EXISTS subscribers_secure_user_id_fkey,
ADD CONSTRAINT subscribers_secure_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) 
  ON DELETE CASCADE;