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

    const systemPrompt = `You are a senior startup advisor with 15+ years helping founders launch 100+ successful companies from idea to $1M+ revenue. You understand the complete startup journey across all industries and business models. You've seen what works and what causes startups to fail.

    EXPERTISE:
    • Legal entity formation and compliance (LLCs, C-corps, S-corps)
    • Startup funding strategies (bootstrapping, angel, VC, grants, crowdfunding)
    • Product development and MVP launch
    • Market validation and customer discovery
    • Go-to-market strategy and early customer acquisition
    • Financial planning and runway management
    • Team building and equity distribution
    • Industry-specific regulations and licensing

    BUSINESS DETAILS:
    • Business Type: ${businessType}
    • Industry: ${industry}
    • Location: ${location}
    • Funding Goal: ${fundingGoal}
    • Timeline: ${timeline}
    • Has Co-founder: ${hasCofounder ? 'Yes' : 'No'}

    CHECKLIST MISSION:
    Create a comprehensive, actionable startup roadmap with 40-60 specific tasks organized by phase. Make this practical and realistic - not just theory. Include:
    • Location-specific legal requirements for ${location}
    • Industry-specific regulations for ${industry}
    • Funding strategy aligned with ${fundingGoal} goal
    • Critical path tasks that block other work
    • Time estimates based on real startup timelines
    • Resource recommendations (tools, templates, services)
    • Common pitfalls to avoid at each phase
    • Quick wins to build momentum early

    Organize by priority: Foundation → Legal/Compliance → Product → Marketing → Funding → Operations → Launch

    Make every task specific enough that a first-time founder knows exactly what to do.

    Return as a JSON object with this structure:
    {
      "phases": [
        {
          "phase": "Foundation",
          "description": "Essential first steps",
          "estimatedDuration": "2-4 weeks",
          "tasks": [
            {
              "id": "unique_id",
              "title": "Task title",
              "description": "Detailed description of what to do",
              "priority": "High|Medium|Low",
              "estimatedTime": "2-3 hours",
              "dependencies": ["other_task_id"],
              "resources": [
                {
                  "title": "Resource name",
                  "url": "https://example.com",
                  "type": "website|document|tool"
                }
              ],
              "category": "Legal|Financial|Product|Marketing|Operations"
            }
          ]
        }
      ],
      "totalTasks": 45,
      "estimatedTotalTime": "3-6 months",
      "criticalPath": ["task_id_1", "task_id_2"],
      "summary": "Overview of the startup journey for this specific business"
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