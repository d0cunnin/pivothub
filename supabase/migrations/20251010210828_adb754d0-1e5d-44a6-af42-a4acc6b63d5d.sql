-- Comprehensive Security Fix Migration
-- Addresses 2 Critical Errors + 5 Warning-level issues

-- ========================================
-- PHASE 1: CRITICAL ERRORS
-- ========================================

-- 1. Drop the old subscribers table (contains sensitive Stripe IDs, no longer needed)
DROP TABLE IF EXISTS public.subscribers CASCADE;

-- 2. Add SELECT policies to subscribers_public table
-- First drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.subscribers_public;

-- Users can only view their own subscription data
CREATE POLICY "Users can view their own subscription data"
ON public.subscribers_public
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all subscriptions (for Admin dashboard)
CREATE POLICY "Admins can view all subscription data"
ON public.subscribers_public
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- ========================================
-- PHASE 2: WARNING-LEVEL ISSUES
-- ========================================

-- 3. Fix conversation_context table RLS (remove anonymous access)
DROP POLICY IF EXISTS "Context readable by owner" ON public.conversation_context;
DROP POLICY IF EXISTS "Context manageable by owner" ON public.conversation_context;

CREATE POLICY "Context readable by owner"
ON public.conversation_context
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Context manageable by owner"
ON public.conversation_context
FOR ALL
USING (auth.uid() = user_id);

-- 4. Fix tool_usage_analytics table RLS (require authentication to read)
DROP POLICY IF EXISTS "Analytics readable by owner" ON public.tool_usage_analytics;

CREATE POLICY "Analytics readable by owner"
ON public.tool_usage_analytics
FOR SELECT
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR user_id IS NULL));

-- 5. Fix result_feedback table RLS (require authentication to read)
DROP POLICY IF EXISTS "Feedback readable by owner" ON public.result_feedback;

CREATE POLICY "Feedback readable by owner"
ON public.result_feedback
FOR SELECT
USING (auth.uid() IS NOT NULL AND (auth.uid() = user_id OR user_id IS NULL));

-- 6. Fix function search_path issues for all SECURITY DEFINER functions

-- Update has_role function (already has it, but ensuring it's correct)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', new.email));
  RETURN new;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update cleanup_expired_contexts function
CREATE OR REPLACE FUNCTION public.cleanup_expired_contexts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.conversation_context 
  WHERE expires_at < now();
END;
$$;

-- Update auto_grant_first_user_admin function
CREATE OR REPLACE FUNCTION public.auto_grant_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user (no roles exist yet)
  IF NOT EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    -- Grant admin role to the first user
    INSERT INTO public.user_roles (user_id, role, granted_by)
    VALUES (NEW.id, 'admin', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;