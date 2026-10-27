-- Lock down AI credits and plan data.
--
-- Before this migration a signed-in user could edit their own credit/plan row
-- directly (e.g. set extra_credits to 999999 or subscribed = true), and anyone
-- holding the public anon key could call check_and_increment_ai_usage for any
-- user id with any amount (a negative amount minted credits).
--
-- Every statement is idempotent and tolerant of objects that don't exist, so
-- this applies cleanly on either schema baseline.

-- ---------------------------------------------------------------------------
-- 1. Users can no longer write their own credit/plan record.
--    Rows are created by the handle_new_user() trigger (SECURITY DEFINER) and
--    updated only by edge functions using the service role.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users insert own sub" ON public.subscribers_public;
DROP POLICY IF EXISTS "Users update own sub" ON public.subscribers_public;
DROP POLICY IF EXISTS "Authenticated users can insert their own subscription" ON public.subscribers_public;
DROP POLICY IF EXISTS "Authenticated users can update their own subscription" ON public.subscribers_public;
DROP POLICY IF EXISTS "Users can insert their own subscription data" ON public.subscribers_public;
DROP POLICY IF EXISTS "Users can update their own subscription data" ON public.subscribers_public;
REVOKE INSERT, UPDATE, DELETE ON public.subscribers_public FROM anon, authenticated;

-- Usage can never go negative (a negative amount used to add credits).
-- NOT VALID: enforced for all new writes without rejecting existing rows.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'subscribers_public_monthly_ai_requests_nonnegative'
  ) THEN
    ALTER TABLE public.subscribers_public
      ADD CONSTRAINT subscribers_public_monthly_ai_requests_nonnegative
      CHECK (monthly_ai_requests >= 0) NOT VALID;
  END IF;
END $$;

-- The users table also holds plan/credit columns; nothing in the app writes it
-- from the browser.
DROP POLICY IF EXISTS "Users update own" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
REVOKE INSERT, UPDATE, DELETE ON public.users FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Credit functions are callable only by the service role (edge functions).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.check_and_increment_ai_usage(uuid,text,integer)',
    'public.check_and_increment_ai_usage(uuid)',
    'public.reset_monthly_ai_requests()'
  ] LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Credit holds.
--    Credits are only deducted after a tool returns a result. Without a hold,
--    many simultaneous requests could all pass the balance check before any of
--    them was charged. A hold reserves the credits for a few minutes; it is
--    turned into a real charge on success and simply expires on failure, so
--    failed requests still cost nothing.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_credit_holds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_credit_holds_user_idx ON public.ai_credit_holds (user_id, expires_at);
ALTER TABLE public.ai_credit_holds ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_credit_holds FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserve_ai_credits(
  p_user_id uuid,
  p_amount integer,
  p_ttl_seconds integer DEFAULT 300
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_total integer;
  v_held integer;
  v_remaining integer;
  v_hold_id uuid;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  PERFORM public.reset_monthly_ai_requests();

  -- Row lock serializes concurrent reservations for the same user.
  SELECT * INTO v_sub FROM public.subscribers_public WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_subscription', 'remaining', 0);
  END IF;
  IF v_sub.account_status = 'suspended' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'account_suspended', 'remaining', 0);
  END IF;

  DELETE FROM public.ai_credit_holds WHERE user_id = p_user_id AND expires_at < now();
  SELECT COALESCE(SUM(amount), 0) INTO v_held FROM public.ai_credit_holds WHERE user_id = p_user_id;

  v_total := COALESCE(v_sub.ai_request_limit, 5) + COALESCE(v_sub.extra_credits, 0) + COALESCE(v_sub.rollover_credits, 0);
  v_remaining := GREATEST(0, v_total - COALESCE(v_sub.monthly_ai_requests, 0) - v_held);

  IF p_amount > v_remaining THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'limit_exceeded', 'remaining', v_remaining);
  END IF;

  INSERT INTO public.ai_credit_holds (user_id, amount, expires_at)
  VALUES (p_user_id, p_amount, now() + make_interval(secs => p_ttl_seconds))
  RETURNING id INTO v_hold_id;

  RETURN jsonb_build_object('ok', true, 'hold_id', v_hold_id, 'remaining', v_remaining - p_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_credit_hold(
  p_user_id uuid,
  p_amount integer,
  p_tool_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold_id uuid;
  v_result jsonb;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;

  PERFORM 1 FROM public.subscribers_public WHERE user_id = p_user_id FOR UPDATE;

  SELECT id INTO v_hold_id
  FROM public.ai_credit_holds
  WHERE user_id = p_user_id AND amount = p_amount
  ORDER BY created_at
  LIMIT 1;

  IF v_hold_id IS NOT NULL THEN
    DELETE FROM public.ai_credit_holds WHERE id = v_hold_id;
  END IF;

  v_result := public.check_and_increment_ai_usage(p_user_id, p_tool_name, p_amount);
  RETURN v_result || jsonb_build_object('hold_released', v_hold_id IS NOT NULL);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_ai_credits(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_ai_credit_hold(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_credits(uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_ai_credit_hold(uuid, integer, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. No more automatic admin for the first signup. The owner already holds the
--    admin role; leaving this on means anyone becomes admin if user_roles is
--    ever emptied. The triggers live on auth.users, which hosted projects may
--    not let migrations alter, so neutralize the trigger function instead.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_grant_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 5. Only admins may change course media files. Older policies let any
--    signed-in user upload, overwrite or delete them. Read policies are left
--    unchanged.
-- ---------------------------------------------------------------------------
-- storage.objects may not be alterable by the migration role on hosted
-- projects; skip (with a notice) rather than abort the whole migration.
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload course media" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update course media" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete course media" ON storage.objects;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Skipped course media storage policies: insufficient privilege on storage.objects';
END $$;
