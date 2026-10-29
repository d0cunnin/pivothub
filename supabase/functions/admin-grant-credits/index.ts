import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';
import { requireAdminMfa } from '../_shared/adminMfaGuard.ts';
import { monthlyAdminCredits, validAdminDuration, MAX_CUSTOM_CREDITS } from '../_shared/adminCreditPolicy.ts';

const bodySchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
  plan: z.enum(['starter', 'pro', 'all-access', 'custom']),
  customCredits: z.number().int().positive().max(MAX_CUSTOM_CREDITS).optional(),
  months: z.number().int().refine(validAdminDuration, 'Choose 1, 3, 6 or 12 months.'),
  note: z.string().trim().max(2000),
});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async req => {
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
    const guard = await requireAdminMfa(admin, user.id);
    if (guard.error) return json({ error: guard.error }, 403);
    const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== 'aal2') return json({ error: 'Complete MFA verification before granting credits.' }, 403);
    let body: unknown;
    try { body = await req.json(); } catch { return json({ error: 'Invalid request body.' }, 400); }
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) return json({ error: parsed.error.issues.map(issue => issue.message).join(' ') }, 400);
    const input = parsed.data;
    let credits: number;
    try { credits = monthlyAdminCredits(input.plan, input.customCredits); } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Invalid credits.' }, 400);
    }
    const { data, error } = await admin.rpc('grant_admin_credits', {
      p_request_id: input.requestId, p_admin_id: user.id, p_user_id: input.userId,
      p_plan: input.plan, p_credits: credits, p_months: input.months, p_note: input.note,
    });
    if (error) return json({ error: error.message }, 400);
    return json(data);
  } catch {
    return json({ error: 'Unable to grant credits. Please try again.' }, 500);
  }
});