-- Add subscription package and usage tracking to subscribers_public table
ALTER TABLE public.subscribers_public 
ADD COLUMN IF NOT EXISTS subscription_package TEXT CHECK (subscription_package IN ('all_access', 'assess_prep_learn', 'build_teach_launch', 'fund_it')),
ADD COLUMN IF NOT EXISTS monthly_ai_requests INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_request_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS extra_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_request_reset TIMESTAMP WITH TIME ZONE DEFAULT date_trunc('month', now()),
ADD COLUMN IF NOT EXISTS abuse_flags INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'warning'));

-- Create index for efficient usage queries
CREATE INDEX IF NOT EXISTS idx_subscribers_public_user_id ON public.subscribers_public(user_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_public_account_status ON public.subscribers_public(account_status);

-- Function to reset monthly AI requests
CREATE OR REPLACE FUNCTION public.reset_monthly_ai_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.subscribers_public
  SET monthly_ai_requests = 0,
      last_request_reset = date_trunc('month', now())
  WHERE last_request_reset < date_trunc('month', now());
END;
$$;

-- Function to check and increment AI usage
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subscriber RECORD;
  v_can_use BOOLEAN := false;
  v_reason TEXT := '';
  v_total_limit INTEGER;
BEGIN
  -- Reset monthly counters if needed
  PERFORM reset_monthly_ai_requests();
  
  -- Get subscriber info
  SELECT * INTO v_subscriber
  FROM public.subscribers_public
  WHERE user_id = p_user_id;
  
  -- Check if user exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'can_use', false,
      'reason', 'no_subscription',
      'remaining', 0,
      'total_used', 0
    );
  END IF;
  
  -- Check account status
  IF v_subscriber.account_status = 'suspended' THEN
    RETURN jsonb_build_object(
      'can_use', false,
      'reason', 'account_suspended',
      'remaining', 0,
      'total_used', v_subscriber.monthly_ai_requests
    );
  END IF;
  
  -- Calculate total limit
  v_total_limit := v_subscriber.ai_request_limit + v_subscriber.extra_credits;
  
  -- Check if trial active or subscribed
  IF (v_subscriber.trial_end > now() AND v_subscriber.is_trial_active) OR v_subscriber.subscribed THEN
    -- Check AI request limit
    IF v_subscriber.monthly_ai_requests < v_total_limit THEN
      -- Increment usage
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + 1
      WHERE user_id = p_user_id;
      
      v_can_use := true;
    ELSE
      v_reason := 'limit_exceeded';
    END IF;
  ELSE
    -- Free tier: 1 request per month
    IF v_subscriber.monthly_ai_requests < 1 THEN
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + 1
      WHERE user_id = p_user_id;
      
      v_can_use := true;
    ELSE
      v_reason := 'free_limit_exceeded';
    END IF;
  END IF;
  
  -- Calculate remaining requests
  RETURN jsonb_build_object(
    'can_use', v_can_use,
    'reason', v_reason,
    'remaining', GREATEST(0, v_total_limit - v_subscriber.monthly_ai_requests - CASE WHEN v_can_use THEN 1 ELSE 0 END),
    'total_used', v_subscriber.monthly_ai_requests + CASE WHEN v_can_use THEN 1 ELSE 0 END
  );
END;
$$;