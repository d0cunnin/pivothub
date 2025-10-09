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
    const { 
      ideaCategory, 
      description, 
      currentStage, 
      targetAudience, 
      availableResources, 
      launchGoals, 
      skillLevel, 
      desiredSupport, 
      additionalInfo 
    } = await req.json();
    
    const apiKey = Deno.env.get('relaunch_openai_key');
    if (!apiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are an expert business launch strategist and entrepreneurship advisor with experience across multiple industries. Create a comprehensive, actionable launch strategy based on the user's specific project details.

Project Details:
- Idea Category: ${ideaCategory}
- Description: ${description}
- Current Stage: ${currentStage}
- Target Audience: ${targetAudience}
- Available Resources: ${availableResources.join(', ')}
- Launch Goals: ${launchGoals.join(', ')}
- Skill Level: ${skillLevel}
- Desired Support: ${desiredSupport.join(', ')}
- Additional Information: ${additionalInfo || 'None provided'}

Create a detailed, personalized launch strategy that includes:

1. EXECUTIVE SUMMARY
A brief overview of the launch approach and key success factors.

2. STEP-BY-STEP ROADMAP
Organize by phases (Foundation, Development, Pre-Launch, Launch, Post-Launch) with specific action items, estimated timelines, and priorities.

3. MARKETING & BRANDING STRATEGY
Specific tactics for reaching the target audience, including content ideas, channels, and messaging.

4. MONETIZATION PLAN
Revenue streams, pricing strategies, and financial projections relevant to this type of project.

5. TOOLS & PLATFORMS
Recommended specific tools, software, and platforms for:
- Project management
- Marketing and social media
- Sales and payments
- Analytics and growth
- Design and content creation

6. LEGAL & COMPLIANCE
Legal requirements, licenses, permits, or registrations specific to this project type and industry.

7. TIMELINE & MILESTONES
A realistic timeline with key milestones based on the current stage and available resources.

8. FUNDING OPPORTUNITIES
Relevant grants, investors, crowdfunding options, or bootstrapping strategies.

9. RISK MITIGATION
Common challenges for this type of launch and how to address them.

10. SUCCESS METRICS
KPIs to track and measure launch success.

Format the response as clear, organized sections with actionable bullet points. Avoid excessive formatting symbols. Be specific and practical, considering the user's experience level and available resources.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a comprehensive launch strategy for this ${ideaCategory} project.` }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate launch strategy');
    }

    let strategy = data.choices[0].message.content;
    
    // Clean up excessive markdown formatting
    strategy = strategy
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n{3,}/g, '\n\n');

    return new Response(
      JSON.stringify({ strategy }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating launch strategy:', error);
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
