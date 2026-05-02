# Give support@pivothub.io 1000 Tool Credits

## Current state

```
email                   ai_request_limit  extra_credits  rollover  used
support@pivothub.io     5                 0              0         4
```

Credit gating in `check_and_increment_ai_usage` uses `subscribers_public.ai_request_limit + extra_credits + rollover_credits`, so the admin only has 5 total — that's why Earn It (2 credits) is on the edge.

## The change

Run a one-off SQL update (no schema change) for user_id `6e213a88-5363-4b05-a58f-561f2a771170`:

- `subscribers_public.ai_request_limit = 1000`
- `subscribers_public.monthly_ai_requests = 0` (reset usage so the full 1000 is available now)
- `subscribers_public.extra_credits = 0`, `rollover_credits = 0` (clean slate)
- `subscribers_public.subscription_tier = 'admin'`, `subscription_package = 'admin'`, `subscribed = true`, `account_status = 'active'`
- Mirror on `users`: `ai_credits_total = 1000`, `ai_credits_remaining = 1000`, `ai_credits_used = 0`, `subscription_tier = 'admin'`, `subscribed = true`

This will be delivered as a migration file so it runs against the live database with your approval.

## Notes

- Only this one admin account is affected.
- No code, RLS, or schema changes — just data updates.
- After the migration runs, refresh the app and the credit counter should show 1000 remaining.
