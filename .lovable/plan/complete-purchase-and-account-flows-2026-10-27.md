# Complete purchase and account flows

## Approved billing rules
- Every plan includes every tool; preserve existing prices and Tool Credit amounts.
- Paid subscription and pack credits roll over, expiring three calendar months after issuance. Spend earliest-expiring credits first.
- Upgrades are immediate: prorated price difference and allowance difference. Downgrades start at the next renewal.
- Refund requests are reviewed individually; reconcile approved refunds and flag spent-credit cases for review.
- Preserve paid-period access after cancellation. Keep test and live balances strictly separate.

## Implementation order
1. Secure credit permissions and introduce expiring credit grants, atomic reservation/debit, and accurate balance refresh.
2. Protect Stripe Customer ownership and serialize pending subscription checkout. Validate provider prices and monthly cadence.
3. Fulfill validated invoice periods, reconcile refunds and disputes, and implement upgrade/downgrade behavior without repeated resets.
4. Complete recovery, identity changes, account switching, purchase status, legal links, billing history access, and safe deletion.
5. Deploy affected functions, add concrete lifecycle regression tests, and verify the preview with a non-admin account and Stripe test cards.

## Technical details
Use service-only ledger and billing coordination tables; grants and RLS are explicit. Maintain subscribers_public as a compatibility projection of spendable credits. Payment gateway access stays in the existing shared Stripe client. Payment receipt uniqueness and request-specific holds protect against retries and concurrency. Version database changes with the managed migration tool. Provider events never trust client-supplied account ownership.

## Test checklist
- Starter: $12 / 40 credits; Pro: $24 / 100; All-Access: $49 / 250.
- Packs: $5 / 25, $10 / 70, $20 / 150; no duplicate grant after reload.
- Test success card 4242 4242 4242 4242, future expiry, any three-digit CVC, and required billing fields.
- Decline 4000 0000 0000 0002; authentication challenge 4000 0025 0000 3155.
- Verify renewal, upgrade delta, deferred downgrade, cancellation, three-month expiry, refunds, and two-account isolation with automated tests.
- Test signup, confirmation, recovery, profile changes, portal return, and deletion using disposable accounts only.

## External requirements
Stripe onboarding status must finish before accepting real money. Production CAPTCHA needs a real configured site key and hosted enforcement. Real email/Google completion requires a usable test account and hosted settings verification. No live purchase or destructive owner-account test is permitted.