import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, deductCreditsOnSuccess, corsHeaders } from '../_shared/guard.ts';
import { generateJson, systemUser } from '../_shared/aiGenerate.ts';

const BUILD_VERSION = "2025-01-12-v2";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let guardResult;
  try {
    guardResult = await guard(req, {
      endpoint: '/prompt-it',
      cost: 1,
      requireAuth: true,
      requireCaptcha: false
    });
  } catch (err) {
    console.error('Guard error:', err);
    if (err instanceof Response) {
      return err;
    }
    return new Response(JSON.stringify({ error: err.message || 'Guard check failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { supabase, userId, ip, startTime } = guardResult;

  console.log(`[PROMPT-IT] Build version: ${BUILD_VERSION}`);

  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Valid prompt is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    const systemPrompt = `You are a world-renowned prompt engineer from a leading tech company.
Analyze the user's prompt and provide:
1. Assessment of why it's unclear or weak (if applicable)
2. Specific improvements needed (context, audience, tone)
3. A detailed rewritten example that's professional and effective
4. Professional explanation of the structure you used

Keep feedback constructive, clear, and educational.

CRITICAL: Return ONLY valid JSON with no additional text or markdown. Your entire response must be parseable JSON with these exact keys:
- analysis: string (your assessment)
- improvedPrompt: string (the rewritten prompt)
- explanation: string (explanation of improvements)`;

    interface PromptAnalysis {
      analysis: string;
      improvedPrompt: string;
      explanation: string;
    }

    let result: PromptAnalysis;
    try {
      result = await generateJson<PromptAnalysis>(
        LOVABLE_API_KEY,
        systemUser(systemPrompt, `Analyze this prompt: "${prompt}"`),
        { maxTokens: 1200 }
      );
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again in a few moments.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({
          error: 'AI credits exhausted. Please add credits in Settings.'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.error('[prompt-it] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate required fields
    if (!result.analysis || !result.improvedPrompt || !result.explanation) {
      return new Response(JSON.stringify({
        error: 'Incomplete response from AI. Please try again.'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await deductCreditsOnSuccess(
      supabase,
      userId,
      '/prompt-it',
      1
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in prompt-it function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred. Please try again.' 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
