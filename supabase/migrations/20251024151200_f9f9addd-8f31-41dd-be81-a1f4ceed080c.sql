-- ==========================================
-- PERFORMANCE OPTIMIZATION: Fix all RLS policies
-- ==========================================
-- This migration fixes 75 performance issues:
-- 1. Optimizes auth.uid() calls (53 issues)
-- 2. Consolidates multiple permissive policies (22 issues)

-- ==========================================
-- PART 1: Optimize auth.uid() in ALL RLS policies
-- Replace auth.uid() with (select auth.uid()) for performance
-- ==========================================

-- profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile or admins can view all"
ON public.profiles FOR SELECT
USING (
  (select auth.uid()) = id OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = (select auth.uid()) AND role = 'admin'::app_role)
);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING ((select auth.uid()) = id);

-- course_enrollments table
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves in courses" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON public.course_enrollments;

CREATE POLICY "Users can view their own enrollments"
ON public.course_enrollments FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can enroll themselves in courses"
ON public.course_enrollments FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own enrollments"
ON public.course_enrollments FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own enrollments"
ON public.course_enrollments FOR DELETE
USING ((select auth.uid()) = user_id);

-- lesson_progress table
DROP POLICY IF EXISTS "Users can view their own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Users can delete their own progress" ON public.lesson_progress;

CREATE POLICY "Users can view their own progress"
ON public.lesson_progress FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.lesson_progress FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own progress"
ON public.lesson_progress FOR DELETE
USING ((select auth.uid()) = user_id);

-- activity_submissions table
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.activity_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.activity_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.activity_submissions;
DROP POLICY IF EXISTS "Users can delete their own submissions" ON public.activity_submissions;

CREATE POLICY "Users can view their own submissions"
ON public.activity_submissions FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own submissions"
ON public.activity_submissions FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own submissions"
ON public.activity_submissions FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own submissions"
ON public.activity_submissions FOR DELETE
USING ((select auth.uid()) = user_id);

-- quiz_results table
DROP POLICY IF EXISTS "Users can view their own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can insert their own quiz results" ON public.quiz_results;
DROP POLICY IF EXISTS "Users can delete their own quiz results" ON public.quiz_results;

CREATE POLICY "Users can view their own quiz results"
ON public.quiz_results FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own quiz results"
ON public.quiz_results FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own quiz results"
ON public.quiz_results FOR DELETE
USING ((select auth.uid()) = user_id);

-- assessment_results table
DROP POLICY IF EXISTS "Users can view their own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can insert their own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can update their own assessment results" ON public.assessment_results;
DROP POLICY IF EXISTS "Users can delete their own assessment results" ON public.assessment_results;

CREATE POLICY "Users can view their own assessment results"
ON public.assessment_results FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own assessment results"
ON public.assessment_results FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own assessment results"
ON public.assessment_results FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own assessment results"
ON public.assessment_results FOR DELETE
USING ((select auth.uid()) = user_id);

-- user_progress table
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can delete their own user progress" ON public.user_progress;

CREATE POLICY "Users can view their own progress"
ON public.user_progress FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.user_progress FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own user progress"
ON public.user_progress FOR DELETE
USING ((select auth.uid()) = user_id);

-- user_preferences table
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON public.user_preferences;

CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own preferences"
ON public.user_preferences FOR DELETE
USING ((select auth.uid()) = user_id);

-- user_roles table
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles or admins can view all"
ON public.user_roles FOR SELECT
USING (
  (select auth.uid()) = user_id OR
  has_role((select auth.uid()), 'admin'::app_role)
);

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role((select auth.uid()), 'admin'::app_role));

-- subscription_audit_log table
DROP POLICY IF EXISTS "Admins can view audit log" ON public.subscription_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.subscription_audit_log;

CREATE POLICY "Admins can view audit log"
ON public.subscription_audit_log FOR SELECT
USING (has_role((select auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert audit log"
ON public.subscription_audit_log FOR INSERT
WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));

-- side_income_assessments table
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.side_income_assessments;
DROP POLICY IF EXISTS "Users can insert their own assessments" ON public.side_income_assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON public.side_income_assessments;
DROP POLICY IF EXISTS "Users can delete their own side income assessments" ON public.side_income_assessments;

CREATE POLICY "Users can view their own assessments"
ON public.side_income_assessments FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own assessments"
ON public.side_income_assessments FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own assessments"
ON public.side_income_assessments FOR UPDATE
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own side income assessments"
ON public.side_income_assessments FOR DELETE
USING ((select auth.uid()) = user_id);

-- side_income_reports table
DROP POLICY IF EXISTS "Users can view their own reports" ON public.side_income_reports;

CREATE POLICY "Users can view their own reports"
ON public.side_income_reports FOR SELECT
USING ((select auth.uid()) = user_id);

-- conversation_context table (consolidate multiple permissive policies)
DROP POLICY IF EXISTS "Context readable by owner" ON public.conversation_context;
DROP POLICY IF EXISTS "Context manageable by owner" ON public.conversation_context;
DROP POLICY IF EXISTS "Users can delete their own context" ON public.conversation_context;

CREATE POLICY "Users can manage their own context"
ON public.conversation_context FOR ALL
USING ((select auth.uid()) = user_id);

-- subscribers_public table (consolidate multiple permissive policies)
DROP POLICY IF EXISTS "Users can view only their own subscription data" ON public.subscribers_public;
DROP POLICY IF EXISTS "Admins can view all subscription data" ON public.subscribers_public;
DROP POLICY IF EXISTS "Deny all anonymous access to subscriptions" ON public.subscribers_public;
DROP POLICY IF EXISTS "Users can insert their own subscription data" ON public.subscribers_public;
DROP POLICY IF EXISTS "Users can update their own subscription data" ON public.subscribers_public;

CREATE POLICY "Users can view their own or admins can view all subscriptions"
ON public.subscribers_public FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL AND (
    (select auth.uid()) = user_id OR
    has_role((select auth.uid()), 'admin'::app_role)
  )
);

CREATE POLICY "Authenticated users can insert their own subscription"
ON public.subscribers_public FOR INSERT
WITH CHECK (
  (select auth.uid()) IS NOT NULL AND
  (select auth.uid()) = user_id
);

CREATE POLICY "Authenticated users can update their own subscription"
ON public.subscribers_public FOR UPDATE
USING ((select auth.uid()) = user_id);

-- result_feedback table
DROP POLICY IF EXISTS "Feedback readable by owner" ON public.result_feedback;
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.result_feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.result_feedback;

CREATE POLICY "Users can view their own feedback"
ON public.result_feedback FOR SELECT
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own feedback"
ON public.result_feedback FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own feedback"
ON public.result_feedback FOR DELETE
USING ((select auth.uid()) = user_id);

-- tool_usage_analytics table
DROP POLICY IF EXISTS "Users can view their own usage" ON public.tool_usage_analytics;

CREATE POLICY "Users can view their own usage"
ON public.tool_usage_analytics FOR SELECT
USING ((select auth.uid()) = user_id);

-- admin_audit_log table
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_log;

CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = (select auth.uid())
    AND role = 'admin'::app_role
  )
);