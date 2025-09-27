-- Cleanup: remove unsafe trigger and function with CASCADE
DROP FUNCTION IF EXISTS public.handle_new_user_trial() CASCADE;