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
      endpoint: '/deploy-it',
      cost: 10,
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

  try {
    const { agentName, purpose, whoItHelps, tone, tools, safetyRules } = await req.json();

    if (!agentName || !purpose || !whoItHelps) {
      throw new Error('Agent name, purpose, and target audience are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    const toolsList = tools && tools.length > 0 ? tools.join(', ') : 'No tools specified';
    const userPrompt = `Agent Name: ${agentName}
Purpose: ${purpose}
Who It Helps: ${whoItHelps}
Tone: ${tone || 'Professional'}
Tools to Connect: ${toolsList}
Safety Rules: ${safetyRules || 'No specific rules provided'}`;

    const systemPrompt = `You are an AI agent design expert who teaches using child-level clarity.
Create a step-by-step plan for building an AI agent in OpenAI's Agent Builder.
Use numbered steps (with emoji), clear language, and practical examples.

Your plan should include:
1. Setup instructions (how to access platform.openai.com/agents)
2. Agent configuration details (name, purpose, tone)
3. Tool connections (if any)
4. Safety and testing guidance

Be encouraging, thorough, and avoid jargon. Write as if explaining to someone who is tech-comfortable but not a developer.
Format your response as JSON with these keys:
- blueprint: string (full step-by-step plan with numbered steps)
- tips: string (helpful tips for success)
- resources: array of strings (useful links or resources)`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 1500,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please add credits in Settings.');
        }
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        throw new Error(`Lovable AI error: ${response.status} - ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from AI');
      }

      console.log('AI response length:', content.length);

      const result = JSON.parse(content);

      await deductCreditsOnSuccess(
        supabase,
        userId,
        '/deploy-it',
        10
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
    console.error('Error in deploy-it function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
