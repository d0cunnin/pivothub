import { withCreditRequest } from '../_shared/guard.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from '../_shared/moderation.ts';
import { generateJson, systemUser } from '../_shared/aiGenerate.ts';
import { assertCredits, deductCreditsOnSuccess } from '../_shared/guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeBuilderRequest {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  targetRole: string;
  yearsExperience?: string;
  summaryFocus?: string;
  topSkills: string;
  workHistory: string;
  education?: string;
  certifications?: string;
  linkedin?: string;
  volunteer?: string;
  tone?: 'professional' | 'modern' | 'executive';
}

Deno.serve(withCreditRequest(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = user.id;

    await supabase.rpc('throttle_user', {
      p_user_id: userId, p_endpoint: 'resume-builder',
      p_window_seconds: 3600, p_max_reqs: 10
    });

    const body: ResumeBuilderRequest = await req.json();
    const { fullName, targetRole, topSkills, workHistory } = body;

    if (!fullName?.trim() || !targetRole?.trim() || !topSkills?.trim() || !workHistory?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required fields: fullName, targetRole, topSkills, workHistory' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const moderationInput = `${fullName} ${targetRole} ${topSkills} ${workHistory} ${body.summaryFocus || ''}`.slice(0, 8000);
    const moderation = await moderateContent(moderationInput, 'resume-builder', userId, 'medium');
    if (moderation.flagged) {
      return new Response(JSON.stringify({ error: 'Content flagged by moderation', details: moderation.categories }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await assertCredits(userId, 5);

    const systemPrompt = `You are an expert resume writer. You turn the candidate's own information into a clear, ATS-friendly resume. A resume is a factual document the candidate signs off on, so accuracy matters more than impressiveness.

TRUTH RULES (most important; never break these):
- Use ONLY facts the candidate provided. Never invent employers, job titles, locations, dates, graduation years, degrees, GPAs, certifications, licenses, awards, tools, techniques, skills, team sizes, customers, or numbers.
- If an employer, location or date is missing, or the candidate wrote a placeholder like [Dates], output exactly "[Company Name]", "[City, State]" or "[Dates]" so they can fill it in.
- No numbers, percentages or dollar amounts unless the candidate gave them. Do not estimate or "infer" metrics.
- "coreSkills" may only contain skills, tools and techniques the candidate listed or clearly described. Do not add related skills they did not mention.
- "certifications" must be empty unless the candidate listed certifications.
- Keep job titles exactly as the candidate wrote them (you may pick one when they wrote "Waitress / Food Service Associate").
- Keep every role, volunteer role, school and link the candidate provided. Do not drop sections.

WRITING RULES:
- Rewrite the candidate's bullets to be clear and strong: start with an action verb, describe what they did and why it mattered, using only their facts.
- Keep 2-4 bullets per role, based on what they wrote (do not pad with invented duties).
- Match wording to the target role where the candidate's facts support it.
- Tone: ${body.tone || 'professional'}
- In "suggestions", list 3-6 short, specific things the candidate could add to make the resume stronger (for example "Add how many students you tutored each week" or "Add the dates for each job"). These are questions for the candidate, never facts in the resume.

Return ONLY valid JSON in this EXACT structure:
{
  "headline": "Short headline based only on the candidate's real background",
  "summary": "3-4 sentence professional summary using only the candidate's facts",
  "coreSkills": ["skill from the candidate's list", "..."],
  "experience": [
    { "title": "Job Title", "company": "Company Name or [Company Name]", "location": "City, State or [City, State]", "dates": "Their dates or [Dates]", "bullets": ["...", "..."] }
  ],
  "volunteer": [
    { "title": "Role", "company": "Organization", "location": "City, State or [City, State]", "dates": "Their dates or [Dates]", "bullets": ["..."] }
  ],
  "education": [
    { "credential": "Degree as given", "institution": "School as given", "year": "Year as given, or empty string", "details": "GPA or honors only if given, else empty string" }
  ],
  "certifications": [],
  "keywords": ["keyword from their background that matches the target role"],
  "suggestions": ["Add ..."]
}`;

    const userPrompt = `Build a resume for this candidate using only the information below.

CANDIDATE:
Name: ${fullName}
Email: ${body.email || 'not provided'}
Phone: ${body.phone || 'not provided'}
Location: ${body.location || 'not provided'}
LinkedIn / website: ${body.linkedin || 'not provided'}
Target Role: ${targetRole}
Years of Experience: ${body.yearsExperience || 'not specified'}
Summary Focus: ${body.summaryFocus || 'general professional summary'}

TOP SKILLS:
${topSkills}

WORK HISTORY (parse into structured roles; keep their placeholders):
${workHistory}

VOLUNTEER EXPERIENCE:
${body.volunteer || 'none provided'}

EDUCATION:
${body.education || 'not provided'}

CERTIFICATIONS:
${body.certifications || 'none'}

Return ONLY the JSON object — no preamble, no markdown fences.`;

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const maxTokens = 6000;
    let resume: any;
    try {
      resume = await generateJson(lovableKey, systemUser(systemPrompt, userPrompt), { maxTokens });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'Our AI service is temporarily unavailable. Please try again later. You were not charged.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[resume-builder] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    resume = enforceProvidedFacts(resume, body);

    await deductCreditsOnSuccess(supabase, userId, 'resume-builder', 5);
    return new Response(JSON.stringify({
      resume,
      contact: {
        fullName,
        email: body.email || null,
        phone: body.phone || null,
        location: body.location || null,
        linkedin: body.linkedin || null,
      },
      creditsUsed: 5,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Resume Builder error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unexpected error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}));


// ---------------------------------------------------------------------------
// Safety net: the prompt forbids invented facts, and this removes any that
// still slip through, by checking against what the candidate actually typed.
// ---------------------------------------------------------------------------
const STOP = new Set(['and', 'the', 'for', 'with', 'from', 'basic', 'skills', 'skill', 'using']);

function enforceProvidedFacts(resume: any, body: ResumeBuilderRequest): any {
  const source = [body.fullName, body.targetRole, body.topSkills, body.workHistory, body.volunteer, body.education,
    body.certifications, body.summaryFocus, body.yearsExperience, body.location].filter(Boolean).join('\n').toLowerCase();
  const has = (text: string) => source.includes(text.toLowerCase().trim());
  const list = (v: any): any[] => (Array.isArray(v) ? v : []);
  const str = (v: any) => (typeof v === 'string' ? v.trim() : '');
  const isPlaceholder = (v: string) => /^\[.*\]$/.test(v);

  // Every number in generated text must appear in the candidate's own text.
  const numbersOk = (text: string) =>
    (text.match(/\d[\d,.]*/g) ?? []).every((n) => source.includes(n.replace(/[.,]$/, '')));

  // Every meaningful word must appear in what the candidate wrote.
  const wordsOk = (text: string) => {
    const words = text.toLowerCase().replace(/[()&/,|–—-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
    return words.length > 0 && words.every((w) => source.includes(w));
  };
  const skillOk = wordsOk;

  const fixRole = (role: any) => {
    const company = str(role?.company);
    const dates = str(role?.dates);
    const location = str(role?.location);
    const bullets = list(role?.bullets).map(str).filter(Boolean);
    const kept = bullets.filter(numbersOk);
    return {
      title: wordsOk(str(role?.title)) ? str(role?.title) : '[Job Title]',
      company: company && (isPlaceholder(company) || has(company)) ? company : '[Company Name]',
      location: location && (isPlaceholder(location) || has(location)) ? location : '[City, State]',
      dates: dates && (isPlaceholder(dates) || numbersOk(dates)) ? dates : '[Dates]',
      bullets: kept.length ? kept : bullets.slice(0, 1).map((b) => b.replace(/\d[\d,.%$+]*/g, '[number]')),
    };
  };


  const certsGiven = str(body.certifications);
  return {
    ...resume,
    headline: numbersOk(str(resume?.headline)) ? str(resume?.headline) : '',
    summary: str(resume?.summary),
    coreSkills: list(resume?.coreSkills).map(str).filter((s) => s && skillOk(s)),
    experience: list(resume?.experience).map(fixRole),
    volunteer: str(body.volunteer) ? list(resume?.volunteer).map(fixRole) : [],
    education: str(body.education)
      ? list(resume?.education).map((e: any) => ({
          credential: str(e?.credential),
          institution: str(e?.institution),
          year: str(e?.year) && numbersOk(str(e?.year)) ? str(e?.year) : '',
          details: str(e?.details) && numbersOk(str(e?.details)) ? str(e?.details) : '',
        }))
      : [],
    certifications: certsGiven ? list(resume?.certifications).map(str).filter((c) => c && skillOk(c)) : [],
    keywords: list(resume?.keywords).map(str).filter(Boolean),
    suggestions: list(resume?.suggestions).map(str).filter(Boolean).slice(0, 6),
  };
}
