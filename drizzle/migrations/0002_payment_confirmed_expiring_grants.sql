CREATE OR REPLACE FUNCTION public.issue_payment_grant(p_user_id uuid,p_environment text,p_payment_key text,p_price_id text,p_credits integer,p_issued_at timestamptz,p_period_start timestamptz DEFAULT NULL,p_period_end timestamptz DEFAULT NULL,p_payment_intent_id text DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE prior_end timestamptz; prior_start timestamptz; prior_price text; plan_name text; BEGIN
IF p_environment NOT IN ('sandbox','live') OR p_credits<=0 OR p_issued_at IS NULL OR p_price_id NOT IN ('starter_monthly','pro_monthly','all_access_monthly','small_pack','boost_pack','power_pack') THEN RAISE EXCEPTION 'Invalid payment grant'; END IF;
PERFORM 1 FROM public.subscribers_public WHERE user_id=p_user_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Credit account missing'; END IF;
INSERT INTO public.payment_credit_receipts(user_id,environment,payment_key,price_id,credits,issued_at,payment_intent_id) VALUES(p_user_id,p_environment,p_payment_key,p_price_id,p_credits,p_issued_at,p_payment_intent_id) ON CONFLICT(environment,payment_key) DO NOTHING; IF NOT FOUND THEN RETURN false; END IF;
INSERT INTO public.credit_grants(user_id,environment,source_key,price_id,issued_at,expires_at,amount,remaining) VALUES(p_user_id,p_environment,p_payment_key,p_price_id,p_issued_at,p_issued_at+interval '3 months',p_credits,p_credits);
IF p_period_end IS NOT NULL THEN
SELECT paid_period_end,paid_period_start,entitled_price_id INTO prior_end,prior_start,prior_price FROM public.payment_subscriptions WHERE user_id=p_user_id AND environment=p_environment ORDER BY paid_period_end DESC NULLS LAST LIMIT 1;
IF prior_end IS NULL OR p_period_start>prior_start OR (p_period_start=prior_start AND CASE p_price_id WHEN 'starter_monthly' THEN 40 WHEN 'pro_monthly' THEN 100 ELSE 250 END>=CASE prior_price WHEN 'starter_monthly' THEN 40 WHEN 'pro_monthly' THEN 100 WHEN 'all_access_monthly' THEN 250 ELSE 0 END) THEN
UPDATE public.payment_subscriptions SET entitled_price_id=p_price_id,paid_period_start=p_period_start,paid_period_end=p_period_end WHERE user_id=p_user_id AND environment=p_environment AND current_period_end>=p_period_end;
IF p_environment='live' AND p_period_end>now() THEN plan_name:=CASE p_price_id WHEN 'starter_monthly' THEN 'starter' WHEN 'pro_monthly' THEN 'pro' ELSE 'all-access' END; UPDATE public.subscribers_public SET subscribed=true,subscription_tier=plan_name,subscription_package=plan_name,subscription_start_date=p_period_start,subscription_end=p_period_end,billing_cycle_start=p_period_start,next_billing_date=p_period_end WHERE user_id=p_user_id; END IF; END IF; END IF;
IF p_environment='live' THEN PERFORM public.refresh_credit_account(p_user_id); END IF; RETURN true; END $$;
REVOKE ALL ON FUNCTION public.issue_payment_grant(uuid,text,text,text,integer,timestamptz,timestamptz,timestamptz,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_payment_grant(uuid,text,text,text,integer,timestamptz,timestamptz,timestamptz,text) TO service_role;
CREATE TABLE public.payment_refund_receipts(environment text NOT NULL,refund_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(environment,refund_id));
GRANT ALL ON public.payment_refund_receipts TO service_role;
ALTER TABLE public.payment_refund_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_refund_receipts_service ON public.payment_refund_receipts FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE OR REPLACE FUNCTION public.reconcile_credit_refund(p_environment text,p_refund_id text,p_payment_intent_id text,p_fraction numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE g record; revoke_amount integer; available integer; BEGIN
IF p_fraction<=0 OR p_fraction>1 THEN RAISE EXCEPTION 'Invalid refund fraction'; END IF;
INSERT INTO public.payment_refund_receipts(environment,refund_id) VALUES(p_environment,p_refund_id) ON CONFLICT DO NOTHING; IF NOT FOUND THEN RETURN; END IF;
FOR g IN SELECT cg.* FROM public.credit_grants cg JOIN public.payment_credit_receipts r ON r.environment=cg.environment AND r.payment_key=cg.source_key WHERE r.environment=p_environment AND r.payment_intent_id=p_payment_intent_id LOOP
PERFORM public.refresh_credit_account(g.user_id); SELECT * INTO g FROM public.credit_grants WHERE id=g.id FOR UPDATE;
revoke_amount:=LEAST(g.amount-g.revoked,ceil(g.amount*p_fraction)::integer); available:=LEAST(revoke_amount,g.remaining);
UPDATE public.credit_grants SET remaining=remaining-available,revoked=revoked+revoke_amount WHERE id=g.id;
IF available<revoke_amount THEN INSERT INTO public.billing_reviews(environment,provider_key,reason,details) VALUES(p_environment,p_refund_id||':'||g.id,'Refund includes spent credits',jsonb_build_object('user_id',g.user_id,'spent_credits',revoke_amount-available)) ON CONFLICT DO NOTHING; END IF;
IF p_environment='live' THEN PERFORM public.refresh_credit_account(g.user_id); END IF; END LOOP; END $$;
REVOKE ALL ON FUNCTION public.reconcile_credit_refund(text,text,text,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_credit_refund(text,text,text,numeric) TO service_role;
COMMENT ON FUNCTION public.fulfill_payment_credits(uuid,text,text,text,timestamptz,timestamptz) IS 'DEPRECATED: replaced by invoice-line validated issue_payment_grant.';