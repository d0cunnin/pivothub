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
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'prompt_analysis',
                description: 'Return structured analysis and improved prompt.',
                parameters: {
                  type: 'object',
                  properties: {
                    analysis: { type: 'string' },
                    improvedPrompt: { type: 'string' },
                    explanation: { type: 'string' }
                  },
                  required: ['analysis', 'improvedPrompt', 'explanation'],
                  additionalProperties: false
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'prompt_analysis' } }
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

      // More flexible content extractor with structural logging and fallbacks
      const extractContentFlexible = (data: any, rawText: string): string | null => {
        try {
          const msg = data?.choices?.[0]?.message;

          const hasToolCalls = Array.isArray(msg?.tool_calls) && msg.tool_calls.length > 0;
          const contentType = typeof msg?.content;
          const isContentArray = Array.isArray(msg?.content);
          const hasCandidates = Array.isArray(data?.candidates) && data.candidates.length > 0;

          console.log('[PROMPT-IT] Message shape:', {
            contentType,
            isContentArray,
            hasToolCalls,
            toolArgsType: typeof msg?.tool_calls?.[0]?.function?.arguments,
            hasCandidates,
          });

          // 1) Direct string content
          if (typeof msg?.content === 'string' && msg.content.trim()) {
            return msg.content;
          }

          // 2) Array content variants
          if (Array.isArray(msg?.content) && msg.content.length > 0) {
            const parts = msg.content
              .map((p: any) => {
                if (!p) return null;
                if (typeof p === 'string') return p;
                if (typeof p.text === 'string') return p.text;
                if (typeof p.content === 'string') return p.content;
                if ((p.type === 'text' || p.type === 'output_text') && typeof p.text === 'string') return p.text;
                return null;
              })
              .filter(Boolean);

            if (parts.length) return parts.join('').trim();
          }

          // 3) Tool calls (function calling)
          const toolArgs = msg?.tool_calls?.[0]?.function?.arguments;
          if (typeof toolArgs === 'string' && toolArgs.trim()) {
            return toolArgs;
          }
          if (toolArgs && typeof toolArgs === 'object') {
            try {
              return JSON.stringify(toolArgs);
            } catch { /* ignore */ }
          }

          // 3.5) Gemini candidates format (Lovable gateway sometimes returns this)
          const candidate = data?.candidates?.[0];
          if (candidate?.content?.parts && Array.isArray(candidate.content.parts)) {
            const parts = candidate.content.parts
              .map((p: any) => {
                if (typeof p === 'string') return p;
                if (typeof p?.text === 'string') return p.text;
                if (typeof p?.content === 'string') return p.content;
                return null;
              })
              .filter(Boolean);
            console.log('[PROMPT-IT] Gemini candidates parts:', { count: parts.length });
            if (parts.length) return parts.join('').trim();
          }

          // 4) Fallback: scan raw response for a JSON object that looks like our schema
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const candidate = jsonMatch[0];
            if (candidate.includes('"analysis"') && candidate.includes('"improvedPrompt"') && candidate.includes('"explanation"')) {
              return candidate;
            }
          }

          return null;
        } catch (e) {
          console.error('[PROMPT-IT] extractContentFlexible error:', e);
          return null;
        }
      };

      const content = extractContentFlexible(data, responseText);
      
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

      // Clean potential code fences before parsing
      const cleaned = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      let result;
      try {
        result = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('Failed to parse AI content:', cleaned.substring(0, 300));
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
