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
        prompt = `Create a detailed 3-phase marketing strategy for a 12-month period for:
Business Type: ${data.businessType}
Target Market: ${data.targetMarket}
Budget: ${data.budget}
Goals: ${data.goals}
Current Stage: ${data.currentStage}

Structure your response with THREE phases covering the full 12 months:

Phase 1: Foundation (Months 1-4)
Timeline: Months 1-4
Objectives:
- [List 2-3 specific objectives]

Tactics:
- [List 3-4 specific marketing tactics]

Budget Allocation: [percentage]
Metrics to Track:
- [List 2-3 key metrics]

Phase 2: Growth (Months 5-8)
Timeline: Months 5-8
Objectives:
- [List 2-3 specific objectives]

Tactics:
- [List 3-4 specific marketing tactics]

Budget Allocation: [percentage]
Metrics to Track:
- [List 2-3 key metrics]

Phase 3: Scale (Months 9-12)
Timeline: Months 9-12
Objectives:
- [List 2-3 specific objectives]

Tactics:
- [List 3-4 specific marketing tactics]

Budget Allocation: [percentage]
Metrics to Track:
- [List 2-3 key metrics]

Use plain text format without markdown. Be specific to the business type and goals provided.`
        break

      case 'pitch-deck':
        prompt = `Create EXACTLY 10 pitch deck slides with SHORT BULLET POINTS ONLY.

CRITICAL FORMATTING RULES:
- Each slide MUST have 3-5 bullet points maximum
- Each bullet point MUST be 10-15 words or less
- NO paragraphs, NO long explanations, NO narrative text
- Format each bullet with • symbol
- Keep language concise and impactful

INPUT DATA:
Company: ${data.companyName}
Presenter: ${data.presenterName || 'N/A'}
Problem: ${data.problem}
Solution: ${data.solution}
Market Size: ${data.marketSize}
Business Model: ${data.businessModel}
Competition: ${data.competition}
Go-to-Market: ${data.goToMarketStrategy || data.businessModel}
Funding: ${data.fundingAmount}
Use of Funds: ${data.useOfFunds}
Team: ${data.teamBackground}
Traction: ${data.traction}

Generate EXACTLY these 10 slides in this format:

[Title / Cover]
• ${data.companyName}
• Presenter: ${data.presenterName || 'Name'}
• [One sentence tagline/value proposition]

[Problem]
• [Key problem point 1 - max 15 words]
• [Key problem point 2 - max 15 words]
• [Key problem point 3 - max 15 words]

[Solution]
• [How you solve it - point 1]
• [How you solve it - point 2]
• [How you solve it - point 3]
• [Key differentiator]

[Market Opportunity]
• Total addressable market: [size from input]
• [Growth rate or trend]
• [Target segment details]
• [Market validation point]

[Product / Technology]
• [Core product feature 1]
• [Core product feature 2]
• [Technology advantage]
• [Current development stage]

[Business Model]
• Revenue model: [from input]
• [Pricing strategy point]
• [Customer acquisition approach]
• [Unit economics highlight]

[Go-to-Market Strategy]
• [Channel strategy point 1]
• [Channel strategy point 2]
• [Partnership approach]
• [Timeline milestone]

[Competition / Differentiation]
• Key competitors: [from input]
• [Our unique advantage 1]
• [Our unique advantage 2]
• [Defensibility point]

[Financials / Traction]
• Current traction: [from input]
• [Key metric or milestone]
• [Revenue projection or funding]
• [Use of funds summary]

[Team & Ask / Closing]
• Team: [from input - key credentials]
• Funding ask: [from input]
• [What funding will achieve]
• [Contact or call to action]

Use ONLY bullet points with • symbol. NO paragraphs.`
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

CRITICAL: Format your response EXACTLY as shown below with [SECTION] markers:

[BIOGRAPHY]
Write a compelling 2-3 paragraph founder biography here in plain text.

[VISION]
Write a concise vision statement here in plain text (1-2 paragraphs).

[MISSION]
Write a clear mission statement here in plain text (1-2 paragraphs).

Do NOT include the section labels in your output, only the content for each section.`
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