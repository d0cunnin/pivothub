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

    const systemPrompt = `You are a startup advisor and business consultant with expertise in helping entrepreneurs navigate the startup process. Create a comprehensive, personalized startup checklist based on the specific business details provided.

    Business Type: ${businessType}
    Industry: ${industry}
    Location: ${location}
    Funding Goal: ${fundingGoal}
    Timeline: ${timeline}
    Has Co-founder: ${hasCofounder ? 'Yes' : 'No'}

    Create a detailed checklist organized by phases with specific tasks. Consider:
    - Legal requirements specific to their location and business type
    - Industry-specific regulations and licenses
    - Funding strategy and requirements
    - Market validation steps
    - Product development milestones
    - Marketing and sales preparation
    - Financial planning and accounting setup
    - Team building and HR considerations

    Organize tasks by priority and timeline. Include estimated time to complete each task and any dependencies.

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
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a startup checklist for this ${businessType} business in ${location}.` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
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
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});