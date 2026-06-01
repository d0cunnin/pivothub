import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from '../_shared/moderation.ts';

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
  tone?: 'professional' | 'modern' | 'executive';
}

Deno.serve(async (req) => {
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

    const { data: usageData, error: usageError } = await supabase.rpc('check_and_increment_ai_usage', {
      p_user_id: userId, p_tool_name: 'resume-builder', p_credits_to_use: 5,
    });
    if (usageError || !usageData?.can_use) {
      return new Response(JSON.stringify({ error: 'Insufficient credits', reason: usageData?.reason }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an elite resume writer with 15+ years of experience helping professionals land interviews at Fortune 500 companies. You write ATS-friendly resumes with quantified, results-oriented achievements.

WRITING RULES:
- Every bullet uses the formula: [Strong Action Verb] + [What] + [Quantified Result] + [Business Impact]
- Include realistic metrics (%, $, time saved, scale) inferred from context — never use placeholders like [X%]
- Use strong verbs: Led, Engineered, Spearheaded, Optimized, Drove, Architected
- Match keywords to the target role
- Tone: ${body.tone || 'professional'}

Return ONLY valid JSON in this EXACT structure:
{
  "headline": "Senior X with 8+ years driving Y",
  "summary": "3-4 sentence professional summary tailored to the target role",
  "coreSkills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "dates": "Mon YYYY – Mon YYYY",
      "bullets": ["Quantified achievement 1", "Quantified achievement 2", "Quantified achievement 3", "Quantified achievement 4"]
    }
  ],
  "education": [
    { "credential": "Degree / Cert", "institution": "School", "year": "YYYY" }
  ],
  "certifications": ["Cert 1", "Cert 2"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}`;

    const userPrompt = `Build a complete resume for the following candidate. Generate strong, quantified achievement bullets even where the work history is sparse — infer reasonable metrics from the role and industry.

CANDIDATE:
Name: ${fullName}
Email: ${body.email || 'not provided'}
Phone: ${body.phone || 'not provided'}
Location: ${body.location || 'not provided'}
Target Role: ${targetRole}
Years of Experience: ${body.yearsExperience || 'not specified'}
Summary Focus: ${body.summaryFocus || 'general professional summary'}

TOP SKILLS:
${topSkills}

WORK HISTORY (parse into structured roles):
${workHistory}

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    let aiRes;
    try {
      aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${lovableKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          max_completion_tokens: 6000,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (e: any) {
      clearTimeout(timeout);
      console.error('AI call failed:', e);
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI gateway error:', aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: 'AI returned empty response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let resume;
    try {
      resume = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) {
        return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      resume = JSON.parse(match[0]);
    }

    return new Response(JSON.stringify({
      resume,
      contact: {
        fullName,
        email: body.email || null,
        phone: body.phone || null,
        location: body.location || null,
      },
      creditsUsed: 5,
      remaining: usageData.remaining,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Resume Builder error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unexpected error',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
