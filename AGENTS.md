# Payment architecture
- Complimentary admin awards use a service-only atomic audited RPC, with due monthly installments materialized into the live credit ledger during balance refresh; this prevents future credits or complimentary awards from becoming payment entitlements or revenue.
- All provider calls use the shared gateway Stripe client with an explicit test/live environment; managed credentials are not direct API keys.
- User-linked checkout derives ownership from verified authentication and resolves a Customer carrying userId metadata to prevent cross-account billing.
- Verified payment fulfillment uses the service-only idempotent receipt function; test receipts never mutate live Tool Credits because preview and production share one database.
- Verified paid invoice lines issue immutable expiring credit grants; subscription status alone never grants paid allowances, and cancellation preserves the current paid period.
- Credit grants and request-specific holds are the credit authority; subscribers_public is a compatibility balance projection, and test grants never affect live tool balances.
- Account/environment billing coordination serializes checkout and plan changes; provider idempotency and a service-only customer mapping prevent duplicate subscriptions and cross-account ownership.
- Charging handlers run in an AsyncLocalStorage request scope so each successful debit consumes its exact server-issued reservation and failed requests release theirs.
- Payment webhook processing and return polling acquire account/environment billing locks; observed-time guards reject stale subscription snapshots and cumulative refunds avoid repeated rounding.

# Home-screen support
- Keep installability manifest-only; the global mobile prompt uses a browser-provided install event when available and platform instructions otherwise, without adding service workers or offline caching.
# Visual refresh
- Keep visual refresh changes scoped to the page being refreshed and reuse existing semantic tokens and controls, so later phases cannot alter unrelated workflows or styling.
- Apply cross-tool visual styling through the opt-in ToolPageAppearance wrapper and its scoped stylesheet; keep tool children, shared UI primitives, and non-tool routes untouched to preserve behavior and isolate later phases.
