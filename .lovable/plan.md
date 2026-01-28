

## Add 300 Credits to User

**User Details:**
- Email: michaelport3@gmail.com
- User ID: `e9069307-d2e0-47da-ac9c-833185384111`
- Current credits: 5 remaining, 0 extra credits

**What will be done:**

Add 300 credits to this user by updating both the `users` table and `subscribers_public` table to ensure credit tracking stays synchronized.

**Database Changes:**

1. **Update `users` table:**
   - Increase `ai_credits_remaining` by 300 (5 → 305)
   - Increase `ai_credits_total` by 300 (5 → 305)

2. **Update `subscribers_public` table:**
   - Add 300 to `extra_credits` (0 → 300)

**SQL to execute:**
```sql
-- Update users table
UPDATE users 
SET ai_credits_remaining = ai_credits_remaining + 300,
    ai_credits_total = ai_credits_total + 300,
    updated_at = now()
WHERE id = 'e9069307-d2e0-47da-ac9c-833185384111';

-- Update subscribers_public table  
UPDATE subscribers_public
SET extra_credits = extra_credits + 300,
    updated_at = now()
WHERE user_id = 'e9069307-d2e0-47da-ac9c-833185384111';
```

**Result:**
The user will have 305 total credits available (5 base + 300 added).

