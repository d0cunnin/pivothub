-- Phase 5: Create moderation_log table for tracking all moderation events
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  function_name text NOT NULL,
  input_text text NOT NULL,
  flagged boolean NOT NULL,
  categories jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all logs
CREATE POLICY "Admins can view moderation logs"
  ON public.moderation_log
  FOR SELECT
  USING (has_role('admin'));

-- Service role can insert logs
CREATE POLICY "Service role can insert moderation logs"
  ON public.moderation_log
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_moderation_log_user_id ON public.moderation_log(user_id);
CREATE INDEX idx_moderation_log_flagged ON public.moderation_log(flagged) WHERE flagged = true;
CREATE INDEX idx_moderation_log_function ON public.moderation_log(function_name);
CREATE INDEX idx_moderation_log_created_at ON public.moderation_log(created_at DESC);