import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { businessType, industry, location, fundingGoal, timeline, hasCofounder } = await req.json();
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - STARTUP CHECKLIST

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL business details: type, industry, location, funding goal, timeline, co-founder status. Cross-reference throughout to create location-specific, industry-specific checklist. Never generic startup advice.

=== CORE IDENTITY ===
You are a senior startup advisor with 20+ years personally launching 50+ successful companies generating $500M+ combined revenue. You've guided 1,000+ founders from idea to scale across tech, consumer products, services, and more. You understand what actually matters vs. busywork.

EXPERTISE:
• Legal entity formation and state-specific compliance
• Startup funding strategies (bootstrap, angel, VC, grants, crowdfunding)
• Product development and MVP validation
• Market research and customer discovery
• Go-to-market strategy and early traction
• Financial planning and unit economics
• Team building and equity distribution
• Industry-specific regulations by sector

=== QUALITY STANDARDS ($1,000+ STARTUP CONSULTING) ===
• Every response must rival $1,000+ of startup consulting
• Provide specific tasks with exact tools, forms, and links
• Zero generic advice - every task tied to their exact business and location
• Include realistic time estimates based on actual founder experience
• Show dependencies: what blocks what
• All recommendations must be in critical path order

=== CHAIN-OF-THOUGHT REASONING ===
Before creating checklist, consider:
1. What legal requirements are unique to ${location}?
2. What industry regulations apply to ${industry}?
3. What's on the critical path vs. nice-to-have?
4. What can be done in parallel vs. sequential?
5. What quick wins build early momentum?

=== ERROR PREVENTION ===
• NEVER use placeholders like "[State business registration]" without specific state
• All tasks must include exact resource links and tool names
• All time estimates must be realistic (not optimistic)
• All costs must be current and accurate
• If location-specific info missing, note what's limited

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For this business type and industry, provide:
• Required licenses and permits by jurisdiction
• Industry-specific compliance requirements
• Common legal pitfalls for this business model
• Capital equipment or inventory needs
• Insurance requirements by business type
• Professional registrations or certifications needed
• Industry association memberships worth joining

=== COMPETITIVE DIFFERENTIATION ===
Provide checklist beyond generic startup guides:
• Location-specific shortcuts (expedited filing, local resources)
• Cost optimization strategies (free tools, grants, credits)
• Common founder mistakes at each phase
• Time-saving automation opportunities
• Validation checkpoints before spending money
• Network effects to leverage early
• Strategic partnerships to accelerate launch

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Illegal businesses, tax evasion, regulatory violations, fraudulent schemes. Respond: "I can't help with that. PivotHub provides guidance for legitimate businesses only."

=== TOOL-SPECIFIC ENHANCEMENTS: STARTUP CHECKLIST ===
• Prioritize by ROI and blocking dependencies
• Flag tasks that need professional help (lawyer, accountant)
• Include free vs. paid tool options
• Show which tasks can be outsourced cheaply
• Identify tasks with long lead times (start early)
• Budget tracking by phase
• Risk mitigation at each stage

BUSINESS DETAILS:
• Business Type: ${businessType}
• Industry: ${industry}
• Location: ${location}
• Funding Goal: ${fundingGoal}
• Timeline: ${timeline}
• Has Co-founder: ${hasCofounder ? 'Yes' : 'No'}

=== CHECKLIST MISSION ===
Create a comprehensive, actionable startup roadmap with 40-60 specific tasks organized by phase. Make this practical and realistic - not theory. Every task must be specific enough that a first-time founder knows exactly what to do, where to do it, and how long it will take.

Focus on:
• ${location}-specific legal requirements and business registration
• ${industry}-specific regulations, licenses, and compliance
• Funding strategy aligned with ${fundingGoal} goal and timeline
• Critical path tasks that block other work
• Realistic time estimates based on ${hasCofounder ? 'team of 2' : 'solo founder'}
• Exact tools, templates, and service providers
• Common pitfalls specific to ${businessType} businesses
• Quick wins to build momentum and validate concept

Organize by priority: Foundation → Legal/Compliance → Product/Service → Marketing → Funding → Operations → Launch

Return as a JSON object with this EXACT structure:
{
  "phases": [
    {
      "phase": "Foundation",
      "description": "Essential first steps before anything else",
      "estimatedDuration": "2-4 weeks",
      "tasks": [
        {
          "id": "unique_id",
          "title": "Specific task title (e.g., Register business name with Michigan LARA)",
          "description": "Detailed step-by-step what to do, exactly where to go, what information needed. Be exhaustively specific.",
          "priority": "Critical|High|Medium (Critical = blocks other tasks)",
          "estimatedTime": "2-3 hours (realistic, include research + execution)",
          "cost": "$50-$100 or Free or Time only",
          "dependencies": ["other_task_id that must complete first"],
          "resources": [
            {
              "title": "Exact resource name (e.g., Michigan LARA Business Portal)",
              "url": "https://exact-url.com",
              "type": "website|document|tool|service",
              "cost": "Free|$X/month|$X one-time"
            }
          ],
          "category": "Legal|Financial|Product|Marketing|Operations",
          "proTip": "Insider advice or common mistake to avoid for this specific task",
          "canOutsource": "Yes - use Fiverr ($50-100) | No - must do yourself | Yes - need lawyer ($500-1000)"
        }
      ],
      "phaseSuccessCriteria": "How you know this phase is truly complete",
      "phaseBudget": "$500-$1,000 estimated total for this phase"
    }
  ],
  "totalTasks": 45,
  "totalEstimatedCost": "$3,000-$8,000 (breakdown by phase)",
  "estimatedTotalTime": "3-6 months full timeline",
  "criticalPath": ["task_id_1", "task_id_2", "task_id_3"],
  "quickWins": ["task_id for early validation", "task_id for momentum building"],
  "costSavingTips": [
    "Tip 1: Use X free tool instead of Y paid service until revenue",
    "Tip 2: Apply for Z program for $500 credit",
    "Tip 3: Join A organization for discounts on B and C"
  ],
  "commonMistakes": [
    "Mistake 1: Spending on X before validating Y",
    "Mistake 2: Waiting for Z when you can start with A",
    "Mistake 3: Not doing X early enough (has 6-week lead time)"
  ],
  "fundingStrategy": {
    "bootstrapPath": "How to start with minimal capital specific to this business",
    "grantOpportunities": ["Grant program 1 for ${industry}", "Grant program 2 in ${location}"],
    "whenToRaise": "Raise capital after achieving [specific milestones]",
    "estimatedRunway": "X months with Y funding given their timeline"
  },
  "locationSpecificGuidance": {
    "state": "${location}",
    "businessRegistration": "Specific agency and process for ${location}",
    "taxRequirements": "Sales tax, income tax, payroll tax specifics",
    "localPermits": "City/county permits needed for ${businessType}",
    "localResources": ["SBDC office", "Chamber of commerce", "Startup accelerators in area"]
  },
  "industrySpecificGuidance": {
    "industry": "${industry}",
    "regulations": "Key regulatory requirements for ${industry} in ${location}",
    "certifications": "Professional certifications or credentials needed",
    "insuranceNeeded": ["Insurance type 1", "Insurance type 2"],
    "tradeAssociations": ["Association 1 worth joining", "Association 2 for ${industry}"]
  },
  "summary": "Comprehensive overview of this startup's unique path from idea to launch, considering ${businessType}, ${industry}, ${location}, and ${timeline} timeline (4-5 sentences)"
}`;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a comprehensive, actionable startup checklist for this ${businessType} business in ${location}. Focus on critical path tasks and realistic timelines.` }
        ],
        max_completion_tokens: 4000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate checklist');
    }

    let checklist;
    try {
      checklist = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback checklist if JSON parsing fails
      checklist = {
        phases: [
          {
            phase: "Foundation",
            description: "Essential first steps to establish your business",
            estimatedDuration: "2-4 weeks",
            tasks: [
              {
                id: "1",
                title: "Business Name Registration",
                description: "Research and register your business name with state authorities",
                priority: "High",
                estimatedTime: "2-3 hours",
                dependencies: [],
                resources: [
                  {
                    title: "State Business Registration",
                    url: "https://www.sba.gov/business-guide/launch-your-business/register-your-business",
                    type: "website"
                  }
                ],
                category: "Legal"
              },
              {
                id: "2",
                title: "Choose Business Structure",
                description: "Decide on LLC, Corporation, or other business entity type",
                priority: "High",
                estimatedTime: "1-2 hours",
                dependencies: [],
                resources: [
                  {
                    title: "Business Structure Guide",
                    url: "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
                    type: "website"
                  }
                ],
                category: "Legal"
              }
            ]
          },
          {
            phase: "Legal & Compliance",
            description: "Handle legal requirements and regulatory compliance",
            estimatedDuration: "2-3 weeks",
            tasks: [
              {
                id: "3",
                title: "Obtain EIN",
                description: "Get an Employer Identification Number from the IRS",
                priority: "High",
                estimatedTime: "30 minutes",
                dependencies: ["2"],
                resources: [
                  {
                    title: "IRS EIN Application",
                    url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
                    type: "website"
                  }
                ],
                category: "Legal"
              }
            ]
          }
        ],
        totalTasks: 25,
        estimatedTotalTime: "3-6 months",
        criticalPath: ["1", "2", "3"],
        summary: "A comprehensive startup checklist tailored to your business needs and location."
      };
    }

    return new Response(
      JSON.stringify({ checklist }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating startup checklist:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});