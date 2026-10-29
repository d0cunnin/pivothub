import { withCreditRequest } from '../_shared/guard.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"
import { guard, logRequest, corsHeaders, deductCreditsOnSuccess } from "../_shared/guard.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { moderateContent } from "../_shared/moderation.ts"
import { generateText } from "../_shared/aiGenerate.ts";
import { CHAT_STYLE_RULES } from "../_shared/chatStyle.ts";

// Input validation schema
const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  isBot: z.boolean()
})

const careerAdvisorSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
  conversationHistory: z.array(chatMessageSchema).max(20, "Conversation history too long").default([])
})

// Moderation uses shared helper from _shared/moderation.ts (logs to moderation_log, fails open)


serve(withCreditRequest(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "career-advisor",
      cost: 1,
      requireAuth: true,
      maxReqsPerMinute: 40
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const requestBody = await req.json()
    
    // Validate input
    const validation = careerAdvisorSchema.safeParse(requestBody)
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
      )
    }

    const { message, conversationHistory } = validation.data

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('Lovable AI key not found');
      throw new Error('Lovable AI key not configured');
    }

    // Check content moderation
    console.log('Checking content moderation...');
    const moderationResult = await moderateContent(message, 'career-advisor', userId, 'medium');
    
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

const systemPrompt = `You are PivotHub's AI Career Advisor. You help people change careers, find work after a job loss, build new skills, improve resumes, prepare for interviews, network, and negotiate pay.

WHAT GOOD HELP LOOKS LIKE:
- Practical, specific steps tailored to what the user has told you in this conversation (remember earlier messages).
- Help them see how their past experience transfers to new roles, in simple words.
- Realistic about timelines and challenges, without discouraging them.
- When they ask for a message, script or resume line, write a short one they can copy, using only details they gave you. Never make up employers, numbers or achievements for them.
- If someone sounds overwhelmed or upset, acknowledge it kindly first, then keep the next steps small.
- Helpful free or low-cost resources you may suggest when relevant: LinkedIn, Indeed, the U.S. Department of Labor's CareerOneStop (careeronestop.org) and local American Job Centers, the Bureau of Labor Statistics Occupational Outlook Handbook (bls.gov/ooh) for pay and job outlook, and free courses through public libraries.

SAFETY: Refuse any request about sexual content, crime, self-harm, suicide, violence, or drugs with: "This type of content is not allowed on PivotHub. I provide safe, professional career guidance only." If someone mentions thoughts of self-harm, also share: "If you are in crisis, please call or text 988 (Suicide & Crisis Lifeline, U.S.)."
${CHAT_STYLE_RULES}`
    const messages: { role: "system" | "user" | "assistant"; content: any }[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: (msg.isBot ? "assistant" : "user") as "assistant" | "user",
        content: msg.text
      })),
      { role: "user", content: message }
    ]

    let aiResponse: string;
    try {
      aiResponse = await generateText(lovableApiKey, messages, { maxTokens: 1500 });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'Our AI service is temporarily unavailable. Please try again later. You were not charged.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[career-advisor] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Sanitize AI response to remove markdown formatting
    const sanitizedResponse = aiResponse
      .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove triple asterisks
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/^\s*[-*+]\s+/gm, '• ') // Clean up bullet points
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/#{2,}/g, '') // Remove any remaining hash symbols
      .replace(/\s{2,}/g, ' ') // Clean up extra spaces
      .trim()

    await logRequest(guardResult.supabase, {
      endpoint: "career-advisor",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 1,
      requestDurationMs: Date.now() - startTime
    });

    await deductCreditsOnSuccess(guardResult.supabase, guardResult.userId!, 'career-advisor', 1);
    
    return new Response(
      JSON.stringify({ response: sanitizedResponse }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    // Guard / credit-check errors are thrown as Response objects
    if (error instanceof Response) return error;
    console.error('Error in career-advisor function:', error)
    
    // Use service client in catch to ensure logging even if guard failed
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await logRequest(serviceClient, {
      endpoint: "career-advisor",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: false,
      creditsCharged: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment, or rephrase your question.',
        fallback: true
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
}))