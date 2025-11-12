-- Fix check_and_increment_ai_usage to include extra_credits for non-subscribed users
CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(p_user_id uuid, p_tool_name text DEFAULT 'generic'::text, p_credits_to_use integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_subscriber RECORD;
  v_can_use BOOLEAN := false;
  v_reason TEXT := '';
  v_total_limit INTEGER;
  v_total_available INTEGER;
  v_estimated_tokens INTEGER := 0;
  v_estimated_cost DECIMAL(10, 4) := 0;
BEGIN
  PERFORM reset_monthly_ai_requests();
  
  SELECT * INTO v_subscriber
  FROM public.subscribers_public
  WHERE user_id = p_user_id;
  
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
  
  v_total_limit := v_subscriber.ai_request_limit + v_subscriber.extra_credits;
  v_total_available := v_total_limit + v_subscriber.rollover_credits;
  
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
  
  v_estimated_cost := (v_estimated_tokens * 0.2 * 2.50 / 1000000) + 
                      (v_estimated_tokens * 0.8 * 10.00 / 1000000);
  
  IF v_subscriber.subscribed OR v_subscriber.grace_period_end IS NOT NULL THEN
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_available THEN
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + p_credits_to_use
      WHERE user_id = p_user_id;
      
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
    -- Include extra_credits for non-subscribed users (for admin testing, promotions, etc.)
    v_total_available := 5 + COALESCE(v_subscriber.extra_credits, 0);
    
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= v_total_available THEN
      UPDATE public.subscribers_public
      SET monthly_ai_requests = monthly_ai_requests + p_credits_to_use
      WHERE user_id = p_user_id;
      
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
$function$;