import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, data } = await req.json()
    
    const openaiApiKey = Deno.env.get('relaunch_openai_key')
    if (!openaiApiKey) {
      throw new Error('relaunch_openai_key not found in environment variables')
    }

    let prompt = ''
    let systemMessage = 'You are an expert business consultant and content creator. IMPORTANT: Provide responses in clean, plain text format without any markdown formatting, headers (#), or special characters. Use simple bullet points (•) if lists are needed. Avoid using symbols like ###, ##, **, *, or other markdown syntax.'

    switch (type) {
      case 'business-ideas':
        prompt = `Generate 5 personalized business ideas based on:
Skills: ${data.skills}
Interests: ${data.interests}
Budget: ${data.budget}

Provide specific, actionable business ideas that match their background. Format as simple numbered list without any markdown or special formatting. Each idea should be 1-2 sentences explaining the concept and why it fits their profile.`
        break

      case 'business-plan':
        prompt = `Create a comprehensive business plan for:
Business Name: ${data.businessName}
Industry: ${data.industry}
Business Type: ${data.businessType}
Target Market: ${data.targetMarket}
Value Proposition: ${data.uniqueValue}
Startup Costs: ${data.startupCosts}
Business Model: ${data.businessModel}

Include: Executive Summary, Business Description, Market Analysis, Marketing Strategy, Financial Projections, Implementation Plan, Risk Analysis, and Conclusion.`
        break

      case 'marketing-strategy':
        prompt = `Create a detailed 3-phase marketing strategy for:
Business Type: ${data.businessType}
Target Market: ${data.targetMarket}
Budget: ${data.budget}
Goals: ${data.goals}
Current Stage: ${data.currentStage}

For each of the 3 phases, provide the following in plain text format:
- Phase name and timeline
- 2-3 specific objectives
- 3-4 marketing tactics
- Budget allocation percentage
- 2-3 key metrics to track

Use clear section breaks between phases but no markdown formatting.`
        break

      case 'pitch-deck':
        prompt = `Create 10-12 pitch deck slides for:
Company: ${data.companyName}
Problem: ${data.problem}
Solution: ${data.solution}
Market Size: ${data.marketSize}
Business Model: ${data.businessModel}
Competition: ${data.competition}
Funding: ${data.fundingAmount}
Use of Funds: ${data.useOfFunds}
Team: ${data.teamBackground}
Traction: ${data.traction}

Generate slides in this exact format for each slide:
[SLIDE_TITLE]
[Detailed slide content here]

[SLIDE_TITLE]
[Detailed slide content here]

Use plain text only, no markdown or special formatting.`
        break

      case 'biography':
        prompt = `Create a professional founder biography, vision statement, and mission statement for:
Founder: ${data.founderName}
Background: ${data.background}
Business Type: ${data.businessType}
Goals: ${data.goals}
Founded: ${data.dateOfFormation}
Products/Services: ${data.productsServices}
Traction: ${data.traction}
Achievements: ${data.achievements}

Format as three sections separated by double line breaks:
1. Founder Biography
2. Vision Statement  
3. Mission Statement`
        break

      case 'social-media':
        prompt = `Generate 6 social media content ideas for:
Business Type: ${data.businessType}
Target Audience: ${data.targetAudience}
Products/Services: ${data.products}
Brand Tone: ${data.brandTone}

Create content for different platforms (Instagram, LinkedIn, Twitter, Facebook) with captions, hashtags, and optimal posting times.`
        break

      default:
        throw new Error('Invalid content type')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    const result = await response.json()
    
    if (result.error) {
      throw new Error(result.error.message)
    }

    let content = result.choices[0].message.content

    // Sanitize content to remove any remaining markdown artifacts
    content = content
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/#{2,}/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    return new Response(
      JSON.stringify({ content, type }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating content:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})