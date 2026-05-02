## Goal

Disconnect the existing external Supabase project (`fkvjsgqjgissolpdqbdh`), provision a fresh **Lovable Cloud** backend, and rebuild the entire PivotHub app on it as-is. Payments stay disabled for now (added later as a separate task). All existing users — including Skyler — and all existing data are abandoned. You become the sole admin on the new backend.

## What stays the same

- All frontend code (pages, components, contexts, hooks, styling, routing) — no UI changes
- All ~50 edge function source files in `supabase/functions/` — same logic, same names
- All AI tools (Assess It, Prep It, Learn It, Build It, Teach It, Launch It, Plan It with Study It, Code It, Deploy It, Speak It, Act It, Fund It, Host It, Schedule It, etc.)
- Lovable AI Gateway for AI calls (already internal)
- Course system, admin dashboard, dashboards, settings, contact forms

## What changes

- Backend connection: external Supabase → Lovable Cloud (a brand-new Supabase project provisioned by Lovable)
- All schema, RLS, functions, triggers, storage buckets get recreated fresh on the new backend
- All existing users, subscriptions, analytics, audit logs, course enrollments, assessments, reports — gone
- BYOK Stripe integration removed; payment-related edge functions deleted; payment UI hidden/disabled until phase 2
- You sign up on the new backend and become the admin (Skyler is not pre-created)

## Phase 1 — Disconnect + provision

1. Disconnect the existing Supabase integration. The old project (`fkvjsgqjgissolpdqbdh`) is left untouched and still exists in your Supabase dashboard; you can delete it manually anytime.
2. Enable Lovable Cloud, which provisions a new Supabase project. New `VITE_SUPABASE_*` env vars auto-populate.

## Phase 2 — Recreate database schema

One large migration recreates everything:

**Enums**
- `app_role` (`admin`, `moderator`, `user`)

**Core tables (29 total, mirroring current schema):**
- `users`, `profiles`, `user_roles`
- `subscribers_public`, `subscribers_secure` (kept for credit/usage tracking even without payments)
- `tool_usage_analytics`, `monthly_usage_summary`, `api_user_usage`, `api_ip_usage`, `api_request_log`, `credit_deduction_log`
- `assessment_results`, `side_income_assessments`, `side_income_reports`, `user_progress`, `user_preferences`
- `course_enrollments`, `lesson_progress`, `quiz_results`, `activity_submissions`
- `conversation_context`, `result_feedback`
- `admin_audit_log`, `admin_rate_limits`, `subscription_audit_log`, `signup_audit`, `auth_failed_attempts`, `auth_lockouts`, `storage_access_audit`, `moderation_log`, `rate_limit_alerts`, `ai_service_status`
- `pricing_plans` (rebuilt empty; populated when payments are added later)
- `checkout_sessions`, `processed_stripe_events`, `webhook_audit_log` (kept as empty scaffolds for phase 3)

**Database functions (all recreated):**
- `has_role(user_id, role)` and `has_role(role)` — security definer
- `handle_new_user()` + trigger on `auth.users` — creates `users`, `profiles`, `subscribers_public`, `subscribers_secure` rows on signup
- `auto_grant_first_user_admin()` + trigger — first signup becomes admin (this is how you become admin)
- `check_and_increment_ai_usage(...)` — credit gating for tools
- `reset_monthly_ai_requests()`, `mask_email()`, `floor_to_window()`
- `throttle_user()`, `throttle_ip()`, `check_admin_rate_limit()`
- `check_account_lockout()`, `record_failed_login()`, `clear_account_lockout()`
- `get_subscriber_secure_data()`, `get_my_billing_profile()`, `get_my_payment_status()`, `get_admin_cost_analysis()`
- `cleanup_old_health_checks()`, `cleanup_expired_contexts()`, `set_month_year()`, `update_updated_at_column()`
- `initialize_new_subscriber()`

**RLS policies** — all 29 tables get policies matching current behavior (owner read/write, admin oversight, service-role inserts for audit/log tables).

**Storage buckets** — recreate `course-media`, `course-materials`, `student-submissions` (all private) with their RLS policies.

## Phase 3 — Edge functions

The source files in `supabase/functions/` are already in the repo and will redeploy automatically against the new backend. No code changes needed for ~45 of them.

**Delete entirely** (payments-related, no longer needed in phase 1):
- `create-checkout`, `customer-portal`, `cancel-subscription`, `purchase-extra-credits`, `stripe-webhook`, `admin-manage-subscription`, `process-expired-grace-periods`, `send-billing-notification`

**Keep but verify**: all AI tool functions, `check-admin-role`, `check-subscription` (returns "no subscription" for everyone), `delete-account`, `track-signup`, `send-contact-email`, `send-assessment-results`, `ai-health-check`.

**Secrets that carry over (re-add to new project):**
- `LOVABLE_API_KEY` (auto-managed by Cloud)
- `RESEND_API_KEY` (you'll re-add — currently `resendemail-key`)
- `GOOGLE_PLACES_API_KEY`
- `TURNSTILE_SECRET_KEY`

**Secrets dropped:** `stripe_restrictedkey_payments`, `pivothub-openai-key`, `relaunch_openai_key`, `relaunch-runwarekey-correct` (all replaced by Lovable AI Gateway or no longer needed in phase 1).

## Phase 4 — Frontend cleanup

- Hide/disable any UI that calls deleted payment functions: `Pricing` page CTAs, `CheckoutModal`, "Upgrade" buttons in dashboards, `AccountSettings` billing section, `TrialBanner`. Show a "Coming soon" state instead of removing components, so phase-2 payments work is faster.
- Keep the credit system UI working — `UsageContext` still calls `check_and_increment_ai_usage`, so users see "5 credits / month" Explore tier behavior universally.
- Keep `Header`, navigation, and Study It under Plan It dropdown exactly as it is now.

## Phase 5 — Become admin

After deployment:
1. You sign up at `/auth` on the new app with whatever email you want to use.
2. The `auto_grant_first_user_admin` trigger automatically grants you the `admin` role since `user_roles` is empty.
3. You can log in to `/admin` immediately.

No pre-seeded accounts. Skyler is not created.

## Phase 6 — Deferred (separate future task)

- Built-in Stripe Payments via Lovable's integration
- Recreate subscription tiers (Explore, Starter, Pro, All-Access, Fund It)
- Wire new checkout/webhook/portal edge functions
- Re-enable pricing UI

## Risks / things you should know

- **All current PivotHub users lose access.** Anyone using `pivothub.io` today will hit a fresh app with no account. There is no migration path.
- **Custom domains** (`pivothub.io`) point to the published Lovable app, not the backend, so they'll keep working — but the app behind them will be the new empty one once republished.
- **The old Supabase project keeps running** with all its data until you delete it manually. If you have active Stripe subscriptions billing through its webhook, those will keep firing into a now-disconnected project; you should also disable the webhook in your Stripe dashboard.
- This is a **large migration** that touches every backend file. Expect to spend credits on the rebuild and on follow-up fixes as edge cases surface.

## Confirmation needed before I start

Reply "go" and I will:
1. Trigger the disconnect + Lovable Cloud enable flow
2. Run the schema migration
3. Delete the payment-related edge functions
4. Hide payment UI
5. Tell you when to sign up to claim admin
