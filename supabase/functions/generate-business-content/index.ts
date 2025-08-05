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
    
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables')
    }

    let prompt = ''
    let systemMessage = 'You are an expert business consultant and content creator.'

    switch (type) {
      case 'business-ideas':
        prompt = `Generate 5 personalized business ideas based on:
Skills: ${data.skills}
Interests: ${data.interests}
Budget: ${data.budget}

Provide specific, actionable business ideas that match their background. Format as a numbered list.`
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
        prompt = `Create a 3-phase marketing strategy for:
Business Type: ${data.businessType}
Target Market: ${data.targetMarket}
Budget: ${data.budget}
Goals: ${data.goals}
Current Stage: ${data.currentStage}

Provide 3 phases with specific tactics, timelines, budgets, and success metrics. Format with clear sections for each phase.`
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

Generate slide titles with detailed content for each. Format as: "Slide Title\nSlide content here"`
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

    const content = result.choices[0].message.content

    return new Response(
      JSON.stringify({ content, type }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating content:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})