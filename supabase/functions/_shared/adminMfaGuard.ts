import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export async function requireAdminMfa(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<{ error?: string }> {
  // Check if user is admin
  const { data: roleCheck, error: roleError } = await supabaseClient
    .rpc('has_role', { _user_id: userId, _role: 'admin' });
  
  if (roleError || !roleCheck) {
    return { error: 'Admin access required' };
  }
  
  // Get user's MFA status from auth.users metadata
  const { data: { user }, error } = await supabaseClient.auth.admin.getUserById(userId);
  
  if (error || !user) {
    console.error('Failed to fetch user MFA status:', error);
    return { error: 'Authentication failed' };
  }
  
  // Check if MFA is enrolled (factors exist and are verified)
  const mfaFactors = user.factors || [];
  const hasMfaEnabled = mfaFactors.some((f: any) => f.status === 'verified');
  
  if (!hasMfaEnabled) {
    return { 
      error: 'MFA enrollment required for admin access. Please enable MFA in your account settings.' 
    };
  }
  
  return {};
}
