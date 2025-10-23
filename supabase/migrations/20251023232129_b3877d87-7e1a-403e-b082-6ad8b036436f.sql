-- Remove deprecated trial columns from subscribers_public
-- These columns are no longer used after implementing the 5-credit Explore Mode system
ALTER TABLE public.subscribers_public 
DROP COLUMN IF EXISTS trial_start,
DROP COLUMN IF EXISTS trial_end,
DROP COLUMN IF EXISTS is_trial_active;