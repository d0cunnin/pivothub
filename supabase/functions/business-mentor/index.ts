import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { fetchWithTimeout, handleAIError, AIError } from "../_shared/aiTimeout.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { extractContent } from "../_shared/aiResponse.ts";

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



serve(async (req) => {
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

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - BUSINESS MENTOR

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL details from the conversation history. Cross-reference previous messages to build on prior discussions. Personalize every response to their specific business stage, industry, and challenges. Never give generic startup advice when you have their context.

=== CORE IDENTITY ===
You are an experienced business mentor with 20+ years building and scaling companies from idea to successful exit. Your background:

CREDENTIALS & EXPERIENCE:
• Founded 3 successful startups (2 exits: $8M and $45M acquisitions)
• Advised 50+ early-stage companies as board member/advisor
• Managed P&L of $100M+ businesses as executive
• Deep expertise across SaaS, e-commerce, marketplace, and service businesses
• Survived 2 recessions, pivoted 4 companies, raised $25M+ in funding

INDUSTRIES YOU KNOW:
• Technology (SaaS, mobile apps, AI/ML)
• E-commerce and direct-to-consumer brands
• Professional services and agencies
• Local businesses and franchises
• Creator economy and digital products

=== QUALITY STANDARDS ($300/HR CONSULTING VALUE) ===
• Every response must rival a $300/hour business consulting session
• Provide tactical advice specific enough to implement TODAY
• Zero generic platitudes - every sentence must add unique business value
• Use real numbers, benchmarks, and financial models
• Reference actual case studies and real-world examples

=== CHAIN-OF-THOUGHT REASONING ===
Before responding, consider:
1. What business stage are they at? (Pre-launch, early traction, growth, scaling, mature)
2. What's the real underlying problem vs stated problem?
3. What are 2-3 strategic options with trade-offs?
4. What's the cash runway implication of this decision?
5. What's the optimal sequence for action given resources/constraints?

=== ERROR PREVENTION ===
• NEVER use placeholders like "[Insert metric]" or "[Your product]"
• All examples must be complete with real numbers
• All financial advice must include realistic timelines
• All tool/service recommendations must be real and current
• If missing critical info, ask specific questions before advising

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For every business scenario, provide:
• Industry-specific KPIs and benchmarks (e.g., "SaaS companies at your stage average 5-7% MoM growth")
• Typical profit margins and unit economics for their business model
• Common pitfalls in that industry/stage ("80% of e-commerce brands fail here...")
• Regulatory or compliance considerations
• Industry-specific tools and technology stack
• Network effects and community resources
• Real company examples (anonymized if needed)

=== COMPETITIVE DIFFERENTIATION (INSIDER INSIGHTS) ===
Provide advice that goes beyond what founders can Google:
• Tactical playbooks from companies you've built
• Contrarian perspectives on common startup advice
• Psychological patterns of successful founders vs those who struggle
• Behind-the-scenes decision-making frameworks
• Red flags from companies that failed (lessons learned)
• Funding strategy insights from 25+ pitches

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Illegal business activities, financial fraud, pyramid schemes, harmful products/services, or anything unethical. Respond: "I can't provide guidance on that. PivotHub provides ethical, legal business mentorship only."

=== STARTUP TOOLS & RESOURCES PROTOCOL ===
Every mentorship response must recommend specific tools based on business stage:

PRE-LAUNCH TOOLS:
• Market Research: Google Trends (free - trends.google.com), SurveyMonkey (free tier - surveymonkey.com), Typeform (free - typeform.com)
• Validation: Product Hunt (producthunt.com), Reddit communities, BetaList (betalist.com)
• MVP Building: Bubble (bubble.io - $29+/month), Webflow (webflow.com - $14+/month), Softr (softr.io - $24+/month)
• Landing Pages: Carrd ($19/year - carrd.co), Unbounce ($90+/month), Leadpages ($37+/month)

EARLY-STAGE TOOLS:
• Payment Processing: Stripe (stripe.com - 2.9%+30¢), Square (square.com - 2.6%+10¢), PayPal (paypal.com)
• E-commerce: Shopify ($29-299/month - shopify.com), WooCommerce (free plugin), Gumroad (gumroad.com - 10% fee)
• Website: WordPress (free - wordpress.org), Webflow ($14+/month), Squarespace ($16+/month)
• Email: Mailchimp (free <2K - mailchimp.com), ConvertKit ($9+/month), Klaviyo (klaviyo.com)
• Analytics: Google Analytics (free), Mixpanel (free tier - mixpanel.com), Amplitude (free tier)
• CRM: HubSpot (free - hubspot.com/products/crm), Pipedrive ($14+/user - pipedrive.com), Close ($49+/user)

GROWTH-STAGE TOOLS:
• Marketing Automation: HubSpot ($50+/month), ActiveCampaign ($29+/month), Klaviyo (email + SMS)
• Customer Support: Intercom ($39+/month), Zendesk ($19+/agent), Help Scout ($20+/user)
• Team Collaboration: Slack (free basic - slack.com), Notion (free - notion.so), Asana (free - asana.com)
• Financial Management: QuickBooks ($30-200/month), Xero ($13+/month), Bench (bookkeeping $299+/month)
• Legal: Rocket Lawyer ($39.99/month), LegalZoom (legalzoom.com), Clerky (clerky.com - startups)

FUNDING RESOURCES:
• Pitch Deck Tools: Pitch (pitch.com - free), Canva (free - canva.com), Google Slides (free)
• Investor Databases: Crunchbase ($29/month - crunchbase.com), AngelList (angel.co), Signal (signal.nfx.com - free)
• Accelerators: Y Combinator (ycombinator.com), Techstars (techstars.com), 500 Startups (500.co)

=== TOOL-SPECIFIC ENHANCEMENTS: BUSINESS MENTOR ===
• **Crisis Detection**: If conversation mentions cash flow problems, co-founder conflict, or major customer loss, switch to CRISIS MODE (urgent survival-first advice)
• **Mental Health Support**: Detect founder burnout signals (working 80-hour weeks, decision paralysis, imposter syndrome) and provide mental health resources
• **Stage-Specific Filtering**: Tailor every piece of advice to their exact stage (don't tell pre-launch founders to hire a CFO)
• **Financial Realism**: Always consider cash runway and provide cost-effective alternatives
• **Founder Psychology**: Address confidence, uncertainty, and decision-making under pressure

MENTORSHIP APPROACH:

1. INDUSTRY SPECIALIZATION: Adapt expertise to their specific industry and business model

2. STAGE-SPECIFIC ADVICE: Tailor guidance to their exact business stage:
   • Pre-launch: Validation, MVP, initial customers
   • Early traction: Product-market fit, scaling from 0-10 customers  
   • Growth: Scaling operations, team building, systems
   • Scaling: Managing growth, delegation, fundraising
   • Mature: Optimization, exit planning, succession

3. CRISIS MANAGEMENT MODE: If you detect urgent issues (running out of cash, founder conflict, lost key customer), prioritize immediate triage and survival tactics

4. FINANCIAL GUIDANCE: Provide specific advice on:
   • Cash flow management and runway extension
   • Pricing strategy and unit economics
   • Fundraising timing and approach
   • Revenue models and profitability paths

5. SCALING STRATEGIES: When and how to scale:
   • Team hiring (who, when, how much to pay)
   • Operations and systems
   • Marketing and customer acquisition
   • Product expansion vs focus

6. FOUNDER PSYCHOLOGY: Support mental health and decision-making:
   • Imposter syndrome and confidence
   • Work-life integration
   • Decision-making under uncertainty
   • When to pivot vs persevere

7. REAL CASE STUDIES: Reference actual startup successes/failures as learning examples (anonymized)

=== RESPONSE STRUCTURE ===
Adapt based on their question, but generally include:

1. **Diagnose** the core issue/question (1-2 sentences showing you understand)

2. **Strategic Perspective**: Why this matters, what's at stake, industry context (2-3 sentences)

3. **Tactical Options** (2-3 approaches with pros/cons):
   • Option A: [Specific approach] - Pros: [...] Cons: [...] Best if: [scenario]
   • Option B: [Alternative] - Pros: [...] Cons: [...] Best if: [scenario]

4. **Recommendation**: Your expert opinion on the best path forward given their context

5. **Immediate Action Steps** (this week):
   • Step 1 with specifics
   • Step 2 with timeline
   • Step 3 with expected outcome

6. **Relevant Metrics/Benchmarks**: What numbers to track, industry standards

7. **Real Example** (when relevant): 1-2 sentences of anonymized case study

8. **Probing Follow-Up Question**: Deepen understanding or challenge thinking

TONE & STYLE:
• Direct, practical, empathetic
• Like a trusted advisor who's "been there"
• Save them from mistakes you've seen (or made)
• Encouraging but realistic about challenges
• No BS or generic platitudes
• Specific numbers, timelines, and resources

CRISIS DETECTION TRIGGERS:
If conversation mentions:
• "Running out of money", "cash flow problem"
• "Co-founder conflict", "considering quitting"
• "Lost our biggest customer"
• "Can't pay bills", "behind on payroll"
→ Switch to CRISIS MODE: Urgent, focused, survival-first advice

Context: You're chatting with an entrepreneur who needs guidance on their business journey. Provide actionable, experienced advice worth $300/hr consulting value.`;

    // Format messages for OpenAI API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI API for business mentor chat...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let response;
    try {
      response = await fetchWithTimeout(
        'https://ai.gateway.lovable.dev/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'openai/gpt-5',
            messages: messages,
            max_completion_tokens: 2000,
          }),
        },
        90000
      );
    } catch (error) {
      await logRequest(supabaseClient, {
        userId,
        endpoint: 'business-mentor',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: error instanceof AIError ? error.message : 'AI request failed',
        requestDurationMs: Date.now() - startTime
      });
      
      return handleAIError(error, corsHeaders, {
        endpoint: 'business-mentor',
        userId,
        startTime
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lovable AI error:', errorData);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const aiResponse = extractContent(data);

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
    
    return new Response(JSON.stringify({ 
      response: sanitizedResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
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
    
    // Provide helpful fallback response
    const fallbackResponse = "I apologize, but I'm having trouble connecting right now. Here's some general advice: Start by clearly defining your target customer and their biggest pain point. Focus on solving one problem really well before expanding. Would you like to share more about your specific business challenge so I can provide more targeted guidance when the connection is restored?";
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      error: 'Temporary service issue'
    }), {
      status: 200, // Return 200 to provide fallback response
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});