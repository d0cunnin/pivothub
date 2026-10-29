CREATE TABLE public.admin_credit_awards (
 id uuid PRIMARY KEY,
 admin_user_id uuid NOT NULL,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 plan text NOT NULL CHECK (plan IN ('starter','pro','all-access','custom')),
 monthly_credits integer NOT NULL CHECK (monthly_credits BETWEEN 1 AND 100000),
 months integer NOT NULL CHECK (months IN (1,3,6,12)),
 note text NOT NULL DEFAULT '' CHECK (length(note)<=2000),
 starts_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_credit_awards TO service_role;
REVOKE ALL ON public.admin_credit_awards FROM anon, authenticated;
ALTER TABLE public.admin_credit_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages complimentary awards" ON public.admin_credit_awards FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX admin_credit_awards_user_idx ON public.admin_credit_awards(user_id);

CREATE OR REPLACE FUNCTION public.materialize_admin_credit_awards(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
BEGIN
 INSERT INTO public.credit_grants(user_id,environment,source_key,price_id,issued_at,expires_at,amount,remaining)
 SELECT a.user_id,'live','admin:'||a.id::text||':'||m.n::text,NULL,
 a.starts_at+make_interval(months=>m.n),
 (a.starts_at+make_interval(months=>m.n))+interval '3 months',
 a.monthly_credits,a.monthly_credits
 FROM public.admin_credit_awards a CROSS JOIN LATERAL generate_series(0,a.months-1) AS m(n)
 WHERE a.user_id=p_user_id
 AND a.starts_at+make_interval(months=>m.n)<=now()
 AND (a.starts_at+make_interval(months=>m.n))+interval '3 months'>now()
 ON CONFLICT(environment,source_key) DO NOTHING;
END $function$;
REVOKE ALL ON FUNCTION public.materialize_admin_credit_awards(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.materialize_admin_credit_awards(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.refresh_credit_account(p_user_id uuid)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE s record; paid integer; held integer; boundary timestamptz; anchor timestamptz; months integer; active_plan text;
BEGIN
 SELECT * INTO s FROM public.subscribers_public WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('remaining',0,'account_status','missing'); END IF;
 PERFORM public.materialize_admin_credit_awards(p_user_id);
 SELECT entitled_price_id INTO active_plan FROM public.payment_subscriptions WHERE user_id=p_user_id AND environment='live' AND paid_period_end>now() AND entitled_price_id IS NOT NULL ORDER BY paid_period_end DESC LIMIT 1;
 IF active_plan IS NULL AND s.subscribed AND EXISTS(SELECT 1 FROM public.payment_subscriptions WHERE user_id=p_user_id AND environment='live') THEN
  UPDATE public.subscribers_public SET subscribed=false,subscription_tier=NULL,subscription_package=NULL,free_tier_start_date=now(),free_credit_reset_at=now(),free_credits_remaining=5 WHERE user_id=p_user_id;
  SELECT * INTO s FROM public.subscribers_public WHERE user_id=p_user_id;
 END IF;
 IF NOT s.subscribed THEN
  anchor:=COALESCE(s.free_tier_start_date,s.created_at); months:=GREATEST(0,(extract(year FROM age(now(),anchor))*12+extract(month FROM age(now(),anchor)))::integer); boundary:=anchor+make_interval(months=>months);
  IF boundary>COALESCE(s.free_credit_reset_at,anchor) THEN UPDATE public.subscribers_public SET free_credits_remaining=5,free_credit_reset_at=boundary,monthly_ai_requests=0 WHERE user_id=p_user_id; s.free_credits_remaining:=5; s.monthly_ai_requests:=0; END IF;
 END IF;
 SELECT COALESCE(sum(remaining),0) INTO paid FROM public.credit_grants WHERE user_id=p_user_id AND environment='live' AND issued_at<=now() AND expires_at>now();
 SELECT COALESCE(sum(amount),0) INTO held FROM public.credit_reservations WHERE user_id=p_user_id AND status='held' AND expires_at>now();
 UPDATE public.subscribers_public SET ai_request_limit=paid+CASE WHEN s.subscribed THEN 0 ELSE s.free_credits_remaining END+COALESCE(s.monthly_ai_requests,0),extra_credits=0,rollover_credits=0 WHERE user_id=p_user_id;
 RETURN jsonb_build_object('remaining',GREATEST(0,paid+CASE WHEN s.subscribed THEN 0 ELSE s.free_credits_remaining END-held),'used',COALESCE(s.monthly_ai_requests,0),'paid_remaining',paid,'held',held,'account_status',s.account_status);
END $function$;

CREATE OR REPLACE FUNCTION public.consume_credit_reservation(p_user_id uuid, p_hold_id uuid, p_tool_name text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE h record; g record; needed integer; take integer; free_available integer;
BEGIN
 PERFORM public.refresh_credit_account(p_user_id);
 SELECT * INTO h FROM public.credit_reservations WHERE id=p_hold_id AND user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Reservation missing'; END IF;
 IF h.status='consumed' THEN RETURN jsonb_build_object('can_use',true,'duplicate',true); END IF;
 IF h.status<>'held' OR h.expires_at<=now() THEN RAISE EXCEPTION 'Reservation expired'; END IF;
 needed:=h.amount;
 SELECT CASE WHEN subscribed THEN 0 ELSE free_credits_remaining END INTO free_available FROM public.subscribers_public WHERE user_id=p_user_id;
 take:=LEAST(needed,free_available); UPDATE public.subscribers_public SET free_credits_remaining=free_credits_remaining-take WHERE user_id=p_user_id; needed:=needed-take;
 FOR g IN SELECT * FROM public.credit_grants WHERE user_id=p_user_id AND environment='live' AND issued_at<=now() AND expires_at>now() AND remaining>0 ORDER BY expires_at,issued_at,id FOR UPDATE LOOP
  EXIT WHEN needed=0; take:=LEAST(needed,g.remaining); UPDATE public.credit_grants SET remaining=remaining-take WHERE id=g.id; needed:=needed-take;
 END LOOP;
 IF needed>0 THEN RAISE EXCEPTION 'Reserved credits no longer available'; END IF;
 UPDATE public.credit_reservations SET status='consumed',tool_name=p_tool_name WHERE id=h.id;
 UPDATE public.subscribers_public SET monthly_ai_requests=COALESCE(monthly_ai_requests,0)+h.amount WHERE user_id=p_user_id;
 INSERT INTO public.tool_usage_analytics(user_id,tool_name,credits_used) VALUES(p_user_id,p_tool_name,h.amount);
 INSERT INTO public.credit_deduction_log(user_id,endpoint,credits_deducted,request_hash) VALUES(p_user_id,p_tool_name,h.amount,h.id::text);
 RETURN jsonb_build_object('can_use',true,'credits_charged',h.amount,'balance',public.refresh_credit_account(p_user_id));
END $function$;

CREATE OR REPLACE FUNCTION public.grant_admin_credits(p_request_id uuid,p_admin_id uuid,p_user_id uuid,p_plan text,p_credits integer,p_months integer,p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE prior public.admin_credit_awards; balance jsonb; inserted boolean;
BEGIN
 IF NOT public.has_role(p_admin_id,'admin'::public.app_role) THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF p_request_id IS NULL OR p_user_id IS NULL OR p_plan IS NULL OR p_plan NOT IN ('starter','pro','all-access','custom') OR p_months IS NULL OR p_months NOT IN (1,3,6,12) OR p_credits IS NULL OR p_credits NOT BETWEEN 1 AND 100000 OR length(COALESCE(p_note,''))>2000 THEN RAISE EXCEPTION 'Invalid complimentary credit award'; END IF;
 IF (p_plan='starter' AND p_credits<>40) OR (p_plan='pro' AND p_credits<>100) OR (p_plan='all-access' AND p_credits<>250) THEN RAISE EXCEPTION 'Invalid plan allowance'; END IF;
 PERFORM 1 FROM public.subscribers_public WHERE user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Credit account missing'; END IF;
 INSERT INTO public.admin_credit_awards(id,admin_user_id,user_id,plan,monthly_credits,months,note)
 VALUES(p_request_id,p_admin_id,p_user_id,p_plan,p_credits,p_months,COALESCE(p_note,'')) ON CONFLICT(id) DO NOTHING;
 inserted:=FOUND;
 SELECT * INTO prior FROM public.admin_credit_awards WHERE id=p_request_id;
 IF prior.admin_user_id<>p_admin_id OR prior.user_id<>p_user_id OR prior.plan<>p_plan OR prior.monthly_credits<>p_credits OR prior.months<>p_months OR prior.note<>COALESCE(p_note,'') THEN RAISE EXCEPTION 'Request ID already used for a different award'; END IF;
 balance:=public.refresh_credit_account(p_user_id);
 IF inserted THEN
  INSERT INTO public.admin_audit_log(admin_user_id,target_user_id,action,details)
  VALUES(p_admin_id,p_user_id,'grant_complimentary_credits',jsonb_build_object('grant_id',p_request_id,'credits',p_credits,'months',p_months,'plan',p_plan,'note',COALESCE(p_note,''),'environment','live','starts_at',prior.starts_at,'balance',balance));
 END IF;
 RETURN jsonb_build_object('grant_id',p_request_id,'credits',p_credits,'months',p_months,'duplicate',NOT inserted,'balance',balance);
END $function$;
REVOKE ALL ON FUNCTION public.grant_admin_credits(uuid,uuid,uuid,text,integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_credits(uuid,uuid,uuid,text,integer,integer,text) TO service_role;