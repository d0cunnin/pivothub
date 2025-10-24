-- Fix function search path mutable issue
-- Add explicit search_path to set_month_year function for security

CREATE OR REPLACE FUNCTION public.set_month_year()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.month_year := to_char(NEW.created_at, 'YYYY-MM');
  RETURN NEW;
END;
$function$;