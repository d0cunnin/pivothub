-- CREATE IT — AI Platform Blueprint Generator
-- Stores generated platform blueprints so users can view, download, and regenerate them.

CREATE TABLE IF NOT EXISTS public.create_it_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL,
  platform_description TEXT,
  industry TEXT,
  platform_type TEXT,
  blueprint_json JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.create_it_blueprints ENABLE ROW LEVEL SECURITY;

-- Users can view their own blueprints
CREATE POLICY "Users can view their own create_it_blueprints"
ON public.create_it_blueprints
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own blueprints
CREATE POLICY "Users can insert their own create_it_blueprints"
ON public.create_it_blueprints
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own blueprints
CREATE POLICY "Users can update their own create_it_blueprints"
ON public.create_it_blueprints
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own blueprints
CREATE POLICY "Users can delete their own create_it_blueprints"
ON public.create_it_blueprints
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all blueprints (support / QA)
CREATE POLICY "Admins can view all create_it_blueprints"
ON public.create_it_blueprints
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for fast history lookups
CREATE INDEX IF NOT EXISTS idx_create_it_blueprints_user_id
  ON public.create_it_blueprints(user_id);
CREATE INDEX IF NOT EXISTS idx_create_it_blueprints_created_at
  ON public.create_it_blueprints(created_at DESC);

-- Keep updated_at fresh on every update
CREATE TRIGGER trg_create_it_blueprints_updated_at
  BEFORE UPDATE ON public.create_it_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
