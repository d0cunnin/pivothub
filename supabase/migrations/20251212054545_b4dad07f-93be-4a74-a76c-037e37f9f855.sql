-- Step 1: Create SECURITY DEFINER function for masked admin access
CREATE OR REPLACE FUNCTION public.get_subscriber_secure_data(target_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  user_id uuid,
  email_masked text,
  has_stripe_customer boolean,
  has_stripe_subscription boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  
  -- Return masked data - full Stripe IDs only via MFA-protected edge functions
  RETURN QUERY
  SELECT 
    s.user_id,
    mask_email(s.email) as email_masked,
    (s.stripe_customer_id IS NOT NULL) as has_stripe_customer,
    (s.stripe_subscription_id IS NOT NULL) as has_stripe_subscription,
    s.created_at,
    s.updated_at
  FROM subscribers_secure s
  WHERE target_user_id IS NULL OR s.user_id = target_user_id;
END;
$$;

-- Step 2: Remove direct admin SELECT access from RLS
DROP POLICY IF EXISTS "subscribers_secure: admin read" ON public.subscribers_secure;