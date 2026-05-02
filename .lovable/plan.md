# Rebrand the Google Sign-In Screen to "Pivot Hub"

## The Issue

When users click "Sign in with Google", the consent screen shows:
> "You're signing back in to **fkvjsgqjgissolpdqbdh.supabase.co**"

instead of:
> "You're signing back in to **Pivot Hub**"

This is purely a **Google Cloud Console configuration** issue — not a code issue. The text Google displays comes from your OAuth Consent Screen settings in Google Cloud Console, which currently has the raw Supabase backend URL instead of your branding.

There are **two paths** to fix this. Pick whichever you prefer:

---

## Option A (Easiest — Recommended): Switch to Lovable's Managed Google OAuth

Lovable Cloud provides a managed Google OAuth out of the box. When you use it, the consent screen shows clean Lovable-managed branding (no scary Supabase URL) and you don't have to maintain your own Google Cloud project.

**Steps:**
1. Open **Cloud → Users → Auth Settings → Sign In Methods → Google** in Lovable.
2. Remove your custom Client ID and Client Secret (leave the fields empty).
3. Save. Lovable will fall back to its managed Google OAuth credentials.
4. Test sign-in — the screen will no longer show the supabase.co URL.

**Trade-off:** The consent screen will show Lovable-managed branding rather than "Pivot Hub" specifically. Cleaner than the supabase URL, but not custom-branded.

---

## Option B (Full Branding): Update Your OAuth Consent Screen in Google Cloud Console

Keep your own Google OAuth credentials and properly brand them as "Pivot Hub".

**Steps (all done in Google Cloud Console — no code changes):**

1. Go to **Google Cloud Console → APIs & Services → OAuth consent screen**.
2. Click **Edit App**.
3. Update these fields:
   - **App name**: `Pivot Hub`
   - **User support email**: your support email
   - **App logo**: upload the Pivot Hub logo (optional but recommended)
   - **Application home page**: `https://pivothub.io`
   - **Application privacy policy link**: `https://pivothub.io/privacy` (must exist)
   - **Application terms of service link**: `https://pivothub.io/terms` (must exist)
   - **Authorized domains**: add `pivothub.io` and `lovable.app`
   - **Developer contact email**: your email
4. Save.
5. (If your app is still in "Testing" mode and you want public users) Click **Publish App** to move it to Production. Note: with sensitive scopes this triggers Google verification, but for basic `email`/`profile`/`openid` scopes publishing is instant and no verification is needed.
6. Wait ~5 minutes for Google's cache to refresh, then test.

**Result:** The consent screen will say "You're signing back in to **Pivot Hub**" with your logo.

---

## Recommendation

Go with **Option B** if you want full "Pivot Hub" branding on the Google screen (most professional). Go with **Option A** if you just want to get rid of the ugly supabase.co URL with zero hassle.

---

## What I Cannot Do

This fix lives entirely inside **your Google Cloud Console account** — there's no code in your project that controls what Google displays. So no file edits are needed for either option. Once you tell me which option you've done (or want help walking through), I can verify the sign-in flow works end-to-end.
