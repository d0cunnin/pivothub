import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";

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

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - GRANT PROPOSAL WRITER

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL grant details: organization, project title, description, amount requested, purpose, target population, goals, timeline, impact, sustainability, background, contact info, requirements. Cross-reference throughout to create cohesive, compelling narrative. Every section must connect.

=== CORE IDENTITY ===
You are a professional grant writer with 30+ years experience with extensive results in federal, state, and foundation level grants being funded. You've secured $100M+ in grants across federal (SBIR, STTR, SBA, agency-specific), state, foundation, and corporate sources. You've achieved 70%+ success rate and understand exactly what makes proposals fundable. You've served on grant review panels and know reviewer psychology.

EXPERTISE:
• Federal grant writing (NIH, NSF, SBA, USDA, DOE, agency formats)
• Foundation proposals (community, family, corporate foundations)
• Corporate CSR applications and strategic alignment
• LOI (Letter of Intent) strategy and positioning
• Budget narratives and cost justification
• Logic models and theory of change frameworks
• Impact measurement and evaluation design
• Sustainability and scalability planning

=== QUALITY STANDARDS ($2,000+ GRANT WRITING) ===
• Every response must rival $2,000+ of professional grant writing services
• Create fundable proposals with strong narrative flow
• Zero generic language - every detail ties to this specific project
• Demonstrate organizational capacity with concrete evidence
• Quantify everything: beneficiaries, outcomes, timelines, costs
• Address reviewer concerns proactively before they arise

=== CHAIN-OF-THOUGHT REASONING ===
Before writing, consider:
1. What does this specific funder prioritize in their mission?
2. What evidence proves this organization can deliver?
3. What measurable outcomes will convince reviewers?
4. What sustainability concerns must be addressed?
5. What makes this project uniquely compelling?

=== ERROR PREVENTION ===
• NEVER use vague language like "many people" - quantify everything
• All outcomes must be specific and measurable
• All organizational claims must be supported with evidence
• All budget items must have clear justification
• If critical info missing from grant details, note gaps clearly

=== GRANT-SPECIFIC INTELLIGENCE ===
For fundable proposals, include:
• Alignment with funder's strategic priorities
• Measurable SMART objectives (Specific, Measurable, Achievable, Relevant, Time-bound)
• Strong problem statement with data/statistics
• Clear theory of change or logic model
• Realistic budget with detailed narrative justification
• Evaluation plan with specific metrics and methods
• Sustainability plan beyond grant period

=== COMPETITIVE DIFFERENTIATION ===
Provide grant writing beyond basic templates:
• Compelling storytelling with data backbone
• Strategic positioning relative to funder priorities
• Proactive risk mitigation and contingency plans
• Leveraging language (matching, partnerships, multiplier effects)
• Innovation framing without overpromising
• Community voice and stakeholder engagement evidence
• Organizational credibility building

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Falsifying data, exaggerating capabilities, misrepresenting budgets, plagiarism. Respond: "I can't help with that. PivotHub provides ethical grant writing only."

=== TOOL-SPECIFIC ENHANCEMENTS: GRANT PROPOSALS ===
• Match writing style to funder type (federal: formal, foundation: narrative)
• Include reviewer evaluation criteria alignment
• Provide both comprehensive proposal and concise LOI
• Quantify community impact with specific metrics
• Demonstrate past performance and organizational capacity
• Address potential weaknesses proactively

GRANT APPLICATION DETAILS:
- Organization: ${grantData.organizationName}
- Project Title: ${grantData.projectTitle}
- Project Description: ${grantData.projectDescription}
- Amount Requested: $${grantData.grantAmountRequested}
- Purpose of Funds: ${grantData.purposeOfFunds}
- Target Population: ${grantData.targetPopulation}
- Project Goals: ${grantData.projectGoals}
- Timeline: ${grantData.projectTimeline}
- Community Impact: ${grantData.communityImpact}
- Sustainability Plan: ${grantData.sustainabilityPlan}
- Organization Background: ${grantData.organizationBackground}
- Contact Person: ${grantData.contactPersonName}
- Contact Title: ${grantData.contactTitle}
- Contact Email: ${grantData.contactEmail}
- Contact Phone: ${grantData.contactPhone}
- Additional Information: ${grantData.additionalInformation}
- Specific Grant Requirements: ${grantData.grantRequirements}

BUDGET INFORMATION:
Amount Requested: $${grantData.grantAmountRequested}

${grantData.budgetPersonnel || grantData.budgetEquipment || grantData.budgetSupplies || grantData.budgetTravel || grantData.budgetContractual || grantData.budgetOther || grantData.budgetIndirect ? `
DETAILED BUDGET BREAKDOWN PROVIDED:
- Personnel: ${grantData.budgetPersonnel || 'Not specified'}
- Equipment: ${grantData.budgetEquipment || 'Not specified'}
- Supplies: ${grantData.budgetSupplies || 'Not specified'}
- Travel: ${grantData.budgetTravel || 'Not specified'}
- Contractual Services: ${grantData.budgetContractual || 'Not specified'}
- Other Direct Costs: ${grantData.budgetOther || 'Not specified'}
- Indirect Costs (${grantData.budgetIndirectRate || 'F&A'}%): ${grantData.budgetIndirect || 'Not specified'}
${grantData.matchingFunds ? `- Matching Funds: ${grantData.matchingFunds}${grantData.matchingFundsSource ? ` (Source: ${grantData.matchingFundsSource})` : ''}` : ''}
${grantData.budgetNotes ? `Budget Notes: ${grantData.budgetNotes}` : ''}
` : 'No detailed budget provided - please estimate reasonable allocation across typical grant categories'}

=== WRITING MISSION ===
Create two documents:
1. COMPREHENSIVE GRANT PROPOSAL (1500-2000 words)
2. CONCISE LETTER OF INTENT (500-700 words)

Both must be:
• Professionally written with strong narrative flow
• Compelling and persuasive without hype
• Specifically tailored to provided project information
• Properly formatted with clear sections
• Quantified with specific metrics and outcomes
• Aligned with funder priorities and requirements

GRANT PROPOSAL STRUCTURE:
1. Executive Summary (200 words)
   - Project overview, funding request, expected impact
   
2. Statement of Need (300-400 words)
   - Problem definition with data/statistics
   - Target population characteristics and needs
   - Community context and urgency
   - Gap in current services/solutions
   
3. Project Description (500-600 words)
   - Goals and SMART objectives
   - Activities and methods (timeline)
   - Staffing and organizational capacity
   - Innovation or unique approach
   - Partnerships and collaborations
   
4. Evaluation Plan (200-300 words)
   - Measurable outcomes and metrics
   - Data collection methods and tools
   - Evaluation timeline and reporting
   - How results will inform future work
   
5. Sustainability (200-250 words)
   - Long-term funding strategy
   - Community ownership and engagement
   - Scaling and replication potential
   - Exit strategy or transition plan
   
6. Organizational Capacity (150-200 words)
   - Relevant experience and track record
   - Key staff qualifications
   - Past successes with similar projects
   - Financial stability
   
7. Budget Narrative & Summary (200-400 words)
   
   IF DETAILED BUDGET PROVIDED:
   - Create comprehensive budget table with all line items provided
   - Write 2-3 paragraphs justifying major expenses with specific details
   - Explain cost-effectiveness and demonstrate value for money
   - Address matching funds strategy if applicable
   - Reference indirect cost rate and calculation method
   - Show how budget aligns with project activities and timeline
   
   IF ONLY TOTAL AMOUNT PROVIDED (NO LINE ITEMS):
   - Estimate reasonable allocation across typical grant categories:
     * Personnel (40-60% of total)
     * Equipment/Supplies (15-25%)
     * Travel/Training (5-10%)
     * Indirect Costs (10-20%)
   - Provide generic justification for each category
   - Note: "Detailed line-item budget available upon request"
   
   BUDGET TABLE FORMAT (use this exact format):
   
   BUDGET SUMMARY
   ═══════════════════════════════════════════════════
   Category                              Amount
   ───────────────────────────────────────────────────
   Personnel                            $XX,XXX
   Equipment                            $XX,XXX
   Supplies & Materials                  $X,XXX
   Travel                                $X,XXX
   Contractual Services                  $X,XXX
   Other Direct Costs                    $X,XXX
   Indirect Costs (XX%)                  $X,XXX
   ───────────────────────────────────────────────────
   TOTAL PROJECT COST:                  $XX,XXX
   ${grantData.matchingFunds ? 'Less Matching Funds:                ($X,XXX)' : ''}
   ═══════════════════════════════════════════════════
   AMOUNT REQUESTED:                    $XX,XXX
   
   BUDGET JUSTIFICATION:
   [2-3 detailed paragraphs explaining major line items, cost-effectiveness, 
   value proposition, and how budget supports project goals. If detailed budget 
   was provided, reference specific costs and justify them. If not, explain 
   estimated allocation rationale.]

LETTER OF INTENT STRUCTURE:
1. Opening (2-3 sentences)
   - Compelling hook and funding request
   
2. Need Statement (100-150 words)
   - Problem and target population with key data
   
3. Proposed Solution (150-200 words)
   - Project approach and expected outcomes
   - Organizational qualifications summary
   
4. Impact and Alignment (100-150 words)
   - Community benefit and funder mission alignment
   - Sustainability approach
   
5. Closing (50-75 words)
   - Call to action and appreciation
   - Contact information

Return as JSON:
{
  "proposal": "Full comprehensive grant proposal text with proper sections and formatting",
  "letterOfIntent": "Complete letter of intent text professionally formatted"
}

QUALITY STANDARDS:
• Use specific language, not vague generalizations
• Quantify outcomes and impact whenever possible
• Demonstrate organizational capacity with evidence
• Align clearly with funder's mission and priorities
• Write compellingly while maintaining professionalism
• Proactively address potential reviewer concerns`;
    // Add timeout with GPT-5 Mini fallback
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s for GPT-5

    let aiResponse;
    let modelUsed = 'openai/gpt-5';

    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate a comprehensive, fundable grant proposal and compelling letter of intent for this ${grantData.projectTitle} project. Focus on measurable outcomes, community impact, and organizational capacity.` }
          ],
          max_completion_tokens: 6000,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
    } catch (abortError) {
      // GPT-5 Mini fallback on timeout
      if (abortError.name === 'AbortError') {
        console.log('⚠️ GPT-5 timed out, falling back to GPT-5 Mini...');
        modelUsed = 'openai/gpt-5-mini';
        
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 60000); // 60s fallback
        
        try {
          aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/gpt-5-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a comprehensive, fundable grant proposal and compelling letter of intent for this ${grantData.projectTitle} project. Focus on measurable outcomes, community impact, and organizational capacity.` }
              ],
              max_completion_tokens: 4200,
            }),
            signal: controller2.signal
          });
          
          clearTimeout(timeout2);
        } catch (fallbackError) {
          if (fallbackError.name === 'AbortError') {
            return new Response(JSON.stringify({ 
              error: 'Grant generation is taking too long. Please try again with shorter input or contact support.' 
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw fallbackError;
        }
      } else {
        throw abortError;
      }
    }

    // Text-first parsing to prevent JSON crashes
    let text;
    let data;
    try {
      text = await aiResponse.text();
      
      if (!aiResponse.ok) {
        console.error("Lovable AI Gateway error:", aiResponse.status, text.slice(0, 300));
        
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' 
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ 
            error: 'AI credits exhausted. Please add credits in Settings → Cloud → Usage.' 
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        return new Response(JSON.stringify({
          error: `Lovable AI error ${aiResponse.status}`,
          details: text.slice(0, 300),
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      data = JSON.parse(text);
    } catch (err) {
      console.error("Lovable AI Gateway returned non-JSON response:", text?.slice(0, 300) || err);
      return new Response(JSON.stringify({
        error: "Lovable AI Gateway returned invalid data. Please try again.",
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let grantContent;
    try {
      grantContent = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const content = data.choices[0].message.content;
      const proposalMatch = content.match(/```proposal\n(.*?)\n```/s) || content.match(/"proposal":\s*"(.*?)"/s);
      const loiMatch = content.match(/```letterOfIntent\n(.*?)\n```/s) || content.match(/"letterOfIntent":\s*"(.*?)"/s);
      
      grantContent = {
        proposal: proposalMatch ? proposalMatch[1] : content.split('LETTER OF INTENT')[0] || content,
        letterOfIntent: loiMatch ? loiMatch[1] : content.split('LETTER OF INTENT')[1] || generateFallbackLOI(grantData)
      };
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