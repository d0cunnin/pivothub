-- Migration: Anniversary-Based Credit Reset System with Exact Calendar Months

-- ==========================================
-- Part 1: Add Tracking Columns
-- ==========================================

ALTER TABLE public.subscribers_public 
ADD COLUMN IF NOT EXISTS free_tier_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_retry_count INTEGER DEFAULT 0;

-- Backfill free_tier_start_date for existing Explorer Mode users
UPDATE public.subscribers_public
SET free_tier_start_date = COALESCE(last_request_reset, created_at)
WHERE subscribed = false AND free_tier_start_date IS NULL;

-- Backfill subscription_start_date for existing paid users
UPDATE public.subscribers_public
SET subscription_start_date = COALESCE(billing_cycle_start, created_at)
WHERE subscribed = true AND subscription_start_date IS NULL;

-- ==========================================
-- Part 2: Update reset_monthly_ai_requests() Function
-- ==========================================

CREATE OR REPLACE FUNCTION public.reset_monthly_ai_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_record RECORD;
  v_months_passed INTEGER;
  v_next_reset_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- ==========================================
  -- PAID SUBSCRIBERS: Anniversary reset with 2× rollover cap
  -- ==========================================
  UPDATE public.subscribers_public
  SET 
    rollover_credits = LEAST(
      ai_request_limit * 2,
      GREATEST(0, (ai_request_limit + extra_credits + rollover_credits) - monthly_ai_requests)
    ),
    monthly_ai_requests = 0,
    last_request_reset = now(),
    next_billing_date = next_billing_date + INTERVAL '1 month'
  WHERE subscribed = true 
    AND next_billing_date IS NOT NULL
    AND next_billing_date <= now();
  
  -- ==========================================
  -- FREE TIER (EXPLORE MODE): Anniversary reset, NO rollover
  -- Uses exact calendar months (Jan 31 → Feb 28/29 → Mar 31)
  -- ==========================================
  
  FOR v_record IN 
    SELECT user_id, free_tier_start_date, last_request_reset
    FROM public.subscribers_public
    WHERE subscribed = false
      AND free_tier_start_date IS NOT NULL
  LOOP
    -- Calculate how many full months have passed since free_tier_start_date
    v_months_passed := FLOOR(
      EXTRACT(EPOCH FROM (now() - v_record.free_tier_start_date)) / (30.44 * 24 * 60 * 60)
    )::INTEGER;
    
    -- Calculate the exact next reset date (handles month-end edge cases)
    v_next_reset_date := v_record.free_tier_start_date + (v_months_passed || ' months')::INTERVAL;
    
    -- Only reset if we've passed the next reset date and haven't already reset for this period
    IF now() >= v_next_reset_date 
       AND v_record.last_request_reset < v_next_reset_date THEN
      
      UPDATE public.subscribers_public
      SET 
        rollover_credits = 0,
        monthly_ai_requests = 0,
        last_request_reset = now()
      WHERE user_id = v_record.user_id;
      
    END IF;
  END LOOP;
  
  -- ==========================================
  -- GRACE PERIOD EXPIRATION: Auto-downgrade after 7 days
  -- Downgrade to Explore Mode with 5 credits
  -- ==========================================
  UPDATE public.subscribers_public
  SET 
    subscribed = false,
    subscription_end = NULL,
    subscription_package = NULL,
    subscription_tier = NULL,
    subscription_start_date = NULL,
    billing_cycle_start = NULL,
    next_billing_date = NULL,
    ai_request_limit = 5,
    rollover_credits = 0,
    monthly_ai_requests = 0,
    extra_credits = 0,
    free_tier_start_date = now(),
    last_request_reset = now(),
    payment_retry_count = 0,
    account_status = 'active',
    grace_period_end = NULL
  WHERE grace_period_end IS NOT NULL
    AND grace_period_end <= now()
    AND subscribed = true;
END;
$$;

-- ==========================================
-- Part 3: Update check_and_increment_ai_usage() Function
-- Remove rollover from free tier calculation
-- ==========================================

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid, p_tool_name text DEFAULT 'generic'::text, p_credits_to_use integer DEFAULT 1)
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
    -- Free tier: 5 credits per month, NO rollover
    v_total_available := 5;
    
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