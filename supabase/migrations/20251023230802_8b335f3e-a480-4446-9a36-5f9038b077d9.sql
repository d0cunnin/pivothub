-- Update free tier to 5 credits per month
-- This migration updates the check_and_increment_ai_usage function to properly support 5 credits for free users

-- Update the older version of the function (single parameter)
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
  
  -- Check if subscribed
  IF v_subscriber.subscribed THEN
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
    -- Free tier: 5 requests per month
    IF v_subscriber.monthly_ai_requests < 5 THEN
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

-- Update the newer version with weighted credits (three parameters)
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
  v_estimated_tokens INTEGER := 0;
  v_estimated_cost DECIMAL(10, 4) := 0;
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
      'total_used', 0,
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
      'credits_charged', 0
    );
  END IF;
  
  -- Calculate total credit limit
  v_total_limit := v_subscriber.ai_request_limit + v_subscriber.extra_credits;
  
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
  -- Assuming 20% input, 80% output
  v_estimated_cost := (v_estimated_tokens * 0.2 * 2.50 / 1000000) + 
                      (v_estimated_tokens * 0.8 * 10.00 / 1000000);
  
  -- Check if subscribed
  IF v_subscriber.subscribed THEN
    -- Check if user has enough credits
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_limit THEN
      -- Increment usage by the weighted amount
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
    -- Free tier: 5 credits per month
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= 5 THEN
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
    'remaining', GREATEST(0, v_total_limit - v_subscriber.monthly_ai_requests - CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END),
    'total_used', v_subscriber.monthly_ai_requests + CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END,
    'credits_charged', CASE WHEN v_can_use THEN p_credits_to_use ELSE 0 END
  );
END;
$$;

-- Update existing free users to have 5 credits limit and reset their usage
UPDATE public.subscribers_public
SET ai_request_limit = 5,
    monthly_ai_requests = 0,
    last_request_reset = now()
WHERE subscribed = false;

-- Update default limit for new users
ALTER TABLE public.subscribers_public 
ALTER COLUMN ai_request_limit SET DEFAULT 5;