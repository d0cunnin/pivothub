import { withCreditRequest } from '../_shared/guard.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as toBase64, decode as fromBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { guard, corsHeaders, assertCredits, deductCreditsOnSuccess, logRequest } from '../_shared/guard.ts';
import { generateJson, generateText, systemUser } from '../_shared/aiGenerate.ts';
import { moderateContent } from '../_shared/moderation.ts';
import {
  ARCHITECTURE_NOTICE, briefProblem, briefText, categoryRules, cleanBrief, duplicateDecision, evaluateStorage,
  isUuid, operationFor, producesImage, projectBusy, resolveCosts, resolveStorageLimits,
  type DesignBrief, type DesignOperation,
} from './designLogic.ts';

/**
 * DESIGN IT: AI design concept studio.
 *
 * Free:  action "config" (live prices and storage settings).
 * Paid:  concept, directions, image, refine (mode text | image | both),
 *        compare, summary. Prices come from designLogic.ts defaults or the
 *        DESIGN_IT_CREDIT_COSTS secret.
 *
 * Every paid request must carry a fresh requestId (UUID). The request is
 * logged in design_it_operations; a repeated requestId never runs or charges
 * twice. Credits are held before the AI call and only charged once the result
 * is saved; any failure releases the hold, so the user is not charged.
 */

const BUCKET = 'design-it';
const IMAGE_MODEL = Deno.env.get('DESIGN_IT_IMAGE_MODEL') || 'google/gemini-3.1-flash-lite-image';
const IMAGE_TIMEOUT_MS = 90_000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const texts = (v: unknown, max = 10) => arr(v).map(text).filter(Boolean).slice(0, max);

class UserFacingError extends Error {
  constructor(message: string, readonly status = 200) { super(message); }
}

const serviceClient = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

// ---------------------------------------------------------------- prompts
const RULES = `=== DESIGN IT RULES ===
- You are a senior design consultant helping someone develop their own idea. Build on their brief; do not replace their idea with a different one.
- Clearly separate what the user specified from your suggestions. Never state a suggestion as if the user asked for it.
- Use the exact HEX colours the user gave. Respect stated dimensions, materials and budget. If something important is missing, say what to decide rather than inventing it.
- Do not invent measurements, prices, supplier names, regulations, test results or certifications. Give ranges or "to be confirmed" where needed.
- Do not copy or imitate existing brands, trademarks, copyrighted characters or a named designer's work.
- Plain, practical language. Short bullet points.`;

function system(b: DesignBrief) {
  return `=== THE USER'S DESIGN BRIEF (the only facts about this project) ===\n${briefText(b)}\n\n${RULES}\n${categoryRules(b.category)}`;
}

const CONCEPT_SHAPE = `{"understanding":"2-4 sentences in your own words on what they want to create, for whom and why",
"overview":"3-5 sentence design concept overview",
"objectives":["3-5 design objectives"],
"creativeDirection":"2-4 sentences describing the creative direction",
"keyElements":["4-6 key design elements"],
"materials":["materials or components, only where they apply; empty list if not relevant"],
"functional":["3-5 functional considerations"],
"improvements":["2-4 suggested improvements to the idea"],
"challenges":["2-4 potential challenges or limitations"]}`;

function readConcept(out: any, extra: Record<string, unknown> = {}): Record<string, any> {
  const c = {
    understanding: text(out?.understanding), overview: text(out?.overview), objectives: texts(out?.objectives),
    creativeDirection: text(out?.creativeDirection), keyElements: texts(out?.keyElements), materials: texts(out?.materials),
    functional: texts(out?.functional), improvements: texts(out?.improvements), challenges: texts(out?.challenges), ...extra,
  };
  if (!c.overview || c.keyElements.length < 2) throw new Error('Concept was incomplete');
  return c;
}

function conceptText(c: any): string {
  if (!c) return '(no concept yet)';
  return [
    c.overview && `Overview: ${c.overview}`,
    c.creativeDirection && `Creative direction: ${c.creativeDirection}`,
    arr(c.keyElements).length && `Key elements: ${arr(c.keyElements).join('; ')}`,
    arr(c.materials).length && `Materials/components: ${arr(c.materials).join('; ')}`,
    arr(c.functional).length && `Functional: ${arr(c.functional).join('; ')}`,
  ].filter(Boolean).join('\n');
}

function directionText(d: any): string {
  if (!d) return '';
  return `Selected creative direction "${text(d.name)}": ${text(d.concept)} Visual approach: ${text(d.visualApproach)} Features: ${arr(d.features).join('; ')}`;
}

function imagePrompt(b: DesignBrief, concept: any, direction: any, notes: string): string {
  const style = b.style === 'Custom' ? b.customStyle : b.style;
  const kind: Record<string, string> = {
    product: 'a clean product concept rendering on a plain background, three-quarter view',
    brand: 'a brand identity concept board showing the mark and how it is applied',
    fashion: 'a fashion design illustration of the garment or accessory on a neutral background',
    interior: 'an interior design concept rendering of the space',
    digital: 'a high-fidelity interface mockup of the main screen',
    event: 'an event design concept rendering showing the atmosphere and layout',
    architecture: 'an architectural concept rendering (conceptual, not a construction drawing)',
    creative: 'a visual concept artwork',
    other: 'a clear design concept visualization',
  };
  return [
    `Create ${kind[b.category]}.`,
    `Design: ${concept?.overview || b.concept}`,
    concept?.keyElements?.length ? `Key elements: ${concept.keyElements.join('; ')}.` : '',
    directionText(direction),
    style ? `Style: ${style}.` : '',
    b.colors ? `Colours: ${b.colors}.` : '',
    b.materials ? `Materials: ${b.materials}.` : '',
    b.dimensions ? `Proportions/size: ${b.dimensions}.` : '',
    b.environment ? `Setting: ${b.environment}.` : '',
    notes ? `Additional direction: ${notes}` : '',
    b.category === 'brand' && b.details.businessName ? `Any text shown must read exactly "${b.details.businessName}".` : 'Avoid text in the image unless it is part of the design.',
    'Do not include real brand logos, trademarks, watermarks or recognisable people.',
  ].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- images
async function callImageModel(apiKey: string, prompt: string, baseImage?: { mime: string; b64: string }) {
  const content = baseImage
    ? [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${baseImage.mime};base64,${baseImage.b64}` } }]
    : prompt;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: IMAGE_MODEL, messages: [{ role: 'user', content }], modalities: ['image', 'text'] }),
      signal: controller.signal,
    });
    if (res.status === 429) throw new UserFacingError('The image service is busy right now. Please wait a minute and try again. You were not charged.');
    if (!res.ok) {
      console.error('[design-it] image model error', res.status, (await res.text()).slice(0, 500));
      throw new Error('Image generation failed');
    }
    const data = await res.json();
    const url: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) throw new Error('No image returned');
    if (url.startsWith('data:')) {
      const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(url);
      if (!m) throw new Error('Unsupported image format');
      return { mime: m[1], bytes: fromBase64(m[2]) };
    }
    const img = await fetch(url, { signal: controller.signal });
    const mime = (img.headers.get('content-type') || '').split(';')[0];
    if (!img.ok || !/^image\/(png|jpeg|webp)$/.test(mime)) throw new Error('Image download failed');
    return { mime, bytes: new Uint8Array(await img.arrayBuffer()) };
  } catch (e: any) {
    if (e?.name === 'AbortError') throw new UserFacingError('Generating the image took too long. Please try again. You were not charged.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function loadImage(svc: any, path: string) {
  const { data, error } = await svc.storage.from(BUCKET).download(path);
  if (error || !data) throw new UserFacingError('We could not open the visual you chose. Please pick another version.');
  return { mime: data.type || 'image/png', b64: toBase64(new Uint8Array(await data.arrayBuffer())) };
}

// ---------------------------------------------------------------- handler
serve(withCreditRequest(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  let g;
  try {
    g = await guard(req, { endpoint: 'design-it', cost: 0, requireAuth: true, maxReqsPerMinute: 12 });
  } catch (err) {
    if (err instanceof Response) return err;
    return json({ error: 'Please sign in and try again.' }, 401);
  }
  const { supabase, userId, ip, startTime } = g;
  const costs = resolveCosts(Deno.env.get('DESIGN_IT_CREDIT_COSTS'));
  const limits = resolveStorageLimits(Deno.env.get('DESIGN_IT_STORAGE_LIMITS'));

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  const action = str(body?.action, 20);

  if (action === 'config') return json({ costs, storageLimits: limits });

  const op = operationFor(action, str(body?.mode, 10));
  if (!op) return json({ error: 'Unknown request.' }, 400);
  if (!isUuid(body?.projectId) || !isUuid(body?.requestId)) return json({ error: 'Invalid request.' }, 400);
  const projectId: string = body.projectId;
  const requestId: string = body.requestId;
  const cost = costs[op];
  const svc = serviceClient();

  // Ownership: the caller's own client only sees their own projects (RLS).
  const { data: project } = await supabase.from('design_it_projects').select('*').eq('id', projectId).maybeSingle();
  if (!project || project.user_id !== userId) return json({ error: 'Project not found.' }, 404);

  const brief = cleanBrief(project.brief);
  const problem = briefProblem(brief);
  if (problem) return json({ error: `${problem} Save your brief, then try again.` }, 400);

  // ---- duplicate and concurrent request protection
  const { data: seen } = await svc.from('design_it_operations').select('*').eq('user_id', userId).eq('request_id', requestId).maybeSingle();
  const decision = duplicateDecision(seen);
  if (decision === 'return-existing') {
    const { data: versions } = await svc.from('design_it_versions').select('*').eq('project_id', projectId).eq('user_id', userId)
      .or(`id.eq.${seen.version_id},parent_version_id.eq.${seen.version_id}`);
    return json({ duplicate: true, versions: versions ?? [], creditsUsed: 0 });
  }
  if (decision === 'in-progress') return json({ error: 'This request is already being processed. Please wait.' }, 409);
  if (decision === 'already-failed') return json({ error: 'That request did not complete and you were not charged. Please try again.' }, 409);

  const { data: running } = await svc.from('design_it_operations').select('created_at')
    .eq('project_id', projectId).eq('status', 'pending');
  if (projectBusy(running ?? [])) return json({ error: 'Another request for this project is still running. Please wait for it to finish.' }, 409);

  const { data: opRow, error: opError } = await svc.from('design_it_operations')
    .insert({ user_id: userId, project_id: projectId, request_id: requestId, action: op, cost, status: 'pending' })
    .select('id').single();
  if (opError || !opRow) {
    // 23505 = the same requestId arrived twice at the same moment.
    if (opError?.code === '23505') return json({ error: 'This request is already being processed. Please wait.' }, 409);
    console.error('[design-it] could not log operation', opError);
    return json({ error: 'Design It is not available yet. Please try again later.' }, 503);
  }

  const finish = async (status: 'succeeded' | 'failed', extra: Record<string, unknown> = {}) => {
    await svc.from('design_it_operations').update({ status, finished_at: new Date().toISOString(), ...extra }).eq('id', opRow.id);
  };
  const uploaded: string[] = [];
  const created: string[] = [];
  let charged = false;

  try {
    const moderation = await moderateContent(`${briefText(brief)}\n${str(body?.instructions, 2000)}`.slice(0, 10000), 'design-it', userId);
    if (moderation.flagged) throw new UserFacingError('This request includes content we cannot help with. Please revise it and try again.', 400);

    if (producesImage(op)) {
      const { data: imgs } = await svc.from('design_it_versions').select('image_bytes').eq('user_id', userId).not('image_path', 'is', null);
      const usage = { images: imgs?.length ?? 0, bytes: (imgs ?? []).reduce((t: number, r: any) => t + Number(r.image_bytes || 0), 0) };
      const storage = evaluateStorage(usage, limits);
      if (!storage.canStoreNewImage) throw new UserFacingError(storage.message!, 200);
    }

    await assertCredits(userId, cost);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('AI service not configured');

    const { data: versions } = await svc.from('design_it_versions').select('*').eq('project_id', projectId).order('version_number');
    const all: any[] = versions ?? [];
    const byId = (id: unknown) => (isUuid(id) ? all.find((v) => v.id === id) : undefined);
    const latest = (kinds: string[]) => [...all].reverse().find((v) => kinds.includes(v.kind));
    const sel = project.selected_direction;
    const direction = sel && byId(sel.versionId)?.content?.directions?.[Number(sel.index)];

    const requestedBase = byId(body?.baseVersionId);
    const baseConcept = requestedBase && ['concept', 'refinement'].includes(requestedBase.kind) ? requestedBase : latest(['concept', 'refinement']);
    const baseImage = requestedBase?.kind === 'image' ? requestedBase : latest(['image']);
    const sys = system(brief);
    const instructions = str(body?.instructions, 2000);
    const refinements = arr(body?.refinements).map((r) => str(r, 60)).filter(Boolean).slice(0, 10);

    const insertVersion = async (row: Record<string, unknown>) => {
      const { data, error } = await svc.from('design_it_versions')
        .insert({ project_id: projectId, user_id: userId, credits_charged: 0, ...row }).select('*').single();
      if (error || !data) throw new Error(`Could not save version: ${error?.message}`);
      created.push(data.id);
      return data;
    };
    const saveImage = async (img: { mime: string; bytes: Uint8Array }) => {
      if (img.bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('Image too large');
      const ext = img.mime === 'image/jpeg' ? 'jpg' : img.mime === 'image/webp' ? 'webp' : 'png';
      const path = `${userId}/${projectId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await svc.storage.from(BUCKET).upload(path, img.bytes, { contentType: img.mime, upsert: false });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      uploaded.push(path);
      return { path, bytes: img.bytes.byteLength };
    };

    const saved: any[] = [];
    let status = project.status;

    if (op === 'concept') {
      const out = await generateJson<any>(apiKey, systemUser(sys, `Develop the initial design concept from this brief. Return ONLY JSON:\n${CONCEPT_SHAPE}${brief.category === 'architecture' ? `\nAdd the field "notice": "${ARCHITECTURE_NOTICE}"` : ''}`), { maxTokens: 4000 });
      saved.push(await insertVersion({ kind: 'concept', label: 'Initial concept', content: readConcept(out, brief.category === 'architecture' ? { notice: ARCHITECTURE_NOTICE } : {}) }));
      status = 'Concept';
    } else if (op === 'directions') {
      const earlier = all.filter((v) => v.kind === 'directions').flatMap((v) => arr(v.content?.directions).map((d: any) => text(d?.name)));
      const out = await generateJson<any>(apiKey, systemUser(sys, `Current concept:\n${conceptText(baseConcept?.content)}\n\nPropose 3 distinct written creative directions for this design.${earlier.length ? ` They must differ from directions already explored: ${earlier.join(', ')}.` : ''}${instructions ? ` The user asked: ${instructions}` : ''}
Return ONLY JSON: {"directions":[{"name":"short memorable name","concept":"2-3 sentences on the overall concept","visualApproach":"2-3 sentences","features":["3-4 distinguishing features"],"materials":["materials or components where they apply"],"advantages":["2-3"],"considerations":["2-3"]}]}`), { maxTokens: 4000 });
      const directions = arr(out?.directions).map((d: any) => ({
        name: text(d?.name), concept: text(d?.concept), visualApproach: text(d?.visualApproach), features: texts(d?.features),
        materials: texts(d?.materials), advantages: texts(d?.advantages), considerations: texts(d?.considerations),
      })).filter((d) => d.name && d.concept).slice(0, 3);
      if (directions.length < 2) throw new Error('Directions were incomplete');
      saved.push(await insertVersion({ kind: 'directions', label: `Creative directions: ${directions.map((d) => d.name).join(', ')}`, content: { directions, request: instructions } }));
      status = 'Exploring';
    } else if (op === 'image') {
      const prompt = imagePrompt(brief, baseConcept?.content, direction, instructions);
      const stored = await saveImage(await callImageModel(apiKey, prompt));
      saved.push(await insertVersion({
        kind: 'image', label: direction ? `Visual: ${text(direction.name)}` : 'Visual', parent_version_id: baseConcept?.id ?? null,
        content: { request: instructions, direction: direction ? text(direction.name) : null, basedOn: baseConcept?.version_number ?? null },
        image_path: stored.path, image_bytes: stored.bytes,
      }));
      status = 'Visualizing';
    } else if (op === 'refine_text' || op === 'refine_both') {
      if (!baseConcept) throw new UserFacingError('Develop the concept first, then refine it.', 400);
      if (!instructions && !refinements.length) throw new UserFacingError('Describe the change you want.', 400);
      if (op === 'refine_both' && !baseImage) throw new UserFacingError('Generate a visual first, or choose a text-only refinement.', 400);
      const out = await generateJson<any>(apiKey, systemUser(sys, `Current concept (version ${baseConcept.version_number}):\n${conceptText(baseConcept.content)}\n${directionText(direction)}\n\nRefine the concept. Requested changes: ${refinements.join(', ') || 'see instructions'}. Instructions: ${instructions || 'none'}.
Keep everything that was not asked to change. Return ONLY JSON in this shape, plus "changes":["2-5 bullet points describing exactly what changed"]:\n${CONCEPT_SHAPE}`), { maxTokens: 4000 });
      const refined = readConcept(out, { changes: texts(out?.changes), refinements, request: instructions, ...(brief.category === 'architecture' ? { notice: ARCHITECTURE_NOTICE } : {}) });
      const textVersion = await insertVersion({ kind: 'refinement', label: `Refinement: ${refinements.join(', ') || 'custom'}`, parent_version_id: baseConcept.id, content: refined });
      saved.push(textVersion);
      if (op === 'refine_both') {
        const prompt = `Update this design to match the refined concept. Keep the overall design recognisable. Changes: ${refined.changes.join('; ') || instructions}. ${imagePrompt(brief, refined, direction, '')}`;
        const stored = await saveImage(await callImageModel(apiKey, prompt, await loadImage(svc, baseImage.image_path)));
        saved.push(await insertVersion({
          kind: 'image', label: `Visual for refinement v${textVersion.version_number}`, parent_version_id: textVersion.id,
          content: { request: instructions, refinements, basedOn: textVersion.version_number, revisedFrom: baseImage.version_number },
          image_path: stored.path, image_bytes: stored.bytes,
        }));
      }
      status = 'Refining';
    } else if (op === 'refine_image') {
      if (!baseImage) throw new UserFacingError('Generate a visual first, then refine it.', 400);
      if (!instructions && !refinements.length) throw new UserFacingError('Describe the change you want.', 400);
      const prompt = `Edit this design image. Apply only these changes: ${refinements.join(', ')}${instructions ? `. ${instructions}` : ''}. Keep everything else the same. Do not add real brand logos, trademarks or watermarks.`;
      const stored = await saveImage(await callImageModel(apiKey, prompt, await loadImage(svc, baseImage.image_path)));
      saved.push(await insertVersion({
        kind: 'image', label: `Revised visual (from v${baseImage.version_number})`, parent_version_id: baseImage.id,
        content: { request: instructions, refinements, revisedFrom: baseImage.version_number }, image_path: stored.path, image_bytes: stored.bytes,
      }));
      status = 'Refining';
    } else if (op === 'compare') {
      const ids = arr(body?.compareIds).filter(isUuid).slice(0, 2);
      const [a, b] = ids.map(byId);
      if (!a || !b || a.id === b.id || ![a, b].every((v) => ['concept', 'refinement'].includes(v.kind))) {
        throw new UserFacingError('Choose two different written concept versions to compare.', 400);
      }
      const analysis = await generateText(apiKey, systemUser(sys, `Compare version ${a.version_number}:\n${conceptText(a.content)}\n\nwith version ${b.version_number}:\n${conceptText(b.content)}\n\nWrite a short markdown comparison with these headings: "## What changed", "## Strengths of each", "## Which fits the brief better and why", "## Questions to decide". Use bullet points. Base it only on the two versions and the brief.`), { maxTokens: 2500 });
      if (!analysis || analysis.trim().length < 80) throw new Error('Comparison was incomplete');
      saved.push(await insertVersion({ kind: 'comparison', label: `Comparison of v${a.version_number} and v${b.version_number}`, content: { versionA: a.version_number, versionB: b.version_number, analysis: analysis.trim() } }));
    } else if (op === 'summary') {
      if (!baseConcept) throw new UserFacingError('Develop the concept first.', 400);
      const out = await generateJson<any>(apiKey, systemUser(sys, `Final concept (version ${baseConcept.version_number}):\n${conceptText(baseConcept.content)}\n${directionText(direction)}\n\nWrite the final design summary. Everything you return is labelled as AI suggestions; the user's own specifications are shown separately, so do not repeat them as if they were yours.
Return ONLY JSON: {"finalConcept":"3-5 sentences","objectives":["3-5"],"palette":[{"name":"","hex":"#RRGGBB","use":"where it is used"}],"materials":["suggested materials or components, where relevant"],"specifications":["suggested specifications to confirm; mark estimates as estimates"],"functional":["3-5"],"outstandingQuestions":["3-6 decisions the user still needs to make"],"nextSteps":["4-6 practical next steps, e.g. prototype, get quotes, user testing, consult a licensed professional where needed"]}
Use the user's HEX colours in the palette where they gave them.`), { maxTokens: 4000 });
      const summary = {
        finalConcept: text(out?.finalConcept), objectives: texts(out?.objectives),
        palette: arr(out?.palette).map((p: any) => ({ name: text(p?.name), hex: /^#[0-9a-f]{6}$/i.test(text(p?.hex)) ? text(p.hex).toUpperCase() : '', use: text(p?.use) })).filter((p) => p.name).slice(0, 8),
        materials: texts(out?.materials), specifications: texts(out?.specifications, 12), functional: texts(out?.functional),
        outstandingQuestions: texts(out?.outstandingQuestions), nextSteps: texts(out?.nextSteps),
        basedOn: baseConcept.version_number, direction: direction ? text(direction.name) : null,
        ...(brief.category === 'architecture' ? { notice: ARCHITECTURE_NOTICE } : {}),
      };
      if (!summary.finalConcept || summary.nextSteps.length < 2) throw new Error('Summary was incomplete');
      saved.push(await insertVersion({ kind: 'summary', label: 'Final design summary', parent_version_id: baseConcept.id, content: summary }));
      status = 'Final';
    }

    // Charge only now that the result is saved. If the charge fails, undo the
    // saved result so the user never keeps something they were not charged
    // for, and never pays for something they did not get.
    await deductCreditsOnSuccess(supabase, userId, `design-it:${op}`, cost);
    charged = true;
    const last = saved[saved.length - 1];
    last.credits_charged = cost;
    // Bookkeeping after the charge must never undo the delivered result.
    try {
      await svc.from('design_it_versions').update({ credits_charged: cost }).eq('id', last.id);
      await svc.from('design_it_projects').update({ status }).eq('id', projectId);
      await finish('succeeded', { version_id: last.id });
      await logRequest({ endpoint: 'design-it', userId, ip, success: true, creditsCharged: cost, requestDurationMs: Date.now() - startTime });
    } catch (e) {
      console.error('[design-it] bookkeeping after charge failed', e);
    }
    return json({ versions: saved, status, creditsUsed: cost });
  } catch (error: any) {
    if (charged) {
      // The result was delivered and charged; only bookkeeping failed.
      console.error('[design-it] error after charge:', error?.message ?? error);
      return json({ error: 'Your result was created. Please reopen the project to see it.' });
    }
    // Roll back anything saved by this failed request.
    if (created.length) await svc.from('design_it_versions').delete().in('id', created);
    if (uploaded.length) await svc.storage.from(BUCKET).remove(uploaded);
    const message = error instanceof UserFacingError
      ? error.message
      : error instanceof Response
        ? null
        : 'We could not complete this step. Please try again. You were not charged.';
    await finish('failed', { error: (error?.message ?? 'credit check').slice(0, 500) });
    await logRequest({ endpoint: 'design-it', userId, ip, success: false, creditsCharged: 0, errorMessage: String(error?.message ?? error).slice(0, 300), requestDurationMs: Date.now() - startTime });
    if (error instanceof Response) return error; // e.g. not enough credits
    console.error('[design-it] error:', error?.message ?? error);
    return json({ error: message }, error instanceof UserFacingError ? error.status : 200);
  }
}));
