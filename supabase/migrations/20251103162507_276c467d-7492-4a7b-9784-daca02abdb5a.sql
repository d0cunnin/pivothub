-- One-time data update: Add 10,000 extra credits to admin account
-- This is NOT a schema change, just adding credits to user 3f87f7e1-962c-4fd8-aabb-e1029a6a065d

UPDATE subscribers_public
SET 
  extra_credits = 10000,
  updated_at = now()
WHERE user_id = '3f87f7e1-962c-4fd8-aabb-e1029a6a065d';