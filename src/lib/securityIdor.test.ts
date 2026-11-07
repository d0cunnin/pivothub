import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = (p: string) => readFileSync(path.join(root, p), 'utf8');

describe('IDOR fixes', () => {
  const sql = read('supabase/migrations/20261107000000_close_idor_gaps.sql');

  it('rate-limit counters can only be changed by the server or for yourself', () => {
    expect(sql).toMatch(/auth\.uid\(\) <> p_user_id/);
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.throttle_user(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;');
    expect(sql).toContain('REVOKE ALL ON FUNCTION public.check_admin_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;');
    // Every caller uses the service role after verifying the user.
    for (const f of ['quiz-generator', 'speak-it', 'study-it', 'act-it', 'lesson-plan']) {
      const src = read(`supabase/functions/${f}/index.ts`);
      expect(src).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(src).toMatch(/p_user_id: userId/);
      expect(src).toMatch(/const userId = user\.id;/);
    }
  });

  it('old course storage is no longer public', () => {
    expect(sql).toMatch(/UPDATE storage\.buckets SET public = false WHERE id IN \('course-materials', 'course-media'\)/);
    expect(sql).toContain('DROP POLICY IF EXISTS "Course materials are publicly accessible" ON storage.objects;');
  });

  it('signup tracking only records a genuine, brand-new account once, with its real email', () => {
    const src = read('supabase/functions/track-signup/index.ts');
    expect(src).toContain('auth.admin.getUserById(claimedId)');
    expect(src).toMatch(/ageMs > 15 \* 60 \* 1000/);
    expect(src).toContain('const email = user.email;');
    expect(src).toContain("eq('user_id', userId).limit(1)");
    expect(src).not.toMatch(/const \{ userId, email \} = await req\.json\(\)/);
  });
});
