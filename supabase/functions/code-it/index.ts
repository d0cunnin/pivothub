import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, deductCreditsOnSuccess, corsHeaders } from '../_shared/guard.ts';
import { generateJson, systemUser } from '../_shared/aiGenerate.ts';

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

    let result: any;
    try {
      result = await generateJson(LOVABLE_API_KEY, systemUser(systemPrompt, `Explain this code:\n\n${code}`), { maxTokens: 1200 });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[code-it] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
