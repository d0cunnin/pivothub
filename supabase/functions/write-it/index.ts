import { withCreditRequest } from '../_shared/guard.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, corsHeaders, assertCredits, deductCreditsOnSuccess } from '../_shared/guard.ts';
import { generateJson, systemUser } from '../_shared/aiGenerate.ts';
import { moderateContent } from '../_shared/moderation.ts';

/**
 * WRITE IT: book planning assistant. Plans, structures and outlines books;
 * it never writes chapters or manuscript text.
 *
 * Actions and credit costs:
 *   plan      3  concept, title ideas, structure, table of contents
 *   outlines  3  outlines for every chapter
 *   outline   1  outline for one chapter (regenerate)
 *   toc       1  regenerate the table of contents
 *   roadmap   1  writing schedule
 */
const COSTS = { plan: 3, outlines: 3, outline: 1, toc: 1, roadmap: 1 } as const;
type Action = keyof typeof COSTS;
const OUTLINE_BATCH = 4;
const MAX_CHAPTERS = 60;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, max = 20): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => (x as string).trim().slice(0, 200)).slice(0, max) : [];
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

interface BookInputs {
  idea: string; category: string; purposes: string[]; audience: string; message: string; devStatus: string;
  title?: string; subtitle?: string; style?: string; length?: string; completionDate?: string; instructions?: string;
}

function readInputs(raw: any): BookInputs {
  return {
    idea: str(raw?.idea, 4000), category: str(raw?.category, 60), purposes: list(raw?.purposes),
    audience: str(raw?.audience, 1000), message: str(raw?.message, 2000), devStatus: str(raw?.devStatus, 200),
    title: str(raw?.title, 200), subtitle: str(raw?.subtitle, 300), style: str(raw?.style, 60), length: str(raw?.length, 40),
    completionDate: str(raw?.completionDate, 20), instructions: str(raw?.instructions, 2000),
  };
}

const orNot = (v?: string) => (v && v.trim() ? v.trim() : 'not provided');

function profile(b: BookInputs, today: string): string {
  return `=== THE AUTHOR'S ANSWERS (the only facts about this book and author) ===
Today's date: ${today}
What the book is about: ${b.idea}
Category: ${b.category}
Purpose(s): ${b.purposes.join(', ')}
Intended audience: ${b.audience}
Central message / reader takeaway: ${b.message}
Where they are now: ${b.devStatus}
Working title: ${orNot(b.title)}
Working subtitle: ${orNot(b.subtitle)}
Preferred writing style: ${orNot(b.style)}
Desired length: ${orNot(b.length)}
Target completion date: ${orNot(b.completionDate)}
Additional instructions: ${orNot(b.instructions)}`;
}

const RULES = `=== RULES ===
- You are a book planning and development coach. You help the author plan, organize and outline. You NEVER write the book: no chapter prose, sample paragraphs, opening lines, scenes, dialogue, poems, devotional entries or finished text. Use short planning phrases and bullet points only.
- Adapt everything to the book's category (for example a devotional uses daily or weekly entries, a workbook uses exercises and worksheets, a children's book uses short spreads, a memoir follows life chapters or themes, fiction uses story structure and arcs, academic work uses research structure). Do not force every book into the same structure.
- Build on the author's own idea, message and experience. Do not invent facts about the author's life, credentials or story; where the plan needs personal stories or details only the author has, say "[your story about ...]".
- For references and research, suggest kinds of sources and search terms. Only name a specific book, study or organization if it is widely known and you are confident it exists; never invent titles, authors or statistics.
- Plain, encouraging, practical language.`;

async function callJson(apiKey: string, system: string, task: string, maxTokens: number) {
  return generateJson<any>(apiKey, systemUser(system, task), { maxTokens });
}

// ---------------------------------------------------------------------------
// Formatting helpers: structured outline -> editable markdown
// ---------------------------------------------------------------------------
function bullets(title: string, items: unknown): string {
  const xs = arr(items).map((x) => text(x)).filter(Boolean);
  return xs.length ? `**${title}**\n${xs.map((x) => `- ${x}`).join('\n')}\n` : '';
}

function outlineToMarkdown(o: any): string {
  const sections = arr(o?.sections).map((s: any) => {
    const subs = arr(s?.subtopics).map((t) => text(t)).filter(Boolean);
    return `- ${text(s?.heading)}${subs.length ? '\n' + subs.map((t) => `  - ${t}`).join('\n') : ''}`;
  }).join('\n');
  return [
    text(o?.purpose) && `**Chapter purpose:** ${text(o.purpose)}\n`,
    text(o?.mainTheme) && `**Main theme:** ${text(o.mainTheme)}\n`,
    bullets('Chapter objectives', o?.objectives),
    sections && `**Major sections and subtopics**\n${sections}\n`,
    bullets('Key questions to address', o?.keyQuestions),
    bullets('Supporting ideas', o?.supportingIdeas),
    bullets('Suggested examples or case studies', o?.examples),
    bullets('Research areas', o?.researchAreas),
    bullets('References to investigate', o?.references),
    bullets('Activities or reflection questions', o?.activities),
    text(o?.conclusion) && `**Closing and transition:** ${text(o.conclusion)}\n`,
  ].filter(Boolean).join('\n').trim();
}

const OUTLINE_SCHEMA = `{"outlines":[{"index":1,"purpose":"one sentence","mainTheme":"short phrase","objectives":["3-5 items"],"sections":[{"heading":"section name","subtopics":["2-4 short points"]}],"keyQuestions":["3-5"],"supportingIdeas":["3-5"],"examples":["2-4 suggested examples or case studies, using [your story about ...] where only the author can supply it"],"researchAreas":["2-4"],"references":["2-4 kinds of sources or search terms"],"activities":["0-4, only if suitable for this category"],"conclusion":"how the chapter closes and leads into the next"}]}`;

serve(withCreditRequest(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let g;
  try {
    g = await guard(req, { endpoint: 'write-it', cost: 0, requireAuth: true, maxReqsPerMinute: 10 });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: 'Please sign in and try again.' }, 401);
  }
  const { supabase, userId } = g;

  try {
    const body = await req.json();
    const action = str(body?.action, 20) as Action;
    if (!(action in COSTS)) return json({ error: 'Unknown request.' }, 400);
    const inputs = readInputs(body?.inputs);
    if (!inputs.idea || !inputs.category || !inputs.purposes.length || !inputs.audience || !inputs.message || !inputs.devStatus) {
      return json({ error: 'Please complete the required book details first.' }, 400);
    }

    const moderation = await moderateContent(
      `${inputs.idea} ${inputs.audience} ${inputs.message} ${inputs.instructions ?? ''}`.slice(0, 10000), 'write-it', userId!,
    );
    if (moderation.flagged) return json({ error: 'This request includes content we cannot help with. Please revise it and try again.' }, 400);

    const cost = COSTS[action];
    await assertCredits(userId!, cost);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('AI service not configured');
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const system = `${profile(inputs, today)}\n\n${RULES}`;

    // Chapters as currently arranged by the author (for outlines, toc, roadmap).
    const chapters = arr(body?.chapters).slice(0, MAX_CHAPTERS).map((c: any, i: number) => ({
      number: i + 1, part: str(c?.part, 200), title: str(c?.title, 300), summary: str(c?.summary, 600),
      status: str(c?.status, 30),
    })).filter((c) => c.title);
    const concept = str(body?.concept, 6000);
    const tocText = chapters.map((c) => `${c.number}. ${c.part ? `[${c.part}] ` : ''}${c.title}${c.summary ? ` - ${c.summary}` : ''}`).join('\n');

    let result: Record<string, unknown>;

    if (action === 'plan' || action === 'toc') {
      const titleRule = inputs.title
        ? `The author already has the working title "${inputs.title}"${inputs.subtitle ? ` and subtitle "${inputs.subtitle}"` : ''}. List it first exactly as written (why: "Your working title"), then 4-6 alternatives they can consider.`
        : 'Suggest 6-8 title and subtitle options.';
      const task = action === 'plan'
        ? `Create the book development plan. Return ONLY JSON:
{"understanding":"3-6 sentences in your own words connecting the idea, audience, purpose and where the author is now (not a list of their answers)",
"concept":{"refinedConcept":"2-4 sentences","centralTheme":"","purposeStatement":"","intendedAudience":"","readerNeeds":["3-5"],"mainMessage":"","readerOutcomes":["3-5"],"organizingApproach":"2-3 sentences"},
"titles":[{"title":"","subtitle":"","why":"one short reason"}],
"structure":{"type":"for example Introduction, chapters and conclusion / Parts with chapters / Chronological / Thematic / Step-by-step / Devotional entries / Workbook sections / Narrative progression","explanation":"2-4 sentences on why this fits the category, purpose and audience"},
"parts":[{"name":"part or section name, or empty string if the book has no parts","chapters":[{"title":"","summary":"one sentence describing what the chapter covers"}]}],
"gaps":["0-4 things the author could clarify to improve the plan"]}
${titleRule}
Plan a table of contents sized to the desired length (${orNot(inputs.length)}) and category. ${inputs.devStatus.toLowerCase().includes('table of contents') || inputs.devStatus.toLowerCase().includes('outline') || inputs.devStatus.toLowerCase().includes('started writing') ? 'The author already has material; where their description mentions existing chapters or structure, build on it rather than replacing it.' : ''}`
        : `Propose a revised table of contents for this book. The author's current chapters are:\n${tocText || '(none yet)'}\n${str(body?.feedback, 1000) ? `What the author wants changed: ${str(body?.feedback, 1000)}\n` : ''}Keep chapters that still fit. Return ONLY JSON: {"structure":{"type":"","explanation":""},"parts":[{"name":"","chapters":[{"title":"","summary":""}]}]}`;
      const out = await callJson(apiKey, system, task, 6000);
      const parts = arr(out?.parts).map((p: any) => ({
        name: text(p?.name), chapters: arr(p?.chapters).map((c: any) => ({ title: text(c?.title), summary: text(c?.summary) })).filter((c) => c.title),
      })).filter((p) => p.chapters.length);
      if (!parts.length) throw new Error('No table of contents was produced');
      result = action === 'plan'
        ? {
            understanding: text(out?.understanding),
            concept: out?.concept ?? {},
            titles: arr(out?.titles).map((t: any) => ({ title: text(t?.title), subtitle: text(t?.subtitle), why: text(t?.why) })).filter((t) => t.title).slice(0, 10),
            structure: { type: text(out?.structure?.type), explanation: text(out?.structure?.explanation) },
            parts,
            gaps: arr(out?.gaps).map(text).filter(Boolean).slice(0, 6),
          }
        : { structure: { type: text(out?.structure?.type), explanation: text(out?.structure?.explanation) }, parts };
    } else if (action === 'outlines' || action === 'outline') {
      if (!chapters.length) return json({ error: 'Add at least one chapter first.' }, 400);
      const targetNumbers: number[] = action === 'outline'
        ? [Math.min(Math.max(1, Number(body?.chapterNumber) || 1), chapters.length)]
        : chapters.map((c) => c.number);
      const batches: number[][] = [];
      for (let i = 0; i < targetNumbers.length; i += OUTLINE_BATCH) batches.push(targetNumbers.slice(i, i + OUTLINE_BATCH));
      const base = `Book concept: ${concept || '(see the author answers)'}\nFull table of contents:\n${tocText}\n\n`;
      const settled = await Promise.allSettled(batches.map((nums) =>
        callJson(apiKey, system, `${base}Create detailed planning OUTLINES (not chapter text) for chapter(s) ${nums.join(', ')} only. Make each chapter distinct and connected to the chapters around it.${str(body?.feedback, 1000) ? ` The author asked: ${str(body?.feedback, 1000)}` : ''}\nReturn ONLY JSON in this shape, with "index" set to the chapter number:\n${OUTLINE_SCHEMA}`, 6000)));
      const outlines: Record<number, string> = {};
      settled.forEach((s) => {
        if (s.status !== 'fulfilled') return;
        arr(s.value?.outlines).forEach((o: any) => {
          const n = Number(o?.index);
          if (targetNumbers.includes(n)) outlines[n] = outlineToMarkdown(o);
        });
      });
      const missing = targetNumbers.filter((n) => !outlines[n] || outlines[n].length < 80);
      if (missing.length) {
        return json({ error: `We could not finish the outline for chapter${missing.length > 1 ? 's' : ''} ${missing.join(', ')}. Please try again. You were not charged.` });
      }
      result = { outlines };
    } else {
      // roadmap
      if (!chapters.length) return json({ error: 'Add at least one chapter first.' }, 400);
      const hours = str(body?.hoursPerWeek, 10);
      const days = str(body?.daysPerWeek, 10);
      const due = str(body?.completionDate, 20) || inputs.completionDate || '';
      const out = await callJson(apiKey, system, `Create a manageable writing roadmap for these chapters:\n${chapters.map((c) => `${c.number}. ${c.title} (status: ${c.status || 'Not Started'})`).join('\n')}
Available writing time: ${hours ? `${hours} hours per week` : 'not provided'}; writing days per week: ${days || 'not provided'}; target completion date: ${due || 'not provided'}.
Skip chapters already marked Completed. If no completion date was given, propose a realistic one and say why. If the date looks unrealistic for the time available, say so kindly and suggest an adjusted date. Include time for revision.
Return ONLY JSON: {"summary":"2-4 sentences","targetDate":"","weeklyRhythm":"how to use their writing days","milestones":[{"by":"date","goal":"","chapters":"which chapters"}],"tips":["3-5 practical tips"]}`, 4000);
      const milestones = arr(out?.milestones).map((m: any) => ({ by: text(m?.by), goal: text(m?.goal), chapters: text(m?.chapters) })).filter((m) => m.goal);
      if (!milestones.length) throw new Error('No roadmap was produced');
      const md = [
        text(out?.summary),
        text(out?.targetDate) && `**Target completion:** ${text(out.targetDate)}`,
        text(out?.weeklyRhythm) && `**Your weekly rhythm:** ${text(out.weeklyRhythm)}`,
        `| By | Goal | Chapters |\n|---|---|---|\n${milestones.map((m) => `| ${m.by} | ${m.goal.replace(/\|/g, '/')} | ${m.chapters.replace(/\|/g, '/')} |`).join('\n')}`,
        bullets('Tips', out?.tips),
      ].filter(Boolean).join('\n\n');
      result = { roadmap: md, inputs: { hoursPerWeek: hours, daysPerWeek: days, completionDate: due } };
    }

    await deductCreditsOnSuccess(supabase, userId!, `write-it:${action}`, cost);
    return json({ ...result, creditsUsed: cost });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('[write-it] error:', error?.message ?? error);
    if (error?.status === 429) return json({ error: 'Too many requests right now. Please wait a minute and try again.' });
    return json({ error: 'We could not complete this step. Please try again. You were not charged.' });
  }
}));
