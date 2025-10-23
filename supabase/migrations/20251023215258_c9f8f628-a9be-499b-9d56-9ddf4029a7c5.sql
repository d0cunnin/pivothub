-- Drop and recreate tool_usage_analytics table with new weighted credit schema
DROP TABLE IF EXISTS public.tool_usage_analytics CASCADE;

CREATE TABLE public.tool_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  credits_used INTEGER NOT NULL,
  estimated_tokens INTEGER,
  estimated_cost_usd DECIMAL(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  month_year TEXT
);

-- Create trigger to auto-populate month_year
CREATE OR REPLACE FUNCTION public.set_month_year()
RETURNS TRIGGER AS $$
BEGIN
  NEW.month_year := to_char(NEW.created_at, 'YYYY-MM');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tool_usage_month_year
BEFORE INSERT ON public.tool_usage_analytics
FOR EACH ROW
EXECUTE FUNCTION public.set_month_year();

-- Index for fast queries
CREATE INDEX idx_tool_usage_user_month ON public.tool_usage_analytics(user_id, month_year);
CREATE INDEX idx_tool_usage_tool ON public.tool_usage_analytics(tool_name);
CREATE INDEX idx_tool_usage_created_at ON public.tool_usage_analytics(created_at);

-- RLS Policies
ALTER TABLE public.tool_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON public.tool_usage_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage"
  ON public.tool_usage_analytics FOR INSERT
  WITH CHECK (true);

-- Create monthly usage summary view
CREATE OR REPLACE VIEW public.monthly_usage_summary AS
SELECT 
  user_id,
  month_year,
  COUNT(*) as total_uses,
  SUM(credits_used) as total_credits,
  SUM(estimated_cost_usd) as total_cost_usd
FROM public.tool_usage_analytics
GROUP BY user_id, month_year;

-- Admin view: All users' costs with profit analysis
CREATE OR REPLACE VIEW public.admin_cost_analysis AS
SELECT 
  u.email,
  sp.subscription_package,
  sp.subscribed,
  COALESCE(mus.month_year, to_char(now(), 'YYYY-MM')) as month_year,
  COALESCE(mus.total_credits, 0) as total_credits,
  COALESCE(mus.total_cost_usd, 0) as total_cost_usd,
  CASE 
    WHEN sp.subscription_package = 'all-access' THEN 29.00
    WHEN sp.subscription_package = 'assess-prep-learn' THEN 18.00
    WHEN sp.subscription_package = 'build-teach-launch' THEN 18.00
    WHEN sp.subscription_package = 'fund-it' THEN 15.00
    ELSE 0
  END as monthly_revenue,
  (
    CASE 
      WHEN sp.subscription_package = 'all-access' THEN 29.00
      WHEN sp.subscription_package = 'assess-prep-learn' THEN 18.00
      WHEN sp.subscription_package = 'build-teach-launch' THEN 18.00
      WHEN sp.subscription_package = 'fund-it' THEN 15.00
      ELSE 0
    END - COALESCE(mus.total_cost_usd, 0)
  ) as profit_margin
FROM public.subscribers_public sp
JOIN auth.users u ON u.id = sp.user_id
LEFT JOIN public.monthly_usage_summary mus ON sp.user_id = mus.user_id AND mus.month_year = to_char(now(), 'YYYY-MM')
WHERE sp.subscribed = true
ORDER BY profit_margin ASC;

-- Update check_and_increment_ai_usage function to support weighted credits
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
  
  -- Check if trial active or subscribed
  IF (v_subscriber.trial_end > now() AND v_subscriber.is_trial_active) OR v_subscriber.subscribed THEN
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
    -- Free tier: 3 credits per month
    IF v_subscriber.monthly_ai_requests + p_credits_to_use <= 3 THEN
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