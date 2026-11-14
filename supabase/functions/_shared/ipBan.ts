// IP ban checks shared by edge functions.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

/** Client IP as seen by the edge runtime (first x-forwarded-for entry). */
export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

// Short per-instance cache so a burst of spam doesn't hit the database every time.
const cache = new Map<string, { banned: boolean; at: number }>();
const CACHE_MS = 60_000;

export async function isIpBanned(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown') return false;
  const hit = cache.get(ip);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.banned;
  try {
    const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data } = await svc.from('ip_bans').select('expires_at').eq('ip', ip).maybeSingle();
    const banned = !!data && (!data.expires_at || new Date(data.expires_at).getTime() > Date.now());
    cache.set(ip, { banned, at: Date.now() });
    if (cache.size > 5000) cache.clear();
    return banned;
  } catch {
    return false; // never block real users because the check itself failed
  }
}

export const BANNED_MESSAGE = 'Access from your network has been blocked. If you think this is a mistake, contact support@pivothub.io.';
