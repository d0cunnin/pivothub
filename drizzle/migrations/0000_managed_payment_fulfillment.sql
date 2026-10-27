CREATE TABLE public.payment_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, environment text NOT NULL CHECK (environment IN ('sandbox','live')), stripe_subscription_id text NOT NULL, stripe_customer_id text NOT NULL, price_id text NOT NULL, status text NOT NULL, current_period_start timestamptz, current_period_end timestamptz, cancel_at_period_end boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(environment,stripe_subscription_id)
);
GRANT ALL ON public.payment_subscriptions TO service_role;
ALTER TABLE public.payment_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_payments ON public.payment_subscriptions FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE TABLE public.payment_credit_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, environment text NOT NULL CHECK (environment IN ('sandbox','live')), payment_key text NOT NULL, price_id text NOT NULL, credits integer NOT NULL CHECK(credits > 0), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(environment,payment_key)
);
GRANT ALL ON public.payment_credit_receipts TO service_role;
ALTER TABLE public.payment_credit_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_receipts ON public.payment_credit_receipts FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE OR REPLACE FUNCTION public.fulfill_payment_credits(p_user_id uuid,p_environment text,p_payment_key text,p_price_id text,p_period_start timestamptz DEFAULT NULL,p_period_end timestamptz DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_credits integer; v_plan text; v_inserted integer;
BEGIN
 IF p_environment NOT IN ('sandbox','live') THEN RAISE EXCEPTION 'Invalid environment'; END IF;
 CASE p_price_id WHEN 'starter_monthly' THEN v_credits:=40;v_plan:='starter'; WHEN 'pro_monthly' THEN v_credits:=100;v_plan:='pro'; WHEN 'all_access_monthly' THEN v_credits:=250;v_plan:='all-access'; WHEN 'small_pack' THEN v_credits:=25; WHEN 'boost_pack' THEN v_credits:=70; WHEN 'power_pack' THEN v_credits:=150; ELSE RAISE EXCEPTION 'Unknown price'; END CASE;
 INSERT INTO public.payment_credit_receipts(user_id,environment,payment_key,price_id,credits) VALUES(p_user_id,p_environment,p_payment_key,p_price_id,v_credits) ON CONFLICT(environment,payment_key) DO NOTHING;
 GET DIAGNOSTICS v_inserted=ROW_COUNT;
 IF v_inserted=0 THEN RETURN false; END IF;
 IF p_environment='live' THEN
  PERFORM 1 FROM public.subscribers_public WHERE user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Account missing'; END IF;
  IF v_plan IS NOT NULL THEN
   IF p_period_start IS NULL OR p_period_end IS NULL THEN RAISE EXCEPTION 'Billing period missing'; END IF;
   UPDATE public.subscribers_public SET subscribed=true,subscription_tier=v_plan,subscription_package=v_plan,ai_request_limit=v_credits,monthly_ai_requests=0,extra_credits=0,rollover_credits=0,billing_cycle_start=p_period_start,next_billing_date=p_period_end,subscription_end=p_period_end,last_request_reset=p_period_start,updated_at=now() WHERE user_id=p_user_id AND (billing_cycle_start IS NULL OR billing_cycle_start<=p_period_start);
  ELSE
   IF NOT EXISTS(SELECT 1 FROM public.payment_subscriptions WHERE user_id=p_user_id AND environment='live' AND status IN ('active','past_due','trialing') AND current_period_end>now()) THEN RAISE EXCEPTION 'Active subscription required'; END IF;
   UPDATE public.subscribers_public SET extra_credits=COALESCE(extra_credits,0)+v_credits,updated_at=now() WHERE user_id=p_user_id;
  END IF;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.fulfill_payment_credits(uuid,text,text,text,timestamptz,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_payment_credits(uuid,text,text,text,timestamptz,timestamptz) TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.subscribers_public FROM anon,authenticated;
COMMENT ON TABLE public.payment_credit_receipts IS 'Verified payment fulfillment ledger; test receipts never alter live Tool Credits.';
CREATE OR REPLACE FUNCTION public.reset_monthly_ai_requests() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_record RECORD; v_months_passed INTEGER; v_next_reset_date TIMESTAMPTZ;
BEGIN
 UPDATE public.subscribers_public sp SET rollover_credits=LEAST(ai_request_limit*2,GREATEST(0,(ai_request_limit+extra_credits+rollover_credits)-monthly_ai_requests)),monthly_ai_requests=0,last_request_reset=now(),next_billing_date=next_billing_date+INTERVAL '1 month'
 WHERE subscribed=true AND next_billing_date IS NOT NULL AND next_billing_date<=now() AND NOT EXISTS(SELECT 1 FROM public.payment_subscriptions ps WHERE ps.user_id=sp.user_id AND ps.environment='live');
 UPDATE public.subscribers_public sp SET subscribed=false,subscription_tier=NULL,subscription_package=NULL,ai_request_limit=5,monthly_ai_requests=0,extra_credits=0,rollover_credits=0,next_billing_date=NULL,free_tier_start_date=now(),last_request_reset=now()
 WHERE subscribed=true AND subscription_end<=now() AND EXISTS(SELECT 1 FROM public.payment_subscriptions ps WHERE ps.user_id=sp.user_id AND ps.environment='live') AND NOT EXISTS(SELECT 1 FROM public.payment_subscriptions ps WHERE ps.user_id=sp.user_id AND ps.environment='live' AND ps.status IN ('active','trialing','past_due') AND ps.current_period_end>now());
 FOR v_record IN SELECT user_id,free_tier_start_date,last_request_reset FROM public.subscribers_public WHERE subscribed=false AND free_tier_start_date IS NOT NULL LOOP
 v_months_passed:=FLOOR(EXTRACT(EPOCH FROM(now()-v_record.free_tier_start_date))/(30.44*24*60*60))::integer;
 v_next_reset_date:=v_record.free_tier_start_date+(v_months_passed||' months')::interval;
 IF now()>=v_next_reset_date AND v_record.last_request_reset<v_next_reset_date THEN UPDATE public.subscribers_public SET rollover_credits=0,monthly_ai_requests=0,last_request_reset=now() WHERE user_id=v_record.user_id; END IF;
 END LOOP;
END $$;