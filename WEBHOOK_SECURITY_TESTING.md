# Webhook Security Testing Guide

This document provides comprehensive test procedures for verifying Stripe webhook security controls.

## Overview

The `/stripe-webhook` edge function implements multiple security layers:

1. **Signature Verification**: Validates webhook authenticity using Stripe signature
2. **Replay Protection**: Prevents duplicate processing of the same event
3. **Event Age Check**: Rejects events older than 15 minutes
4. **Audit Logging**: Records all webhook attempts for security monitoring

## Test Prerequisites

- Stripe account in test mode
- Stripe CLI installed ([Installation Guide](https://stripe.com/docs/stripe-cli))
- Access to Supabase database for verification queries
- Webhook endpoint: `https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/stripe-webhook`

## Setup Stripe CLI

### Installation

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz

# Windows
scoop install stripe
```

### Authentication

```bash
stripe login
```

### Start Webhook Forwarding

```bash
stripe listen --forward-to https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/stripe-webhook
```

Note: This will output a webhook signing secret (whsec_...). This is automatically used by the CLI for testing.

## Test Cases

### Test 1: Valid Webhook Signature

**Objective**: Verify that properly signed webhooks are accepted and processed.

**Commands**:
```bash
# Trigger subscription creation
stripe trigger checkout.session.completed

# Trigger payment success
stripe trigger invoice.payment_succeeded

# Trigger subscription update
stripe trigger customer.subscription.updated

# Trigger subscription deletion
stripe trigger customer.subscription.deleted
```

**Expected Results**:
- HTTP 200 response
- Entry in `webhook_audit_log` with `signature_valid=true`
- Entry in `processed_stripe_events` with `processed_successfully=true`
- Corresponding subscription updates in `subscribers_public` table

**Verification**:
```sql
SELECT 
  event_id,
  event_type,
  signature_valid,
  processing_status,
  received_at
FROM webhook_audit_log
ORDER BY received_at DESC
LIMIT 10;
```

---

### Test 2: Invalid Webhook Signature

**Objective**: Verify that webhooks with invalid signatures are rejected.

**Manual Test** (using curl):

```bash
curl -X POST https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=invalid_signature_here" \
  -d '{
    "id": "evt_test_invalid",
    "object": "event",
    "type": "invoice.payment_succeeded",
    "data": {
      "object": {
        "id": "in_test",
        "customer": "cus_test"
      }
    }
  }'
```

**Expected Results**:
- HTTP 400 Bad Request
- Response body: `{"error": "Invalid signature"}`
- Entry in `webhook_audit_log` with `signature_valid=false`
- No entry in `processed_stripe_events`
- No database changes

**Verification**:
```sql
SELECT 
  event_id,
  event_type,
  signature_valid,
  processing_status,
  error_message
FROM webhook_audit_log
WHERE signature_valid = false
ORDER BY received_at DESC
LIMIT 10;
```

---

### Test 3: Replay Attack Prevention

**Objective**: Verify that duplicate events are detected and not reprocessed.

**Procedure**:

1. Send a valid webhook event:
```bash
stripe trigger checkout.session.completed
```

2. Note the `event_id` from the response (format: `evt_...`)

3. Wait 30 seconds

4. Replay the same event using Stripe CLI:
```bash
# The CLI automatically prevents this, so we'll use curl with captured data
# First capture a real event's payload and signature from webhook_audit_log
```

**Alternative Method**:

Send the same trigger twice in rapid succession:
```bash
stripe trigger checkout.session.completed
sleep 2
stripe trigger checkout.session.completed
```

**Expected Results**:
- First event: HTTP 200, processed successfully
- Second event (duplicate): HTTP 200, but marked as duplicate in logs
- Only ONE entry in `processed_stripe_events` for that event_id
- Database updated only once

**Verification**:
```sql
-- Check for duplicate event IDs
SELECT 
  event_id,
  COUNT(*) as occurrences
FROM webhook_audit_log
GROUP BY event_id
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;

-- Verify only processed once
SELECT 
  event_id,
  event_type,
  processed_successfully,
  created_at
FROM processed_stripe_events
WHERE event_id IN (
  SELECT event_id 
  FROM webhook_audit_log 
  GROUP BY event_id 
  HAVING COUNT(*) > 1
);
```

---

### Test 4: Event Age Validation

**Objective**: Verify that old events (>15 minutes) are rejected.

**Manual Test**:

```bash
# Generate an old timestamp (16 minutes ago)
OLD_TIMESTAMP=$(($(date +%s) - 960))

curl -X POST https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=$OLD_TIMESTAMP,v1=fake_signature" \
  -d '{
    "id": "evt_test_old",
    "object": "event",
    "type": "invoice.payment_succeeded",
    "created": '$OLD_TIMESTAMP',
    "data": {
      "object": {
        "id": "in_test",
        "customer": "cus_test"
      }
    }
  }'
```

**Expected Results**:
- HTTP 400 Bad Request
- Response: `{"error": "Event timestamp too old"}`
- Entry in `webhook_audit_log` with appropriate error message
- No processing of the event

**Verification**:
```sql
SELECT 
  event_id,
  event_type,
  signature_valid,
  processing_status,
  error_message,
  received_at
FROM webhook_audit_log
WHERE error_message LIKE '%timestamp%'
ORDER BY received_at DESC;
```

---

### Test 5: Subscription Lifecycle

**Objective**: Verify complete subscription flow from creation to cancellation.

**Procedure**:

```bash
# 1. Create subscription
stripe trigger checkout.session.completed

# 2. Successful payment
stripe trigger invoice.payment_succeeded

# 3. Update subscription (upgrade/downgrade)
stripe trigger customer.subscription.updated

# 4. Payment failure
stripe trigger invoice.payment_failed

# 5. Cancel subscription
stripe trigger customer.subscription.deleted
```

**Expected Results**:

After each event, verify database state:

```sql
-- Check subscription status updates
SELECT 
  user_id,
  subscribed,
  subscription_package,
  subscription_tier,
  ai_request_limit,
  account_status,
  grace_period_end,
  next_billing_date
FROM subscribers_public
ORDER BY updated_at DESC
LIMIT 5;

-- Check webhook processing
SELECT 
  event_type,
  processing_status,
  received_at
FROM webhook_audit_log
WHERE event_type LIKE '%subscription%' 
   OR event_type LIKE '%invoice%'
ORDER BY received_at DESC
LIMIT 10;
```

**Expected State Transitions**:

1. `checkout.session.completed`: 
   - `subscribed = true`
   - `subscription_package` set
   - `ai_request_limit` updated to package credits

2. `invoice.payment_succeeded`:
   - `account_status = 'active'`
   - `next_billing_date` updated

3. `customer.subscription.updated`:
   - Credits adjusted based on new package
   - Rollover credits preserved/adjusted

4. `invoice.payment_failed`:
   - `account_status = 'warning'`
   - `grace_period_end` set to 7 days ahead
   - `payment_retry_count` incremented

5. `customer.subscription.deleted`:
   - `subscribed = false`
   - Reverted to free tier (5 credits)
   - `subscription_package = NULL`

---

## Verification SQL Queries

### Webhook Audit Log Analysis

```sql
-- Overview of webhook activity
SELECT 
  event_type,
  COUNT(*) as total_events,
  SUM(CASE WHEN signature_valid THEN 1 ELSE 0 END) as valid_signatures,
  SUM(CASE WHEN processing_status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN processing_status = 'error' THEN 1 ELSE 0 END) as errors,
  SUM(CASE WHEN processing_status = 'duplicate' THEN 1 ELSE 0 END) as duplicates
FROM webhook_audit_log
GROUP BY event_type
ORDER BY total_events DESC;
```

### Recent Webhook Activity

```sql
-- Last 50 webhook attempts
SELECT 
  event_id,
  event_type,
  signature_valid,
  processing_status,
  error_message,
  received_at
FROM webhook_audit_log
ORDER BY received_at DESC
LIMIT 50;
```

### Duplicate Detection

```sql
-- Find events that were received multiple times
SELECT 
  event_id,
  event_type,
  COUNT(*) as receipt_count,
  MIN(received_at) as first_received,
  MAX(received_at) as last_received
FROM webhook_audit_log
GROUP BY event_id, event_type
HAVING COUNT(*) > 1
ORDER BY receipt_count DESC;
```

### Processing Errors

```sql
-- All webhook processing errors
SELECT 
  event_id,
  event_type,
  error_message,
  received_at
FROM webhook_audit_log
WHERE processing_status = 'error'
ORDER BY received_at DESC
LIMIT 20;
```

### Successful Subscriptions

```sql
-- Users successfully subscribed via webhooks
SELECT 
  sp.user_id,
  sp.subscription_package,
  sp.subscribed,
  sp.ai_request_limit,
  sp.account_status,
  sp.created_at
FROM subscribers_public sp
WHERE sp.subscribed = true
  AND sp.created_at > NOW() - INTERVAL '1 day'
ORDER BY sp.created_at DESC;
```

---

## Security Checklist

After testing, verify all security controls are functioning:

- [ ] ✅ Valid signatures are accepted
- [ ] ✅ Invalid signatures are rejected (400 error)
- [ ] ✅ Duplicate events are detected and not reprocessed
- [ ] ✅ Events older than 15 minutes are rejected
- [ ] ✅ All webhook attempts are logged in `webhook_audit_log`
- [ ] ✅ Successful events are recorded in `processed_stripe_events`
- [ ] ✅ Subscription lifecycle updates database correctly
- [ ] ✅ Payment failures trigger grace period
- [ ] ✅ Cancellations revert to free tier
- [ ] ✅ No sensitive data exposed in error messages

---

## Troubleshooting

### No Webhook Logs Appearing

**Check**:
1. Stripe webhook secret is configured: Check Supabase Edge Function secrets
2. Webhook endpoint is accessible: Test with curl
3. Stripe CLI is forwarding correctly: Check CLI output

### All Webhooks Failing Signature Validation

**Check**:
1. Correct webhook signing secret is configured in Supabase
2. Secret matches the one shown in Stripe Dashboard or CLI
3. Request headers include `Stripe-Signature`

### Duplicate Events Not Detected

**Check**:
1. `processed_stripe_events` table has proper unique constraint on `event_id`
2. Event IDs are being extracted correctly from webhook payload
3. Database insert is happening before processing logic

### Old Events Not Rejected

**Check**:
1. Event timestamp extraction is working
2. 15-minute threshold calculation is correct
3. Error response is being returned before processing

---

## Monitoring Recommendations

### Daily Checks

```sql
-- Check for webhook processing errors in last 24 hours
SELECT COUNT(*) as error_count
FROM webhook_audit_log
WHERE processing_status = 'error'
  AND received_at > NOW() - INTERVAL '24 hours';
```

### Weekly Review

```sql
-- Webhook reliability metrics
SELECT 
  DATE_TRUNC('day', received_at) as date,
  COUNT(*) as total_webhooks,
  SUM(CASE WHEN processing_status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN processing_status = 'error' THEN 1 ELSE 0 END) as errors,
  ROUND(100.0 * SUM(CASE WHEN processing_status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM webhook_audit_log
WHERE received_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', received_at)
ORDER BY date DESC;
```

### Alert Conditions

Set up alerts for:
- Error rate > 5%
- No webhooks received for > 1 hour during business hours
- Multiple signature validation failures (possible attack)
- High number of duplicate events (possible replay attempt)

---

## Production Deployment

Before going live:

1. **Update Webhook Endpoint** in Stripe Dashboard:
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`

2. **Configure Signing Secret**:
   - Copy webhook signing secret from Stripe Dashboard
   - Add to Supabase Edge Function secrets as `stripe_webhook_secret`

3. **Test in Production**:
   - Create a real test subscription using Stripe test card (4242 4242 4242 4242)
   - Verify webhook processing works correctly
   - Cancel test subscription

4. **Enable Monitoring**:
   - Set up daily/weekly SQL queries to monitor webhook health
   - Configure alerts for error conditions

---

## Security Best Practices

✅ **What this implementation provides**:
- Cryptographic verification of webhook authenticity
- Protection against replay attacks
- Time-based validation to prevent old event processing
- Complete audit trail for compliance
- Idempotent processing (safe to retry)

⚠️ **Additional considerations**:
- Rotate webhook signing secrets periodically (every 90 days)
- Monitor for unusual webhook patterns (rate limiting)
- Keep Stripe API libraries up to date
- Review webhook logs regularly for anomalies
- Test disaster recovery (webhook endpoint down)

---

## References

- [Stripe Webhook Security Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Event Types](https://stripe.com/docs/api/events/types)
