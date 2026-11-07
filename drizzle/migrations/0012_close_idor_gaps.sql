CREATE OR REPLACE FUNCTION public.throttle_user(p_user_id uuid, p_endpoint text, p_window_seconds integer, p_max_reqs integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  w_start TIMESTAMPTZ;
  cur_count INTEGER;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND (auth.uid() IS NULL OR auth.uid() <> p_user_id) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  w_start := floor_to_window(NOW(), p_window_seconds);
  INSERT INTO public.api_user_usage(user_id, endpoint, window_start, count)
  VALUES (p_user_id, p_endpoint, w_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET count = public.api_user_usage.count + 1
  RETURNING public.api_user_usage.count INTO cur_count;
  IF cur_count > p_max_reqs THEN RAISE EXCEPTION 'USER_RATE_LIMIT_EXCEEDED'; END IF;
  DELETE FROM public.api_user_usage WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;
REVOKE ALL ON FUNCTION public.throttle_user(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.throttle_user(uuid, text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.check_admin_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_rate_limit(uuid, text, integer, integer) TO service_role;

DROP POLICY IF EXISTS "Course materials are publicly accessible" ON storage.objects;