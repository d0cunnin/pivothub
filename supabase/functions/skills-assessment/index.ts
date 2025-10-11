import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const skillsAssessmentSchema = z.object({
  responses: z.record(
    z.string().min(1).max(50),
    z.string().min(1).max(1000)
  ).refine(
    obj => Object.keys(obj).length >= 1 && Object.keys(obj).length <= 50,
    { message: 'Responses must contain between 1 and 50 entries' }
  ),
  targetField: z.string().trim().min(1).max(100).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = skillsAssessmentSchema.safeParse(requestBody);
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

    const { responses, targetField } = validation.data;
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are a senior career strategist with 20+ years of experience in professional development, talent assessment, and career coaching across multiple industries. You've helped hundreds of professionals successfully transition careers, upskill for promotions, and enter new fields with confidence.

    EXPERTISE:
    • Deep knowledge of industry skill requirements and current market trends
    • Career pathways across technology, business, creative, healthcare, and trades
    • Learning methodologies and resource recommendations (courses, certifications, bootcamps)
    • Skill transferability analysis and career pivoting strategies
    • Industry benchmarking and salary impact of skill development

    TARGET FIELD: ${targetField || 'General Career Development'}
    USER ASSESSMENT RESPONSES: ${JSON.stringify(responses)}

    ANALYSIS FRAMEWORK:
    Analyze the user's responses comprehensively to create a professional-grade skills assessment that rivals a $500 career coaching session.

    Return as a detailed JSON object with this EXACT structure:

    {
      "strengths": ["Strength 1 with context", "Strength 2 with context", ...],
      "gaps": ["Specific skill gap 1", "Specific skill gap 2", ...],
      "priorities": ["Priority 1 to focus on", "Priority 2", "Priority 3"],
      "competencyMatrix": [
        {
          "skill": "Specific skill name (e.g., Python Programming, Project Management)",
          "currentLevel": 65,
          "requiredLevel": 90,
          "gap": 25,
          "priority": "high|medium|low",
          "timeToAcquire": "2-3 months with focused study"
        }
      ],
      "learningPathways": [
        {
          "name": "Fast-Track (3-6 months)",
          "focus": "Core essentials for job readiness",
          "commitment": "20-25 hours per week",
          "certifications": ["Certification 1", "Certification 2"],
          "projects": ["Portfolio project 1", "Portfolio project 2"],
          "outcome": "Ready for entry-level positions"
        },
        {
          "name": "Comprehensive (6-12 months)",
          "focus": "Full mastery and competitive edge",
          "commitment": "15-20 hours per week",
          "certifications": ["Certification 1", "Certification 2", "Certification 3"],
          "projects": ["Advanced project 1", "Advanced project 2"],
          "outcome": "Ready for mid-level positions with strong portfolio"
        },
        {
          "name": "Part-Time (12-18 months)",
          "focus": "Gradual skill building while working",
          "commitment": "8-12 hours per week",
          "certifications": ["Foundational cert", "Intermediate cert"],
          "projects": ["Project 1", "Project 2"],
          "outcome": "Career transition ready with lower time pressure"
        }
      ],
      "certificationRoadmap": [
        {
          "certification": "AWS Solutions Architect Associate (example)",
          "provider": "Amazon Web Services",
          "costRange": "$150-300",
          "prepTime": "2-3 months",
          "priority": "high|medium|low",
          "careerImpact": "Opens cloud engineering roles, +$15k salary potential",
          "prerequisite": "Basic cloud computing knowledge"
        }
      ],
      "portfolioProjects": [
        {
          "project": "Build a full-stack e-commerce application",
          "skillsDemonstrated": ["React", "Node.js", "MongoDB", "API Design"],
          "timeCommitment": "40-60 hours",
          "visibility": "GitHub repository + live deployment",
          "impact": "Demonstrates end-to-end development capability"
        }
      ],
      "peerComparison": {
        "percentile": 68,
        "interpretation": "Above average in foundational skills but room for advanced specialization",
        "topPerformerTraits": ["Continuous learning mindset", "Strong portfolio", "Industry certifications"],
        "howToImprove": "Focus on advanced technical skills and building a strong portfolio"
      },
      "skillTransferAnalysis": [
        {
          "currentSkill": "Project Management",
          "transfersTo": ["Product Management", "Scrum Master", "Program Manager", "Operations Manager"],
          "transferability": "high",
          "additionalSkillsNeeded": ["Product roadmap planning", "Agile methodology certification"],
          "timeToTransition": "3-6 months"
        }
      ],
      "marketDemand": {
        "hotSkills": ["AI/ML", "Cloud Architecture", "Data Engineering", "Cybersecurity"],
        "demandTrend": "increasing|stable|declining",
        "jobOpenings": "12,000+ openings in your region (estimate)",
        "competitionLevel": "moderate - need to differentiate with portfolio and certifications",
        "salaryRange": "$75,000-$125,000 for ${targetField || 'this field'}"
      },
      "salaryImpact": {
        "currentEstimate": "$70,000-$90,000 based on current skills",
        "targetFieldEstimate": "$95,000-$125,000 with target skills",
        "milestoneGains": [
          {
            "milestone": "Complete AWS certification",
            "expectedIncrease": "$8,000-$12,000 annually"
          },
          {
            "milestone": "Build 3-project portfolio",
            "expectedIncrease": "$5,000-$8,000 in negotiating power"
          }
        ]
      },
      "resources": [
        {
          "skill": "skill name",
          "type": "course|book|certification|bootcamp|practice",
          "resource": "Specific resource name with details",
          "url": "Direct URL if applicable",
          "timeline": "Estimated completion time",
          "cost": "$X or Free"
        }
      ],
      "readinessScore": 68,
      "summary": "Comprehensive 3-4 sentence summary of current position, key strengths to leverage, critical gaps to address, and realistic timeline to target field readiness",
      "timeline": "6-9 months to strong job-ready status in ${targetField || 'target field'}",
      "immediateActions": [
        "This week: Enroll in [specific course] to address [specific gap]",
        "This month: Start building [specific portfolio project]",
        "This quarter: Join [specific community or group] for networking"
      ]
    }

    QUALITY STANDARDS:
    • Be specific with course names, certification titles, and resource recommendations
    • Use realistic, data-informed timelines and salary estimates
    • Provide actionable, immediate next steps
    • Reference current market trends and in-demand skills
    • Assess both technical and soft skills comprehensively
    • Be encouraging but realistic about the effort required`;

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
          { role: 'user', content: `Analyze these skill assessment responses and provide comprehensive career development recommendations following the detailed structure provided.` }
        ],
        max_completion_tokens: 4000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to analyze skills');
    }

    let assessment;
    try {
      assessment = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback assessment if JSON parsing fails
      assessment = {
        strengths: ["Problem-solving", "Communication", "Adaptability"],
        gaps: ["Technical skills", "Industry knowledge", "Leadership experience"],
        priorities: ["Technical skill development", "Industry networking", "Certification pursuit"],
        resources: [
          {
            skill: "Technical Skills",
            type: "course",
            resource: "Online courses in your target field",
            timeline: "3-6 months"
          }
        ],
        readinessScore: 65,
        summary: "You have strong foundational skills but need to develop technical expertise specific to your target field.",
        timeline: "4-8 months to significant improvement"
      };
    }

    return new Response(
      JSON.stringify({ assessment }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing skills assessment:', error);
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