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
    const { responses } = await req.json();
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are a senior career psychologist and executive coach with 20+ years of experience in organizational behavior, personality assessment, and leadership development. You've coached C-suite executives, entrepreneurs, and professionals across industries, helping them understand their natural tendencies and leverage their personality for career success.

    EXPERTISE:
    • Myers-Briggs, Big Five, DISC, and workplace personality frameworks
    • Executive presence and leadership development
    • Career path optimization based on personality fit
    • Team dynamics and organizational psychology
    • Communication styles and conflict resolution
    • Work-life integration and stress management
    • Personal branding and professional positioning

    USER ASSESSMENT RESPONSES: ${JSON.stringify(responses)}

    ANALYSIS FRAMEWORK:
    Provide a comprehensive personality analysis that rivals a $400 executive coaching session. Focus on career implications, team dynamics, leadership potential, and personal development.

    Return as a detailed JSON object with this EXACT structure:

    {
      "personalityType": "Primary personality classification (e.g., Analytical Collaborator, Strategic Executor)",
      "keyTraits": [
        {
          "trait": "Specific trait name (e.g., Analytical Thinking)",
          "score": 85,
          "description": "2-3 sentences explaining this trait and its career implications"
        }
      ],
      "workStyle": {
        "preferences": ["Structured environment with clear goals", "Collaborative projects", "Deep work time"],
        "motivators": ["Problem-solving", "Learning and growth", "Making measurable impact"],
        "idealEnvironment": "Detailed description of the work environment where they thrive",
        "teamRole": "The role they naturally take on teams (e.g., Strategic thinker, Implementer, Facilitator)"
      },
      "careerCompatibility": [
        {
          "role": "Product Manager",
          "industry": "Technology / SaaS",
          "compatibilityScore": 87,
          "fitReason": "2-3 sentences explaining why their personality fits this role perfectly",
          "successFactors": ["Strong analytical skills", "Collaborative nature", "Data-driven decision making"],
          "challenges": ["May need to develop executive presence", "Practice quick decision-making under pressure"],
          "examples": ["Senior Product Manager at tech startups", "Product Lead at SaaS companies", "Technical Product Owner"]
        }
      ],
      "workEnvironmentAnalysis": {
        "remoteVsOffice": {
          "preference": "hybrid|remote|office",
          "score": 75,
          "reasoning": "Detailed explanation of why this environment suits them"
        },
        "teamSize": {
          "ideal": "5-15 people",
          "reasoning": "Explanation of why this team size works best"
        },
        "structureLevel": {
          "preference": "high|moderate|low structure",
          "score": 65,
          "reasoning": "Balance between autonomy and framework they need"
        },
        "pacePreference": "steady with occasional sprints|fast-paced|slow and methodical",
        "changeAdaptability": "high|moderate|low - ability to handle organizational change"
      },
      "communicationOptimization": {
        "naturalStyle": "Thoughtful and analytical|Direct and action-oriented|Warm and relationship-focused",
        "withExecutives": "Specific advice on how to communicate effectively with senior leadership",
        "withPeers": "How to collaborate and communicate with colleagues at their level",
        "withDirectReports": "Leadership communication approach if managing others",
        "presentationStyle": "How to present ideas effectively (data-driven, storytelling, visual)",
        "writtenCommunication": "Strengths and tips for email and document communication"
      },
      "leadershipDevelopmentPath": {
        "currentStage": "Emerging Leader|Individual Contributor|Mid-Level Manager|Senior Leader",
        "naturalLeadershipStyle": "Collaborative consensus-builder|Decisive commander|Servant leader|Visionary",
        "nextStageGoals": [
          "Develop executive presence and confident communication",
          "Practice decisive leadership in ambiguous situations",
          "Build strategic thinking and long-term planning skills"
        ],
        "timelineToNextStage": "12-18 months with focused development",
        "developmentActivities": [
          "Lead cross-functional project to practice stakeholder management",
          "Join Toastmasters or public speaking group",
          "Seek executive mentor in target role"
        ]
      },
      "conflictResolution": {
        "approach": "Collaborative problem-solving|Avoidant|Direct confrontation|Mediator",
        "strengths": ["Active listening", "Finding common ground", "Maintaining composure"],
        "growthAreas": ["Direct confrontation when needed", "Setting firm boundaries", "Quick resolution"],
        "scenarioGuidance": {
          "withDifficultPeer": "Specific 2-3 sentence advice on handling peer conflict",
          "withUnresponsiveManager": "How to escalate or address upward management issues",
          "inTeamConflict": "Facilitation approach when team members disagree"
        }
      },
      "stressManagement": {
        "primaryTriggers": ["Ambiguity and lack of clarity", "Tight deadlines with limited resources", "Interpersonal conflict"],
        "earlyWarningSigns": ["Overthinking and analysis paralysis", "Withdrawal from team", "Perfectionism"],
        "copingStrategies": [
          "Break large ambiguous tasks into smaller concrete steps",
          "Seek clarification proactively rather than assuming",
          "Practice mindfulness and scheduled breaks",
          "Maintain work-life boundaries"
        ],
        "resilienceScore": 72,
        "burnoutRisk": "moderate-low|moderate|moderate-high",
        "preventionTips": "Specific advice on maintaining long-term career sustainability"
      },
      "personalBrandPositioning": {
        "uniqueStrengths": "What makes them stand out (2-3 sentences)",
        "differentiators": ["Analytical depth with collaborative style", "Technical expertise with business acumen", "Strategic thinking with execution capability"],
        "linkedInHeadline": "Specific optimized LinkedIn headline (120 characters)",
        "elevatorPitch": "30-second professional introduction script they can use",
        "targetAudience": "Who they should market themselves to (hiring managers, recruiters, clients)",
        "personalBrandAdjectives": ["Data-driven", "Collaborative", "Results-oriented"]
      },
      "teamComposition": {
        "complementaryPersonalities": ["Action-oriented executor to balance analysis", "Creative visionary for ideation", "Detail-oriented implementer"],
        "idealManagerProfile": "Supportive coach who provides autonomy|Directive leader with clear expectations|Strategic mentor",
        "idealDirectReportProfile": "Detail-oriented implementer|Creative problem-solver|Execution-focused",
        "teamDynamicsAdvice": "How to work effectively in team settings given their personality"
      },
      "careerTrajectory": {
        "shortTerm": "Senior individual contributor or team lead role (1-2 years)",
        "mediumTerm": "Director-level leadership or senior IC expert (3-5 years)",
        "longTerm": "VP/C-suite executive or specialized consultant/advisor (7-10 years)",
        "alternativePaths": [
          "Deep technical/functional expert (individual contributor track)",
          "Startup founder or entrepreneur",
          "Independent consultant or fractional executive"
        ],
        "pivotOpportunities": "Adjacent careers or industries where skills transfer well"
      },
      "strengths": ["Core strength 1 with career advantage", "Core strength 2", "Core strength 3"],
      "developmentAreas": ["Area for growth 1 with development approach", "Area 2", "Area 3"],
      "actionPlan": [
        "This week: Join one professional group aligned with your personality and career goals",
        "This month: Practice decisive communication in 3 meetings this month",
        "This quarter: Lead one cross-functional initiative to develop leadership skills",
        "This year: Seek mentor in target role and work toward next career stage"
      ],
      "communicationStyle": "Overall natural communication style with strengths and areas for development",
      "leadershipStyle": "Natural leadership approach and how to develop it further",
      "tips": ["Actionable career tip 1", "Tip 2", "Tip 3"],
      "summary": "Comprehensive 4-5 sentence summary of their personality, career fit, key strengths to leverage, areas for development, and strategic career guidance"
    }

    QUALITY STANDARDS:
    • Provide executive-level insights, not generic personality descriptions
    • Be specific about career paths, roles, and industries
    • Include concrete development activities and timelines
    • Reference current 2025 workplace trends
    • Balance encouragement with realistic assessment
    • Focus on actionable career strategies`;

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
          { role: 'user', content: `Analyze these personality assessment responses and provide comprehensive executive-level career insights following the detailed structure.` }
        ],
        max_completion_tokens: 4000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to analyze personality');
    }

    let personality;
    try {
      personality = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback personality analysis if JSON parsing fails
      personality = {
        personalityType: "Analytical Collaborator",
        keyTraits: [
          {
            trait: "Analytical Thinking",
            score: 85,
            description: "You excel at breaking down complex problems and finding logical solutions"
          },
          {
            trait: "Team Collaboration",
            score: 78,
            description: "You work well with others and value diverse perspectives"
          }
        ],
        workStyle: {
          preferences: ["Structured environment", "Clear goals", "Collaborative projects"],
          motivators: ["Problem-solving", "Learning", "Making impact"],
          idealEnvironment: "Collaborative yet focused workspace with opportunities for deep thinking",
          teamRole: "The strategic thinker who brings analysis and solutions"
        },
        careerFit: [
          {
            field: "Technology",
            fitReason: "Your analytical skills and collaborative nature suit tech environments",
            examples: ["Product Manager", "Business Analyst", "UX Researcher"]
          }
        ],
        strengths: ["Analytical thinking", "Problem-solving", "Team collaboration"],
        developmentAreas: ["Public speaking", "Risk-taking", "Quick decision-making"],
        communicationStyle: "Thoughtful and data-driven, prefers to analyze before speaking",
        leadershipStyle: "Collaborative leader who builds consensus through analysis and inclusion",
        tips: ["Leverage your analytical skills in strategic roles", "Practice presenting ideas confidently"],
        summary: "You're a natural problem-solver who thrives in collaborative, structured environments where you can apply analytical thinking to meaningful challenges."
      };
    }

    return new Response(
      JSON.stringify({ personality }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing personality assessment:', error);
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