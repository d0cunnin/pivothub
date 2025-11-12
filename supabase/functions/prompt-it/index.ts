import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, deductCreditsOnSuccess, corsHeaders } from '../_shared/guard.ts';

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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
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
            { role: 'user', content: `Analyze this prompt: "${prompt}"` }
          ]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Text-first parsing to handle non-JSON responses
      const responseText = await response.text();
      console.log('AI Gateway status:', response.status, 'Response length:', responseText.length);

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded. Please try again in a few moments.' 
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ 
            error: 'AI credits exhausted. Please add credits in Settings.' 
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        console.error('Lovable AI error:', response.status, responseText.substring(0, 300));
        return new Response(JSON.stringify({ 
          error: 'AI service temporarily unavailable. Please try again.' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', responseText.substring(0, 300));
        return new Response(JSON.stringify({ 
          error: 'Invalid response from AI. Please try again.' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Robust content extraction
      const extractContent = (data: any): string | null => {
        const msg = data?.choices?.[0]?.message;
        
        // Try string content first
        if (typeof msg?.content === 'string' && msg.content.trim()) {
          return msg.content;
        }
        
        // Try content array (for models that return structured content)
        if (Array.isArray(msg?.content) && msg.content.length > 0) {
          const textPart = msg.content.find((p: any) => typeof p.text === 'string' && p.text.trim());
          if (textPart?.text) return textPart.text;
        }
        
        // Try tool calls (some models may use function calling format)
        const toolArgs = msg?.tool_calls?.[0]?.function?.arguments;
        if (typeof toolArgs === 'string' && toolArgs.trim()) {
          return toolArgs;
        }
        
        return null;
      };

      const content = extractContent(data);
      
      if (!content) {
        const debugPreview = responseText.substring(0, 200);
        console.error('Empty response from AI. Debug preview:', debugPreview);
        return new Response(JSON.stringify({ 
          error: 'Empty response from AI. Please try again.' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log('AI response content length:', content.length);

      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse AI content:', content.substring(0, 300));
        return new Response(JSON.stringify({ 
          error: 'Invalid AI response format. Please try again.' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
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
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        return new Response(JSON.stringify({ 
          error: 'Request took too long. Please try a shorter prompt.' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw error;
    }
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
