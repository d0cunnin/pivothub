# Payment architecture
- All provider calls use the shared gateway Stripe client with an explicit test/live environment; managed credentials are not direct API keys.
- User-linked checkout derives ownership from verified authentication and resolves a Customer carrying userId metadata to prevent cross-account billing.
- Verified payment fulfillment uses the service-only idempotent receipt function; test receipts never mutate live Tool Credits because preview and production share one database.
- Verified paid invoice lines issue immutable expiring credit grants; subscription status alone never grants paid allowances, and cancellation preserves the current paid period.
- Credit grants and request-specific holds are the credit authority; subscribers_public is a compatibility balance projection, and test grants never affect live tool balances.
- Account/environment billing coordination serializes checkout and plan changes; provider idempotency and a service-only customer mapping prevent duplicate subscriptions and cross-account ownership.
- Charging handlers run in an AsyncLocalStorage request scope so each successful debit consumes its exact server-issued reservation and failed requests release theirs.
- Payment webhook processing and return polling acquire account/environment billing locks; observed-time guards reject stale subscription snapshots and cumulative refunds avoid repeated rounding.