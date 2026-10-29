import { withCreditRequest } from '../_shared/guard.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders, deductCreditsOnSuccess } from "../_shared/guard.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from "../_shared/moderation.ts";
import { generateText } from "../_shared/aiGenerate.ts";
import { CHAT_STYLE_RULES } from "../_shared/chatStyle.ts";

// Input validation schema
const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  isBot: z.boolean()
});

const businessMentorSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
  conversationHistory: z.array(chatMessageSchema).max(20, "Conversation history too long").default([])
});

// Moderation uses shared helper from _shared/moderation.ts (logs to moderation_log, fails open)



serve(withCreditRequest(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "business-mentor",
      cost: 1,
      requireAuth: true,
      maxReqsPerMinute: 40
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const requestBody = await req.json();
    
    // Validate input
    const validation = businessMentorSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.issues 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { message, conversationHistory } = validation.data;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('Lovable AI key not found');
      throw new Error('Lovable AI key not configured');
    }

    // Check content moderation
    console.log('Checking content moderation...');
    const moderationResult = await moderateContent(message, 'business-mentor', userId, 'medium');
    
    if (moderationResult.flagged) {
      console.warn('Content blocked by moderation:', moderationResult.categories);
      return new Response(
        JSON.stringify({ 
          error: 'inappropriate_content',
          message: 'Your message contains inappropriate content and cannot be processed. Please keep the conversation professional and respectful.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Processing business mentor chat with GPT-5...');

    const systemPrompt = `You are PivotHub's AI Business Mentor. You help people start and grow small businesses and side businesses: testing an idea, finding first customers, pricing, simple marketing, money and cash flow, legal basics, and staying motivated.

WHAT GOOD HELP LOOKS LIKE:
- Fit the advice to their stage (idea, just started, growing) and budget. Do not suggest expensive tools or hires to someone just starting.
- Remember what they told you earlier in the conversation and build on it.
- When it helps, offer 2 simple options with a quick pro and con for each, then say which you would pick and why.
- Prefer free and low-cost first steps. Well-known options you may mention when relevant: SBA (sba.gov) and SCORE free mentoring (score.org), local Small Business Development Centers, Canva, Google Business Profile, Square or Stripe for payments, Shopify or Etsy for selling online.
- If they mention running out of money, a partner conflict, or burnout, deal with the urgent problem first with calm, small steps.
- For legal, tax or licensing questions, give general guidance and suggest checking with their state, a local SBDC, or a professional.

SAFETY: Refuse requests about illegal activity, fraud, pyramid schemes, or harmful products with: "I can't provide guidance on that. PivotHub provides ethical, legal business mentorship only."
${CHAT_STYLE_RULES}`;

    // Format messages for OpenAI API
    const messages: { role: 'system' | 'user' | 'assistant'; content: any }[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: (msg.isBot ? 'assistant' : 'user') as 'assistant' | 'user',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    console.log('Calling AI for business mentor chat...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let aiResponse: string;
    try {
      aiResponse = await generateText(lovableApiKey, messages, { maxTokens: 1500 });
    } catch (err: any) {
      await logRequest(supabaseClient, {
        userId,
        endpoint: 'business-mentor',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: err instanceof Error ? err.message : 'AI request failed',
        requestDurationMs: Date.now() - startTime
      });
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'Our AI service is temporarily unavailable. Please try again later. You were not charged.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[business-mentor] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    // Clean up the response
    const sanitizedResponse = aiResponse
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .trim();

    await logRequest(guardResult.supabase, {
      endpoint: "business-mentor",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 1,
      requestDurationMs: Date.now() - startTime
    });

    await deductCreditsOnSuccess(guardResult.supabase, guardResult.userId!, 'business-mentor', 1);
    
    return new Response(JSON.stringify({ 
      response: sanitizedResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    // Guard / credit-check errors are thrown as Response objects
    if (error instanceof Response) return error;
    console.error('Error in business-mentor function:', error);
    
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await logRequest(serviceClient, {
      endpoint: "business-mentor",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: false,
      creditsCharged: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      requestDurationMs: Date.now() - startTime
    });
    
    // No canned advice: the user sees an error and can resend (not charged).
    return new Response(JSON.stringify({
      error: "Sorry, I couldn't respond just now. Please try again. You were not charged."
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}));