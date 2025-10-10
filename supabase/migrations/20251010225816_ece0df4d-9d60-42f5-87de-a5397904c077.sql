-- Grant admin role to support@pivothub.io
INSERT INTO public.user_roles (user_id, role, granted_by)
SELECT 
  id,
  'admin'::app_role,
  id
FROM auth.users
WHERE email = 'support@pivothub.io'
ON CONFLICT (user_id, role) DO NOTHING;