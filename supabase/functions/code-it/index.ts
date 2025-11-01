import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, deductCreditsOnSuccess, corsHeaders } from '../_shared/guard.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let guardResult;
  try {
    guardResult = await guard(req, {
      endpoint: '/code-it',
      cost: 1,
      requireAuth: true,
      requireCaptcha: false
    });
  } catch (err) {
    console.error('Guard error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { supabase, userId, ip, startTime } = guardResult;

  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      throw new Error('Valid code is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    const systemPrompt = `You are a patient coding teacher for absolute beginners.
Analyze the Python code provided and explain:
1. What each line does in simple, child-level terms
2. The expected output (if any)
3. Any potential errors, improvements, or tips

Use child-level clarity. Avoid jargon. Be encouraging and educational.
Format your response as JSON with these keys:
- explanation: string (explain what the code does)
- expectedOutput: string (what would this output if run)
- tips: string (helpful tips or improvements)`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Explain this code:\n\n${code}` }
        ],
        max_completion_tokens: 1200,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      throw new Error(`Lovable AI Gateway error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const result = JSON.parse(content);

    await deductCreditsOnSuccess(
      supabase,
      userId,
      '/code-it',
      1
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in code-it function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
