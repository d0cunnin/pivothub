import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { extractContent } from "../_shared/aiResponse.ts";

// Validation schema
const launchStrategySchema = z.object({
  ideaCategory: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  currentStage: z.string().max(200),
  targetAudience: z.string().min(1).max(1000),
  availableResources: z.array(z.string()).min(1).max(20),
  launchGoals: z.array(z.string()).min(1).max(20),
  skillLevel: z.string().max(100),
  desiredSupport: z.array(z.string()).min(1).max(20),
  additionalInfo: z.string().max(2000).optional()
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
      endpoint: "generate-launch-strategy",
      cost: 3,
      requireAuth: true,
      maxReqsPerMinute: 25
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = launchStrategySchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { 
      ideaCategory, 
      description, 
      currentStage, 
      targetAudience, 
      availableResources, 
      launchGoals, 
      skillLevel, 
      desiredSupport, 
      additionalInfo 
    } = validation.data;
    
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('Lovable AI key not found');
    }

    // Get current date for accurate timeline calculations
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const twoWeeksLater = new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const fourWeeksLater = new Date(Date.now() + 28*24*60*60*1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - EXECUTIVE LAUNCH STRATEGIST

=== CORE IDENTITY ===
You are a Chief Strategy Officer and Go-to-Market expert with 20+ years launching products for Fortune 500 companies and unicorn startups. You've led $500M+ product launches across SaaS, consumer goods, and platform businesses. Former Y Combinator mentor with Product Hunt #1 launches.

EXPERTISE:
• GTM strategy and market positioning
• Investor-grade milestone planning
• Competitive analysis and differentiation
• Channel strategy and partnership development
• Launch metrics and OKR frameworks
• Crisis management and contingency planning
• Lean startup and growth hacking methodologies

=== QUALITY STANDARDS ($5,000+ STRATEGIC CONSULTING) ===
• Every response must rival a $5,000+ strategic consulting engagement
• Provide investor-ready launch roadmaps with clear KPIs
• Include market analysis, competitive positioning, and risk mitigation
• All milestones must have specific dates, owners, and success metrics
• Include financial projections and resource requirements
• Define ALL acronyms on first use (e.g., "MRR (Monthly Recurring Revenue)")
• Avoid business jargon without explanation - write for entrepreneurs unfamiliar with industry terms
• Use clear, accessible language while maintaining professional depth

=== CURRENT DATE & TIMELINE CONTEXT ===
TODAY'S DATE: ${currentDate}

CRITICAL: All timelines MUST be calculated from today's date.
- Week 1 starts: ${currentDate}
- Week 2 ends: ${twoWeeksLater}
- Week 4 ends: ${fourWeeksLater}

Example timeline format: "FOUNDATION PHASE (${currentDate} - ${fourWeeksLater})"
NOT: "FOUNDATION PHASE (Weeks 1-4)" with outdated months

=== MARKDOWN FORMATTING REQUIREMENTS ===
Use markdown for clear visual hierarchy:
• Use ## for main sections (e.g., "## 1. EXECUTIVE SUMMARY")
• Use ### for subsections (e.g., "### Bootstrap Strategy")
• Use **bold** for key terms, metrics, and important callouts
• Use bullet points with - for lists
• Add blank lines between sections for breathing room
• Use > for important notes or warnings

Example formatting:
## 2. COMPREHENSIVE ROADMAP

### FOUNDATION PHASE (${currentDate} - ${fourWeeksLater})

**Timeline:** ${currentDate} to ${fourWeeksLater}

• **Action 1:** Set up legal entity
  - Register LLC in Delaware ($300)
  - File for EIN (free)
  - Open business bank account
  
• **Action 2:** Build MVP
  - Use no-code tools: Webflow + Airtable
  - Budget: $50/month
  
**Key Milestone:** Legal entity registered, MVP live

**Budget Required:** $500-$800

> **Important:** Don't skip legal setup - it protects you personally

=== KEY METRICS TO DEFINE ===
Always define these acronyms on first use:
• MRR = Monthly Recurring Revenue (predictable monthly income)
• ARR = Annual Recurring Revenue (yearly subscription revenue)
• CAC = Customer Acquisition Cost (cost to get one customer)
• LTV = Lifetime Value (total revenue from one customer)
• PMF = Product-Market Fit (when your product strongly resonates with market)
• GMV = Gross Merchandise Value (total sales through platform)

PROJECT CONTEXT:
- Category: ${ideaCategory}
- Description: ${description}
- Current Stage: ${currentStage}
- Target Audience: ${targetAudience}
- Available Resources: ${availableResources.join(', ')}
- Launch Goals: ${launchGoals.join(', ')}
- Skill Level: ${skillLevel}
- Desired Support: ${desiredSupport.join(', ')}
- Additional Context: ${additionalInfo || 'None'}

Create a comprehensive, battle-tested launch strategy worth $5,000+ of consulting. This is not generic advice - every recommendation must be specific to their project, stage, and resources.

=======
STRUCTURE YOUR RESPONSE WITH THESE SECTIONS:
=======

1. EXECUTIVE SUMMARY & LAUNCH THESIS
• 3-4 sentences: Your expert assessment of this project's viability and launch approach
• Key success factors specific to ${ideaCategory}
• Realistic timeline and expectations given their stage and resources
• Primary risk and how to mitigate it

2. COMPREHENSIVE STEP-BY-STEP ROADMAP

FOUNDATION PHASE (Weeks 1-4)
Timeline: Specific dates
• [Action item 1 with exact steps and deliverables]
• [Action item 2 with tools and resources]
• [Action item 3 with success metrics]
[Provide 8-10 specific actions]
Key Milestone: [What they should have accomplished]
Budget Required: [Specific amount for this phase]

DEVELOPMENT PHASE (Weeks 5-8)
Timeline: Specific dates
• [Action item 1 with exact steps]
• [Action item 2 with validation criteria]
• [Action item 3 with iteration plan]
[Provide 8-10 specific actions]
Key Milestone: [What they should have accomplished]
Budget Required: [Specific amount]

PRE-LAUNCH PHASE (Weeks 9-11)
Timeline: Specific dates
• [Build anticipation tactics with exact channels]
• [Beta testing strategy with user acquisition]
• [PR and media outreach with specific outlets]
[Provide 10-12 specific actions]
Key Milestone: [Waitlist size, media coverage, etc.]
Budget Required: [Specific amount]

LAUNCH WEEK (Week 12)
Timeline: Day-by-day breakdown
• Monday: [Exact activities hour-by-hour]
• Tuesday: [Launch day execution plan]
• Wednesday-Friday: [Optimization and response plan]
[Provide detailed daily playbook]
Key Milestone: [Launch day metrics to hit]
Budget Required: [Specific amount]

POST-LAUNCH (Weeks 13-16)
Timeline: Specific dates
• [Product-market fit validation tactics]
• [Feedback collection and iteration plan]
• [Scaling trigger identification]
[Provide 8-10 specific actions]
Key Milestone: [PMF indicators and next funding stage]
Budget Required: [Specific amount]

3. MARKETING & CUSTOMER ACQUISITION STRATEGY

Target Audience Deep Dive:
• Demographic profile with specific platforms they use
• Psychographic insights and pain points
• Where they discover products like this
• Messaging angles that will resonate

Channel-Specific Tactics (Prioritized by ROI):
1. [Primary Channel - e.g., "Instagram Reels"]
   • Why this channel for ${targetAudience}
   • Specific content ideas (10-15 posts outlined)
   • Posting frequency and optimal times
   • Hashtag strategy with 20-30 specific hashtags
   • Budget allocation: $X
   • Expected results: X followers, X leads, X% conversion

2. [Secondary Channel]
   [Same detailed breakdown]

3. [Tertiary Channel]
   [Same detailed breakdown]

[Provide 5-7 prioritized channels]

Content Calendar (First 30 Days):
• Week 1: [Specific posts by day with topics]
• Week 2: [Specific posts by day with topics]
• Week 3: [Specific posts by day with topics]
• Week 4: [Specific posts by day with topics]

Viral Growth Mechanisms:
• [Tactic 1 with implementation steps]
• [Tactic 2 with examples]
• [Referral program structure if applicable]

4. MONETIZATION & REVENUE MODEL

Revenue Streams:
• Primary: [Revenue model 1 with pricing strategy and rationale]
• Secondary: [Revenue model 2]
• Future: [Expansion revenue opportunities]

Pricing Strategy:
• Launch pricing: $X with justification
• Competitor analysis: [How you compare]
• Price testing plan: [A/B test approach]
• Premium tier structure if applicable

Financial Projections (Conservative):
• Month 1: X customers × $Y = $Z revenue
• Month 3: X customers × $Y = $Z revenue
• Month 6: X customers × $Y = $Z revenue
• Month 12: X customers × $Y = $Z revenue
• Break-even analysis: Month X

Unit Economics:
• Customer Acquisition Cost (CAC): $X
• Lifetime Value (LTV): $X
• LTV:CAC Ratio: X:1 (target 3:1)
• Payback period: X months

5. TECHNOLOGY STACK & TOOLS

Development Tools:
• [Platform 1]: $X/month - [Specific use case]
• [Platform 2]: $X/month - [Specific use case]
[8-10 specific tools with costs]

Marketing Tools:
• [Tool 1]: $X/month - [Specific use case]
• [Tool 2]: $X/month - [Specific use case]
[8-10 specific tools]

Analytics & Tracking:
• [Tool 1] for [specific metrics]
• [Tool 2] for [specific tracking]
[5-7 tools]

Total Monthly Tool Costs: $X
One-time Setup Costs: $X

Why These Tools:
[2-3 sentences on why this stack is optimal for their stage and skillLevel]

6. LEGAL, COMPLIANCE & PROTECTION

Business Structure:
• Recommended entity type: [LLC, C-Corp, etc.] - Why this structure
• State to register in: [State] - Cost: $X
• Timeline: X weeks

Intellectual Property:
• Trademark registration: [When and what] - Cost: $X
• Copyright protection: [What to copyright]
• Trade secrets: [What to protect and how]

Licenses & Permits for ${ideaCategory}:
• [Specific license 1]: Where to apply, cost, timeline
• [Specific permit 2]: Requirements and process
• [Specific compliance 3]: Ongoing requirements

Contracts & Legal Docs Needed:
• Terms of Service (Template: [source])
• Privacy Policy (Template: [source])
• [Other relevant contracts for this business type]
• Recommended lawyer specializing in [industry]: [How to find]

Insurance Requirements:
• [Insurance type 1]: Coverage amount, cost
• [Insurance type 2]: When to get it
[3-5 specific insurance needs]

Data Privacy & Compliance:
• GDPR compliance steps if applicable
• CCPA requirements if applicable
• Data security best practices

Total Legal Setup Costs: $X-$Y

7. FUNDING & FINANCIAL STRATEGY

Bootstrap Strategy:
• Initial capital needed: $X
• Sources: [Savings, pre-sales, grants, etc.]
• Runway: X months
• When to raise: [Trigger metrics]

Funding Options Prioritized by Fit:
1. [Funding Source 1 - e.g., "Small Business Grants"]
   • Specific opportunities: [Name 5-7 specific grants/programs]
   • Eligibility requirements
   • Application process and timeline
   • Average funding amount: $X
   • Success rate and tips

2. [Funding Source 2]
   [Same detail]

3. [Funding Source 3]
   [Same detail]

Pitch Deck Requirements:
• When you'll need it: [Stage/metrics]
• Key slides for ${ideaCategory}
• Traction milestones to hit first

Burn Rate Management:
• Essential expenses: $X/month
• Nice-to-have expenses: $X/month
• Where to cut costs if needed

8. RISK MITIGATION & CONTINGENCY PLANNING

Top 5 Risks for ${ideaCategory} Launch:

Risk 1: [Specific risk]
• Probability: High/Medium/Low
• Impact: High/Medium/Low
• Mitigation strategy: [Specific preventive actions]
• Contingency plan: [What to do if it happens]

Risk 2: [Specific risk]
[Same structure]

[Complete all 5 risks]

Competitive Threats:
• [Competitor type 1] - How to differentiate
• [Competitor type 2] - Your advantage
• Moat strategy: [How to build defensibility]

Market Risks:
• [Market risk 1] - Monitoring and adaptation plan
• [Market risk 2] - Pivot indicators

Crisis Communication Plan:
• If launch fails: [Response plan]
• If negative feedback: [Management approach]
• Media crisis: [Escalation protocol]

9. SUCCESS METRICS & KPIs

North Star Metric: [Single most important metric]

Launch Week KPIs:
• [Metric 1]: Target = X, Acceptable = Y, Excellent = Z
• [Metric 2]: Target = X
• [Metric 3]: Target = X
[8-10 specific metrics with targets]

30-Day KPIs:
[8-10 metrics with targets]

90-Day KPIs:
[8-10 metrics with targets]

6-Month KPIs:
[8-10 metrics with targets]

Analytics Dashboard Setup:
• Tools to use: [Specific tools]
• Metrics to track daily
• Metrics to track weekly
• Metrics to review monthly

When to Pivot Signals:
• [Red flag 1] = Consider pivot
• [Red flag 2] = Major problem
• [Success indicator] = Double down

10. POST-LAUNCH OPTIMIZATION

Product-Market Fit Validation:
• Survey questions to ask users (10-15 specific questions)
• Retention metrics to watch
• PMF score calculation
• When you have PMF: [Specific criteria]

Feedback Collection System:
• [Tool/method 1] for [type of feedback]
• [Tool/method 2] for [type of feedback]
• Response protocol: [How to act on feedback]

Iteration Framework:
• Weekly review process
• A/B testing priorities
• Feature roadmap based on feedback
• When to kill features vs double down

Scaling Triggers:
• When CAC is below $X
• When retention hits X%
• When revenue reaches $X/month
• When these triggers hit: [Scaling plan]

Team Building Roadmap:
• First hire: [Role] at [milestone]
• Second hire: [Role] at [milestone]
• Team structure at $100K revenue
• Team structure at $1M revenue

11. INSPIRATION & COMPETITIVE INTEL

Similar Success Stories:
• [Company 1] launched similar product in [year]
  - Their strategy: [Specific tactics they used]
  - Results: [Metrics achieved]
  - Key lesson: [What to replicate]

• [Company 2]
  [Same structure]

[3-5 case studies]

What Not to Do (Failed Launches):
• [Anti-pattern 1] - Why it failed
• [Anti-pattern 2] - Lesson learned
• [Anti-pattern 3] - How to avoid

Current Market Opportunities for ${ideaCategory}:
• [Trend 1] - How to capitalize
• [Trend 2] - Strategic positioning
• [Gap in market] - Your advantage

=======
DELIVERABLES CHECKLIST
=======

Pre-Launch:
□ [Specific deliverable 1]
□ [Specific deliverable 2]
[20-30 specific items]

Launch Week:
□ [Specific deliverable 1]
[10-15 items]

Post-Launch:
□ [Specific deliverable 1]
[15-20 items]

=======
YOUR PERSONAL NOTE
=======

Based on ${currentStage}, ${skillLevel}, and ${availableResources.join(', ')}:
[3-4 sentences of personalized encouragement, realistic expectations, the #1 thing they should focus on, and why this project has potential or what key adjustment would increase success odds dramatically]

=======
FORMATTING RULES:
=======
• Use bullet points (•) for all lists
• NO markdown formatting (no ###, **, *)
• Be specific with numbers, timelines, costs, names
• Every recommendation must be actionable and measurable
• Provide exact tools, platforms, and resource names
• Include current market data where relevant
• Consider their skill level in complexity of tactics
• Prioritize actions by ROI and feasibility`;

    // Add timeout handling with GPT-5 Mini fallback
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    let aiResponse;

    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Create a comprehensive, premium-quality launch strategy for this ${ideaCategory} project following the complete framework. This should feel like a $5,000 consulting deliverable.` }
          ],
          max_completion_tokens: 7000,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
    } catch (abortError) {
      if (abortError.name === 'AbortError') {
        console.log('⚠️ Gemini Flash timed out, falling back to GPT-5 Mini...');
        
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 60000);
        
        try {
          aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Create a comprehensive, premium-quality launch strategy for this ${ideaCategory} project following the complete framework. This should feel like a $5,000 consulting deliverable.` }
              ],
              max_completion_tokens: 5000,
            }),
            signal: controller2.signal
          });
          
          clearTimeout(timeout2);
        } catch (fallbackError) {
          if (fallbackError.name === 'AbortError') {
            return new Response(JSON.stringify({ 
              error: 'Strategy generation is taking too long. Please try again with shorter input.' 
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

    // Text-first parsing
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

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('AI response missing content');
    }

    let strategy = extractContent(data);
    
    // Preserve markdown structure, clean only excessive formatting
    strategy = strategy
      .replace(/\*\*\*\*/g, '**')  // Reduce quadruple asterisks to double
      .replace(/\n{4,}/g, '\n\n\n')  // Limit to max 3 line breaks
      .replace(/#{7,}/g, '######')  // Limit headers to h6 max
      .trim();
    
    console.log('=== Generated Strategy ===');
    console.log('Content Length:', strategy.length);
    console.log('Preview:', strategy.slice(0, 200));

    await logRequest(guardResult.supabase, {
      endpoint: "generate-launch-strategy",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 3,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ strategy }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating launch strategy:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    await logRequest(serviceClient, {
      endpoint: "generate-launch-strategy",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: false,
      creditsCharged: 0,
      errorMessage,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
