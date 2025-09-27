-- Create trigger to automatically give new users a 3-day trial
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create subscriber record with 3-day trial for new users
  INSERT INTO public.subscribers (
    user_id,
    email,
    trial_start,
    trial_end,
    is_trial_active
  ) VALUES (
    NEW.id,
    NEW.email,
    now(),
    now() + interval '3 days',
    true
  );
  RETURN NEW;
END;
$function$;

-- Create trigger that fires when a new user signs up
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trial();