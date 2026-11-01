CREATE OR REPLACE FUNCTION public.grant_admin_credits(p_request_id uuid,p_admin_id uuid,p_user_id uuid,p_plan text,p_credits integer,p_months integer,p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
DECLARE prior public.admin_credit_awards; balance jsonb; inserted boolean; award_type text;
BEGIN
 IF NOT public.has_role(p_admin_id,'admin'::public.app_role) THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF p_request_id IS NULL OR p_user_id IS NULL OR p_plan IS NULL OR p_plan NOT IN ('starter','pro','all-access','custom') OR p_months IS NULL OR p_months NOT IN (1,3,6,12) OR p_credits IS NULL OR p_credits NOT BETWEEN 1 AND 100000 OR length(COALESCE(p_note,''))>2000 THEN RAISE EXCEPTION 'Invalid complimentary credit award'; END IF;
 IF p_plan='custom' AND p_months<>1 THEN RAISE EXCEPTION 'Custom Tool Credits must be a one-time award'; END IF;
 IF (p_plan='starter' AND p_credits<>40) OR (p_plan='pro' AND p_credits<>100) OR (p_plan='all-access' AND p_credits<>250) THEN RAISE EXCEPTION 'Invalid plan allowance'; END IF;
 award_type:=CASE WHEN p_plan='custom' THEN 'one_time' ELSE 'monthly' END;
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
  VALUES(p_admin_id,p_user_id,'grant_complimentary_credits',jsonb_build_object('grant_id',p_request_id,'grant_type',award_type,'credits',p_credits,'months',p_months,'plan',p_plan,'note',COALESCE(p_note,''),'environment','live','starts_at',prior.starts_at,'balance',balance));
 END IF;
 RETURN jsonb_build_object('grant_id',p_request_id,'grant_type',award_type,'credits',p_credits,'months',p_months,'duplicate',NOT inserted,'balance',balance);
END $function$;
REVOKE ALL ON FUNCTION public.grant_admin_credits(uuid,uuid,uuid,text,integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.grant_admin_credits(uuid,uuid,uuid,text,integer,integer,text) TO service_role;