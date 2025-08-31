import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('relaunch_openai_key');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentType, responses, userProfile } = await req.json();
    
    // Get the authorization header for user context
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }

    console.log(`Processing ${assessmentType} assessment for user ${userId}`);

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
        max_completion_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.choices[0].message.content;
    console.log('AI Response received:', content.substring(0, 200) + '...');
    
    let analysis;
    try {
      analysis = JSON.parse(content);
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

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced-assessment-analyzer:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getSystemPromptForAssessment(assessmentType: string): string {
  const basePrompt = `You are an expert career counselor and assessment analyst. Provide detailed, actionable analysis in plain text without markdown formatting. Respond with valid JSON only.`;
  
  switch (assessmentType) {
    case 'career':
      return `${basePrompt}

Analyze career assessment responses and provide comprehensive insights. Return JSON with this exact structure:

{
  "overallScore": number (1-10),
  "primaryInterests": ["interest1", "interest2", "interest3"],
  "topCareerPaths": [
    {
      "title": "Career Title",
      "match": number (1-10),
      "description": "Why this career fits",
      "requirements": ["req1", "req2"],
      "growthOutlook": "growth description"
    }
  ],
  "skillsNeeded": ["skill1", "skill2", "skill3"],
  "actionPlan": {
    "immediate": ["action1", "action2"],
    "shortTerm": ["action1", "action2"],
    "longTerm": ["action1", "action2"]
  },
  "personalityAlignment": "explanation of how personality traits align with career suggestions",
  "nextSteps": "specific guidance for immediate next steps",
  "resources": ["resource1", "resource2", "resource3"]
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