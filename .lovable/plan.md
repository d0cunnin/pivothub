# Fix Earn It "Get Your Blueprint" Button

## The problem

The "Get Your Blueprint" button on `/earnit` opens the assessment for anyone, but the underlying edge function (`generate-side-income-report`) requires:
1. An authenticated user (returns 401 "Auth session missing" otherwise)
2. 2 available Tool Credits

Currently `handleStartAssessment` has a comment `// No auth or credit checks - free to use` and skips both checks. So a logged‑out visitor (or one with 0 credits) can complete the 8‑minute assessment, then sees a generic "Report Generation Failed" toast at the very end.

The edge function logs confirm this: `❌ Authentication failed: Auth session missing!`

## The fix

### 1. `src/pages/EarnIt.tsx` — gate the start button
Update `handleStartAssessment` to:
- If `!user`, show a toast ("Please sign in to generate your blueprint") and `navigate('/auth?redirect=/earnit')` instead of starting the assessment.
- If logged in but `remainingRequests < 2`, show a toast ("This blueprint uses 2 credits — you have X remaining") and route to `/pricing`.
- Only set `step = 'assessment'` when both checks pass.
- Remove the misleading "No auth or credit checks - free to use" comment and the "INCLUDED / no barriers" copy near the CTA so the UI matches reality (account + 2 credits required).

### 2. `src/components/SideIncomeReport.tsx` — better error surfacing
When the edge function returns an error response, the current code throws a generic message. Improve the catch block to:
- Detect `error.message` containing "401" / "Authentication required" → toast "Please sign in again" and redirect to `/auth`.
- Detect "Insufficient credits" → toast with remaining count and link to `/pricing`.
- Otherwise keep the existing retry UI.

### 3. Verify behavior in the preview
After the edits, sign in as `support@pivothub.io`, click "Get Your Blueprint", confirm the assessment opens and the report generates. Then sign out, click the button, and confirm we are redirected to `/auth` instead of getting a silent failure at the end.

## Notes / scope

- No database, RLS, or edge‑function changes needed — the edge function is already correctly enforcing auth and credits.
- No changes to the Auth flow, Google OAuth, or admin role assignment.
- This is the same root cause pattern likely affecting any other tool page that says "free to use" while its edge function requires credits; out of scope for this change but worth a follow‑up audit.
