ALTER TABLE public.payment_subscriptions ADD COLUMN IF NOT EXISTS sync_observed_at timestamptz;
CREATE OR REPLACE FUNCTION public.protect_subscription_snapshot() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF OLD.sync_observed_at IS NOT NULL AND NEW.sync_observed_at<OLD.sync_observed_at THEN RETURN OLD; END IF; RETURN NEW; END $$;
CREATE TRIGGER payment_subscription_snapshot BEFORE UPDATE ON public.payment_subscriptions FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_snapshot();
ALTER TABLE public.payment_refund_receipts ADD COLUMN IF NOT EXISTS payment_intent_id text;
ALTER TABLE public.payment_refund_receipts ADD COLUMN IF NOT EXISTS fraction numeric NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.reconcile_credit_refund(p_environment text,p_refund_id text,p_payment_intent_id text,p_fraction numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE g record; revoke_amount integer; available integer; total_fraction numeric; BEGIN
IF p_fraction<=0 OR p_fraction>1 OR p_payment_intent_id IS NULL THEN RAISE EXCEPTION 'Invalid refund fraction'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(p_environment||':'||p_payment_intent_id,0));
INSERT INTO public.payment_refund_receipts(environment,refund_id,payment_intent_id,fraction) VALUES(p_environment,p_refund_id,p_payment_intent_id,p_fraction) ON CONFLICT DO NOTHING; IF NOT FOUND THEN RETURN; END IF;
SELECT LEAST(1,sum(fraction)) INTO total_fraction FROM public.payment_refund_receipts WHERE environment=p_environment AND payment_intent_id=p_payment_intent_id;
FOR g IN SELECT cg.* FROM public.credit_grants cg JOIN public.payment_credit_receipts r ON r.environment=cg.environment AND r.payment_key=cg.source_key WHERE r.environment=p_environment AND r.payment_intent_id=p_payment_intent_id LOOP
PERFORM public.refresh_credit_account(g.user_id); SELECT * INTO g FROM public.credit_grants WHERE id=g.id FOR UPDATE;
revoke_amount:=GREATEST(0,LEAST(g.amount,ceil(g.amount*total_fraction)::integer)-g.revoked); available:=LEAST(revoke_amount,g.remaining);
UPDATE public.credit_grants SET remaining=remaining-available,revoked=revoked+revoke_amount WHERE id=g.id;
IF available<revoke_amount THEN INSERT INTO public.billing_reviews(environment,provider_key,reason,details) VALUES(p_environment,p_refund_id||':'||g.id,'Refund includes spent credits',jsonb_build_object('user_id',g.user_id,'spent_credits',revoke_amount-available)) ON CONFLICT DO NOTHING; END IF;
IF p_environment='live' THEN PERFORM public.refresh_credit_account(g.user_id); END IF; END LOOP; END $$;
REVOKE ALL ON FUNCTION public.reconcile_credit_refund(text,text,text,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_credit_refund(text,text,text,numeric) TO service_role;