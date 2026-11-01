import { withCreditRequest } from '../_shared/guard.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, corsHeaders, deductCreditsOnSuccess } from '../_shared/guard.ts';
import { generateText, systemUser } from '../_shared/aiGenerate.ts';
import { moderateContent } from '../_shared/moderation.ts';

/**
 * PUBLISH IT: personalized publishing summary (2 credits).
 * Platform instructions, fees and requirements are NOT generated here; they
 * come from PivotHub's maintained guide with official links. This summary
 * only explains the author's own situation and priorities.
 */
const COST = 2;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => (x as string).slice(0, 200)).slice(0, 30) : []);

serve(withCreditRequest(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  let g;
  try {
    g = await guard(req, { endpoint: 'publish-it', cost: COST, requireAuth: true, maxReqsPerMinute: 6 });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: 'Please sign in and try again.' }, 401);
  }
  const { supabase, userId } = g;

  try {
    const body = await req.json();
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
    return json({ error: 'We could not create your summary. Please try again. You were not charged.' });
  }
}));
