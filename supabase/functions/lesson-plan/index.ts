import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from '../_shared/moderation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const userId = user.id;

    await supabase.rpc('throttle_user', { p_user_id: userId, p_endpoint: 'lesson-plan', p_window_seconds: 3600, p_max_reqs: 10 });

    const body = await req.json();
    const { subject, gradeLevel, duration, objectives, materials } = body;
    if (!subject?.trim() || !gradeLevel?.trim() || !objectives?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required fields: subject, gradeLevel, objectives' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const mod = await moderateContent(`${subject} ${objectives}`, 'lesson-plan', userId, 'low');
    if (mod.flagged) return new Response(JSON.stringify({ error: 'Content flagged', details: mod.categories }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: usage, error: uErr } = await supabase.rpc('check_and_increment_ai_usage', { p_user_id: userId, p_tool_name: 'lesson-plan', p_credits_to_use: 5 });
    if (uErr || !usage?.can_use) return new Response(JSON.stringify({ error: 'Insufficient credits', reason: usage?.reason }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const systemPrompt = `You are an experienced curriculum designer. Produce a complete, classroom-ready lesson plan in clean Markdown.

Structure (use ## headings exactly):
## Lesson Overview
Subject, grade, duration, brief description.

## Learning Objectives
3-5 SMART objectives, Bloom's-aligned.

## Standards Alignment
Suggest relevant Common Core / NGSS / state standards by code where applicable.

## Materials Needed
Bulleted list.

## Lesson Sequence
### Warm-Up (5-10 min)
### Direct Instruction (10-20 min)
### Guided Practice (10-15 min)
### Independent Practice (10-15 min)
### Closure (5 min)
Each segment: clear teacher actions, student actions, and questions to ask.

## Differentiation
Strategies for advanced, on-level, ELL, and IEP students.

## Assessment
Formative and summative checks for understanding.

## Homework / Extension
Optional.

Be specific. No filler.`;

    const userPrompt = `Build a lesson plan with these details:
Subject: ${subject}
Grade Level: ${gradeLevel}
Duration: ${duration || '45 minutes'}
Learning Objectives: ${objectives}
Available Materials: ${materials || 'standard classroom supplies'}`;

    const key = Deno.env.get('LOVABLE_API_KEY')!;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 90000);
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_completion_tokens: 5000,
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

    return new Response(JSON.stringify({ content, creditsUsed: 5, remaining: usage.remaining }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('lesson-plan error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
