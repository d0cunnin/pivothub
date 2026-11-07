-- Close small IDOR gaps found in the November 2026 security review.

-- 1. throttle_user: a signed-in user could add requests to ANOTHER user's
--    rate-limit counter (locking them out of a tool for up to an hour).
--    Every edge function calls it with the service role (after verifying the
--    user), so only the server may call it now. The ownership check inside is a
--    second safeguard in case it is ever called with a user's login.
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

-- 2. check_admin_rate_limit takes any admin id and is not used by the app.
--    Only the server may call it.
REVOKE ALL ON FUNCTION public.check_admin_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_admin_rate_limit(uuid, text, integer, integer) TO service_role;

-- 3. Old course storage: no longer used by PivotHub. Make it private and
--    remove the leftover public-read rule. Admin-only rules remain.
UPDATE storage.buckets SET public = false WHERE id IN ('course-materials', 'course-media');
DROP POLICY IF EXISTS "Course materials are publicly accessible" ON storage.objects;
