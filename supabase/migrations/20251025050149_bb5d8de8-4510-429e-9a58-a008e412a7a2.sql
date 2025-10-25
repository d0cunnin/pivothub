-- Fix floor_to_window function: Add explicit search_path for security
CREATE OR REPLACE FUNCTION public.floor_to_window(ts timestamp with time zone, seconds integer)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $function$
  SELECT date_trunc('second', ts) - make_interval(secs => (extract('epoch' from ts)::int % seconds))
$function$;

COMMENT ON FUNCTION public.floor_to_window(timestamp with time zone, integer) IS 
'Floors a timestamp to nearest time window for rate limiting. IMMUTABLE with explicit search_path for security.';