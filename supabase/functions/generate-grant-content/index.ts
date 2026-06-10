import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { extractContent } from "../_shared/aiResponse.ts";
import { generateRaw, systemUser } from "../_shared/aiGenerate.ts";

// Validation schema
const grantDataSchema = z.object({
  organizationName: z.string().min(1).max(300),
  projectTitle: z.string().min(1).max(300),
  projectDescription: z.string().min(1).max(5000),
  grantAmountRequested: z.string().max(100),
  purposeOfFunds: z.string().max(2000),
  targetPopulation: z.string().max(1000),
  projectGoals: z.string().max(2000),
  projectTimeline: z.string().max(1000),
  communityImpact: z.string().max(2000),
  sustainabilityPlan: z.string().max(2000),
  organizationBackground: z.string().max(2000),
  contactPersonName: z.string().max(200),
  contactTitle: z.string().max(200),
  contactEmail: z.string().email().max(200),
  contactPhone: z.string().max(50),
  additionalInformation: z.string().max(2000).optional(),
  grantRequirements: z.string().max(2000).optional(),
  // Budget fields (optional)
  budgetPersonnel: z.string().max(100).optional(),
  budgetEquipment: z.string().max(100).optional(),
  budgetSupplies: z.string().max(100).optional(),
  budgetTravel: z.string().max(100).optional(),
  budgetContractual: z.string().max(100).optional(),
  budgetOther: z.string().max(100).optional(),
  budgetIndirect: z.string().max(100).optional(),
  budgetIndirectRate: z.string().max(20).optional(),
  matchingFunds: z.string().max(100).optional(),
  matchingFundsSource: z.string().max(500).optional(),
  budgetNotes: z.string().max(2000).optional(),
});

serve(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "generate-grant-content",
      cost: 5,
      requireAuth: true,
      maxReqsPerMinute: 20
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = grantDataSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const grantData = validation.data;
    
    // Content moderation (medium risk - fail open)
    const moderationText = `${grantData.projectDescription} ${grantData.purposeOfFunds} ${grantData.projectGoals} ${grantData.communityImpact}`;
    const moderationResult = await moderateContent(moderationText, 'generate-grant-content', userId, 'medium');
    
    if (moderationResult.flagged) {
      console.warn('Content flagged by moderation:', moderationResult.categories);
      return new Response(
        JSON.stringify({ 
          error: 'Content policy violation detected',
          details: 'Your grant information contains content that violates our policies. Please revise and try again.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable AI key not found');
    }

    const systemPrompt = `You are a senior grant writer. Produce two outputs: a full Grant Proposal and a concise Letter of Intent (LOI), both tailored to the user's project and organization.

Output format (JSON):
{
  "proposal": "string - full proposal with clear headings and subsections",
  "letterOfIntent": "string - 4–7 paragraphs, formal LOI"
}

Guidelines:
- Voice: confident, specific, outcome-focused, measurable, and funder-aligned
- Tie every section back to: goals, target population, measurable outcomes, sustainability, and budget use
- Avoid repetition, filler phrases, and generic claims
- Use the provided details verbatim where appropriate and keep narrative cohesive
- Numbers: include quantifiable outcomes, timelines, KPIs, and evaluation methods
- Structure proposal with clear sections: Executive Summary; Need/Problem; Goals & Objectives; Program Design; Implementation Plan & Timeline; Target Population & Community Impact; Evaluation Plan (metrics and methods); Organizational Capacity; Budget & Justification; Sustainability; Conclusion
- LOI: formal letter on behalf of the organization, under 700 words, referencing fit and high-level budget use
- Keep formatting plain text (no markdown code fences)

Length targets:
- Proposal: 1200–2000 words (concise but complete)
- LOI: 300–600 words

GRANT APPLICATION DETAILS:
- Organization: ${grantData.organizationName}
- Project Title: ${grantData.projectTitle}
- Project Description: ${grantData.projectDescription}
- Amount Requested: ${grantData.grantAmountRequested}
- Purpose: ${grantData.purposeOfFunds}
- Target Population: ${grantData.targetPopulation}
- Project Goals: ${grantData.projectGoals}
- Timeline: ${grantData.projectTimeline}
- Community Impact: ${grantData.communityImpact}
- Sustainability Plan: ${grantData.sustainabilityPlan}
- Organization Background: ${grantData.organizationBackground}
- Contact Person: ${grantData.contactPersonName}, ${grantData.contactTitle}
- Contact Email: ${grantData.contactEmail}
- Contact Phone: ${grantData.contactPhone}
${grantData.additionalInformation ? `- Additional Information: ${grantData.additionalInformation}` : ''}
${grantData.grantRequirements ? `- Grant Requirements: ${grantData.grantRequirements}` : ''}

Return ONLY JSON as specified (no preamble).`;
    console.log('🚀 Starting grant generation...');
    const maxTokens = 8000;
    let data: unknown;
    try {
      data = await generateRaw(lovableApiKey, systemUser(systemPrompt, `Using the provided grant data, generate the proposal & LOI. Project title: ${grantData.projectTitle}. Focus on measurable outcomes, impact, and realistic budget justification.`), { maxTokens });
      console.log('✅ Generation completed successfully');
      console.log('⏱️ Response Time:', Date.now() - startTime, 'ms');
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings → Cloud → Usage.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[generate-grant-content] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let grantContent;
    try {
      grantContent = JSON.parse(extractContent(data));
    } catch (parseError) {
      console.log('JSON parsing failed, using regex fallback');
      const content = extractContent(data);
      
      // Try multiple regex patterns for more robust parsing
      const proposalMatch = 
        content.match(/```proposal\n([\s\S]*?)\n```/s) ||
        content.match(/"proposal":\s*"([\s\S]*?)"/s) ||
        content.match(/GRANT PROPOSAL[\s\S]*?\n\n([\s\S]*?)(?=LETTER OF INTENT|$)/i) ||
        content.match(/## Full Grant Proposal\n\n([\s\S]*?)(?=## Letter of Intent|$)/i);
        
      const loiMatch = 
        content.match(/```letterOfIntent\n([\s\S]*?)\n```/s) ||
        content.match(/"letterOfIntent":\s*"([\s\S]*?)"/s) ||
        content.match(/LETTER OF INTENT[\s\S]*?\n\n([\s\S]*?)$/i) ||
        content.match(/## Letter of Intent\n\n([\s\S]*?)$/i);
      
      console.log('Regex parsing results:', {
        foundProposal: !!proposalMatch,
        foundLOI: !!loiMatch,
        proposalLength: proposalMatch?.[1]?.length || 0,
        loiLength: loiMatch?.[1]?.length || 0
      });
      
      grantContent = {
        proposal: proposalMatch?.[1]?.trim() || content.trim(),
        letterOfIntent: loiMatch?.[1]?.trim() || generateFallbackLOI(grantData)
      };
    }

    // Log parsed content details
    console.log('=== Parsed Content Debug ===');
    console.log('Proposal Length:', grantContent.proposal?.length || 0);
    console.log('Proposal Preview:', grantContent.proposal?.slice(0, 200) || 'EMPTY');
    console.log('LOI Length:', grantContent.letterOfIntent?.length || 0);
    console.log('LOI Preview:', grantContent.letterOfIntent?.slice(0, 200) || 'EMPTY');

    // Validate content exists and is substantial
    const proposalLength = grantContent.proposal?.length || 0;
    const loiLength = grantContent.letterOfIntent?.length || 0;
    
    if (proposalLength < 800 || loiLength < 400) {
      console.error('Generated content too short:', { proposalLength, loiLength });
      return new Response(
        JSON.stringify({ 
          error: 'Generated content is incomplete',
          details: 'The AI generated content that is too short. Please add more details to your form and try again.',
          proposalLength,
          loiLength
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await logRequest(guardResult.supabase, {
      userId,
      endpoint: "generate-grant-content",
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 5,
      requestDurationMs: Date.now() - startTime
    });

    return new Response(
      JSON.stringify(grantContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in generate-grant-content:', error);
    
    // Use service client for error logging since guardResult might not exist if guard failed
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    await logRequest(serviceClient, {
      userId,
      endpoint: "generate-grant-content",
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: false,
      creditsCharged: 0,
      errorMessage: error.message || 'Unknown error',
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred generating grant content'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function generateFallbackLOI(grantData: any): string {
  return `LETTER OF INTENT

${new Date().toLocaleDateString()}

Dear Grant Review Committee,

${grantData.organizationName} respectfully submits this Letter of Intent for the "${grantData.projectTitle}" project. We are seeking $${grantData.grantAmountRequested} to support this vital initiative that will create meaningful impact in our community.

PROJECT OVERVIEW
${grantData.projectDescription}

Our organization has a proven track record of successful project implementation and community engagement. This project aligns with our mission and will directly benefit ${grantData.targetPopulation}.

We believe this project represents an excellent opportunity to advance our shared goals of community development and positive social impact. We would be honored to submit a full proposal for your consideration.

Thank you for your time and consideration.

Sincerely,

${grantData.contactPersonName}
${grantData.contactTitle}
${grantData.organizationName}
${grantData.contactEmail}
${grantData.contactPhone}`;
}