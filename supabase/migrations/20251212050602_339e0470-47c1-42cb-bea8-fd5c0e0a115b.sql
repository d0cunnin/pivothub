-- SECURITY FIX 1: Remove direct email access from subscribers_secure
-- Users should use get_my_billing_profile() RPC which returns masked email
DROP POLICY IF EXISTS "subscribers_secure: owner_read" ON public.subscribers_secure;

-- SECURITY FIX 2: Move Stripe subscription ID to subscribers_secure and remove from users table

-- Add stripe_subscription_id column to subscribers_secure if it doesn't exist
ALTER TABLE public.subscribers_secure 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Migrate any existing stripe_subscription_id data from users to subscribers_secure
UPDATE public.subscribers_secure ss
SET stripe_subscription_id = u.stripe_subscription_id
FROM public.users u
WHERE ss.user_id = u.id
  AND u.stripe_subscription_id IS NOT NULL
  AND ss.stripe_subscription_id IS NULL;

-- Also ensure stripe_customer_id is migrated if not already present
UPDATE public.subscribers_secure ss
SET stripe_customer_id = u.stripe_customer_id
FROM public.users u
WHERE ss.user_id = u.id
  AND u.stripe_customer_id IS NOT NULL
  AND ss.stripe_customer_id IS NULL;

-- Drop the Stripe columns from users table (they are now in subscribers_secure)
ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.users DROP COLUMN IF EXISTS stripe_subscription_id;