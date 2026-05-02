# Fix Earn It Auth Failure In Edge Function

## What the screenshots and logs show

You signed in as the admin and completed the assessment, but the report screen shows **"Unable to Generate Your Blueprint"** with code `REPORT_GEN_FAIL`.

The edge function logs (`generate-side-income-report`) show the real cause:

```
2026-05-02T02:09:14Z ERROR ❌ Authentication failed: Auth session missing!
```

Even though you are logged in, the function cannot recover your user from the request.

## Root cause

In `supabase/functions/generate-side-income-report/index.ts` the function does:

```ts
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: req.headers.get('Authorization')! } }
});
const { data: { user } } = await supabase.auth.getUser();   // ← no token argument
```

With the current Supabase JS SDK, `auth.getUser()` with no argument tries to read a stored session — which doesn't exist in an edge function. It must be called as `auth.getUser(jwt)` with the token pulled from the `Authorization: Bearer ...` header. That's why every request fails with "Auth session missing!" even for authenticated users.

## The fix

### 1. `supabase/functions/generate-side-income-report/index.ts`
- Read the bearer token from `req.headers.get('Authorization')` and strip the `Bearer ` prefix.
- If no token, return 401 (same as today).
- Call `await supabase.auth.getUser(token)` explicitly so the SDK validates the JWT instead of looking for a non-existent session.
- Add a small log `🔐 Auth header present / token length` so future failures are easier to diagnose.

No other logic changes — the rest of the function (credit check via `check_and_increment_ai_usage`, AI call, JSON parsing, response shaping) stays the same.

### 2. Deploy the function and verify
- Deploy `generate-side-income-report`.
- Tail its logs and re-run the Earn It assessment as `support@pivothub.io`.
- Expected new logs: `🔐 Auth header present: true ...` then `✅ User authenticated: <uuid>` then `✅ Credits deducted: 2`.
- Expected UI: the report renders instead of the REPORT_GEN_FAIL screen.

### 3. Audit other edge functions for the same bug (follow-up, same change)
Several other functions appear to use the same `getUser()`-without-token pattern and likely fail the same way for any logged-in user. After confirming the Earn It fix, apply the identical token-extraction change to:

- `generate-grant-content`, `generate-grant-readiness`
- `generate-event-plan`, `generate-schedule`, `generate-garden-plan`, `generate-program-design`, `generate-stakeholder-plan`
- `generate-launch-strategy`, `generate-legal-docs`, `generate-business-content`, `generate-teaching-content`, `generate-capability-statement`, `generate-contract-readiness`
- `act-it`, `code-it`, `deploy-it`, `prompt-it`, `speak-it`, `study-it`, `community-dev-coach`
- `interview-feedback`, `interview-questions`, `resume-analyzer`, `enhanced-assessment-analyzer`, `tech-readiness-assessment`, `personality-assessment`, `skills-assessment`, `career-assessment`, `generate-community-assessment`, `generate-side-income-report` (already covered), `generate-logo`, `name-checker`, `business-mentor`, `business-resources`, `career-advisor`, `grant-finder`, `grant-resources`, `social-media-content`, `startup-checklist`

I'll grep each one and only change the ones that exhibit the bad pattern; functions that don't require auth or already pass the token correctly will be skipped.

## Notes / scope

- No database, RLS, or migration changes.
- No frontend changes — `supabase.functions.invoke()` already attaches the Authorization header correctly.
- No changes to Google OAuth, sign-in flow, or admin role assignment.
