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
    // Guard throws Response objects with proper status codes
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

    const OPENAI_API_KEY = Deno.env.get('pivothub-openai-key');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
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
    console.error('Error in deploy-it function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
