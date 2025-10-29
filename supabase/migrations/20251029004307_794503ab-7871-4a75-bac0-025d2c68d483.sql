-- PHASE 1 CORRECTED: Create users table and fix backfill query

-- Create users table if not exists (from previous attempt)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Billing fields
  subscription_tier TEXT DEFAULT 'explore',
  subscription_package TEXT,
  subscription_status TEXT DEFAULT 'active',
  subscribed BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  billing_cycle_start TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  
  -- Credits system
  ai_credits_remaining INTEGER DEFAULT 5,
  ai_credits_used INTEGER DEFAULT 0,
  ai_credits_total INTEGER DEFAULT 5,
  ai_usage_month INTEGER,
  ai_usage_year INTEGER,
  grace_period_end TIMESTAMPTZ,
  
  -- Metadata
  onboarding_completed BOOLEAN DEFAULT false,
  last_login TIMESTAMPTZ
);

-- Indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;

-- Create RLS policies
CREATE POLICY "Users can view own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- Update trigger function to handle both profiles and users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles (idempotent)
  INSERT INTO public.profiles (id, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    updated_at = NOW();
  
  -- Insert into users (idempotent)
  INSERT INTO public.users (
    id, 
    email, 
    display_name,
    subscription_tier,
    ai_credits_remaining,
    ai_credits_total,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    'explore',
    5,
    5,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, users.display_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- CORRECTED BACKFILL: Pull subscription data from subscribers_public
INSERT INTO public.users (
  id, 
  email, 
  display_name, 
  subscription_tier,
  subscription_package,
  subscribed,
  stripe_customer_id,
  subscription_start,
  subscription_end,
  billing_cycle_start,
  next_billing_date,
  ai_credits_remaining,
  ai_credits_total,
  ai_credits_used,
  grace_period_end,
  subscription_status,
  onboarding_completed,
  created_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(p.display_name, SPLIT_PART(au.email, '@', 1)),
  COALESCE(sp.subscription_tier, 'explore'),
  sp.subscription_package,
  COALESCE(sp.subscribed, false),
  ss.stripe_customer_id,
  sp.subscription_start_date,
  sp.subscription_end,
  sp.billing_cycle_start,
  sp.next_billing_date,
  COALESCE(sp.ai_request_limit - sp.monthly_ai_requests + sp.extra_credits + sp.rollover_credits, 5),
  COALESCE(sp.ai_request_limit + sp.extra_credits, 5),
  COALESCE(sp.monthly_ai_requests, 0),
  sp.grace_period_end,
  COALESCE(sp.account_status, 'active'),
  COALESCE(p.onboarding_completed, false),
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
LEFT JOIN public.subscribers_public sp ON sp.user_id = au.id
LEFT JOIN public.subscribers_secure ss ON ss.user_id = au.id
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id)
ON CONFLICT (id) DO UPDATE SET
  subscription_tier = EXCLUDED.subscription_tier,
  subscription_package = EXCLUDED.subscription_package,
  subscribed = EXCLUDED.subscribed,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  ai_credits_remaining = EXCLUDED.ai_credits_remaining,
  ai_credits_total = EXCLUDED.ai_credits_total,
  updated_at = NOW();

-- Create credit deduction log table (if not exists)
CREATE TABLE IF NOT EXISTS public.credit_deduction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  credits_deducted INTEGER NOT NULL,
  request_hash TEXT,
  deducted_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, request_hash)
);

CREATE INDEX IF NOT EXISTS idx_credit_log_user_hash ON public.credit_deduction_log(user_id, request_hash);

-- Enable RLS on credit log
ALTER TABLE public.credit_deduction_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit log" ON public.credit_deduction_log;
DROP POLICY IF EXISTS "Service role credit log access" ON public.credit_deduction_log;

CREATE POLICY "Users can view own credit log" ON public.credit_deduction_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role credit log access" ON public.credit_deduction_log
  FOR ALL USING (auth.role() = 'service_role');