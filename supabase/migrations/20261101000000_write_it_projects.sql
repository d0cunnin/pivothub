-- WRITE IT: saved book development projects (planning only, never manuscripts).
-- Each user can only see and change their own projects.

CREATE TABLE IF NOT EXISTS public.write_it_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL CHECK (length(project_name) BETWEEN 1 AND 200),
  status TEXT NOT NULL DEFAULT 'Planning' CHECK (status IN ('Not Started', 'Planning', 'In Progress', 'Completed')),
  -- Form answers, AI plan, chapters, roadmap and Publish It package as JSON.
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  chapters JSONB NOT NULL DEFAULT '[]'::jsonb,
  roadmap JSONB NOT NULL DEFAULT '{}'::jsonb,
  publish_package JSONB,
  sent_to_publish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS write_it_projects_user_idx ON public.write_it_projects (user_id, updated_at DESC);

ALTER TABLE public.write_it_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own write_it_projects" ON public.write_it_projects;
DROP POLICY IF EXISTS "Users insert own write_it_projects" ON public.write_it_projects;
DROP POLICY IF EXISTS "Users update own write_it_projects" ON public.write_it_projects;
DROP POLICY IF EXISTS "Users delete own write_it_projects" ON public.write_it_projects;

CREATE POLICY "Users view own write_it_projects" ON public.write_it_projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own write_it_projects" ON public.write_it_projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own write_it_projects" ON public.write_it_projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own write_it_projects" ON public.write_it_projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

REVOKE ALL ON public.write_it_projects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.write_it_projects TO authenticated;

CREATE OR REPLACE FUNCTION public.write_it_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS write_it_projects_touch ON public.write_it_projects;
CREATE TRIGGER write_it_projects_touch BEFORE UPDATE ON public.write_it_projects
  FOR EACH ROW EXECUTE FUNCTION public.write_it_touch_updated_at();
