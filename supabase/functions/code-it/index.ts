import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, deductCreditsOnSuccess, corsHeaders } from '../_shared/guard.ts';
import { chat } from '../_shared/openai.ts';

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await chat({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Explain this code:\n\n${code}` }
        ],
        maxOutputTokens: 1200,
        responseFormat: { type: "json_object" }
      });

      clearTimeout(timeoutId);

      if (!response.text) {
        throw new Error('Empty response from AI');
      }

      console.log('AI response length:', response.text.length);
      console.log('OpenAI Request ID:', response.requestId);

      const result = JSON.parse(response.text);

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
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error in code-it function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
