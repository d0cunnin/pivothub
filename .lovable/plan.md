## Problem

The sign-in page (`src/pages/Auth.tsx`) already has a footer line linking to Terms of Use and Privacy Policy, but the `href` values point to routes that don't exist:

- `/terms` → should be `/terms-and-conditions`
- `/privacy` → should be `/privacy-policy`

These are the routes used elsewhere in the app (e.g. `CheckoutModal.tsx`) and registered in `App.tsx`. Right now clicking either link 404s.

## Change

In `src/pages/Auth.tsx` (lines 521–531), update the two `<a>` tags:

- `href="/terms"` → `href="/terms-and-conditions"`
- `href="/privacy"` → `href="/privacy-policy"`
- Add `target="_blank"` and `rel="noopener noreferrer"` so the pages open in a new tab and users don't lose their sign-in progress.

No other files or routes need to change.
