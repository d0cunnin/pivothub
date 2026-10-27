# Payment architecture
- All provider calls use the shared gateway Stripe client with an explicit test/live environment; managed credentials are not direct API keys.
- User-linked checkout derives ownership from verified authentication and resolves a Customer carrying userId metadata to prevent cross-account billing.
- Verified payment fulfillment uses the service-only idempotent receipt function; test receipts never mutate live Tool Credits because preview and production share one database.
- Managed subscription credits reset only after a paid invoice; cancellation preserves the current paid period and blocks future renewals.