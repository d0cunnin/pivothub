## Problem

After a successful email/password sign-up, the user is left staring at the same sign-in/sign-up form with only a small toast. This happens because Supabase requires email verification before a session is created — `signUp()` does not log the user in, so there's nothing to navigate to. The current toast ("You can now sign in") is also misleading since they must click the confirmation link first.

## Fix

Update `src/pages/Auth.tsx` to:

1. **Add a `signupSuccess` state** that flips to `true` when `supabase.auth.signUp()` returns without error.

2. **Replace the form with a confirmation panel** when `signupSuccess` is true. The panel shows:
   - A check/email icon
   - Heading: "Check your email"
   - Body: "We've sent a confirmation link to **{email}**. Click it to activate your account, then come back to sign in."
   - A "Back to sign in" button that resets `signupSuccess` and switches the tab to Sign In
   - A small "Didn't get it? Resend" link that calls `supabase.auth.resend({ type: 'signup', email })`

3. **Update the success toast** to match: "Confirmation email sent — check your inbox."

4. **Handle the "already-registered" edge case**: When `signUp()` returns `data.user` with an empty `identities` array, Supabase silently means the email is already in use. Detect this and show a toast telling them to sign in or reset their password instead of showing the success panel.

5. **Edge case — email confirmation disabled**: If a session is returned immediately from `signUp()` (meaning the project has auto-confirm on), navigate straight to `redirectPath` instead of showing the confirmation panel.

## Files touched

- `src/pages/Auth.tsx` — the only change. No backend, schema, or routing changes needed. `/auth/callback` already handles the post-verification redirect correctly.

## Out of scope

- Not changing Cloud auth settings (email confirmation stays ON, which is the secure default).
- Not touching Google sign-in flow — it already navigates correctly via `/auth/callback`.
