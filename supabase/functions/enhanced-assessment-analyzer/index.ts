import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";

// Validation schema
const assessmentAnalyzerSchema = z.object({
  assessmentType: z.enum(['career', 'skills', 'personality']),
  responses: z.record(z.any()),
  userProfile: z.record(z.any()).optional()
});

const openAIApiKey = Deno.env.get('pivothub-openai-key');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

serve(async (req) => {
  const startTime = Date.now();
  let userId: string | null = null;
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "enhanced-assessment-analyzer",
      cost: 3,
      requireAuth: true,
      maxReqsPerMinute: 30
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = assessmentAnalyzerSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { assessmentType, responses, userProfile } = validation.data;

    console.log(`Processing ${assessmentType} assessment for user ${userId}`);
    
    // Content moderation (medium risk - fail open)
    const moderationText = JSON.stringify(responses);
    const moderationResult = await moderateContent(moderationText, 'enhanced-assessment-analyzer', userId, 'medium');
    
    if (moderationResult.flagged) {
      console.warn('Content flagged by moderation:', moderationResult.categories);
      return new Response(
        JSON.stringify({ 
          error: 'Content policy violation detected',
          details: 'Your assessment responses contain content that violates our policies. Please revise and try again.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = getSystemPromptForAssessment(assessmentType);
    
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
          { role: 'user', content: `Assessment Type: ${assessmentType}\nUser Responses: ${JSON.stringify(responses)}\nUser Profile: ${JSON.stringify(userProfile || {})}` }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText.slice(0, 200)}`);
    }

    const data = await response.json();

    const content = data.choices[0].message.content;
    console.log('AI Response received:', content.substring(0, 200) + '...');
    
    let analysis;
    try {
      // Sanitize and parse JSON
      const sanitizedContent = content
        .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
        .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove triple asterisks
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
        .replace(/```json\s*|\s*```/g, '') // Remove code blocks
        .trim();
      
      analysis = JSON.parse(sanitizedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      analysis = createFallbackAnalysis(assessmentType, responses);
    }

    // Save results to database if user is authenticated
    if (userId) {
      const { error: saveError } = await supabase
        .from('assessment_results')
        .insert({
          user_id: userId,
          assessment_type: assessmentType,
          results: responses,
          detailed_analysis: analysis,
          score: analysis.overallScore || null
        });

      if (saveError) {
        console.error('Error saving assessment results:', saveError);
      } else {
        console.log('Assessment results saved successfully');
      }
    }

    await logRequest(guardResult.supabase, {
      endpoint: "enhanced-assessment-analyzer",
      userId: userId || 'unknown',
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 3,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced-assessment-analyzer:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logRequest(supabase, {
      endpoint: "enhanced-assessment-analyzer",
      userId: userId || 'unknown',
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: false,
      creditsCharged: 0,
      errorMessage,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSystemPromptForAssessment(assessmentType: string): string {
  const basePrompt = `You are a senior career strategist and psychologist with 20+ years of experience conducting assessments for Fortune 500 companies and helping individuals achieve career breakthroughs. You've personally guided over 3,000 successful career transitions and pivots. 

Your assessments are known for being deeply insightful, actionable, and transformative - not generic. Provide detailed, evidence-based analysis in plain text without markdown formatting. Do NOT use ### headers, ** bold, or * italics. Respond with valid JSON only.

CRITICAL: Every recommendation must be specific, personalized to their responses, and immediately actionable with concrete next steps.`;
  
  switch (assessmentType) {
    case 'career':
      return `${basePrompt}

Analyze career assessment responses and provide a comprehensive, transformative career roadmap. This assessment should feel like a $2,000 professional career counseling session.

Return JSON with this exact structure:

{
  "overallScore": number (1-10 with explanation of what this score represents),
  "primaryInterests": ["interest1 with explanation", "interest2 with explanation", "interest3 with explanation"],
  "topCareerPaths": [
    {
      "title": "Specific Career Title",
      "match": number (1-10),
      "description": "3-4 sentences explaining exactly why this career aligns with their responses, personality, skills, and interests. Be specific about what aspects of their assessment led to this recommendation.",
      "requirements": ["Specific requirement 1", "Specific requirement 2", "Specific requirement 3", "Timeline estimate"],
      "growthOutlook": "Detailed growth description with current market data, salary ranges ($X-$Y), demand trends, and future-proofing assessment",
      "entryStrategy": "2-3 sentences on exactly how to break into this field given their background",
      "dayToDay": "What a typical day looks like in this role",
      "successProfile": "Personality traits and skills that predict success in this role"
    }
    [Provide 5-7 career paths ranked by match score]
  ],
  "skillsNeeded": [
    "Technical Skill 1 (Priority: High) - Estimated learning time: X months - Resources: [specific courses or certifications]",
    "Soft Skill 2 (Priority: Medium) - How to develop: [specific approach]",
    [10-15 prioritized skills with development guidance]
  ],
  "skillGapAnalysis": {
    "currentStrengths": ["Strength 1 with evidence from assessment", "Strength 2", "Strength 3"],
    "criticalGaps": ["Gap 1 with impact explanation", "Gap 2", "Gap 3"],
    "quickWinSkills": ["Skills they can develop in 30 days to build momentum"]
  },
  "actionPlan": {
    "immediate": [
      "Week 1: [Specific action with exact steps]",
      "Week 2: [Specific action with resources]",
      "Week 3-4: [Specific action with measurable outcome]",
      [5-7 immediate actions for first month]
    ],
    "shortTerm": [
      "Month 2-3: [Specific milestone with tactics]",
      "Month 4-6: [Specific milestone with resources]",
      [6-8 actions for months 2-6]
    ],
    "longTerm": [
      "Year 1: [Major milestone with success metrics]",
      "Year 2: [Career progression target]",
      "Year 3-5: [Long-term positioning and income goals]",
      [4-6 actions for 1-5 year horizon]
    ]
  },
  "careerRoadmap": {
    "entryLevel": "Specific role title with $X-$Y salary range and timeline",
    "midCareer": "Progression path with 3-5 years experience",
    "senior": "Senior role trajectory with 7-10 years experience",
    "executiveTrack": "C-suite or equivalent path if applicable"
  },
  "personalityAlignment": "4-5 sentences with deep analysis of how their personality traits, work style preferences, and values from the assessment align with recommended careers. Include specific examples from their responses.",
  "industryInsights": [
    "Current trend 1 affecting these career paths",
    "Industry transformation 2 to be aware of",
    "Emerging opportunity 3 in these fields",
    "Risk factor 4 and mitigation strategy"
  ],
  "networkingStrategy": {
    "targetConnections": ["Type of professionals to connect with 1", "Type 2", "Type 3"],
    "communities": ["Specific LinkedIn group or Slack community 1", "Community 2", "Community 3"],
    "events": ["Specific upcoming conferences or meetups", "Event 2", "Event 3"],
    "informationalInterviews": "Template message and approach for reaching out"
  },
  "financialProjections": {
    "currentRange": "$X-$Y based on their background",
    "year1Target": "$X-$Y with strategy to achieve",
    "year3Target": "$X-$Y with progression path",
    "year5Target": "$X-$Y with senior role positioning"
  },
  "educationPath": [
    "Formal education needs (degree, bootcamp, certification) with cost and time",
    "Self-study resources with specific courses and platforms",
    "Micro-credentials or certifications currently valued",
    "Learning timeline optimized for their situation"
  ],
  "nextSteps": "4-5 sentences providing crystal clear guidance on the single most important action to take in the next 48 hours, why it matters, and exactly how to do it. Include a specific deliverable or outcome.",
  "resources": [
    "Specific website, platform, or tool 1 (e.g., 'Join DataCamp for Python skills - $25/month')",
    "Specific resource 2 with exact URL or name",
    "Specific resource 3 with cost and time investment",
    [15-20 specific, named resources]
  ],
  "potentialObstacles": [
    "Common barrier 1 for this transition and exact solution",
    "Challenge 2 they'll likely face and proven workaround",
    "Mental block 3 and mindset shift needed"
  ],
  "successStories": [
    "Anonymized example of someone with similar profile who succeeded in recommended path",
    "Key lessons from their journey",
    "Timeline and milestones they achieved"
  ],
  "confidenceBuilder": "3-4 sentences of encouragement based on specific strengths identified in their assessment, realistic timeline expectations, and why they're well-positioned for this transition."
}`;

    case 'skills':
      return `${basePrompt}

Analyze skills assessment responses and provide detailed skill gap analysis. Return JSON with this exact structure:

{
  "overallScore": number (1-10),
  "skillCategories": [
    {
      "category": "Category Name",
      "score": number (1-10),
      "level": "Beginner/Intermediate/Advanced",
      "strengths": ["strength1", "strength2"],
      "improvements": ["improvement1", "improvement2"]
    }
  ],
  "topSkills": ["skill1", "skill2", "skill3"],
  "skillGaps": ["gap1", "gap2", "gap3"],
  "actionPlan": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"]
  },
  "learningPath": [
    {
      "step": "Step description",
      "timeframe": "timeframe",
      "resources": ["resource1", "resource2"]
    }
  ],
  "careerImpact": "explanation of how improving these skills will impact career prospects",
  "certifications": ["cert1", "cert2"],
  "practiceOpportunities": ["opportunity1", "opportunity2"]
}`;

    case 'personality':
      return `${basePrompt}

Analyze personality assessment responses and provide comprehensive personality insights. Return JSON with this exact structure:

{
  "overallScore": number (1-10),
  "personalityType": "Primary Personality Type",
  "keyTraits": [
    {
      "trait": "Trait Name",
      "score": number (1-5),
      "description": "detailed explanation",
      "careerRelevance": "how this trait impacts career choices"
    }
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "workStyle": "description of ideal work environment and style",
  "careerFit": [
    {
      "field": "Career Field",
      "match": number (1-10),
      "reasoning": "why this field matches personality"
    }
  ],
  "actionPlan": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"]
  },
  "developmentAreas": ["area1", "area2"],
  "workEnvironmentTips": ["tip1", "tip2", "tip3"],
  "relationshipStyle": "how you work with others"
}`;

    default:
      return basePrompt;
  }
}

function createFallbackAnalysis(assessmentType: string, responses: any): any {
  const fallbackBase = {
    overallScore: 7,
    actionPlan: {
      immediate: ["Review your assessment results", "Identify key areas for improvement"],
      shortTerm: ["Set specific learning goals", "Seek feedback from mentors"],
      longTerm: ["Develop a comprehensive career plan", "Track your progress regularly"]
    }
  };

  switch (assessmentType) {
    case 'career':
      return {
        ...fallbackBase,
        primaryInterests: ["Technology", "Communication", "Problem Solving"],
        topCareerPaths: [{
          title: "Professional Development Specialist",
          match: 8,
          description: "Based on your responses, this field aligns with your interests",
          requirements: ["Bachelor's degree", "Communication skills"],
          growthOutlook: "Growing field with good opportunities"
        }],
        skillsNeeded: ["Leadership", "Communication", "Technical skills"],
        personalityAlignment: "Your responses suggest you work well in collaborative environments",
        nextSteps: "Focus on identifying your strongest interests and researching related career paths",
        resources: ["Career exploration websites", "Professional networking groups", "Informational interviews"]
      };

    case 'skills':
      return {
        ...fallbackBase,
        skillCategories: [{
          category: "General Skills",
          score: 7,
          level: "Intermediate",
          strengths: ["Basic competency demonstrated"],
          improvements: ["Continue practicing and learning"]
        }],
        topSkills: ["Communication", "Problem solving", "Adaptability"],
        skillGaps: ["Advanced technical skills", "Leadership experience"],
        learningPath: [{
          step: "Focus on your strongest skills first",
          timeframe: "1-3 months",
          resources: ["Online courses", "Practice exercises"]
        }],
        careerImpact: "Developing these skills will enhance your career prospects",
        certifications: ["Industry-relevant certifications"],
        practiceOpportunities: ["Volunteer work", "Side projects"]
      };

    case 'personality':
      return {
        ...fallbackBase,
        personalityType: "Balanced Professional",
        keyTraits: [{
          trait: "Adaptability",
          score: 4,
          description: "Shows flexibility in various situations",
          careerRelevance: "Important for most career paths"
        }],
        strengths: ["Balanced approach", "Willingness to learn", "Professional attitude"],
        workStyle: "Works well in structured environments with clear expectations",
        careerFit: [{
          field: "Professional Services",
          match: 8,
          reasoning: "Matches your demonstrated traits and preferences"
        }],
        developmentAreas: ["Leadership skills", "Specialized expertise"],
        workEnvironmentTips: ["Seek clear expectations", "Build professional relationships"],
        relationshipStyle: "Collaborative and professional"
      };

    default:
      return fallbackBase;
  }
}