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

    await supabase.rpc('throttle_user', { p_user_id: userId, p_endpoint: 'quiz-generator', p_window_seconds: 3600, p_max_reqs: 10 });

    const body = await req.json();
    const { topic, gradeLevel, numQuestions, questionType, difficulty } = body;
    if (!topic?.trim() || !gradeLevel?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required fields: topic, gradeLevel' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const mod = await moderateContent(topic, 'quiz-generator', userId, 'low');
    if (mod.flagged) return new Response(JSON.stringify({ error: 'Content flagged', details: mod.categories }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: usage, error: uErr } = await supabase.rpc('check_and_increment_ai_usage', { p_user_id: userId, p_tool_name: 'quiz-generator', p_credits_to_use: 4 });
    if (uErr || !usage?.can_use) return new Response(JSON.stringify({ error: 'Insufficient credits', reason: usage?.reason }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const n = Math.min(Math.max(parseInt(numQuestions) || 10, 3), 25);
    const type = ['multiple-choice', 'short-answer', 'true-false', 'mixed'].includes(questionType) ? questionType : 'mixed';

    const systemPrompt = `You are an expert assessment designer. Generate a quiz as ONLY valid JSON (no markdown).

Schema:
{
  "title": "Quiz title",
  "instructions": "Brief student-facing instructions",
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice" | "short-answer" | "true-false",
      "prompt": "The question text",
      "options": ["A", "B", "C", "D"],   // multiple-choice only; omit for others
      "answer": "The correct answer (letter for MC, text otherwise)",
      "explanation": "1-2 sentence explanation"
    }
  ]
}

Rules:
- ${n} questions total.
- Question type: ${type}. If "mixed", vary across MC, true-false, and short-answer.
- Calibrate difficulty to grade level ${gradeLevel}.
- Multiple-choice = exactly 4 options, one correct.
- Avoid trick questions.`;

    const userPrompt = `Topic: ${topic}\nGrade Level: ${gradeLevel}\nDifficulty: ${difficulty || 'medium'}\nReturn ONLY the JSON object.`;

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

    let quiz;
    try { quiz = JSON.parse(content); } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (!m) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      quiz = JSON.parse(m[0]);
    }

    return new Response(JSON.stringify({ quiz, creditsUsed: 4, remaining: usage.remaining }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('quiz-generator error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unexpected error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
