-- Admin bans: block abusive accounts and IP addresses.
-- Admins can read these lists; only the admin-ban edge function (service
-- role, admin + two-step verified) can change them.

CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT,
  reason TEXT NOT NULL DEFAULT '' CHECK (length(reason) <= 1000),
  banned_by UUID,
  banned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ips TEXT[] NOT NULL DEFAULT '{}',
  lifted_at TIMESTAMPTZ,
  lifted_by UUID
);
CREATE INDEX IF NOT EXISTS user_bans_active_idx ON public.user_bans (user_id) WHERE lifted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.ip_bans (
  ip TEXT PRIMARY KEY CHECK (length(ip) BETWEEN 3 AND 64),
  reason TEXT NOT NULL DEFAULT '' CHECK (length(reason) <= 1000),
  user_id UUID,
  banned_by UUID,
  banned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Contact form submissions per IP (for rate limiting spam). No message content.
CREATE TABLE IF NOT EXISTS public.contact_form_log (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_form_log_ip_idx ON public.contact_form_log (ip, created_at DESC);

ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_form_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read user_bans" ON public.user_bans;
DROP POLICY IF EXISTS "Admins read ip_bans" ON public.ip_bans;
DROP POLICY IF EXISTS "Admins read contact_form_log" ON public.contact_form_log;
CREATE POLICY "Admins read user_bans" ON public.user_bans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read ip_bans" ON public.ip_bans FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins read contact_form_log" ON public.contact_form_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.user_bans, public.ip_bans, public.contact_form_log FROM anon, authenticated;
GRANT SELECT ON public.user_bans, public.ip_bans, public.contact_form_log TO authenticated;
