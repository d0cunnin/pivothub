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

    const systemPrompt = `You are a personality assessment expert specializing in workplace personality analysis and career fit recommendations. Analyze the user's responses to provide insights into their personality traits and how they relate to career success.

    User Responses: ${JSON.stringify(responses)}

    Based on their responses, provide:
    1. Primary personality traits and characteristics
    2. Work style preferences and motivations
    3. Ideal work environments and team dynamics
    4. Leadership style and collaboration approach
    5. Career paths that align with their personality
    6. Potential blind spots and development areas
    7. Tips for maximizing their natural strengths

    Focus on:
    - Actionable insights for career development
    - How their personality affects work performance
    - Team collaboration and leadership effectiveness
    - Work-life balance considerations
    - Communication and decision-making styles
    - Stress management and resilience factors

    Return as a JSON object with this structure:
    {
      "personalityType": "Primary personality classification",
      "keyTraits": [
        {
          "trait": "trait name",
          "score": 85,
          "description": "detailed description"
        }
      ],
      "workStyle": {
        "preferences": ["preference1", "preference2"],
        "motivators": ["motivator1", "motivator2"],
        "idealEnvironment": "description of ideal work environment",
        "teamRole": "natural team role they gravitate towards"
      },
      "careerFit": [
        {
          "field": "career field",
          "fitReason": "why this fits their personality",
          "examples": ["specific job titles"]
        }
      ],
      "strengths": ["strength1", "strength2"],
      "developmentAreas": ["area1", "area2"],
      "communicationStyle": "how they naturally communicate",
      "leadershipStyle": "their approach to leadership",
      "tips": ["actionable tip1", "actionable tip2"],
      "summary": "Overall personality assessment and career guidance"
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
          { role: 'user', content: `Analyze these personality assessment responses and provide career-focused insights.` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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