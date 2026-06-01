CREATE TABLE public.create_it_blueprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  platform_description TEXT,
  industry TEXT,
  platform_type TEXT,
  blueprint_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_create_it_blueprints_user_id ON public.create_it_blueprints(user_id);
CREATE INDEX idx_create_it_blueprints_created_at ON public.create_it_blueprints(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.create_it_blueprints TO authenticated;
GRANT ALL ON public.create_it_blueprints TO service_role;

ALTER TABLE public.create_it_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blueprints"
  ON public.create_it_blueprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blueprints"
  ON public.create_it_blueprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blueprints"
  ON public.create_it_blueprints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blueprints"
  ON public.create_it_blueprints FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_create_it_blueprints_updated_at
  BEFORE UPDATE ON public.create_it_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();