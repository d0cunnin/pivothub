# Preview purchase and account checks

The same payment functions serve test and live. Preview uses test payments; the published website uses live payments after publishing. Both event configurations have been updated. Never use a real card in preview.

## Test purchase
1. Sign into the preview with a non-admin customer account. Confirm the test-payment notice is visible.
2. Choose Starter, review $12 per month / 40 Tool Credits, accept terms, and continue.
3. Enter **4242 4242 4242 4242**, any future expiry, any three-digit CVC, and the requested name/address.
4. After confirmation, expect a test receipt for 40 credits. Test purchases deliberately do not alter the live tool balance. Reload: no duplicate credit receipt should appear.
5. Try a second checkout in another tab: the existing pending checkout should be reused rather than a second subscription created.

## Subscription and billing
- In Account Settings, review Starter → Pro. Review the prorated charge and 60 additional credits. Credits must not be granted before payment succeeds.
- Pro → Starter should show the next billing date as its effective date, with no immediate credit removal.
- Cancel renewal: current paid period continues. Free plan returns after that period with 5 monthly credits; paid credits retain their original three-month expiry.
- Billing History opens a new tab for invoices and payment methods. Return to the app and verify refreshed status.
- Decline card: **4000 0000 0000 0002**. No paid credit receipt should be issued.
- Authentication challenge: **4000 0025 0000 3155**. Complete the challenge and confirm only one receipt.
- Use Stripe test-mode tools to advance renewal dates, fail renewals, replay events, and issue approved full/partial refunds. Never do these against live customers.

## Account and tools
- Test confirmation, resend, Google sign-in return, Forgot Password, name/email/password changes, sign-out, and two-account switching.
- Run a successful tool as a non-admin and check the live tool balance falls by its stated cost. Failed requests release reservations. Sandbox payment receipts alone are not live tool-debit evidence.
- Delete only a disposable account. Admin deletion is blocked; renewable billing must stop before saved content is deleted. Financial/security records may be retained.

## Verification status
- Price and lifecycle regression tests pass; public purchase review, legal links and signed-out recovery page were browser-checked without runtime errors.
- Hosted credit mutation permissions are restricted; request reservations and expiring grants are installed.
- Authenticated purchase, upgrade/downgrade, renewal, refund, account update and deletion checks remain unverified until an appropriate preview account is available.
- Production CAPTCHA uses a test site key in the current sign-in page. A real Cloudflare site configuration and hosted enforcement must be supplied/verified before public launch. Hosted email confirmation, secure email change, password reauthentication and delivery remain unverified.
- No live customer was charged, refunded or deleted during these checks. Frontend updates are not published automatically.