-- PUBLISH IT: publishing plans now cost credits, so new plans can only be
-- created by the publish-it edge function (which charges for them).
-- Users can still read, update and delete their own plans.
DROP POLICY IF EXISTS "Users insert own publish_it_projects" ON public.publish_it_projects;
REVOKE INSERT ON public.publish_it_projects FROM authenticated;
