-- Create function to initialize subscriber records for new users
CREATE OR REPLACE FUNCTION public.initialize_new_subscriber()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into subscribers_public with free tier defaults
  INSERT INTO public.subscribers_public (
    user_id,
    subscribed,
    ai_request_limit,
    monthly_ai_requests,
    extra_credits,
    rollover_credits,
    account_status,
    free_tier_start_date,
    last_request_reset
  ) VALUES (
    NEW.id,
    false,
    5,
    0,
    0,
    0,
    'active',
    now(),
    now()
  );

  -- Insert into subscribers_secure
  INSERT INTO public.subscribers_secure (
    user_id,
    email
  ) VALUES (
    NEW.id,
    NEW.email
  );

  RETURN NEW;
END;
$$;

-- Create trigger to initialize subscribers on user creation
DROP TRIGGER IF EXISTS on_auth_user_created_subscriber ON auth.users;
CREATE TRIGGER on_auth_user_created_subscriber
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_new_subscriber();

-- Backfill existing users who don't have subscriber records
INSERT INTO public.subscribers_public (
  user_id,
  subscribed,
  ai_request_limit,
  monthly_ai_requests,
  extra_credits,
  rollover_credits,
  account_status,
  free_tier_start_date,
  last_request_reset
)
SELECT 
  au.id,
  false,
  5,
  0,
  0,
  0,
  'active',
  now(),
  now()
FROM auth.users au
LEFT JOIN public.subscribers_public sp ON sp.user_id = au.id
WHERE sp.user_id IS NULL;

-- Backfill subscribers_secure for existing users
INSERT INTO public.subscribers_secure (
  user_id,
  email
)
SELECT 
  au.id,
  au.email
FROM auth.users au
LEFT JOIN public.subscribers_secure ss ON ss.user_id = au.id
WHERE ss.user_id IS NULL;