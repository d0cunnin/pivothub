import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

/** Admin-only check (admin role required; no authenticator app). */
export async function requireAdmin(serviceClient: SupabaseClient, userId: string): Promise<{ error?: string }> {
  const { data, error } = await serviceClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  if (error || !data) return { error: 'Admin access required' };
  return {};
}
