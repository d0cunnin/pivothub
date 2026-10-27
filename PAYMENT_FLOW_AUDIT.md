# Purchase and account audit — 27 October 2026

## Scope and evidence

Reviewed client account/authentication/pricing flows, server checkout/status/management/webhooks, shared gateway and credit guard, both migration directories, hosted database policies/functions, and Stripe go-live status. Public pricing and sign-in pages rendered without runtime errors. Existing catalog tests passed (7/7); the independent account audit also ran all existing tests (14/14).

No authenticated purchase, identity update, renewal, refund, or deletion was executed. The requester has no matching app account for automatic session minting; sign in to the preview or identify the account before authenticated testing. Hosted email confirmation, CAPTCHA, password requirements, OAuth settings, portal configuration, product tax codes, and webhook subscriptions have not been independently read.

## Current architecture

- React/Vite client uses Lovable Cloud authentication. Email/password and Google sign-in exist; Google uses the managed OAuth helper. Signup creates profile, legacy user, public credit account, and secure billing profile through application-owned signup triggers.
- Every plan accesses every tool; monthly Tool Credits are the differentiator. Catalog: Free 5/$0, Starter 40/$12, Pro 100/$24, All-Access 250/$49. Subscriber-only packs: 25/$5, 70/$10, 150/$20. USD prices exclude applicable checkout tax according to current copy.
- Catalog is repeated in Pricing, Account Settings, the server payment catalog, SQL fulfillment mappings, and an unused/empty hosted pricing table. Human-readable Stripe lookup keys identify prices across environments.
- Purchase review opens embedded Stripe checkout. create-checkout verifies the caller, validates the price/environment/return origin, resolves a Stripe Customer, checks subscription eligibility, retrieves the lookup-key price, and returns a client secret.
- All modern payment calls use the shared Stripe gateway transport with explicit sandbox/live environment. Managed connection identifiers are not direct Stripe API keys. Checkout requests full tax/compliance handling, but seller eligibility and product tax classifications need confirmation.
- Verified webhooks and the authenticated return-status endpoint converge on service-only fulfillment. A unique environment/payment receipt prevents repeat fulfillment of the same payment. Test receipts deliberately never modify live Tool Credits.
- Subscription UI reads environment-scoped payment_subscriptions through check-subscription. Actual tool balances and access read subscribers_public. Paid invoices synchronize those separate systems. Billing portal configuration controls available changes; dedicated plan-change logic is absent.
- Cancellation sets cancel_at_period_end. Account deletion attempts immediate cancellation, then deletes application data and the authentication identity. Profile/email/password edits and password recovery are absent.
- Most tools use a shared credit check before generation and attempt a debit after success. Admins skip tool charging, so an admin account cannot verify customer credit deduction.

## Verified hosted state

- Stripe account claiming is in progress; all subsequent live onboarding steps have not started. Real-money checkout is not ready.
- payment_subscriptions and payment_credit_receipts exist, with zero rows. Their policies allow service-role access only. fulfill_payment_credits exists and execution is restricted to service_role.
- Both overloads of check_and_increment_ai_usage and reset_monthly_ai_requests remain executable by PUBLIC/anon/authenticated.
- reserve_ai_credits is absent. The checked-in lockdown migration is not installed in the hosted state.
- subscribers_public still has user INSERT/UPDATE policies, but current authenticated grants already revoke those writes. This is policy debt, not evidence that a browser can currently update that table. The legacy users table still has user UPDATE grants and an owner-update policy covering credit/plan columns.
- Managed fulfillment SQL lives under drizzle/migrations, while credit lockdown lives under supabase/migrations. Local file presence is not deployment evidence. Hosted fulfillment matches the separate Drizzle implementation.

## Gaps and remediation priorities

### Critical/high: protect balances and billing ownership

1. Public credit mutation RPC accepts an arbitrary user ID and nonpositive charges; revoke public execution and validate positive amounts. Protect both credit/plan representations from client writes. Neutralize automatic first-user admin assignment while preserving current roles.
2. Install request-specific atomic credit reservations/consumption/release. Current absent holds fall back to a plain balance check; concurrent requests can pass together. Existing hold design discards hold IDs, consumes by amount rather than request, and logs failed charges while still returning content. Fail closed and make usage logs transactional/idempotent.
3. Customer email fallback overwrites another stored userId. Reject conflicting ownership; safely handle unowned historical customers, durable user/environment customer mapping, and customer-creation races.
4. Duplicate subscription checks have a race between concurrent outstanding checkouts. Coordinate a single pending subscription checkout per account/environment, provider idempotency, session expiry/reuse, and cleanup.
5. Invoice fulfillment derives price and period from today's subscription instead of the settled invoice. Delayed old invoices and proration invoices can grant the wrong allowance or reset usage twice. Use validated paid invoice lines, billing reason, period, and monotonic renewal state.
6. No refund/dispute reconciliation. Decide full/partial refunds and spent-credit policy; add verified events and receipt adjustments without allowing negative balances or automatic unsupported refund promises.

### High/medium: complete customer flows

7. Define upgrades, downgrades, proration, rollover, and pack expiry. Current paid invoice fulfillment clears all extra/rollover credits and resets monthly use. Legacy paid accounts can reset by date without verified payment. Remove that unpaid-renewal path while preserving deliberate admin grants.
8. Packs purchased while eligible can settle after eligibility expires and then fail fulfillment indefinitely. Capture eligibility and paid-period expiry at purchase; fulfill or reconcile according to the selected policy.
9. Add password recovery and safe name/email/password updates with validation, verified email-change behavior, and recent-authentication handling. Unify signup security and intended destination restoration across Auth, ToolGuard, and callback.
10. Clear and race-protect auth/usage state on sign-out and account changes. Fix stale admin-status closure, stale package state, zero-credit display, missing-row behavior, and refresh after purchases/portal returns/cross-device changes.
11. Purchase legal links use nonexistent /terms-and-conditions and /privacy-policy paths; app routes are /terms and /privacy. Fix links or provide safe aliases and align policy copy.
12. Poll/retry pending payment confirmation, distinguish open/pending/failed/paid states, refresh actual credit usage, and do not claim credits were granted merely because a receipt exists for an ignored older period.
13. Surface renewal-canceled/payment-overdue state and period end correctly. Allow past customers access to invoices/portal even when no longer subscribed. Settings currently displays incorrect package names for current plans.
14. Account deletion includes a legacy direct Stripe API path, ignores returned database deletion errors, relies on incomplete local subscription rows, uses the wrong profile key, omits some data/storage, and makes overly broad erasure claims. Discover billing through gateway customer ownership, block deletion if renewable billing cannot be reconciled, make cleanup resumable, and preserve required financial records under an explicit retention policy.
15. Validate catalog type/monthly cadence as well as amount/currency. Consolidate catalog consumption, version active SQL in one deployment workflow, and add lifecycle tests.
16. Free-tier reset endpoint resets before the true monthly anniversary. Correct calendar-based due checks. Grant Resources advertises two credits but its endpoint is configured as zero; align with the established tool-credit rule.
17. Shared guard allows loose origin matching and fails open for some throttling/CAPTCHA infrastructure failures. Review within authentication/credit scope; do not assume client-only checks establish hosted protection.

## Decisions required before the remediation plan

- Monthly unused-credit rollover and purchased-pack expiry.
- Upgrade/downgrade effective date, charge proration, and credit adjustments.
- Refund/partial-refund/dispute handling, including credits already used.
- Stripe seller country and whether the existing full tax-handling setup is eligible. Existing setup adds 3.5% plus standard fees and LINK.COM* statement branding.

Safe defaults to retain: every tool available on every plan, cancellation preserves the paid period, test purchases never alter live balances, payment ownership comes only from verified authentication, and account deletion must stop renewable billing before erasing identity. No real financial operation should be executed during preview validation.

## Proposed preview test checklist (after fixes)

1. Sign in using a disposable non-admin customer account. Check the test-payment banner. Never enter a real card in the preview.
2. Buy Starter with 4242 4242 4242 4242, a future expiry, any three-digit CVC, and the required name/address. Confirm the test receipt records exactly 40 Tool Credits; the live balance must remain unchanged.
3. Repeat status confirmation/reload and confirm no duplicate receipt/allowance. Open checkout in two tabs and verify duplicate subscription protection.
4. Test declines with 4000 0000 0000 0002 and authentication challenges with 4000 0025 0000 3155. Verify no paid receipt/credit grant on decline.
5. Test a pack, pending payment, cancellation, portal return, and selected plan-change policy. Verify exact prices/credits, billing dates, and test/live separation.
6. Simulate renewal, failed renewal, repeated/out-of-order events, pack expiry, and refunds through automated isolated tests/provider test tools; do not wait a calendar month or modify live customer balances.
7. Test tool success/failure/concurrent calls with controlled test credit state. Admin tool runs are not debit evidence. If a test-credit ledger is introduced, keep it distinct from live tool accounts and visibly labeled.
8. Test signup/confirmation/resend, Google destination, password recovery, identity updates, logout/account switching, and two-user isolation. Email delivery/Google completion require real hosted flows.
9. Delete only a disposable test account, verify renewals stop first and allowed data is removed. Never delete the owner/admin for testing.

## Remaining external blockers

Live Stripe onboarding is user-driven. Authenticated browser testing requires a chosen non-admin test account/session. Hosted-only settings and real email delivery remain unverified until they can be read/exercised. Final implementation plan follows business-policy answers; no code fixes have been claimed or deployed by this audit.