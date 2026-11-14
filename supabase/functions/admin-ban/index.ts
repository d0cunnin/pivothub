import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';
import { requireAdmin } from '../_shared/adminGuard.ts';

/**
 * ADMIN BANS (admin role required)
 *   list                 active user bans and IP bans
 *   user-ips   {userId}  IPs this user signed up from or used recently
 *   ban-user   {userId, reason, ips[]}  block sign-in and every tool; optionally ban IPs
 *   unban-user {userId, liftIps}
 *   ban-ip     {ip, reason}
 *   unban-ip   {ip}
 */
const BAN_DURATION = '876000h'; // about 100 years; lifted with "none"
const ip = z.string().trim().regex(/^[0-9a-fA-F:.]{3,45}$/, 'Enter a valid IP address.');
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('user-ips'), userId: z.string().uuid() }),
  z.object({ action: z.literal('ban-user'), userId: z.string().uuid(), reason: z.string().trim().max(1000), ips: z.array(ip).max(20).default([]) }),
  z.object({ action: z.literal('unban-user'), userId: z.string().uuid(), liftIps: z.boolean().default(true) }),
  z.object({ action: z.literal('ban-ip'), ip, reason: z.string().trim().max(1000) }),
  z.object({ action: z.literal('unban-ip'), ip }),
]);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Please sign in.' }, 401);
    const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return json({ error: 'Invalid authentication.' }, 401);
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const gate = await requireAdmin(admin, user.id);
    if (gate.error) return json({ error: gate.error }, 403);

    let raw: unknown;
    try { raw = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, 400);
    const input = parsed.data;

    const isAdmin = async (id: string) => {
      const { data } = await admin.from('user_roles').select('role').eq('user_id', id).eq('role', 'admin').maybeSingle();
      return !!data;
    };

    if (input.action === 'list') {
      const [{ data: users }, { data: ips }] = await Promise.all([
        admin.from('user_bans').select('*').is('lifted_at', null).order('banned_at', { ascending: false }).limit(500),
        admin.from('ip_bans').select('*').order('banned_at', { ascending: false }).limit(1000),
      ]);
      return json({ users: users ?? [], ips: ips ?? [] });
    }

    if (input.action === 'user-ips') {
      const [{ data: signup }, { data: requests }, { data: banned }] = await Promise.all([
        admin.from('signup_audit').select('ip_address, created_at').eq('user_id', input.userId).limit(5),
        admin.from('api_request_log').select('ip_address, created_at').eq('user_id', input.userId).order('created_at', { ascending: false }).limit(500),
        admin.from('user_bans').select('id, reason, banned_at').eq('user_id', input.userId).is('lifted_at', null).maybeSingle(),
      ]);
      const seen = new Map<string, { ip: string; source: string; lastSeen: string; count: number }>();
      for (const r of signup ?? []) if (r.ip_address && r.ip_address !== 'unknown') seen.set(r.ip_address, { ip: r.ip_address, source: 'signup', lastSeen: r.created_at, count: 1 });
      for (const r of requests ?? []) {
        if (!r.ip_address || r.ip_address === 'unknown') continue;
        const cur = seen.get(r.ip_address);
        if (cur) { cur.count++; if (cur.source === 'signup') cur.source = 'signup + tools'; }
        else seen.set(r.ip_address, { ip: r.ip_address, source: 'tools', lastSeen: r.created_at, count: 1 });
      }
      const { data: ipBans } = await admin.from('ip_bans').select('ip').in('ip', [...seen.keys()].length ? [...seen.keys()] : ['-']);
      const bannedIps = new Set((ipBans ?? []).map((b: any) => b.ip));
      return json({ ips: [...seen.values()].slice(0, 20).map((x) => ({ ...x, banned: bannedIps.has(x.ip) })), ban: banned ?? null });
    }

    if (input.action === 'ban-user') {
      if (input.userId === user.id) return json({ error: 'You cannot ban yourself.' }, 400);
      if (await isAdmin(input.userId)) return json({ error: 'Administrator accounts cannot be banned here.' }, 400);
      const { data: target, error: findError } = await admin.auth.admin.getUserById(input.userId);
      if (findError || !target?.user) return json({ error: 'User not found.' }, 404);
      const { error: banError } = await admin.auth.admin.updateUserById(input.userId, { ban_duration: BAN_DURATION });
      if (banError) return json({ error: `Could not ban: ${banError.message}` }, 500);
      await admin.from('subscribers_public').update({ account_status: 'suspended' }).eq('user_id', input.userId);
      await admin.from('user_bans').update({ lifted_at: new Date().toISOString(), lifted_by: user.id }).eq('user_id', input.userId).is('lifted_at', null);
      await admin.from('user_bans').insert({ user_id: input.userId, email: target.user.email, reason: input.reason, banned_by: user.id, ips: input.ips });
      if (input.ips.length) {
        await admin.from('ip_bans').upsert(input.ips.map((x) => ({ ip: x, reason: input.reason || `Used by banned account ${target.user.email ?? input.userId}`, user_id: input.userId, banned_by: user.id })), { onConflict: 'ip' });
      }
      return json({ success: true });
    }

    if (input.action === 'unban-user') {
      const { error } = await admin.auth.admin.updateUserById(input.userId, { ban_duration: 'none' });
      if (error) return json({ error: `Could not unban: ${error.message}` }, 500);
      await admin.from('subscribers_public').update({ account_status: 'active' }).eq('user_id', input.userId);
      const { data: active } = await admin.from('user_bans').select('ips').eq('user_id', input.userId).is('lifted_at', null);
      await admin.from('user_bans').update({ lifted_at: new Date().toISOString(), lifted_by: user.id }).eq('user_id', input.userId).is('lifted_at', null);
      if (input.liftIps) {
        await admin.from('ip_bans').delete().eq('user_id', input.userId);
        const listed = (active ?? []).flatMap((b: any) => b.ips ?? []);
        if (listed.length) await admin.from('ip_bans').delete().in('ip', listed);
      }
      return json({ success: true });
    }

    if (input.action === 'ban-ip') {
      const { error } = await admin.from('ip_bans').upsert({ ip: input.ip, reason: input.reason, banned_by: user.id }, { onConflict: 'ip' });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    if (input.action === 'unban-ip') {
      const { error } = await admin.from('ip_bans').delete().eq('ip', input.ip);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (e) {
    console.error('[admin-ban]', e);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
