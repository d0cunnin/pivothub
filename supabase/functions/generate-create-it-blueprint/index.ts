import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, corsHeaders } from '../_shared/guard.ts';
import { extractJson } from '../_shared/aiResponse.ts';

const ENDPOINT = '/generate-create-it-blueprint';
const PRIMARY_MODEL = 'google/gemini-2.5-flash';
const FALLBACK_MODEL = 'google/gemini-2.5-flash-lite';

interface CreateItRequest {
  // Step 1 — Platform Overview
  appName: string;
  platformDescription: string;
  targetAudience: string;
  primaryPurpose: string;
  // Step 2 — Core Features
  features: string[];
  customFeature?: string;
  // Step 3 — Platform Type
  platformType: string; // Web Application | Mobile Application | Both
  targetPlatforms: string[]; // iOS, Android, Desktop, PWA
  // Step 4 — Monetization
  monetizationTypes: string[];
  pricingInfo?: string;
  // Step 5 — User Journey
  userJourney: string;
  // Step 6 — Integrations
  integrations: string[];
  customIntegration?: string;
  // Step 7 — Builder Skill Level
  skillLevel: string;
}

// The structured blueprint contract returned to the client. Every field is a
// rich markdown string so the viewer and PDF can render it consistently.
const BLUEPRINT_KEYS = [
  'executiveSummary',
  'technologyStack',
  'databaseArchitecture',
  'applicationArchitecture',
  'userFlow',
  'integrations',
  'monetizationStrategy',
  'developmentRoadmap',
  'buildInstructions',
  'githubSetup',
  'aiBuildPrompt',
] as const;

type BlueprintKey = (typeof BLUEPRINT_KEYS)[number];
type Blueprint = Record<BlueprintKey, string>;

const KEY_DESCRIPTIONS: Record<BlueprintKey, string> = {
  executiveSummary: "Overview of the platform, the problem it solves, the target users, and the market opportunity.",
  technologyStack: "Recommended stack with sections for Frontend, Backend, Database, Authentication, Payments, Storage, Notifications, Hosting, Analytics, and AI Services — with a one-line justification for each choice.",
  databaseArchitecture: "Tables (with key columns and types), relationships, user roles, permissions, and data flow.",
  applicationArchitecture: "Frontend architecture, Backend architecture, API architecture, Security architecture, and Deployment architecture.",
  userFlow: "Step-by-step user journey, the screens required, the features on each screen, and the navigation structure.",
  integrations: "For each selected integration, explain why it should be used and how it fits into the stack.",
  monetizationStrategy: "Pricing recommendations, realistic revenue projections, and growth opportunities.",
  developmentRoadmap: "Phase 1 MVP, Phase 2 Beta, Phase 3 Launch, Phase 4 Scale — each with deliverables and a rough timeline.",
  buildInstructions: "Concrete build instructions with a subsection for Lovable, Claude Code, OpenAI Codex, Cursor, Bolt, Replit, and Webflow.",
  githubSetup: "A numbered guide: 1) Create GitHub Repository, 2) Connect GitHub to Lovable, 3) Connect GitHub to Claude Code, 4) Configure Branch Strategy, 5) Configure Deployment Workflow, 6) Configure Environment Variables, 7) Configure Secrets, 8) Configure CI/CD.",
  aiBuildPrompt: "A single, highly detailed, ready-to-paste implementation prompt the user can paste directly into Lovable, Claude Code, OpenAI, Cursor, or Bolt to generate the first version of the application. Include the stack, data model, core features, and acceptance criteria.",
};

// Split into 3 chunks so each AI call stays well under the token cap and
// avoids truncation. Chunks run in parallel for low wall-clock latency.
const CHUNKS: BlueprintKey[][] = [
  ['executiveSummary', 'technologyStack', 'databaseArchitecture', 'applicationArchitecture'],
  ['userFlow', 'integrations', 'monetizationStrategy', 'developmentRoadmap'],
  ['buildInstructions', 'githubSetup', 'aiBuildPrompt'],
];

function buildSystemPrompt(skillLevel: string, keys: BlueprintKey[]): string {
  const schemaLines = keys.map((k) => `  "${k}": "${KEY_DESCRIPTIONS[k]}"`).join(',\n');
  return `You are "AI Startup Architect" — a principal software architect and startup CTO who has shipped dozens of production SaaS, marketplace, and mobile platforms. You write blueprints detailed enough that a developer, an agency, or an AI builder (Lovable, Claude Code, OpenAI Codex, Cursor, Bolt, Replit, Webflow) can begin building immediately.

QUALITY BAR: Treat this as a $10,000+ technical architecture engagement. Be specific, opinionated, and production-ready. Recommend concrete technologies, name actual tables and columns, describe real API routes, and give phased timelines. Never be vague.

TECHNICAL DEPTH: Tailor the depth and terminology to a "${skillLevel}" builder. For Beginner, explain concepts plainly and prefer no-code/low-code paths. For Agency/Enterprise, include scalability, security, compliance, observability, and team workflow.

OUTPUT FORMAT: Respond with a single valid JSON object containing EXACTLY these ${keys.length} keys and nothing else. Each value is a detailed, well-structured markdown string (use ## / ### headings, bullet lists, and tables where helpful). Keep the total response under ~3500 tokens so the JSON is never truncated.

{
${schemaLines}
}

IMPORTANT: Return ONLY the JSON object with exactly the ${keys.length} keys listed above. No prose, no markdown fences, no commentary before or after.`;
}


function buildUserPrompt(body: CreateItRequest): string {
  const features = [...(body.features || [])];
  if (body.customFeature) features.push(`Custom: ${body.customFeature}`);

  const integrations = [...(body.integrations || [])];
  if (body.customIntegration) integrations.push(`Custom: ${body.customIntegration}`);

  return `Design a complete platform blueprint for the following project.

# Platform Overview
- App Name: ${body.appName}
- Description: ${body.platformDescription}
- Target Audience: ${body.targetAudience}
- Primary Purpose / Industry: ${body.primaryPurpose}

# Core Features
${features.length ? features.map((f) => `- ${f}`).join('\n') : '- (none selected)'}

# Platform Type
- Type: ${body.platformType}
- Target Platforms: ${(body.targetPlatforms || []).join(', ') || 'Not specified'}

# Monetization
- Models: ${(body.monetizationTypes || []).join(', ') || 'Not specified'}
- Pricing Information: ${body.pricingInfo || 'Not specified'}

# User Journey
${body.userJourney || 'Not specified'}

# Selected Integrations
${integrations.length ? integrations.map((i) => `- ${i}`).join('\n') : '- (none selected)'}

# Builder Skill Level
- ${body.skillLevel}

Generate the full blueprint now as the specified JSON object.`;
}

async function callModel(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  timeoutMs: number,
): Promise<Blueprint> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_completion_tokens: 5000,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[${ENDPOINT}] ${model} error:`, response.status, errorText.slice(0, 300));
      const err: any = new Error(`AI error: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    return extractJson<Blueprint>(data);
  } finally {
    clearTimeout(timeoutId);
  }
}

function validateBlueprint(bp: Partial<Blueprint>): Blueprint {
  const result = {} as Blueprint;
  let totalLength = 0;
  for (const key of BLUEPRINT_KEYS) {
    const value = typeof bp[key] === 'string' ? (bp[key] as string) : '';
    result[key] = value;
    totalLength += value.length;
  }
  if (totalLength < 800) {
    throw new Error('Generated blueprint was too short — please try again.');
  }
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let guardResult;
  try {
    guardResult = await guard(req, {
      endpoint: ENDPOINT,
      cost: 70,
      requireAuth: true,
      requireCaptcha: false,
      maxBodySize: 50_000,
    });
  } catch (err) {
    console.error('Guard error:', err);
    if (err instanceof Response) return err;
    return new Response(JSON.stringify({ error: (err as Error).message || 'Guard check failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { supabase, userId } = guardResult;

  try {
    const body = (await req.json()) as CreateItRequest;

    // Validate request
    if (!body.appName || !body.platformDescription || !body.targetAudience) {
      throw new Error('App name, description, and target audience are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI key not configured');
    }

    const systemPrompt = buildSystemPrompt(body.skillLevel || 'Intermediate');
    const userPrompt = buildUserPrompt(body);

    // Generate blueprint — try the primary model, fall back on failure.
    let raw: Blueprint;
    let modelUsed = PRIMARY_MODEL;
    try {
      raw = await callModel(LOVABLE_API_KEY, PRIMARY_MODEL, systemPrompt, userPrompt, 75_000);
    } catch (primaryErr: any) {
      // Surface hard billing/rate errors directly rather than burning a fallback.
      if (primaryErr?.status === 402) {
        throw new Error('AI credits exhausted. Please add credits in Settings.');
      }
      console.warn(`[${ENDPOINT}] Primary model failed, falling back to ${FALLBACK_MODEL}:`, primaryErr?.message);
      modelUsed = FALLBACK_MODEL;
      raw = await callModel(LOVABLE_API_KEY, FALLBACK_MODEL, systemPrompt, userPrompt, 60_000);
    }

    const blueprint = validateBlueprint(raw);

    // Store history (RLS: user_id must equal auth.uid()).
    let blueprintId: string | null = null;
    const { data: saved, error: saveError } = await supabase
      .from('create_it_blueprints')
      .insert({
        user_id: userId,
        platform_name: body.appName,
        platform_description: body.platformDescription,
        industry: body.primaryPurpose || null,
        platform_type: body.platformType || null,
        blueprint_json: blueprint as unknown as Record<string, unknown>,
      })
      .select('id')
      .maybeSingle();

    if (saveError) {
      console.error(`[${ENDPOINT}] Failed to save blueprint:`, saveError.message);
    } else {
      blueprintId = saved?.id ?? null;
    }

    // NOTE: Credits (70) are checked + deducted atomically on the client via
    // the canonical check_and_increment_ai_usage RPC before this function is
    // invoked, which also writes the AI usage log. We intentionally do NOT
    // deduct again here to avoid double-charging.

    return new Response(
      JSON.stringify({ blueprint, blueprintId, modelUsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: any) {
    console.error(`[${ENDPOINT}] Error:`, error);
    const msg = error?.message || 'Failed to generate blueprint';
    const isAIFailure = /malformed JSON|empty response|AI error/i.test(msg);
    const status = isAIFailure ? 502 : 500;
    const userMsg = isAIFailure
      ? 'AI service is temporarily unavailable. Please try again in a moment.'
      : msg;
    return new Response(JSON.stringify({ error: userMsg }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
