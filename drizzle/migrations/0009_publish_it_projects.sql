-- PUBLISH IT: saved publishing plans (guidance and progress only; no files).
-- Each user can only see and change their own projects.

CREATE TABLE IF NOT EXISTS public.publish_it_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL CHECK (length(project_name) BETWEEN 1 AND 200),
  assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
  progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  isbn_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  costs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  write_it_project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publish_it_projects_user_idx ON public.publish_it_projects (user_id, updated_at DESC);

ALTER TABLE public.publish_it_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own publish_it_projects" ON public.publish_it_projects;
DROP POLICY IF EXISTS "Users insert own publish_it_projects" ON public.publish_it_projects;
DROP POLICY IF EXISTS "Users update own publish_it_projects" ON public.publish_it_projects;
DROP POLICY IF EXISTS "Users delete own publish_it_projects" ON public.publish_it_projects;

CREATE POLICY "Users view own publish_it_projects" ON public.publish_it_projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own publish_it_projects" ON public.publish_it_projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own publish_it_projects" ON public.publish_it_projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own publish_it_projects" ON public.publish_it_projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.publish_it_projects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publish_it_projects TO authenticated;

CREATE OR REPLACE FUNCTION public.publish_it_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS publish_it_projects_touch ON public.publish_it_projects;
CREATE TRIGGER publish_it_projects_touch BEFORE UPDATE ON public.publish_it_projects
  FOR EACH ROW EXECUTE FUNCTION public.publish_it_touch_updated_at();
