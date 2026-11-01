-- DESIGN IT: design concept projects, AI-generated versions, generated images,
-- and a log of every paid AI operation.
--
-- Ownership rules:
--   * design_it_projects: owners can create, read, update and delete their own.
--   * design_it_versions / design_it_operations: owners can only READ their own.
--     Rows are written by the design-it edge function (service role) after it
--     has verified ownership, so AI results and charges cannot be forged.
--   * Storage bucket "design-it" (private): files live under <user_id>/...;
--     owners can read and delete their own files. Only the edge function uploads.

-- ---------------------------------------------------------------- projects
CREATE TABLE IF NOT EXISTS public.design_it_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL CHECK (length(project_name) BETWEEN 1 AND 200),
  category TEXT NOT NULL CHECK (length(category) BETWEEN 1 AND 60),
  status TEXT NOT NULL DEFAULT 'Brief' CHECK (status IN ('Brief', 'Concept', 'Exploring', 'Visualizing', 'Refining', 'Final')),
  brief JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_direction JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS design_it_projects_user_idx ON public.design_it_projects (user_id, updated_at DESC);

ALTER TABLE public.design_it_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own design_it_projects" ON public.design_it_projects;
DROP POLICY IF EXISTS "Users insert own design_it_projects" ON public.design_it_projects;
DROP POLICY IF EXISTS "Users update own design_it_projects" ON public.design_it_projects;
DROP POLICY IF EXISTS "Users delete own design_it_projects" ON public.design_it_projects;
CREATE POLICY "Users view own design_it_projects" ON public.design_it_projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own design_it_projects" ON public.design_it_projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own design_it_projects" ON public.design_it_projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own design_it_projects" ON public.design_it_projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.design_it_projects FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_it_projects TO authenticated;

CREATE OR REPLACE FUNCTION public.design_it_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS design_it_projects_touch ON public.design_it_projects;
CREATE TRIGGER design_it_projects_touch BEFORE UPDATE ON public.design_it_projects
  FOR EACH ROW EXECUTE FUNCTION public.design_it_touch_updated_at();

-- ---------------------------------------------------------------- versions
-- Every AI result is a new, immutable version. Viewing old versions never
-- calls the AI.
CREATE TABLE IF NOT EXISTS public.design_it_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.design_it_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 0,
  kind TEXT NOT NULL CHECK (kind IN ('concept', 'directions', 'refinement', 'image', 'comparison', 'summary')),
  label TEXT NOT NULL DEFAULT '',
  parent_version_id UUID REFERENCES public.design_it_versions(id) ON DELETE SET NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_path TEXT,
  image_bytes BIGINT NOT NULL DEFAULT 0 CHECK (image_bytes >= 0),
  credits_charged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);
CREATE INDEX IF NOT EXISTS design_it_versions_project_idx ON public.design_it_versions (project_id, version_number);
CREATE INDEX IF NOT EXISTS design_it_versions_user_idx ON public.design_it_versions (user_id) WHERE image_path IS NOT NULL;

-- Number versions 1, 2, 3 ... per project, safely under concurrent inserts.
CREATE OR REPLACE FUNCTION public.design_it_number_version()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('design_it_versions:' || NEW.project_id::text));
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO NEW.version_number
    FROM public.design_it_versions WHERE project_id = NEW.project_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS design_it_versions_number ON public.design_it_versions;
CREATE TRIGGER design_it_versions_number BEFORE INSERT ON public.design_it_versions
  FOR EACH ROW EXECUTE FUNCTION public.design_it_number_version();

ALTER TABLE public.design_it_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own design_it_versions" ON public.design_it_versions;
CREATE POLICY "Users view own design_it_versions" ON public.design_it_versions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.design_it_versions FROM anon, authenticated;
GRANT SELECT ON public.design_it_versions TO authenticated;

-- ---------------------------------------------------------------- operations
-- One row per paid request. The unique request_id stops a repeated submit
-- from running (and charging) twice.
CREATE TABLE IF NOT EXISTS public.design_it_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.design_it_projects(id) ON DELETE SET NULL,
  request_id UUID NOT NULL,
  action TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  error TEXT,
  version_id UUID REFERENCES public.design_it_versions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  UNIQUE (user_id, request_id)
);
CREATE INDEX IF NOT EXISTS design_it_operations_project_idx ON public.design_it_operations (project_id, status, created_at DESC);

ALTER TABLE public.design_it_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own design_it_operations" ON public.design_it_operations;
CREATE POLICY "Users view own design_it_operations" ON public.design_it_operations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.design_it_operations FROM anon, authenticated;
GRANT SELECT ON public.design_it_operations TO authenticated;

-- ---------------------------------------------------------------- storage
-- Bucket "design-it" (private, 10MB) is created with the storage tool, not SQL.

DROP POLICY IF EXISTS "Users read own design-it files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own design-it files" ON storage.objects;
CREATE POLICY "Users read own design-it files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'design-it' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own design-it files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'design-it' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- admin monitoring
-- Aggregate storage and credit totals for administrators. No user content.
CREATE OR REPLACE FUNCTION public.get_design_it_storage_summary()
RETURNS TABLE (
  projects BIGINT,
  users_with_projects BIGINT,
  stored_images BIGINT,
  stored_bytes BIGINT,
  users_with_images BIGINT,
  operations_30d BIGINT,
  failed_operations_30d BIGINT,
  credits_charged_30d BIGINT,
  images_generated_30d BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM public.design_it_projects),
    (SELECT COUNT(DISTINCT user_id) FROM public.design_it_projects),
    (SELECT COUNT(*) FROM public.design_it_versions WHERE image_path IS NOT NULL),
    (SELECT COALESCE(SUM(image_bytes), 0)::BIGINT FROM public.design_it_versions WHERE image_path IS NOT NULL),
    (SELECT COUNT(DISTINCT user_id) FROM public.design_it_versions WHERE image_path IS NOT NULL),
    (SELECT COUNT(*) FROM public.design_it_operations WHERE created_at > now() - interval '30 days'),
    (SELECT COUNT(*) FROM public.design_it_operations WHERE status = 'failed' AND created_at > now() - interval '30 days'),
    (SELECT COALESCE(SUM(cost), 0)::BIGINT FROM public.design_it_operations WHERE status = 'succeeded' AND created_at > now() - interval '30 days'),
    (SELECT COUNT(*) FROM public.design_it_versions WHERE image_path IS NOT NULL AND created_at > now() - interval '30 days');
END $$;
REVOKE ALL ON FUNCTION public.get_design_it_storage_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_design_it_storage_summary() TO authenticated;
