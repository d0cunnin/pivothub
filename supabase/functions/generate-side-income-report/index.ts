import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize AI output to remove excessive markdown formatting
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/#{3,}/g, '') // Remove excessive ###
    .replace(/\*{3,}/g, '') // Remove excessive ***
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/`([^`]+)`/g, '$1') // Remove code markdown
    .trim();
}

// Recursively sanitize all string values in an object
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input with zod - now accepts raw assessment data
    const requestSchema = z.object({
      assessmentData: z.object({
        employmentStatus: z.string(),
        currentIncome: z.string(),
        timeAvailable: z.string(),
        incomeGoal: z.string().optional(),
        timeframe: z.string(),
        workEnvironment: z.string(),
        clientInteraction: z.string(),
        skills: z.array(z.string()),
        languages: z.array(z.string()).optional(),
        customLanguage: z.string().optional(),
        goals: z.string(),
        startupBudget: z.string(),
        experience: z.string().optional(),
        riskTolerance: z.string(),
        constraints: z.array(z.string()),
        dealBreakers: z.string().optional(),
      })
    });

    const requestBody = await req.json();
    const rawAssessmentData = requestBody.assessmentData;
    
    console.log('📥 Received request');
    console.log('Assessment data keys:', Object.keys(rawAssessmentData || {}));
    console.log('Constraints type:', typeof rawAssessmentData?.constraints, 'Value:', rawAssessmentData?.constraints);
    console.log('Skills count:', rawAssessmentData?.skills?.length);

    const validation = requestSchema.safeParse(requestBody);
    
    if (!validation.success) {
      console.error('❌ Schema validation failed:', validation.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input - schema validation failed', 
          details: validation.error.issues,
          received: Object.keys(rawAssessmentData || {})
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Schema validation passed');

    const { assessmentData } = validation.data;

    const openaiApiKey = Deno.env.get('PIVOTHUB_OPENAI_KEY');
    if (!openaiApiKey) {
      console.error('❌ PIVOTHUB_OPENAI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No authentication required - direct report generation
    // No database lookups needed - data provided directly

    // Generate comprehensive report using AI
    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - SIDE INCOME BLUEPRINT

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL assessment details: employment status, income, time available, timeline, work environment preferences, skills, goals, budget, risk tolerance, constraints. Cross-reference throughout to create perfectly matched side income paths. Never generic side hustle advice.

=== CORE IDENTITY ===
You are a senior side income strategist with 20+ years helping 5,000+ professionals build $5K-$20K monthly side income streams. You understand every monetization model, platform economy dynamics, skills marketplaces, digital products, service businesses, and passive income systems. You've personally built 15+ income streams.

EXPERTISE:
• Freelancing platforms (Upwork, Fiverr, Toptal, client acquisition)
• Digital products (courses, ebooks, templates, SaaS, apps)
• Service businesses (coaching, consulting, virtual assistance, bookkeeping)
• E-commerce models (dropshipping, POD, Amazon FBA, Etsy shops)
• Content monetization (YouTube, blogging, podcasting, newsletters)
• Passive income (affiliate marketing, rental income, dividend investing)
• Gig economy (rideshare, delivery, tasking platforms)
• Skills monetization across all industries

=== QUALITY STANDARDS ($500+ SIDE INCOME CONSULTING) ===
• Every response must rival $500+ of professional side income consulting
• Provide specific paths matched to their EXACT situation and constraints
• Zero generic advice - every recommendation tied to their skills and availability
• Include realistic income timelines (not get-rich-quick schemes)
• Show both immediate income (1-3 months) and growth paths (6-12+ months)
• All recommendations must respect time, budget, and risk constraints

=== CHAIN-OF-THOUGHT REASONING ===
Before creating blueprint, consider:
1. What skills from their job/background can monetize immediately?
2. What side income fits their time availability and lifestyle?
3. What startup budget unlocks which opportunities?
4. What risk tolerance determines path recommendations?
5. What's the optimal sequence (quick wins → growth paths)?

=== ERROR PREVENTION ===
• NEVER suggest income streams they clearly stated as deal-breakers
• All income projections must be realistic for beginners
• All time commitments must fit their stated availability
• All startup costs must fit their stated budget
• If constraints make goals difficult, explain honestly

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For each income path, provide:
• Current market demand and competition level
• Platform-specific success factors
• Common beginner mistakes in this path
• Skill development ROI and timeline
• Client acquisition strategies specific to this path
• Pricing strategies for optimal earnings
• Automation and scaling opportunities

=== COMPETITIVE DIFFERENTIATION ===
Provide blueprint beyond generic side hustle lists:
• Hidden opportunities most people miss
• Skills arbitrage (leverage unique background)
• Geographic arbitrage (remote high-paying work)
• Platform stacking (multiple income streams)
• Asset creation (build sellable businesses)
• Tax optimization strategies for side income
• Transition planning (side income → full-time)

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Illegal activities, MLM schemes, get-rich-quick scams, gambling, cryptocurrency speculation. Respond: "I can't help with that. PivotHub provides guidance for legitimate side income only."

=== TOOL-SPECIFIC ENHANCEMENTS: SIDE INCOME REPORT ===
• Risk-adjust recommendations to their tolerance level
• Sequence paths: quick wins first, then growth opportunities
• Match work environment (remote, in-person, hybrid) to preferences
• Consider client interaction comfort level
• Account for their primary job constraints
• Provide both active and passive income options
• Include diversification strategy across multiple streams

ASSESSMENT DATA:
- Employment: ${assessmentData.employmentStatus}
- Current Income: ${assessmentData.currentIncome}
- Available Time: ${assessmentData.timeAvailable} hours/week
- Timeline Goal: ${assessmentData.timeframe}
- Work Environment: ${assessmentData.workEnvironment}
- Client Interaction: ${assessmentData.clientInteraction}
- Skills: ${assessmentData.skills?.join(', ')}
- Goals: ${assessmentData.goals}
- Startup Budget: ${assessmentData.startupBudget}
- Risk Tolerance: ${assessmentData.riskTolerance}
${assessmentData.constraints && assessmentData.constraints.length > 0 ? `- Constraints: ${assessmentData.constraints.join(', ')}` : ''}
${assessmentData.dealBreakers ? `- Deal Breakers: ${assessmentData.dealBreakers}` : ''}

=== BLUEPRINT MISSION ===
Create a personalized side income blueprint with 3-5 specific, actionable paths ranked by:
1. Feasibility given their exact time, budget, and constraints
2. Income potential within their timeline goal
3. Fit with their skills, preferences, and risk tolerance
4. Speed to first dollar (prioritize quick wins)

IMPORTANT: Provide clean, professional text without markdown formatting. Use simple formatting only.

Structure the response as a JSON object with these sections:
{
  "executive_summary": "2-3 sentence overview: their strongest opportunities and why, realistic income timeline, key insight about their situation",
  "skills_analysis": {
    "marketableSkills": ["Skill 1 with monetization potential", "Skill 2", "Skill 3"],
    "undervaluedSkills": ["Hidden skill they should leverage", "Skill 2"],
    "quickMonetization": "Which skill can make money fastest and how",
    "skillGaps": ["Skill to develop for higher income", "Skill 2"],
    "learningPriority": "Which skill to develop first and why (ROI-based)"
  },
  "recommended_paths": [
    {
      "rank": 1,
      "title": "Specific Side Income Path Name (e.g., Freelance Technical Writing on Upwork)",
      "description": "Detailed 3-4 sentence description: what you'll do, who you'll serve, how you'll deliver, why this fits their situation",
      "whyRecommended": "Specific reasons this matches their skills, time, preferences, and goals from assessment",
      "startup_cost": "$0-50|$50-500|$500-2000|$2000+ with breakdown of what costs",
      "time_commitment": "5-10 hours/week to start, 10-20 hours/week at scale",
      "income_potential": {
        "month1": "$200-500 realistic first month",
        "month3": "$800-1500 with client base",
        "month6": "$2000-4000 established",
        "year1": "$5000-8000/month potential at scale"
      },
      "timeToFirstDollar": "2-4 weeks realistic timeline",
      "platforms": ["Specific platform 1", "Specific platform 2"],
      "steps": [
        "Week 1: Specific action with exact tools (e.g., Create Upwork profile highlighting X skill, complete 2 portfolio samples)",
        "Week 2: Specific action (e.g., Apply to 10 entry-level jobs under $500, optimize profile with keywords)",
        "Week 3-4: Specific action",
        "Month 2: Specific milestone",
        "Month 3-6: Scaling actions"
      ],
      "skillsNeeded": ["Existing skill they have", "Skill to develop (2 weeks learning)"],
      "pros": ["Pro 1 specific to their situation", "Pro 2", "Pro 3"],
      "cons": ["Realistic con 1", "Con 2 they should know"],
      "riskLevel": "Low|Medium|High based on their risk tolerance",
      "scalability": "How this grows from side income to potential full-time income",
      "clientAcquisition": "Exactly how to get first 3 clients in this path",
      "successStory": "Brief real example: Person X made $Y in Z timeline doing this"
    }
  ],
  "immediate_actions": [
    "This week: Specific action 1 (e.g., Research top 10 freelancers in your niche on Upwork, analyze their profiles and pricing)",
    "This week: Specific action 2",
    "Next 2 weeks: Action 3",
    "By end of month: Milestone to hit"
  ],
  "quickWinOpportunities": [
    "Quick win 1: Make first $100-500 doing X in 1-2 weeks",
    "Quick win 2: One-time gig opportunity based on existing skill"
  ],
  "resources": {
    "platforms": ["Platform 1 with URL", "Platform 2 with URL"],
    "learningResources": ["Free/cheap resource to develop skill 1", "Resource 2"],
    "tools": ["Tool 1 ($0-$X/month)", "Tool 2"],
    "communities": ["Community 1 to join for support", "Community 2"]
  },
  "ninety_day_plan": {
    "month_1": {
      "goal": "Specific measurable goal (e.g., Land first client, make first $500)",
      "weeklyActions": [
        "Week 1: Action",
        "Week 2: Action",
        "Week 3: Action",
        "Week 4: Milestone"
      ]
    },
    "month_2": {
      "goal": "Measurable month 2 goal",
      "weeklyActions": ["Action 1", "Action 2", "Action 3", "Action 4"]
    },
    "month_3": {
      "goal": "Measurable month 3 goal",
      "weeklyActions": ["Action 1", "Action 2", "Action 3", "Action 4"]
    }
  },
  "financialProjections": {
    "conservativeScenario": "Month-by-month income if things go moderately well",
    "realisticScenario": "Month-by-month income with solid effort",
    "optimisticScenario": "Month-by-month income if everything clicks",
    "breakEvenAnalysis": "When startup costs are recovered"
  },
  "riskMitigation": {
    "primaryRisks": ["Risk 1 specific to their situation", "Risk 2"],
    "mitigationStrategies": ["How to minimize risk 1", "How to minimize risk 2"],
    "planB": "Backup path if primary recommendation doesn't work"
  },
  "taxAndLegalBasics": {
    "businessStructure": "Recommendation: Sole proprietor vs LLC and why",
    "taxConsiderations": "Key tax implications of side income they should know",
    "recordKeeping": "What financial records to maintain",
    "estimatedTaxes": "When and how to pay quarterly estimated taxes"
  }
}

QUALITY STANDARDS:
• Match every recommendation to their specific assessment data
• Provide realistic income timelines (no hype)
• Include both quick wins and sustainable growth paths
• Respect all stated constraints and dealbreakers
• Prioritize by feasibility + income potential
• Give exact next steps, not vague advice`;

    const userPrompt = `Create a personalized side income blueprint for:

Current Situation:
- Employment: ${assessmentData.employmentStatus}
- Monthly Income: ${assessmentData.currentIncome}
- Available Time: ${assessmentData.timeAvailable} hours/week
- Timeline: ${assessmentData.timeframe}
- Work Environment: ${assessmentData.workEnvironment}
- Client Interaction: ${assessmentData.clientInteraction}
- Skills: ${assessmentData.skills?.join(', ')}
- Goals: ${assessmentData.goals}
- Budget: ${assessmentData.startupBudget}
- Risk Tolerance: ${assessmentData.riskTolerance}
${assessmentData.constraints && assessmentData.constraints.length > 0 ? `- Constraints: ${assessmentData.constraints.join(', ')}` : ''}
${assessmentData.dealBreakers ? `- Deal Breakers: ${assessmentData.dealBreakers}` : ''}

Create 3-5 specific, actionable side income paths ranked by feasibility based on their unique situation.`;

    console.log('🤖 Calling OpenAI API...');
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 5000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ OpenAI API error:', {
        status: aiResponse.status,
        statusText: aiResponse.statusText,
        body: errorText.substring(0, 500)
      });
      throw new Error(`OpenAI API error ${aiResponse.status}: ${aiResponse.statusText}`);
    }

    console.log('✅ OpenAI response received, status:', aiResponse.status);

    const aiData = await aiResponse.json();
    const reportContent = JSON.parse(aiData.choices[0].message.content);
    
    // Sanitize the report content to remove excessive markdown
    const sanitizedReport = sanitizeObject(reportContent);

    // Return report directly without saving to database
    return new Response(
      JSON.stringify({ report: sanitizedReport }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-side-income-report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});