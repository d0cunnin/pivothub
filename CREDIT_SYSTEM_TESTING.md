# Credit System Testing Guide

This document provides comprehensive test procedures for verifying the AI credit system's functionality and security controls.

## Overview

The credit system manages AI tool usage through a tiered subscription model:

- **Free Tier**: 5 credits per month
- **Assess + Prep + Learn**: 60 credits per month
- **Build + Teach + Launch**: 60 credits per month
- **Fund It**: 60 credits per month
- **All-Access**: 150 credits per month

Key features:
- Monthly credit allocation based on subscription tier
- Rollover credits (unused credits carry forward, capped at 2× monthly limit)
- Extra credits (one-time purchases)
- Grace period (7 days) for failed payments
- Automatic monthly reset via cron job

## Test Prerequisites

- Test user account(s) created
- Access to Supabase database
- Ability to manually update subscription states (for testing)
- Admin access to grant subscriptions (or Stripe test mode)

## Core Functions

The credit system is managed by the `check_and_increment_ai_usage()` database function:

```sql
SELECT check_and_increment_ai_usage(
  p_user_id := 'user-uuid-here',
  p_tool_name := 'career-assessment',
  p_credits_to_use := 5
);
```

---

## Test Case 1: Free Tier Limits

**Objective**: Verify that free-tier users are limited to 5 credits per month.

### Setup

```sql
-- Create or verify test user exists in free tier
INSERT INTO subscribers_public (user_id, subscribed, ai_request_limit, monthly_ai_requests)
VALUES ('test-user-free-id', false, 5, 0)
ON CONFLICT (user_id) DO UPDATE
SET subscribed = false,
    ai_request_limit = 5,
    monthly_ai_requests = 0,
    extra_credits = 0,
    rollover_credits = 0;
```

### Test Steps

1. **Use 5 Credits**:
```sql
-- Use Career Assessment (5 credits)
SELECT check_and_increment_ai_usage('test-user-free-id', 'career-assessment', 5);
```

**Expected Response**:
```json
{
  "can_use": true,
  "reason": "",
  "remaining": 0,
  "total_used": 5,
  "total_available": 5,
  "rollover_credits": 0,
  "credits_charged": 5
}
```

2. **Attempt 6th Credit**:
```sql
-- Try to use Resume Analyzer (3 credits)
SELECT check_and_increment_ai_usage('test-user-free-id', 'resume-analyzer', 3);
```

**Expected Response**:
```json
{
  "can_use": false,
  "reason": "free_limit_exceeded",
  "remaining": 0,
  "total_used": 5,
  "total_available": 5,
  "rollover_credits": 0,
  "credits_charged": 0
}
```

### Verification

```sql
SELECT 
  user_id,
  subscribed,
  ai_request_limit,
  monthly_ai_requests,
  rollover_credits,
  extra_credits,
  (ai_request_limit + rollover_credits + extra_credits - monthly_ai_requests) as remaining
FROM subscribers_public
WHERE user_id = 'test-user-free-id';
```

**Expected State**:
- `subscribed = false`
- `ai_request_limit = 5`
- `monthly_ai_requests = 5`
- `remaining = 0`

---

## Test Case 2: Subscription Credit Allocation

**Objective**: Verify that subscribed users receive correct credit allocations.

### Setup

```sql
-- Upgrade user to "Assess + Prep + Learn" package
UPDATE subscribers_public
SET subscribed = true,
    subscription_package = 'assess-prep-learn',
    subscription_tier = 'standard',
    ai_request_limit = 60,
    monthly_ai_requests = 0,
    billing_cycle_start = NOW(),
    next_billing_date = NOW() + INTERVAL '1 month',
    subscription_start_date = NOW()
WHERE user_id = 'test-user-sub-id';
```

### Test Steps

1. **Verify Initial Credits**:
```sql
SELECT 
  ai_request_limit,
  monthly_ai_requests,
  (ai_request_limit - monthly_ai_requests) as available
FROM subscribers_public
WHERE user_id = 'test-user-sub-id';
```

**Expected**: 60 available credits

2. **Use 10 Credits**:
```sql
-- Career Assessment (5 credits)
SELECT check_and_increment_ai_usage('test-user-sub-id', 'career-assessment', 5);

-- Resume Analyzer (3 credits)
SELECT check_and_increment_ai_usage('test-user-sub-id', 'resume-analyzer', 3);

-- Interview Questions (2 credits)
SELECT check_and_increment_ai_usage('test-user-sub-id', 'interview-questions', 2);
```

3. **Verify Usage**:
```sql
SELECT 
  monthly_ai_requests,
  ai_request_limit,
  (ai_request_limit - monthly_ai_requests) as remaining
FROM subscribers_public
WHERE user_id = 'test-user-sub-id';
```

**Expected**:
- `monthly_ai_requests = 10`
- `remaining = 50`

### Package-Specific Tests

Test each subscription tier:

```sql
-- All-Access (150 credits)
UPDATE subscribers_public
SET subscription_package = 'all-access',
    ai_request_limit = 150
WHERE user_id = 'test-user-sub-id';

-- Fund It (60 credits)
UPDATE subscribers_public
SET subscription_package = 'fund-it',
    ai_request_limit = 60
WHERE user_id = 'test-user-sub-id';
```

Verify each has correct limits and can use credits up to their limit.

---

## Test Case 3: Rollover Credits

**Objective**: Verify unused credits roll over to next month with 2× cap.

### Setup

```sql
-- User with 60 credit limit, used 40 in previous month
UPDATE subscribers_public
SET ai_request_limit = 60,
    monthly_ai_requests = 40,
    rollover_credits = 0,
    next_billing_date = NOW() - INTERVAL '1 day'  -- Trigger reset
WHERE user_id = 'test-user-rollover-id';
```

### Test Steps

1. **Trigger Monthly Reset**:
```sql
-- Manually call reset function (normally done by cron)
SELECT reset_monthly_ai_requests();
```

2. **Verify Rollover Calculation**:
```sql
SELECT 
  ai_request_limit,
  monthly_ai_requests,
  rollover_credits,
  (ai_request_limit + rollover_credits - monthly_ai_requests) as total_available
FROM subscribers_public
WHERE user_id = 'test-user-rollover-id';
```

**Expected**:
- `monthly_ai_requests = 0` (reset)
- `rollover_credits = 20` (60 limit - 40 used)
- `total_available = 80` (60 + 20)

3. **Use Rollover Credits**:
```sql
-- Use 70 credits (60 monthly + 10 rollover)
SELECT check_and_increment_ai_usage('test-user-rollover-id', 'business-plan', 70);
```

**Expected Response**:
```json
{
  "can_use": true,
  "remaining": 10,
  "rollover_credits": 20
}
```

4. **Test Rollover Cap (2× Limit)**:
```sql
-- Scenario: User never uses credits for a month
UPDATE subscribers_public
SET monthly_ai_requests = 0,  -- Used 0 credits
    rollover_credits = 60,  -- Already has 60 rollover
    next_billing_date = NOW() - INTERVAL '1 day'
WHERE user_id = 'test-user-rollover-id';

-- Trigger reset
SELECT reset_monthly_ai_requests();

-- Check rollover cap
SELECT rollover_credits FROM subscribers_public WHERE user_id = 'test-user-rollover-id';
```

**Expected**:
- `rollover_credits = 120` (capped at 2× the 60 monthly limit)
- NOT 180 (60 + 60 + 60)

---

## Test Case 4: Extra Credits (One-Time Purchases)

**Objective**: Verify one-time credit purchases work correctly.

### Setup

```sql
-- User purchases 25 extra credits
UPDATE subscribers_public
SET extra_credits = extra_credits + 25
WHERE user_id = 'test-user-extra-id';
```

### Test Steps

1. **Verify Extra Credits Added**:
```sql
SELECT 
  ai_request_limit,
  monthly_ai_requests,
  rollover_credits,
  extra_credits,
  (ai_request_limit + rollover_credits + extra_credits - monthly_ai_requests) as total_available
FROM subscribers_public
WHERE user_id = 'test-user-extra-id';
```

2. **Use Extra Credits**:
```sql
-- Use credits that exceed monthly limit
SELECT check_and_increment_ai_usage('test-user-extra-id', 'teaching-materials', 75);
```

**Expected**: Should succeed if `monthly + rollover + extra >= 75`

3. **Verify Extra Credits Persist After Reset**:
```sql
-- Trigger monthly reset
UPDATE subscribers_public
SET next_billing_date = NOW() - INTERVAL '1 day'
WHERE user_id = 'test-user-extra-id';

SELECT reset_monthly_ai_requests();

-- Check extra credits still there
SELECT extra_credits FROM subscribers_public WHERE user_id = 'test-user-extra-id';
```

**Expected**: `extra_credits` remains unchanged after monthly reset (doesn't expire)

---

## Test Case 5: Grace Period After Payment Failure

**Objective**: Verify users can still use credits during 7-day grace period.

### Setup

```sql
-- Simulate payment failure
UPDATE subscribers_public
SET account_status = 'warning',
    grace_period_end = NOW() + INTERVAL '7 days',
    payment_retry_count = 1,
    subscribed = true  -- Still subscribed during grace period
WHERE user_id = 'test-user-grace-id';
```

### Test Steps

1. **Verify Can Use Credits During Grace Period**:
```sql
SELECT check_and_increment_ai_usage('test-user-grace-id', 'career-assessment', 5);
```

**Expected**: `can_use = true` (grace period active)

2. **Simulate Grace Period Expiry**:
```sql
-- Set grace period to expired
UPDATE subscribers_public
SET grace_period_end = NOW() - INTERVAL '1 day'
WHERE user_id = 'test-user-grace-id';

-- Trigger grace period processor (normally done by cron)
SELECT reset_monthly_ai_requests();
```

3. **Verify Reverted to Free Tier**:
```sql
SELECT 
  subscribed,
  ai_request_limit,
  subscription_package,
  account_status,
  grace_period_end
FROM subscribers_public
WHERE user_id = 'test-user-grace-id';
```

**Expected**:
- `subscribed = false`
- `ai_request_limit = 5`
- `subscription_package = NULL`
- `account_status = 'active'`
- `grace_period_end = NULL`

4. **Verify Free Tier Limits Apply**:
```sql
-- Try to use more than 5 credits
SELECT check_and_increment_ai_usage('test-user-grace-id', 'business-plan', 8);
```

**Expected**: `can_use = false, reason = 'free_limit_exceeded'`

---

## Test Case 6: Suspended Account

**Objective**: Verify suspended accounts cannot use credits.

### Setup

```sql
-- Suspend account (e.g., after 3 moderation flags)
UPDATE subscribers_public
SET account_status = 'suspended',
    moderation_flags = 3
WHERE user_id = 'test-user-suspended-id';
```

### Test Steps

1. **Attempt to Use Credits**:
```sql
SELECT check_and_increment_ai_usage('test-user-suspended-id', 'career-assessment', 5);
```

**Expected Response**:
```json
{
  "can_use": false,
  "reason": "account_suspended",
  "remaining": 0
}
```

2. **Verify No Credits Charged**:
```sql
SELECT monthly_ai_requests 
FROM subscribers_public 
WHERE user_id = 'test-user-suspended-id';
```

**Expected**: No change in `monthly_ai_requests`

---

## Test Case 7: Monthly Reset (Cron Job)

**Objective**: Verify the cron job correctly resets credits and handles rollovers.

### Setup

Create multiple test users with different scenarios:

```sql
-- User A: Used 40 out of 60 (should get 20 rollover)
INSERT INTO subscribers_public (user_id, subscribed, ai_request_limit, monthly_ai_requests, next_billing_date)
VALUES ('user-a', true, 60, 40, NOW() - INTERVAL '1 hour');

-- User B: Used 60 out of 60 (should get 0 rollover)
INSERT INTO subscribers_public (user_id, subscribed, ai_request_limit, monthly_ai_requests, next_billing_date)
VALUES ('user-b', true, 60, 60, NOW() - INTERVAL '1 hour');

-- User C: Used 5 out of 60 (should get 55 rollover)
INSERT INTO subscribers_public (user_id, subscribed, ai_request_limit, monthly_ai_requests, next_billing_date)
VALUES ('user-c', true, 60, 5, NOW() - INTERVAL '1 hour');

-- User D: Free tier (should reset to 0 usage, 0 rollover)
INSERT INTO subscribers_public (user_id, subscribed, ai_request_limit, monthly_ai_requests, free_tier_start_date)
VALUES ('user-d', false, 5, 5, NOW() - INTERVAL '31 days');
```

### Test Steps

1. **Trigger Reset Function**:
```sql
SELECT reset_monthly_ai_requests();
```

2. **Verify Results**:
```sql
SELECT 
  user_id,
  monthly_ai_requests,
  rollover_credits,
  next_billing_date
FROM subscribers_public
WHERE user_id IN ('user-a', 'user-b', 'user-c', 'user-d')
ORDER BY user_id;
```

**Expected Results**:

| User | monthly_ai_requests | rollover_credits | Notes |
|------|-------------------|------------------|-------|
| user-a | 0 | 20 | 60 - 40 = 20 |
| user-b | 0 | 0 | 60 - 60 = 0 |
| user-c | 0 | 55 | 60 - 5 = 55 |
| user-d | 0 | 0 | Free tier, no rollover |

3. **Verify Billing Date Advanced**:
```sql
SELECT 
  user_id,
  next_billing_date > NOW() as is_future_date
FROM subscribers_public
WHERE user_id IN ('user-a', 'user-b', 'user-c')
  AND subscribed = true;
```

**Expected**: All should show `is_future_date = true` (advanced by 1 month)

---

## Tool Credit Weights

Different tools consume different amounts of credits:

| Tool | Credits | Token Estimate |
|------|---------|----------------|
| Teaching Materials | 10 | 10,000 |
| Business Plan | 8 | 8,000 |
| Grant Content | 8 | 8,000 |
| Pitch Deck | 6 | 6,000 |
| Marketing Strategy | 6 | 6,000 |
| Legal Docs | 6 | 6,000 |
| Career Assessment | 5 | 4,000 |
| Skills Assessment | 5 | 4,000 |
| Personality Assessment | 5 | 4,000 |
| Business Idea | 4 | 4,000 |
| Social Media | 3 | 3,000 |
| Resume Analyzer | 3 | 3,000 |
| Interview Feedback | 3 | 3,000 |
| Business Foundation | 3 | 3,000 |
| Grant Finder | 2 | 2,000 |
| Interview Questions | 2 | 1,500 |
| Others | 1 | 1,500 |

### Test Different Tool Weights

```sql
-- Verify each tool charges correct credits
SELECT check_and_increment_ai_usage('test-user', 'teaching-materials', 10);  -- Should charge 10
SELECT check_and_increment_ai_usage('test-user', 'career-assessment', 5);    -- Should charge 5
SELECT check_and_increment_ai_usage('test-user', 'interview-questions', 2);  -- Should charge 2
```

---

## Verification SQL Queries

### Check User Credit Balance

```sql
SELECT 
  user_id,
  subscribed,
  subscription_package,
  ai_request_limit,
  monthly_ai_requests,
  rollover_credits,
  extra_credits,
  (ai_request_limit + rollover_credits + extra_credits) as total_monthly_credits,
  (ai_request_limit + rollover_credits + extra_credits - monthly_ai_requests) as remaining_credits,
  account_status,
  grace_period_end,
  next_billing_date
FROM subscribers_public
WHERE user_id = 'user-id-here';
```

### Check Tool Usage Breakdown

```sql
SELECT 
  tool_name,
  SUM(credits_used) as total_credits_used,
  COUNT(*) as times_used,
  SUM(estimated_cost_usd) as total_cost,
  AVG(estimated_cost_usd) as avg_cost_per_use
FROM tool_usage_analytics
WHERE user_id = 'user-id-here'
  AND created_at >= DATE_TRUNC('month', NOW())
GROUP BY tool_name
ORDER BY total_credits_used DESC;
```

### Check Credit Deduction Logs

```sql
SELECT 
  endpoint,
  credits_charged,
  success,
  error_message,
  created_at,
  request_duration_ms
FROM api_request_log
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC
LIMIT 50;
```

### Monthly Usage Summary

```sql
SELECT 
  user_id,
  month_year,
  total_uses,
  total_credits,
  total_cost_usd
FROM monthly_usage_summary
WHERE user_id = 'user-id-here'
ORDER BY month_year DESC;
```

### Platform-Wide Credit Statistics

```sql
-- Admin view of credit usage across all users
SELECT 
  subscription_package,
  COUNT(DISTINCT user_id) as user_count,
  AVG(monthly_ai_requests) as avg_credits_used,
  SUM(monthly_ai_requests) as total_credits_used,
  AVG(ai_request_limit + rollover_credits + extra_credits) as avg_available
FROM subscribers_public
WHERE subscribed = true
GROUP BY subscription_package
ORDER BY user_count DESC;
```

---

## Edge Cases to Test

### 1. Concurrent Usage

**Scenario**: User triggers multiple tools simultaneously

```sql
-- Simulate concurrent requests (in separate transactions)
-- Should correctly increment without race conditions
```

**Expected**: Each request correctly increments total, no lost updates

### 2. Subscription Change Mid-Month

**Scenario**: User upgrades from 60 to 150 credits

```sql
-- User has used 50 out of 60 credits
UPDATE subscribers_public
SET monthly_ai_requests = 50,
    ai_request_limit = 60
WHERE user_id = 'test-user';

-- User upgrades to all-access
UPDATE subscribers_public
SET subscription_package = 'all-access',
    ai_request_limit = 150
WHERE user_id = 'test-user';
```

**Expected**: User now has 100 credits available (150 - 50 used)

### 3. Downgrade with Excess Usage

**Scenario**: User used 100 credits, downgrades to 60 credit package

```sql
UPDATE subscribers_public
SET monthly_ai_requests = 100,
    ai_request_limit = 150
WHERE user_id = 'test-user';

-- Downgrade to 60 credits
UPDATE subscribers_public
SET ai_request_limit = 60
WHERE user_id = 'test-user';
```

**Expected**: 
- Remaining credits = -40 (cannot use more this month)
- Next month reset: 0 rollover (already exceeded limit)

### 4. Rollover Cap Edge Case

**Scenario**: User has 100 rollover + 60 monthly = 160 total, but cap is 120

```sql
UPDATE subscribers_public
SET rollover_credits = 100,
    ai_request_limit = 60
WHERE user_id = 'test-user';
```

**Expected**: Total available = 120 (rollover capped at 2× limit)

---

## Security Checklist

After testing, verify:

- [ ] ✅ Free tier users cannot exceed 5 credits
- [ ] ✅ Subscribed users receive correct credit allocations
- [ ] ✅ Rollover credits calculated correctly and capped at 2× limit
- [ ] ✅ Extra credits persist across monthly resets
- [ ] ✅ Grace period allows credit usage for 7 days
- [ ] ✅ Suspended accounts cannot use credits
- [ ] ✅ Monthly reset functions correctly
- [ ] ✅ Tool credit weights are accurate
- [ ] ✅ Usage is logged in `tool_usage_analytics`
- [ ] ✅ No race conditions in concurrent usage
- [ ] ✅ Subscription changes handled correctly mid-month

---

## Troubleshooting

### Credits Not Deducting

**Check**:
1. `check_and_increment_ai_usage()` function is being called
2. User ID is correct
3. Tool name matches expected value
4. Function returns `can_use = true`

### Rollover Not Working

**Check**:
1. `reset_monthly_ai_requests()` cron job is running
2. `next_billing_date` is in the past (triggers reset)
3. User is subscribed (`subscribed = true`)
4. Rollover calculation: `GREATEST(0, limit + extra + rollover - used)`

### Monthly Reset Not Triggering

**Check**:
1. Cron job configured: `0 0 * * *` (daily at midnight)
2. Edge function `reset-free-tier-credits` exists
3. Check edge function logs for errors

### Wrong Credit Amounts

**Check**:
1. Tool credit weights in `check_and_increment_ai_usage()` function
2. Subscription package limits in `subscribers_public.ai_request_limit`
3. Extra credits from purchases

---

## Monitoring Recommendations

### Daily Checks

```sql
-- Users approaching credit limits
SELECT 
  user_id,
  subscription_package,
  ai_request_limit,
  monthly_ai_requests,
  (ai_request_limit - monthly_ai_requests) as remaining
FROM subscribers_public
WHERE subscribed = true
  AND (ai_request_limit - monthly_ai_requests) < 10
ORDER BY remaining;
```

### Weekly Review

```sql
-- Credit usage trends
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  SUM(credits_used) as total_credits,
  AVG(credits_used) as avg_per_user
FROM tool_usage_analytics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### Monthly Audit

```sql
-- Revenue vs. cost analysis
SELECT 
  sp.subscription_package,
  COUNT(DISTINCT sp.user_id) as subscribers,
  SUM(mus.total_credits) as total_credits_used,
  SUM(mus.total_cost_usd) as total_api_cost,
  CASE sp.subscription_package
    WHEN 'all-access' THEN 29.00 * COUNT(DISTINCT sp.user_id)
    WHEN 'assess-prep-learn' THEN 18.00 * COUNT(DISTINCT sp.user_id)
    WHEN 'build-teach-launch' THEN 18.00 * COUNT(DISTINCT sp.user_id)
    WHEN 'fund-it' THEN 15.00 * COUNT(DISTINCT sp.user_id)
    ELSE 0
  END as monthly_revenue
FROM subscribers_public sp
LEFT JOIN monthly_usage_summary mus ON sp.user_id = mus.user_id
WHERE sp.subscribed = true
GROUP BY sp.subscription_package;
```

---

## References

- Database function: `check_and_increment_ai_usage()` in `supabase/migrations`
- Tool credit weights: See function implementation
- Monthly reset: `reset_monthly_ai_requests()` function
- Subscription packages: Defined in `pricing_plans` table
