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
    const { businessType, industry, location, fundingAmount, businessStage } = await req.json();
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are a grant research specialist with comprehensive knowledge of government and private funding opportunities. Find relevant grants and funding sources based on the business details provided.

    Business Type: ${businessType}
    Industry: ${industry}
    Location: ${location}
    Funding Amount Needed: ${fundingAmount}
    Business Stage: ${businessStage}

    Provide 8-12 relevant grant opportunities including:
    1. Federal grants (SBA, SBIR, STTR, etc.)
    2. State and local grants specific to their location
    3. Industry-specific grants
    4. Private foundation grants
    5. Corporate grants and contests

    For each grant, provide:
    - Grant name and organization
    - Award amount range
    - Eligibility requirements
    - Application deadline
    - Brief description
    - Application difficulty level
    - Success tips

    Focus on current, active grants that match their specific situation. Include both competitive and formula grants.

    IMPORTANT: Do NOT use markdown formatting like ### headers, ** bold, or * italics
    Return clean text in JSON format only

    Return as a JSON array with this structure:
    [
      {
        "id": "unique_id",
        "name": "Grant Name",
        "organization": "Funding Organization",
        "amountRange": "$10,000 - $50,000",
        "deadline": "March 15, 2025",
        "description": "Brief description of the grant",
        "eligibility": ["requirement1", "requirement2"],
        "matchScore": 85,
        "difficulty": "Medium",
        "applicationUrl": "https://example.com/apply",
        "tips": "Key success tips for this specific grant",
        "category": "Federal|State|Private|Corporate"
      }
    ]`;

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
          { role: 'user', content: `Find grants for this ${businessType} business in ${location} seeking ${fundingAmount}.` }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to find grants');
    }

    let grants;
    try {
      const aiResponse = data.choices[0].message.content;
      // Sanitize and parse JSON
      const sanitizedContent = aiResponse
        .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
        .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove triple asterisks
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
        .replace(/```json\s*|\s*```/g, '') // Remove code blocks
        .trim();
      
      grants = JSON.parse(sanitizedContent);
    } catch (parseError) {
      // Fallback grants if JSON parsing fails
      grants = [
        {
          id: '1',
          name: 'SBIR Small Business Innovation Research',
          organization: 'U.S. Small Business Administration',
          amountRange: '$50,000 - $1,750,000',
          deadline: 'Varies by agency',
          description: 'Funding for small businesses engaged in R&D with commercialization potential',
          eligibility: ['Small business (<500 employees)', 'R&D focus', 'For-profit entity'],
          matchScore: 75,
          difficulty: 'High',
          applicationUrl: 'https://www.sbir.gov',
          tips: 'Focus on innovation and commercialization potential. Partner with universities.',
          category: 'Federal'
        },
        {
          id: '2',
          name: 'State Small Business Credit Initiative',
          organization: 'State Economic Development',
          amountRange: '$10,000 - $500,000',
          deadline: 'Rolling applications',
          description: 'State-level funding for small business growth and development',
          eligibility: ['Small business', 'Job creation potential', 'State residence'],
          matchScore: 80,
          difficulty: 'Medium',
          applicationUrl: 'https://state.gov/economic-development',
          tips: 'Emphasize local economic impact and job creation.',
          category: 'State'
        }
      ];
    }

    return new Response(
      JSON.stringify({ grants }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error finding grants:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});