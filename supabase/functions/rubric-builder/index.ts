import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from '../_shared/moderation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const userId = user.id;

    await supabase.rpc('throttle_user', { p_user_id: userId, p_endpoint: 'rubric-builder', p_window_seconds: 3600, p_max_reqs: 10 });

    const body = await req.json();
    const { assignment, gradeLevel, criteriaCount, scaleLevels } = body;
    if (!assignment?.trim() || !gradeLevel?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required fields: assignment, gradeLevel' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const mod = await moderateContent(assignment, 'rubric-builder', userId, 'low');
    if (mod.flagged) return new Response(JSON.stringify({ error: 'Content flagged', details: mod.categories }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: usage, error: uErr } = await supabase.rpc('check_and_increment_ai_usage', { p_user_id: userId, p_tool_name: 'rubric-builder', p_credits_to_use: 3 });
    if (uErr || !usage?.can_use) return new Response(JSON.stringify({ error: 'Insufficient credits', reason: usage?.reason }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const c = Math.min(Math.max(parseInt(criteriaCount) || 5, 3), 8);
    const levelsParam = parseInt(scaleLevels) || 4;
    const levels = [3, 4, 5].includes(levelsParam) ? levelsParam : 4;

    const systemPrompt = `You are an instructional design expert. Generate a complete scoring rubric as ONLY valid JSON.

Schema:
{
  "title": "Rubric for [assignment]",
  "scale": ["Exemplary (4)", "Proficient (3)", "Developing (2)", "Beginning (1)"],
  "criteria": [
    {
      "name": "Criterion name",
      "weight": 25,
      "descriptors": {
        "Exemplary (4)": "Specific observable behavior at this level",
        "Proficient (3)": "...",
        "Developing (2)": "...",
        "Beginning (1)": "..."
      }
    }
  ],
  "totalPoints": 100
}

Rules:
- ${c} criteria, weights sum to 100.
- ${levels}-level scale labeled top to bottom (Exemplary→Beginning style).
- Each descriptor: 1 sentence, concrete and observable.
- Grade level: ${gradeLevel}.`;

    const userPrompt = `Assignment: ${assignment}\nGrade Level: ${gradeLevel}\nReturn ONLY the JSON object.`;

    const key = Deno.env.get('LOVABLE_API_KEY')!;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 90000);
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        response_format: { type: 'json_object' },
        max_completion_tokens: 4000,
      }),
      signal: controller.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: 'AI rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ error: 'AI generation failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const j = await res.json();
    const content = j.choices?.[0]?.message?.content;
    if (!content) return new Response(JSON.stringify({ error: 'Empty AI response' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let rubric;
    try { rubric = JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      rubric = JSON.parse(m[0]);
    }

    return new Response(JSON.stringify({ rubric, creditsUsed: 3, remaining: usage.remaining }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('rubric-builder error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
