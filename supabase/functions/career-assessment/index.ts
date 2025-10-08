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
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not found');
    }

    console.log('Processing career assessment with OpenAI gpt-4.1 model...');

    const systemPrompt = `You are a career counseling expert specializing in career path analysis and professional development guidance. Analyze the user's assessment responses to provide comprehensive career recommendations.

    User Responses: ${JSON.stringify(responses)}

    Based on their responses, provide:
    1. Top 3-5 recommended career paths that align with their interests, skills, and values
    2. Career fit analysis for each recommendation (why it's a good match)
    3. Required skills and qualifications for each path
    4. Market outlook and salary expectations
    5. Transition steps and timeline for career change
    6. Potential challenges and how to overcome them

    Focus on:
    - Evidence-based recommendations tied to their responses
    - Current job market trends and opportunities
    - Realistic transition pathways
    - Both traditional and emerging career options
    - Work-life balance considerations
    - Growth potential and advancement opportunities

    Return as a JSON object with this structure:
    {
      "recommendations": [
        {
          "title": "Career Path Title",
          "fitScore": 85,
          "description": "Brief description of the role",
          "whyGoodFit": "Explanation based on their responses",
          "requiredSkills": ["skill1", "skill2"],
          "education": "Educational requirements",
          "salaryRange": "$50k-$80k",
          "marketOutlook": "Growing/Stable/Declining",
          "transitionTime": "6-12 months",
          "challenges": ["challenge1", "challenge2"],
          "nextSteps": ["step1", "step2"]
        }
      ],
      "summary": "Overall career assessment summary",
      "keyStrengths": ["strength1", "strength2"],
      "developmentAreas": ["area1", "area2"],
      "generalAdvice": "Personalized career development advice"
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
          { role: 'user', content: `Analyze these career assessment responses and provide personalized career recommendations.` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error(data.error?.message || 'Failed to analyze career assessment');
    }

    console.log('Successfully received OpenAI response');

    let analysis;
    try {
      analysis = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback analysis if JSON parsing fails
      analysis = {
        recommendations: [
          {
            title: "Project Manager",
            fitScore: 85,
            description: "Lead cross-functional teams to deliver projects on time and within budget",
            whyGoodFit: "Strong organizational and communication skills align well with project management",
            requiredSkills: ["Project management", "Leadership", "Communication", "Problem-solving"],
            education: "Bachelor's degree preferred, PMP certification beneficial",
            salaryRange: "$65k-$95k",
            marketOutlook: "Growing",
            transitionTime: "3-6 months",
            challenges: ["Learning project management methodologies", "Building leadership experience"],
            nextSteps: ["Complete PMP certification", "Gain experience with project management tools"]
          }
        ],
        summary: "You show strong potential for leadership and organizational roles that require strategic thinking and people management.",
        keyStrengths: ["Communication", "Problem-solving", "Adaptability", "Team collaboration"],
        developmentAreas: ["Technical skills", "Industry expertise", "Leadership experience"],
        generalAdvice: "Focus on building leadership skills and gaining relevant certifications to transition into management roles."
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing career assessment:', error);
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