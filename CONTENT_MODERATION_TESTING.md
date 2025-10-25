# Content Moderation Testing Guide

This document provides comprehensive test procedures for verifying the content moderation system's security controls.

## Overview

The platform uses OpenAI's Moderation API to screen user-generated content for harmful material. Functions are classified into two risk levels:

- **High-Risk (Fail-Closed)**: Block all operations if moderation fails or API is unavailable
- **Medium-Risk (Fail-Open)**: Log warnings but allow operations to proceed if API is unavailable

## Test Prerequisites

- Active user account with available credits
- Access to database for verification queries
- OpenAI API key configured in Supabase secrets

## High-Risk Functions (Fail-Closed)

These functions MUST block operations if moderation fails or API is unavailable.

### Test 1: Resume Analyzer

**Endpoint**: `/resume-analyzer`

**Test Cases**:

1. **Normal Content (Expected: Success)**
   ```
   Input: "Software Engineer with 5 years experience in React and Node.js. Strong problem-solving skills."
   Expected: 200 OK, resume analysis returned
   ```

2. **Harmful Content (Expected: Blocked)**
   ```
   Input: "I hate all people from [country]. I want to hurt them."
   Expected: 400 Bad Request, error message about content policy violation
   ```

3. **API Unavailable (Expected: Blocked)**
   ```
   Action: Temporarily remove or invalidate OpenAI API key
   Input: Any resume text
   Expected: 503 Service Unavailable, error about moderation unavailable
   ```

### Test 2: Legal Document Generator

**Endpoint**: `/generate-legal-docs`

**Test Cases**:

1. **Normal Content (Expected: Success)**
   ```
   Input: Business name "Green Tech Solutions", Type "LLC"
   Expected: 200 OK, legal document generated
   ```

2. **Harmful Content (Expected: Blocked)**
   ```
   Input: Business name "I Hate [Group] Services", Type "LLC"
   Expected: 400 Bad Request, flagged content
   ```

3. **API Unavailable (Expected: Blocked)**
   ```
   Action: API key removed
   Expected: 503 Service Unavailable
   ```

### Test 3: Interview Feedback

**Endpoint**: `/interview-feedback`

**Test Cases**:

1. **Normal Content (Expected: Success)**
   ```
   Input: Q&A about technical interview questions
   Expected: 200 OK, feedback provided
   ```

2. **Harmful Content (Expected: Blocked)**
   ```
   Input: Q&A containing violent or discriminatory language
   Expected: 400 Bad Request
   ```

### Test 4: Career Assessment

**Endpoint**: `/career-assessment`

**Test Cases**:

1. **Normal Content (Expected: Success)**
   ```
   Input: Standard career assessment responses
   Expected: 200 OK, assessment results
   ```

2. **Harmful Content (Expected: Blocked)**
   ```
   Input: Responses with hate speech or violent content
   Expected: 400 Bad Request
   ```

## Medium-Risk Functions (Fail-Open)

These functions should log warnings but proceed if API is unavailable.

### Test 5: Interview Questions Coach

**Endpoint**: `/interview-questions`

**Test Cases**:

1. **Normal Content (Expected: Success)**
   ```
   Input: Job title "Software Engineer"
   Expected: 200 OK, interview questions generated
   ```

2. **Harmful Content (Expected: Blocked)**
   ```
   Input: Job title with offensive language
   Expected: 400 Bad Request
   ```

3. **API Unavailable (Expected: Success with Warning)**
   ```
   Action: API key removed
   Input: "Software Engineer"
   Expected: 200 OK, questions generated, warning logged
   ```

### Test 6: Social Media Content

**Endpoint**: `/social-media-content`

**Test Cases**:

1. **Normal Content (Expected: Success)**
   ```
   Input: "Coffee shop in downtown"
   Expected: 200 OK, social media content generated
   ```

2. **Harmful Content (Expected: Blocked)**
   ```
   Input: Business description with hate speech
   Expected: 400 Bad Request
   ```

3. **API Unavailable (Expected: Success with Warning)**
   ```
   Action: API key removed
   Expected: 200 OK, content generated despite moderation unavailable
   ```

### Test 7: Grant Content Generator

**Endpoint**: `/generate-grant-content`

**Test Cases**:

1. **Normal Content (Expected: Success)**
   ```
   Input: Grant proposal for community education
   Expected: 200 OK, grant content generated
   ```

2. **Harmful Content (Expected: Blocked)**
   ```
   Input: Grant proposal with discriminatory content
   Expected: 400 Bad Request
   ```

3. **API Unavailable (Expected: Success with Warning)**
   ```
   Action: API key removed
   Expected: 200 OK, proceeds with warning
   ```

## Verification SQL Queries

### Check Moderation Logs

Run after each test to verify moderation events:

```sql
-- View recent moderation logs
SELECT 
  id,
  function_name, 
  flagged, 
  categories, 
  created_at,
  LEFT(input_text, 100) as sample_text,
  user_id
FROM moderation_log 
ORDER BY created_at DESC 
LIMIT 50;
```

### Check User Reputation

Verify that flagged content increments user reputation flags:

```sql
-- Check users with moderation flags
SELECT 
  user_id, 
  moderation_flags, 
  last_flag_date,
  account_status,
  subscribed
FROM subscribers_public
WHERE moderation_flags > 0
ORDER BY moderation_flags DESC, last_flag_date DESC;
```

### Check Fail-Open Behavior

Verify medium-risk functions proceeded despite API issues:

```sql
-- Check if medium-risk functions logged warnings but proceeded
SELECT 
  ml.function_name,
  ml.flagged,
  ml.categories,
  ml.input_text,
  ml.created_at
FROM moderation_log ml
WHERE ml.created_at > NOW() - INTERVAL '1 hour'
ORDER BY ml.created_at DESC;
```

### Check Function-Specific Logs

```sql
-- Count moderation events by function
SELECT 
  function_name,
  COUNT(*) as total_checks,
  SUM(CASE WHEN flagged THEN 1 ELSE 0 END) as flagged_count,
  SUM(CASE WHEN NOT flagged THEN 1 ELSE 0 END) as passed_count
FROM moderation_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY function_name
ORDER BY total_checks DESC;
```

## Expected Outcomes

### Successful Test Results

✅ **High-Risk Functions**:
- Normal content: Passes moderation and returns results
- Harmful content: Blocked with 400 error
- API down: Blocked with 503 error
- `moderation_log` contains entry with `flagged=true` for harmful content

✅ **Medium-Risk Functions**:
- Normal content: Passes moderation and returns results
- Harmful content: Blocked with 400 error
- API down: Proceeds with 200 OK, warning logged
- `moderation_log` contains entry for all attempts

✅ **User Reputation**:
- `moderation_flags` increments when harmful content detected
- `last_flag_date` updates on each flag
- After 3 flags: `account_status` changes to 'suspended'

## Testing with API Unavailability

To test fail-closed vs fail-open behavior:

### Method 1: Temporarily Remove API Key

```sql
-- View current secret (requires admin access)
SELECT name FROM vault.secrets WHERE name = 'relaunch_openai_key';

-- To test, temporarily update the secret to an invalid value
-- through Supabase Dashboard > Settings > Vault
-- Then restore after testing
```

### Method 2: Mock API Errors

Modify the `_shared/moderation.ts` file temporarily to simulate API errors for testing purposes.

## Troubleshooting

### No Moderation Logs Appearing

**Check**:
1. OpenAI API key is configured: `SELECT name FROM vault.secrets WHERE name = 'relaunch_openai_key'`
2. Function is actually calling moderation: Check edge function logs
3. User has sufficient credits: Check `subscribers_public.monthly_ai_requests`

### All Content Being Flagged

**Check**:
1. OpenAI API response: Review edge function logs
2. Moderation threshold settings in `_shared/moderation.ts`
3. Categories being checked (hate, violence, self-harm, sexual, harassment)

### Moderation Not Blocking Harmful Content

**Check**:
1. `fail_closed` parameter is set correctly in function call
2. Function is returning 400 status when `flagged=true`
3. Client is handling 400 errors properly

## Security Notes

⚠️ **Important**: The moderation system is a defense-in-depth layer. It does NOT replace:
- Input validation
- Output sanitization
- Rate limiting
- User authentication
- RLS policies

✅ **What it provides**:
- Early detection of harmful content
- User reputation tracking
- Audit trail for compliance
- Automatic suspension of repeat offenders

## Maintenance

**Regular Reviews**:
- Weekly: Check `moderation_log` for patterns
- Monthly: Review flagged users and false positives
- Quarterly: Adjust moderation thresholds if needed

**Metrics to Monitor**:
- False positive rate (legitimate content blocked)
- False negative rate (harmful content not caught)
- API availability and response times
- User suspension rate
