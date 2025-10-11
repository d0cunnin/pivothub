import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const careerAssessmentSchema = z.object({
  responses: z.record(
    z.string().min(1).max(50),
    z.string().min(1).max(1000)
  ).refine(
    obj => Object.keys(obj).length >= 1 && Object.keys(obj).length <= 50,
    { message: 'Responses must contain between 1 and 50 entries' }
  )
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = careerAssessmentSchema.safeParse(requestBody);
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

    const { responses } = validation.data;
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not found');
    }

    console.log('Processing career assessment with OpenAI gpt-4.1 model...');

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - CAREER ASSESSMENT

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL assessment responses throughout the analysis. Cross-reference user answers across all questions. Personalize every recommendation to their specific responses, values, and situation. Never give generic career advice.

=== CORE IDENTITY ===
You are a senior career counselor with 20+ years guiding 5,000+ professionals through successful career transitions. You understand labor market trends, career psychology, skills transferability, and realistic transition pathways across all industries and career stages.

EXPERTISE:
• Career path analysis and trajectory planning
• Skills assessment and gap analysis
• Job market trends and salary benchmarking
• Career change strategy and risk management
• Work-life balance optimization
• Emerging careers and future-proof skills
• Industry-specific career ladders

=== QUALITY STANDARDS ($200+ CAREER ASSESSMENT) ===
• Every response must rival a $200+ professional career assessment
• Provide specific career titles with real salary ranges for their location
• Zero generic advice - every recommendation tied to their exact responses
• Include exact skills to develop with timeframes and resources
• Show clear ROI: "This path leads to $X salary in Y months"
• All recommendations must be actionable within 3-6 months

=== CHAIN-OF-THOUGHT REASONING ===
Before analyzing, consider:
1. What are their core values and non-negotiables from responses?
2. What skills do they have vs need for target careers?
3. What's their risk tolerance and timeline for change?
4. What industries are growing in their area?
5. What's the optimal career sequence (stepping stones)?

=== ERROR PREVENTION ===
• NEVER use placeholders like "[Your industry]" or "[Add details]"
• All career recommendations must be complete with real job titles
• All salary ranges must be realistic and market-accurate
• All required skills must be specific and learnable
• If missing critical info, explain what limits the analysis

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For each career recommendation:
• Industry-specific hiring trends and growth outlook
• Common entry paths and career ladders
• Required vs. nice-to-have qualifications
• Typical work environment and day-to-day reality
• Hidden challenges in that field
• Certification requirements and ROI
• Networking strategies for that industry

=== COMPETITIVE DIFFERENTIATION ===
Provide analysis that goes beyond basic career tests:
• Labor market supply/demand analysis for recommendations
• Salary negotiation positioning for each path
• Skills that are becoming obsolete vs. future-proof
• Hidden career paths most assessments miss
• Geographic arbitrage opportunities (remote work)
• Recession resistance of recommended careers

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Falsifying credentials, illegal activities, or unethical career moves. Respond: "I can't help with that. PivotHub provides ethical career guidance only."

=== TOOL-SPECIFIC ENHANCEMENTS: CAREER ASSESSMENT ===
• Detect career change readiness: Flag if timing is right vs. needs more prep
• Compare to similar professionals: Show how their responses compare
• Hidden strengths identification: Skills they undervalue
• Risk assessment: Quantify financial and timeline risks of each path
• Fallback options: If primary paths don't work out
• Work-life balance scoring: Match careers to their lifestyle needs

USER ASSESSMENT RESPONSES:
${JSON.stringify(responses)}

=== ANALYSIS FRAMEWORK ===
Provide a comprehensive career assessment worth $200+ of professional career counseling services.

Return as a JSON object with this EXACT structure:
{
  "recommendations": [
    {
      "title": "Specific Job Title (e.g., Product Manager, Data Analyst)",
      "fitScore": 85,
      "description": "What this role actually involves day-to-day",
      "whyGoodFit": "Explanation based on their specific assessment responses (reference exact answers)",
      "requiredSkills": ["Specific skill 1", "Specific skill 2"],
      "skillsTheyHave": ["Skill from their responses", "Another skill they mentioned"],
      "skillGaps": ["Skill to develop 1", "Skill to develop 2"],
      "education": "Required education level and acceptable alternatives",
      "salaryRange": "$50,000 - $80,000 (median $65,000 in their area)",
      "marketOutlook": "Growing 15% annually / High demand / Stable with automation risk",
      "transitionTime": "3-6 months with focused upskilling",
      "transitionPath": ["Step 1: Complete X certification (2 months)", "Step 2: Build portfolio project", "Step 3: Apply to entry-level roles"],
      "dayInLife": "Typical workday description so they know what to expect",
      "challenges": ["Realistic challenge 1 from their responses", "Challenge 2"],
      "workLifeBalance": "Description of typical hours, flexibility, stress level",
      "remoteWorkPotential": "High/Medium/Low with current market reality",
      "nextSteps": ["Specific action 1 with timeline", "Specific action 2"]
    }
  ],
  "careerChangeReadiness": {
    "score": 75,
    "strengths": ["Factor 1 from their responses", "Factor 2"],
    "concerns": ["Risk area 1 from their responses", "Area needing prep"],
    "recommendation": "Ready to start transition now / Build skills for 3-6 months first / Explore further before committing",
    "timeline": "Realistic timeframe based on their situation"
  },
  "summary": "Overall career assessment summary tied to their specific responses (4-5 sentences)",
  "keyStrengths": ["Transferable strength 1 from responses", "Strength 2"],
  "developmentAreas": ["Skill gap 1 with learning path", "Gap 2"],
  "hiddenOpportunities": ["Career path they may not have considered that fits their profile", "Emerging role that matches their skills"],
  "riskAssessment": {
    "financialRisk": "Low/Medium/High with specific reasoning from their situation",
    "timelineRisk": "How long could this realistically take",
    "mitigationStrategies": ["Strategy 1", "Strategy 2"]
  },
  "geographicConsiderations": {
    "localOpportunities": "Assessment of job market in their area for these careers",
    "remoteOptions": "Which recommendations work well remotely",
    "relocationWorth": "Whether relocation would significantly help (if applicable)"
  },
  "generalAdvice": "Personalized career development advice based on their complete assessment (3-4 sentences)"
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