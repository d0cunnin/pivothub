## Heads up

There is currently **no `support@pivothub.io` account** in the database. The 3 existing users are:

- `dandrea.bolden@gmail.com`
- `johnbcodes@gmail.com`
- `stepstovictory1@gmail.com`

So "delete everyone except support@pivothub.io" effectively means: **delete all 3 existing users**, then you sign up fresh with `support@pivothub.io`. Because of the `auto_grant_first_user_admin` trigger, the first account created after the wipe automatically becomes admin — so signing up with `support@pivothub.io` next will make it the admin.

## Plan

1. **Create a one-time admin edge function** `admin-purge-users` that:
   - Verifies the caller (or accepts a one-time secret) — since no admin exists right now, gate it via a hard-coded `PURGE_TOKEN` secret you'll provide (or simply allow it once and remove the function after).
   - Uses the service role to call `supabase.auth.admin.listUsers()` and `supabase.auth.admin.deleteUser(id)` for every user whose email is **not** `support@pivothub.io`.
   - Deleting the auth user cascades to `profiles`, `users`, `subscribers_public`, `subscribers_secure` (via `on delete cascade` on the FK to `auth.users`).
   - Also cleans any orphaned rows in tables keyed by `user_id` without a FK (e.g. `assessment_results`, `tool_usage_analytics`, `user_roles`, etc.) for safety.

2. **Invoke the function once** from the chat (I'll curl it after deploy) to wipe the 3 accounts.

3. **You then sign up** at `/auth` using `support@pivothub.io`. The `auto_grant_first_user_admin` trigger fires because `user_roles` will be empty, so that account gets the `admin` role automatically.

4. **Delete the purge function** after use so it can't be re-triggered.

### Technical details

- Edge function path: `supabase/functions/admin-purge-users/index.ts`
- Uses `SUPABASE_SERVICE_ROLE_KEY` (already in secrets)
- Config: `verify_jwt = false` (one-time admin script, gated by a token header)
- Cleanup SQL the function will run via service role:
  ```sql
  DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
  DELETE FROM public.assessment_results WHERE user_id NOT IN (SELECT id FROM auth.users);
  -- etc. for any user-scoped tables without FK cascade
  ```

### Why a function instead of just SQL

`auth.users` is a Supabase-reserved schema — direct `DELETE FROM auth.users` via migrations is blocked / unsafe. The official path is `supabase.auth.admin.deleteUser()`, which only works from a service-role context (an edge function).

Approve and I'll build + run it, then remove it.