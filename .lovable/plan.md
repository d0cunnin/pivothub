## What I found
This looks like a **Google OAuth redirect mismatch**, not a publish issue.

I checked your app and found **two likely causes**:

1. **Your Google OAuth setup is probably using the wrong redirect URI**
   - For this Lovable Cloud setup, the correct redirect URIs are the ones shown in **Cloud → Users → Auth → Google**.
   - The older backend callback URL I mentioned earlier (`.../auth/v1/callback`) is for a different flow and is likely **not** the URI Google expects for your current setup.
   - If you’re using **your own Google credentials**, Google must whitelist **every exact redirect URI** selected in Lovable.

2. **Your app currently uses two different Google sign-in implementations**
   - `src/pages/Auth.tsx` uses `lovable.auth.signInWithOAuth(...)`
   - `src/components/AuthGuard.tsx` and `src/components/ToolGuard.tsx` still use `supabase.auth.signInWithOAuth(...)`
   - That inconsistency can produce different redirect behavior depending on where the user clicks “Continue with Google”.

## What to do right now in the Google/Lovable settings
1. Open **Cloud → Users → Auth → Google**.
2. Check whether you selected **Your own credentials**.
3. Copy the **exact redirect URI or URIs shown there**.
4. In **Google Cloud Console → OAuth Client → Authorized redirect URIs**:
   - remove the old backend callback if that’s what you added
   - add **every exact URI shown in Lovable**
   - make sure there are no typos, no missing path, and no trailing-slash mismatch
5. If your Google consent screen is still in testing mode, add your Google account as a **Test user**.
6. Wait a couple of minutes, then test again on the **same domain you whitelisted**.

## Code cleanup I can do after approval
1. Update all Google sign-in buttons to use the **same Lovable Cloud OAuth method**.
2. Replace the old Google auth calls in:
   - `src/components/AuthGuard.tsx`
   - `src/components/ToolGuard.tsx`
3. Align `src/pages/Auth.tsx` with the documented pattern so the redirect target is consistent.
4. Re-check the callback flow in `src/pages/AuthCallback.tsx` and route handling so sign-in lands users in the right place.
5. Verify Google sign-in from all entry points:
   - `/auth`
   - gated dashboard flow
   - gated tool modal flow

## Technical notes
- Current mixed implementations:
  ```text
  Auth page: lovable.auth.signInWithOAuth("google", { redirect_uri: ... })
  Guard modals: supabase.auth.signInWithOAuth({ provider: 'google', ... })
  ```
- Lovable docs for **your own credentials** say the selected redirect URIs in Lovable must match the ones added in Google exactly.
- This error is usually caused by config mismatch first, but the code inconsistency should still be cleaned up so the app behaves the same everywhere.

## Fastest path
- First fix the **Authorized redirect URIs** in Google based on what Lovable shows.
- Then I can clean up the code paths so this doesn’t break from one sign-in button but not another.