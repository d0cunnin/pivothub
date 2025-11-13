-- Create signup audit table to track all signups with IP and fraud detection
CREATE TABLE IF NOT EXISTS public.signup_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  flagged_as_suspicious BOOLEAN NOT NULL DEFAULT false,
  fraud_reason TEXT,
  accounts_from_ip INTEGER DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.signup_audit ENABLE ROW LEVEL SECURITY;

-- Admins can view all signup audits
CREATE POLICY "Admins can view signup audits"
ON public.signup_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert signup audits
CREATE POLICY "Service role can insert signup audits"
ON public.signup_audit
FOR INSERT
WITH CHECK (true);

-- Create index on IP for fast fraud detection queries
CREATE INDEX idx_signup_audit_ip ON public.signup_audit(ip_address);
CREATE INDEX idx_signup_audit_created_at ON public.signup_audit(created_at DESC);
CREATE INDEX idx_signup_audit_flagged ON public.signup_audit(flagged_as_suspicious) WHERE flagged_as_suspicious = true;

-- Create view for suspicious signup monitoring
CREATE OR REPLACE VIEW public.v_suspicious_signups AS
SELECT 
  ip_address,
  COUNT(DISTINCT user_id) as account_count,
  COUNT(*) as signup_count,
  ARRAY_AGG(DISTINCT email) as emails,
  MAX(created_at) as last_signup,
  MIN(created_at) as first_signup,
  BOOL_OR(flagged_as_suspicious) as has_flags
FROM public.signup_audit
GROUP BY ip_address
HAVING COUNT(DISTINCT user_id) > 1
ORDER BY COUNT(DISTINCT user_id) DESC;