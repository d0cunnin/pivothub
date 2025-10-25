-- Phase 6: Add reputation tracking columns to subscribers_public
ALTER TABLE public.subscribers_public 
ADD COLUMN IF NOT EXISTS moderation_flags integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_flag_date timestamptz;

-- Create index for efficient querying of flagged users
CREATE INDEX IF NOT EXISTS idx_subscribers_moderation_flags 
ON public.subscribers_public(moderation_flags) 
WHERE moderation_flags > 0;