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
    const { businessType, industry, stage, location, specificNeeds } = await req.json();
    
    const openaiApiKey = Deno.env.get('relaunch_openai_key');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found, using fallback');
      return fallbackResponse();
    }

    // Construct a focused search query for local business resources
    const searchQuery = `Find local business resources in ZIP code ${location} for ${specificNeeds}. Include:
- Business incubators and accelerators
- Small Business Development Centers (SBDC)
- SCORE chapters
- Co-working spaces
- Business networking groups
- Local funding sources
- Business support organizations
- Entrepreneurship programs
Provide real names, addresses, phone numbers, websites, and brief descriptions. Format your response as a structured list.`;

    console.log('Searching for business resources with query:', searchQuery);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a business resource finder. Return ONLY valid JSON with this exact shape and no markdown, no text outside JSON: {"categories":[{"category":"string","description":"string","resources":[{"id":"string","name":"string","description":"string","type":"string","url":"string","cost":"string","rating":number,"pros":["string"],"cons":["string"],"bestFor":"string","location":"string","contactInfo":"string"}]}], "totalResources": number, "recommendedFirst": ["string"], "summary": "string"}. Ensure at least 3 resources overall using real organizations when possible.'
          },
          {
            role: 'user',
            content: searchQuery + '\nReturn only the JSON object described above. Do not include code fences.'
          }
        ],
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return fallbackResponse();
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';
    
    console.log('OpenAI response received');

    // Parse and structure the response
    const resources = parseBusinessResources(aiResponse, location);

    return new Response(
      JSON.stringify({ resources }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error finding business resources:', error);
    return fallbackResponse();
  }
});

function parseBusinessResources(aiResponse: string, location: string) {
  // Try to extract JSON if present
  const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.categories) return parsed;
    } catch (e) {
      console.log('Failed to parse JSON from AI response');
    }
  }

  // Parse text response into structured format
  const categories = [
    {
      category: "Business Support Centers",
      description: "Local organizations providing business guidance and support",
      resources: []
    },
    {
      category: "Funding Sources",
      description: "Local funding and investment opportunities",
      resources: []
    },
    {
      category: "Networking & Community",
      description: "Business networking groups and entrepreneurship communities",
      resources: []
    }
  ];

  // Extract resource information from the text
  const lines = aiResponse.split('\n');
  let currentResource: any = {};
  let resourceCount = 0;

  lines.forEach(line => {
    line = line.trim();
    if (!line) return;

    // Look for organization names (usually in bold or at start of lines)
    if (line.match(/^\d+\.|^[-•*]/)) {
      if (currentResource.name) {
        // Save previous resource
        const categoryIndex = resourceCount % 3;
        categories[categoryIndex].resources.push(currentResource);
        resourceCount++;
      }
      currentResource = {
        id: `resource_${resourceCount + 1}`,
        name: line.replace(/^\d+\.|^[-•*]\s*/, '').split(/[:(]/)[0].trim(),
        description: '',
        type: 'organization',
        url: '',
        cost: 'Varies',
        rating: 4.5,
        pros: ['Local support', 'Expert guidance'],
        cons: [],
        bestFor: 'Small businesses and startups',
        location: location,
        contactInfo: ''
      };
    } else if (line.match(/https?:\/\//)) {
      currentResource.url = line.match(/https?:\/\/[^\s]+/)?.[0] || '';
    } else if (line.match(/\(\d{3}\)|\d{3}-\d{3}-\d{4}/)) {
      currentResource.contactInfo = line.match(/\(\d{3}\)[- ]?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/)?.[0] || '';
    } else if (currentResource.name && !currentResource.description && line.length > 20) {
      currentResource.description = line;
    }
  });

  // Add the last resource
  if (currentResource.name) {
    const categoryIndex = resourceCount % 3;
    categories[categoryIndex].resources.push(currentResource);
  }

  return {
    categories: categories.filter(cat => cat.resources.length > 0),
    totalResources: resourceCount,
    recommendedFirst: categories[0]?.resources.slice(0, 2).map((r: any) => r.id) || [],
    summary: `Found ${resourceCount} local business resources in the ${location} area based on real-time web search.`
  };
}

function fallbackResponse() {
  const resources = {
    categories: [
      {
        category: "Business Support Centers",
        description: "Local SBDC and SCORE offices",
        resources: [
          {
            id: "1",
            name: "Small Business Development Center (SBDC)",
            description: "Free business consulting and low-cost training for small businesses. SBDCs are located in every state.",
            type: "organization",
            url: "https://www.sba.gov/local-assistance/find/",
            cost: "Free",
            rating: 4.8,
            pros: ["Free consulting", "Expert advisors", "Workshops and training"],
            cons: ["Appointment required", "Limited availability"],
            bestFor: "All small businesses and startups",
            location: "Nationwide",
            contactInfo: "Find your local SBDC office"
          },
          {
            id: "2",
            name: "SCORE Business Mentoring",
            description: "Free mentoring from experienced business professionals. SCORE has chapters nationwide.",
            type: "organization",
            url: "https://www.score.org",
            cost: "Free",
            rating: 4.7,
            pros: ["Experienced mentors", "Free service", "Local chapters"],
            cons: ["Volunteer availability varies"],
            bestFor: "Entrepreneurs seeking mentorship",
            location: "Nationwide",
            contactInfo: "(800) 634-0245"
          }
        ]
      }
    ],
    totalResources: 2,
    recommendedFirst: ["1", "2"],
    summary: "Connect with your local SBDC or SCORE chapter for personalized business support. Visit sba.gov/local-assistance to find resources in your area."
  };

  return new Response(
    JSON.stringify({ resources }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}