import { withCreditRequest } from '../_shared/guard.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { guard, corsHeaders, assertCredits, deductCreditsOnSuccess } from '../_shared/guard.ts';
import { generateText, systemUser } from '../_shared/aiGenerate.ts';
import { moderateContent } from '../_shared/moderation.ts';

/**
 * PUBLISH IT
 *   action "create": create a publishing plan project (PLAN_COST credits).
 *     Projects can only be created here (users have no INSERT permission),
 *     so a plan cannot be created without being charged.
 *   default: personalized publishing summary (COST credits).
 * Reopening, updating progress and downloading PDFs are free.
 * Platform instructions, fees and requirements are NOT generated here; they
 * come from PivotHub's maintained guide with official links. This summary
 * only explains the author's own situation and priorities.
 */
const COST = 2;
const PLAN_COST = 2;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => (x as string).slice(0, 200)).slice(0, 30) : []);

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Create a publishing plan project, charging PLAN_COST only once it is saved. */
async function createPlan(body: any, supabase: any, userId: string): Promise<Response> {
  const a = body?.assessment;
  if (!isObj(a) || !isObj(a.book) || !str(a.book.title) || !str(a.book.author)) {
    return json({ error: 'Please complete the assessment first.' }, 400);
  }
  if (JSON.stringify(a).length > 60_000) return json({ error: 'Your answers are too long. Please shorten them.' }, 400);
  const title = str(a.book.title, 200);
  const svc = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // A double-click or retry within a minute returns the plan already created (no second charge).
  const since = new Date(Date.now() - 60_000).toISOString();
  const { data: recent } = await svc.from('publish_it_projects').select('*').eq('user_id', userId)
    .eq('project_name', title).gte('created_at', since).order('created_at', { ascending: false }).limit(1);
  if (recent?.[0] && JSON.stringify(recent[0].assessment) === JSON.stringify(a)) {
    return json({ project: recent[0], creditsUsed: 0, duplicate: true });
  }

  await assertCredits(userId, PLAN_COST);
  const writeItId = UUID_RE.test(str(body?.writeItProjectId, 40)) ? str(body.writeItProjectId, 40) : null;
  const { data: project, error } = await svc.from('publish_it_projects').insert({
    user_id: userId, project_name: title, assessment: a, write_it_project_id: writeItId,
  }).select('*').single();
  if (error || !project) {
    console.error('[publish-it] create failed', error);
    return json({ error: 'We could not create your plan. Please try again. You were not charged.' });
  }
  try {
    await deductCreditsOnSuccess(supabase, userId, 'publish-it:plan', PLAN_COST);
  } catch (e) {
    // Never keep a plan that was not paid for.
    await svc.from('publish_it_projects').delete().eq('id', project.id);
    throw e;
  }
  return json({ project, creditsUsed: PLAN_COST });
}

serve(withCreditRequest(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  let g;
  try {
    g = await guard(req, { endpoint: 'publish-it', cost: 0, requireAuth: true, maxReqsPerMinute: 6 });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: 'Please sign in and try again.' }, 401);
  }
  const { supabase, userId } = g;

  try {
    const body = await req.json();
    if (body?.action === 'create') return await createPlan(body, supabase, userId!);
    await assertCredits(userId!, COST);
    const a = body?.assessment ?? {};
    const book = a.book ?? {};
    const readiness = Array.isArray(body?.readiness) ? body.readiness.slice(0, 20).map((r: any) => `${str(r?.label, 100)}: ${str(r?.status, 30)}`) : [];
    if (!str(book.title)) return json({ error: 'Please complete the assessment first.' }, 400);

    const moderation = await moderateContent(`${str(book.title)} ${str(book.description, 4000)}`, 'publish-it', userId!);
    if (moderation.flagged) return json({ error: 'This request includes content we cannot help with.' }, 400);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('AI service not configured');

    const system = `You are PivotHub's publishing guide for independent authors. You write a short, personal summary of where this author stands and what to do first.

=== THE AUTHOR'S ANSWERS (the only facts) ===
Title: ${str(book.title, 200)}${str(book.subtitle) ? ` - ${str(book.subtitle, 300)}` : ''}
Author: ${str(book.author, 200)}
Category: ${str(book.category, 100) || 'not provided'}; audience: ${str(book.audience, 500) || 'not provided'}
Description: ${str(book.description, 2000) || 'not provided'}
Formats: ${list(a.formats).join(', ') || 'none'}
Print platform: ${str(a.printPlatform, 20) || 'not applicable'}
Goals: ${list(a.goals).join(', ') || 'none'}
ISBN status: ${str(a.isbnStatus, 200)}; copyright status: ${str(a.copyrightStatus, 200)}
Budget: ${a.budgetUndetermined ? 'not yet determined' : str(a.budget, 100) || 'not provided'}
Readiness:
${readiness.join('\n')}

=== STRICT RULES ===
- Do NOT state any fees, prices, royalty rates, printing costs, file specifications, trim sizes, margins, audio levels or platform policies. Those change; say "see the official link in your plan" instead.
- Do not promise publication approval, bookstore placement, library placement, sales or earnings.
- Do not recommend KDP Select or KDP Expanded Distribution by default; if relevant, say to review the terms in the plan.
- Only an item the author answered "Yes" to is complete. Do not assume the manuscript is finished.
- Plain, encouraging language. Markdown with short sections.

=== WRITE ===
## Our Understanding of Your Book
3-5 sentences about the book, the author's goals and chosen formats and platforms.
## Where You Stand
What is done and what still needs attention, in plain words.
## Your Top Priorities
The 3-5 most important next steps in order, each with one sentence on why, based on their answers.
## Decisions to Make
Only the choices that apply to them (for example owning an ISBN vs a free one, one platform or both, whether to register copyright, how to approach the audiobook), with the main consideration for each.`;

    const summary = await generateText(apiKey, systemUser(system, 'Write my publishing summary.'), { maxTokens: 2500 });
    if (!summary || summary.trim().length < 200) return json({ error: 'We could not create your summary. Please try again. You were not charged.' });
    await deductCreditsOnSuccess(supabase, userId!, 'publish-it', COST);
    return json({ summary: summary.trim(), creditsUsed: COST });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('[publish-it] error:', error?.message ?? error);
    return json({ error: 'We could not complete this request. Please try again. You were not charged.' });
  }
}));
