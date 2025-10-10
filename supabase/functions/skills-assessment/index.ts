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

    const systemPrompt = `You are a career development expert specializing in skills assessment and professional development planning. Analyze the user's responses to provide a comprehensive skills evaluation.

    Target Field: ${targetField || 'General'}
    User Responses: ${JSON.stringify(responses)}

    Based on their responses, provide:
    1. Current skill strengths (what they're already good at)
    2. Skill gaps to address for their target field
    3. Recommended learning priorities (most important skills to develop first)
    4. Specific learning resources and next steps
    5. Timeline for skill development
    6. Overall readiness assessment for their target field

    Focus on:
    - Actionable insights they can implement immediately
    - Industry-relevant skills and trends
    - Both technical and soft skills
    - Realistic timelines and expectations
    - Specific resources (courses, certifications, books)

    Return as a JSON object with this structure:
    {
      "strengths": ["strength1", "strength2"],
      "gaps": ["gap1", "gap2"],
      "priorities": ["priority1", "priority2"],
      "resources": [
        {
          "skill": "skill name",
          "type": "course|book|certification|practice",
          "resource": "specific resource name",
          "url": "optional_url",
          "timeline": "estimated time to complete"
        }
      ],
      "readinessScore": 75,
      "summary": "Overall assessment and next steps...",
      "timeline": "3-6 months to significant improvement"
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
          { role: 'user', content: `Analyze these skill assessment responses and provide development recommendations.` }
        ],
        temperature: 0.7,
        max_tokens: 1500,
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