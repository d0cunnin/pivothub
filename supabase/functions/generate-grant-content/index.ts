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
    const grantData = await req.json();
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are a professional grant writer with expertise in creating compelling grant proposals and letters of intent. Generate high-quality, professional documents that effectively communicate the project's value and impact.

Grant Application Details:
- Organization: ${grantData.organizationName}
- Project Title: ${grantData.projectTitle}
- Project Description: ${grantData.projectDescription}
- Grant Amount: $${grantData.grantAmountRequested}
- Purpose of Funds: ${grantData.purposeOfFunds}
- Target Population: ${grantData.targetPopulation}
- Project Goals: ${grantData.projectGoals}
- Timeline: ${grantData.projectTimeline}
- Community Impact: ${grantData.communityImpact}
- Sustainability Plan: ${grantData.sustainabilityPlan}
- Organization Background: ${grantData.organizationBackground}
- Contact Person: ${grantData.contactPersonName}
- Contact Title: ${grantData.contactTitle}
- Contact Email: ${grantData.contactEmail}
- Contact Phone: ${grantData.contactPhone}
- Additional Information: ${grantData.additionalInformation}
- Grant Requirements: ${grantData.grantRequirements}

Create two documents:
1. A comprehensive grant proposal (1500-2000 words)
2. A concise letter of intent (500-700 words)

Both should be professionally written, compelling, and specifically tailored to the provided information. Include proper formatting, clear sections, and persuasive language that demonstrates the project's value and impact.

Return as JSON:
{
  "proposal": "full grant proposal text",
  "letterOfIntent": "letter of intent text"
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
          { role: 'user', content: `Generate a professional grant proposal and letter of intent for this ${grantData.projectTitle} project.` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate grant content');
    }

    let grantContent;
    try {
      grantContent = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const content = data.choices[0].message.content;
      const proposalMatch = content.match(/```proposal\n(.*?)\n```/s) || content.match(/"proposal":\s*"(.*?)"/s);
      const loiMatch = content.match(/```letterOfIntent\n(.*?)\n```/s) || content.match(/"letterOfIntent":\s*"(.*?)"/s);
      
      grantContent = {
        proposal: proposalMatch ? proposalMatch[1] : content.split('LETTER OF INTENT')[0] || content,
        letterOfIntent: loiMatch ? loiMatch[1] : content.split('LETTER OF INTENT')[1] || generateFallbackLOI(grantData)
      };
    }

    return new Response(
      JSON.stringify(grantContent),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating grant content:', error);
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

function generateFallbackLOI(grantData: any): string {
  return `LETTER OF INTENT

${new Date().toLocaleDateString()}

Dear Grant Review Committee,

${grantData.organizationName} respectfully submits this Letter of Intent for the "${grantData.projectTitle}" project. We are seeking $${grantData.grantAmountRequested} to support this vital initiative that will create meaningful impact in our community.

PROJECT OVERVIEW
${grantData.projectDescription}

Our organization has a proven track record of successful project implementation and community engagement. This project aligns with our mission and will directly benefit ${grantData.targetPopulation}.

We believe this project represents an excellent opportunity to advance our shared goals of community development and positive social impact. We would be honored to submit a full proposal for your consideration.

Thank you for your time and consideration.

Sincerely,

${grantData.contactPersonName}
${grantData.contactTitle}
${grantData.organizationName}
${grantData.contactEmail}
${grantData.contactPhone}`;
}