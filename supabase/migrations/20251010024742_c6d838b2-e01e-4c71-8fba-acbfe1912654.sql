-- Step 1: Create subscribers_public table (non-sensitive data)
CREATE TABLE IF NOT EXISTS public.subscribers_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  subscribed boolean NOT NULL DEFAULT false,
  subscription_tier text,
  subscription_end timestamp with time zone,
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  is_trial_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 2: Create subscribers_secure table (payment data only)
CREATE TABLE IF NOT EXISTS public.subscribers_secure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.subscribers_public(user_id) ON DELETE CASCADE,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Step 3: Enable RLS on both tables
ALTER TABLE public.subscribers_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers_secure ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for subscribers_public (users can access their own data)
CREATE POLICY "Users can view their own subscription data"
ON public.subscribers_public
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription data"
ON public.subscribers_public
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription data"
ON public.subscribers_public
FOR UPDATE
USING (auth.uid() = user_id);

-- Step 5: Create STRICT RLS policies for subscribers_secure (NO direct access, service role only)
CREATE POLICY "No direct select access to secure data"
ON public.subscribers_secure
FOR SELECT
USING (false);

CREATE POLICY "No direct insert access to secure data"
ON public.subscribers_secure
FOR INSERT
WITH CHECK (false);

CREATE POLICY "No direct update access to secure data"
ON public.subscribers_secure
FOR UPDATE
USING (false);

CREATE POLICY "No direct delete access to secure data"
ON public.subscribers_secure
FOR DELETE
USING (false);

-- Step 6: Migrate existing data from subscribers to the new tables
INSERT INTO public.subscribers_public (
  id, user_id, email, subscribed, subscription_tier, subscription_end,
  trial_start, trial_end, is_trial_active, created_at, updated_at
)
SELECT 
  id, user_id, email, subscribed, subscription_tier, subscription_end,
  trial_start, trial_end, is_trial_active, created_at, updated_at
FROM public.subscribers
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.subscribers_secure (user_id, stripe_customer_id, created_at, updated_at)
SELECT user_id, stripe_customer_id, created_at, updated_at
FROM public.subscribers
WHERE stripe_customer_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Step 7: Add triggers for updated_at columns
CREATE TRIGGER update_subscribers_public_updated_at
BEFORE UPDATE ON public.subscribers_public
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_secure_updated_at
BEFORE UPDATE ON public.subscribers_secure
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 8: Add indexes for performance
CREATE INDEX idx_subscribers_public_user_id ON public.subscribers_public(user_id);
CREATE INDEX idx_subscribers_secure_user_id ON public.subscribers_secure(user_id);

-- Step 9: Add comment explaining the security model
COMMENT ON TABLE public.subscribers_secure IS 'Contains sensitive payment data. Access restricted to service role only. Never query directly from client code.';
COMMENT ON TABLE public.subscribers_public IS 'Contains non-sensitive subscription information. Users can access their own data via RLS policies.';