-- Add billing cycle tracking and rollover credit support
ALTER TABLE public.subscribers_public 
ADD COLUMN IF NOT EXISTS billing_cycle_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rollover_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMP WITH TIME ZONE;

-- Update reset function to handle rollover credits
CREATE OR REPLACE FUNCTION public.reset_monthly_ai_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Handle paid subscribers with billing cycle dates
  UPDATE public.subscribers_public
  SET rollover_credits = GREATEST(0, (ai_request_limit + extra_credits + rollover_credits) - monthly_ai_requests),
      monthly_ai_requests = 0,
      last_request_reset = now(),
      next_billing_date = next_billing_date + INTERVAL '1 month'
  WHERE subscribed = true 
    AND next_billing_date IS NOT NULL
    AND next_billing_date <= now();
    
  -- Handle free tier (calendar month reset, with rollover)
  UPDATE public.subscribers_public
  SET rollover_credits = GREATEST(0, (5 + rollover_credits) - monthly_ai_requests),
      monthly_ai_requests = 0,
      last_request_reset = date_trunc('month', now())
  WHERE subscribed = false
    AND last_request_reset < date_trunc('month', now());
    
  -- Handle grace period expiration (auto-downgrade)
  UPDATE public.subscribers_public
  SET subscribed = false,
      subscription_end = NULL,
      subscription_package = NULL,
      subscription_tier = NULL,
      billing_cycle_start = NULL,
      next_billing_date = NULL,
      ai_request_limit = 5,
      rollover_credits = 0, -- Delete all rollover credits
      monthly_ai_requests = 0,
      account_status = 'active',
      grace_period_end = NULL,
      last_request_reset = now()
  WHERE grace_period_end IS NOT NULL
    AND grace_period_end <= now()
    AND subscribed = true;
END;
$$;

-- Update usage check function to include rollover credits
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  p_user_id UUID,
  p_tool_name TEXT DEFAULT 'generic',
  p_credits_to_use INTEGER DEFAULT 1
)
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
  v_total_available INTEGER;
  v_estimated_tokens INTEGER := 0;
  v_estimated_cost DECIMAL(10, 4) := 0;
BEGIN
  -- Reset monthly counters and handle grace period expirations
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
      'total_used', 0,
      'total_available', 0,
      'rollover_credits', 0,
      'credits_charged', 0
    );
  END IF;
  
  -- Check account status
  IF v_subscriber.account_status = 'suspended' THEN
    RETURN jsonb_build_object(
      'can_use', false,
      'reason', 'account_suspended',
      'remaining', 0,
      'total_used', v_subscriber.monthly_ai_requests,
      'total_available', v_subscriber.ai_request_limit + v_subscriber.extra_credits + v_subscriber.rollover_credits,
      'rollover_credits', v_subscriber.rollover_credits,
      'credits_charged', 0
    );
  END IF;
  
  -- Calculate limits including rollover
  v_total_limit := v_subscriber.ai_request_limit + v_subscriber.extra_credits;
  v_total_available := v_total_limit + v_subscriber.rollover_credits;
  
  -- Estimate token usage and cost based on tool
  v_estimated_tokens := CASE p_tool_name
    WHEN 'teaching-materials' THEN 10000
    WHEN 'business-plan' THEN 8000
    WHEN 'grant-content' THEN 8000
    WHEN 'pitch-deck' THEN 6000
    WHEN 'marketing-strategy' THEN 6000
    WHEN 'legal-docs' THEN 6000
    WHEN 'business-idea' THEN 4000
    WHEN 'social-media' THEN 3000
    WHEN 'resume-analyzer' THEN 3000
    WHEN 'interview-feedback' THEN 3000
    WHEN 'business-foundation' THEN 3000
    WHEN 'grant-finder' THEN 2000
    ELSE 1500
  END;
  
  -- Calculate cost at GPT-5 rates ($2.50 input + $10 output per 1M tokens)
  v_estimated_cost := (v_estimated_tokens * 0.2 * 2.50 / 1000000) + 
                      (v_estimated_tokens * 0.8 * 10.00 / 1000000);
  
  -- Check if subscribed (including grace period)
  IF v_subscriber.subscribed OR v_subscriber.grace_period_end IS NOT NULL THEN
    -- Check if user has enough credits (including rollover)
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_available THEN
      -- Increment usage
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + p_credits_to_use
      WHERE user_id = p_user_id;
      
      -- Log detailed usage
      INSERT INTO public.tool_usage_analytics (
        user_id, 
        tool_name, 
        credits_used, 
        estimated_tokens,
        estimated_cost_usd
      ) VALUES (
        p_user_id, 
        p_tool_name, 
        p_credits_to_use,
        v_estimated_tokens,
        v_estimated_cost
      );
      
      v_can_use := true;
    ELSE
      v_reason := 'limit_exceeded';
    END IF;
  ELSE
    -- Free tier: 5 credits per month + rollover
    v_total_available := 5 + v_subscriber.rollover_credits;
    
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_available THEN
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + p_credits_to_use
      WHERE user_id = p_user_id;
      
      -- Log usage even for free tier
      INSERT INTO public.tool_usage_analytics (
        user_id, 
        tool_name, 
        credits_used,
        estimated_tokens,
        estimated_cost_usd
      ) VALUES (
        p_user_id, 
        p_tool_name, 
        p_credits_to_use,
        v_estimated_tokens,
        v_estimated_cost
      );
      
      v_can_use := true;
    ELSE
      v_reason := 'free_limit_exceeded';
    END IF;
  END IF;
  
  -- Calculate remaining credits
  RETURN jsonb_build_object(
    'can_use', v_can_use,
    'reason', v_reason,
    'remaining', GREATEST(0, v_total_available - v_subscriber.monthly_ai_requests - CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END),
    'total_used', v_subscriber.monthly_ai_requests + CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END,
    'total_available', v_total_available,
    'rollover_credits', v_subscriber.rollover_credits,
    'credits_charged', CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END
  );
END;
$$;

-- Also update the single-parameter version for backwards compatibility
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.check_and_increment_ai_usage(p_user_id, 'generic', 1);
END;
$$;