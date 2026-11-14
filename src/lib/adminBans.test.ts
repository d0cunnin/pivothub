import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { validIp } from './adminBans';

const root = path.resolve(__dirname, '../..');
const read = (p: string) => readFileSync(path.join(root, p), 'utf8');

describe('bans', () => {
  it('accepts IPv4 and IPv6 addresses only', () => {
    expect(validIp('203.0.113.7')).toBe(true);
    expect(validIp('2001:db8::1')).toBe(true);
    expect(validIp('hello')).toBe(false);
    expect(validIp('1; drop table')).toBe(false);
  });

  it('ban lists are admin-readable and only the server can change them', () => {
    const sql = read('supabase/migrations/20261114000000_user_and_ip_bans.sql');
    for (const t of ['user_bans', 'ip_bans', 'contact_form_log']) {
      expect(sql).toContain(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).not.toMatch(/FOR (INSERT|UPDATE|DELETE|ALL)/);
    expect(sql).toMatch(/has_role\(auth\.uid\(\), 'admin'\)/);
  });

  it('banning requires an admin and cannot target admins or yourself', () => {
    const fn = read('supabase/functions/admin-ban/index.ts');
    expect(fn).toContain('requireAdmin(admin, user.id)');
    expect(read('supabase/functions/_shared/adminGuard.ts')).toContain(".eq('role', 'admin')");
    expect(fn).toContain("'You cannot ban yourself.'");
    expect(fn).toContain("'Administrator accounts cannot be banned here.'");
    expect(fn).toContain("ban_duration: BAN_DURATION");
    expect(fn).toContain("account_status: 'suspended'");
  });

  it('every tool refuses banned IPs and banned accounts; contact form is rate limited', () => {
    const guard = read('supabase/functions/_shared/guard.ts');
    expect(guard).toContain('await isIpBanned(ip)');
    expect(guard).toContain('user.banned_until');
    const contact = read('supabase/functions/send-contact-email/index.ts');
    expect(contact).toContain('isIpBanned(ip)');
    expect(contact).toMatch(/MAX_PER_HOUR = 3/);
    const signup = read('supabase/functions/track-signup/index.ts');
    expect(signup).toContain("isIpBanned(ip)");
    expect(signup).toContain("ban_duration: '876000h'");
  });
});
