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
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are a business consultant with comprehensive knowledge of resources, tools, and services for entrepreneurs and businesses. Provide a curated list of resources based on the business details provided.

    Business Type: ${businessType}
    Industry: ${industry}
    Business Stage: ${stage}
    Location: ${location}
    Specific Needs: ${specificNeeds}

    Provide resources in these categories:
    1. Funding & Investment (VCs, angels, grants, loans)
    2. Legal & Compliance (lawyers, legal templates, compliance tools)
    3. Business Tools & Software (CRM, accounting, project management)
    4. Marketing & Sales (platforms, agencies, tools)
    5. Industry Resources (associations, publications, events)
    6. Education & Training (courses, books, mentorship)
    7. Professional Services (accountants, consultants, developers)
    8. Networking & Community (events, organizations, online communities)

    Focus on:
    - Current, active resources (not outdated links)
    - Mix of free and paid options
    - Resources specific to their industry and stage
    - Location-relevant resources when applicable
    - High-quality, reputable providers

    Return as a JSON object with this structure:
    {
      "categories": [
        {
          "category": "Funding & Investment",
          "description": "Sources of capital and investment",
          "resources": [
            {
              "id": "unique_id",
              "name": "Resource Name",
              "description": "What this resource provides",
              "type": "website|tool|service|person|organization",
              "url": "https://example.com",
              "cost": "Free|Paid|Varies",
              "rating": 4.5,
              "pros": ["benefit1", "benefit2"],
              "cons": ["limitation1"],
              "bestFor": "Early-stage startups seeking seed funding",
              "location": "Global|US|Specific Region",
              "contactInfo": "Optional contact information"
            }
          ]
        }
      ],
      "totalResources": 50,
      "recommendedFirst": ["resource_id_1", "resource_id_2"],
      "summary": "Overview of recommended resources for this business"
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
          { role: 'user', content: `Find business resources for this ${businessType} business in ${stage} stage, located in ${location}.` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to find resources');
    }

    let resources;
    try {
      resources = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback resources if JSON parsing fails
      resources = {
        categories: [
          {
            category: "Funding & Investment",
            description: "Sources of capital and investment opportunities",
            resources: [
              {
                id: "1",
                name: "AngelList",
                description: "Platform connecting startups with angel investors and VCs",
                type: "website",
                url: "https://angel.co",
                cost: "Free",
                rating: 4.2,
                pros: ["Large investor network", "Easy to use", "Startup jobs board"],
                cons: ["High competition", "Limited success for early stage"],
                bestFor: "Tech startups seeking seed to Series A funding",
                location: "Global",
                contactInfo: "support@angel.co"
              },
              {
                id: "2",
                name: "SBA Loans",
                description: "Government-backed small business loans with favorable terms",
                type: "service",
                url: "https://www.sba.gov/funding-programs/loans",
                cost: "Varies",
                rating: 4.0,
                pros: ["Lower interest rates", "Government backing", "Flexible terms"],
                cons: ["Lengthy process", "Strict requirements", "Personal guarantees"],
                bestFor: "Established businesses with revenue seeking growth capital",
                location: "US",
                contactInfo: "Local SBA office"
              }
            ]
          },
          {
            category: "Business Tools & Software",
            description: "Essential software and tools for business operations",
            resources: [
              {
                id: "3",
                name: "QuickBooks",
                description: "Comprehensive accounting and financial management software",
                type: "tool",
                url: "https://quickbooks.intuit.com",
                cost: "Paid",
                rating: 4.3,
                pros: ["Easy to use", "Integrations", "Tax preparation"],
                cons: ["Monthly cost", "Learning curve", "Limited customization"],
                bestFor: "Small to medium businesses needing accounting solutions",
                location: "Global",
                contactInfo: "customer support available"
              }
            ]
          }
        ],
        totalResources: 25,
        recommendedFirst: ["1", "3"],
        summary: "Essential resources to help establish and grow your business effectively."
      };
    }

    return new Response(
      JSON.stringify({ resources }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error finding business resources:', error);
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