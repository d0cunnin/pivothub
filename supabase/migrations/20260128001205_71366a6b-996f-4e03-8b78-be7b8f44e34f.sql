-- Add 300 credits to user michaelport3@gmail.com
-- User ID: e9069307-d2e0-47da-ac9c-833185384111

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