import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getModelForUser, validateProvider } from "../_shared/providerRouter.ts";
import { extractContent } from "../_shared/aiResponse.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const businessResourcesSchema = z.object({
  businessType: z.string().min(1).max(300),
  industry: z.string().min(1).max(300),
  stage: z.string().max(200),
  location: z.string().min(1).max(300),
  specificNeeds: z.string().max(1000).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validation = businessResourcesSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { businessType, industry, stage, location, specificNeeds } = validation.data;
    
    // Content moderation for user input (medium risk - fail open)
    if (specificNeeds) {
      const moderationResult = await moderateContent(specificNeeds, 'business-resources', undefined, 'medium');
      
      if (moderationResult.flagged) {
        console.warn('Specific needs content flagged by moderation:', moderationResult.categories);
        return new Response(
          JSON.stringify({ 
            error: 'Content policy violation detected',
            details: 'Your input contains content that violates our policies. Please revise and try again.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!googleApiKey) {
      console.error('Google Places API key not found');
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    console.log('Starting Google Places search for location:', location);
    console.log('Request params:', { businessType, industry, stage, location, specificNeeds });

    // Step 1: Geocode the location to get lat/lng
    console.log('Step 1: Geocoding location...');
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleApiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);
    
    if (!geocodeResponse.ok) {
      console.error('Geocoding API request failed:', geocodeResponse.status);
      return fallbackResponse();
    }

    const geocodeData = await geocodeResponse.json();
    console.log('Geocoding response status:', geocodeData.status);

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      console.error('Geocoding failed or no results:', geocodeData.status, geocodeData.error_message);
      return fallbackResponse();
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;
    console.log('Geocoded coordinates:', { lat, lng });

    // Step 2: Search for business resources using nearbysearch
    const searchKeywords = [
      'small business development center',
      'SCORE business mentoring',
      'business incubator',
      'coworking space',
      'entrepreneurship center'
    ];

    const allPlaces: any[] = [];

    // Fetch results for each keyword
    for (const keyword of searchKeywords) {
      try {
        console.log(`Searching for: ${keyword}`);
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=25000&keyword=${encodeURIComponent(keyword)}&key=${googleApiKey}`;
        const placesResponse = await fetch(placesUrl);
        
        if (!placesResponse.ok) {
          console.error(`Places API request failed for "${keyword}":`, placesResponse.status);
          continue;
        }

        const placesData = await placesResponse.json();
        console.log(`Places API status for "${keyword}":`, placesData.status);

        if (placesData.status === 'REQUEST_DENIED') {
          console.error('Places API REQUEST_DENIED:', placesData.error_message);
          return new Response(
            JSON.stringify({ 
              error: 'Google Places API access denied. Please verify your API key has Places API enabled.',
              details: placesData.error_message 
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 403
            }
          );
        }

        if (placesData.status === 'OVER_QUERY_LIMIT') {
          console.error('Places API OVER_QUERY_LIMIT');
          return new Response(
            JSON.stringify({ error: 'Google Places API quota exceeded. Please check your billing settings.' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 429
            }
          );
        }
        
        if (placesData.results && placesData.results.length > 0) {
          console.log(`Found ${placesData.results.length} results for "${keyword}"`);
          // Get details for top 2 results
          for (const place of placesData.results.slice(0, 2)) {
            try {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,business_status,opening_hours&key=${googleApiKey}`;
              const detailsResponse = await fetch(detailsUrl);
              
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                if (detailsData.result) {
                  allPlaces.push({
                    ...place,
                    details: detailsData.result,
                    searchKeyword: keyword
                  });
                  console.log(`Added place: ${detailsData.result.name}`);
                }
              }
            } catch (detailErr) {
              console.error(`Error fetching details for place:`, detailErr);
            }
          }
        } else {
          console.log(`No results found for "${keyword}"`);
        }
      } catch (err) {
        console.error(`Error fetching places for keyword "${keyword}":`, err);
      }
    }

    console.log(`Total places found: ${allPlaces.length}`);

    if (allPlaces.length === 0) {
      console.log('No places found from Google Places API, using fallback');
      return fallbackResponse();
    }

    // Phase 2: Add AI-powered strategic guidance with Gemini 2.5 Flash
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.warn('Lovable API key missing - returning unenhanced Google Places results');
      const resources = formatGooglePlacesResults(allPlaces, location);
      return new Response(
        JSON.stringify({ resources }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Build AI prompt with business context + Google Places data
    const aiPrompt = `You are a strategic business resource advisor. Analyze these local resources for a specific entrepreneur.

**Business Profile:**
- Business Type: ${businessType}
- Industry: ${industry}
- Stage: ${stage}
- Location: ${location}
- Specific Needs: ${specificNeeds || 'General business support'}

**Available Resources (from Google Places):**
${JSON.stringify(allPlaces.slice(0, 10).map(p => ({
  place_id: p.details?.place_id,
  name: p.details?.name,
  types: p.details?.types,
  rating: p.details?.rating,
  address: p.details?.formatted_address
})), null, 2)}

**Your Tasks:**
1. Rank each resource by relevance (1-10 scale) for THIS specific business profile
2. For EACH resource, write:
   - **Why Valuable** (2-3 sentences): Explain why this resource matters for their situation
   - **When to Engage** (1 sentence): Best timing/stage to contact them (e.g., "Ideal for: pre-launch validation phase")
   - **Questions to Ask** (2-3 questions): Strategic questions they should ask when reaching out
3. Identify the **TOP 2** resources they should prioritize contacting first
4. Write a **Strategic Summary** (3-4 sentences): How to leverage these resources for maximum impact

**CRITICAL: Return ONLY valid JSON (no markdown, no code fences):**
{
  "rankedResources": [
    {
      "place_id": "exact_google_place_id_string",
      "relevanceScore": 8,
      "whyValuable": "...",
      "whenToEngage": "...",
      "questionsToAsk": ["...", "...", "..."]
    }
  ],
  "topTwoPriority": ["place_id_1", "place_id_2"],
  "strategicSummary": "..."
}`;

    // Initialize Lovable AI model config (use GPT-5 for text generation)
    const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_KEY) {
      console.warn('Lovable AI key missing - returning unenhanced Google Places results');
      const resources = formatGooglePlacesResults(allPlaces, location);
      return new Response(
        JSON.stringify({ resources }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const modelConfig = {
      model: 'google/gemini-2.5-flash',
      apiKey: LOVABLE_KEY,
      endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions'
    };

    try {
      console.log('Invoking Lovable AI for AI enhancement...');
      const aiResponse = await fetch(modelConfig.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${modelConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert business resource strategist. Always return valid JSON without markdown formatting.' 
            },
            { role: 'user', content: aiPrompt }
          ],
          max_completion_tokens: 4000
        })
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          console.warn('Rate limit hit, using unenhanced results');
          const resources = formatGooglePlacesResults(allPlaces, location);
          return new Response(
            JSON.stringify({ resources }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        if (aiResponse.status === 402) {
          console.warn('AI credits exhausted, using unenhanced results');
          const resources = formatGooglePlacesResults(allPlaces, location);
          return new Response(
            JSON.stringify({ resources }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        const errorText = await aiResponse.text();
        console.error(`Lovable AI error (${aiResponse.status}):`, errorText);
        throw new Error(`Lovable AI returned ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      let aiContent = extractContent(aiData);
      
      // Strip markdown code fences if present
      aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      console.log('AI response received, parsing JSON...');
      const aiInsights = JSON.parse(aiContent);
      
      // Merge AI insights with Google Places data
      const enhancedResources = formatEnhancedResults(
        allPlaces, 
        aiInsights, 
        location, 
        businessType, 
        industry, 
        stage
      );
      
      console.log('Successfully enhanced results with AI insights');
      return new Response(
        JSON.stringify({ resources: enhancedResources }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } catch (aiError) {
      console.error('AI enhancement failed, falling back to unenhanced Google Places results:', aiError);
      // Graceful degradation: return Google Places data without AI enhancement
      const resources = formatGooglePlacesResults(allPlaces, location);
      return new Response(
        JSON.stringify({ resources }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

  } catch (error) {
    console.error('Error finding business resources:', error);
    return fallbackResponse();
  }
});

function formatGooglePlacesResults(places: any[], location: string) {
  const categories = [
    {
      category: "Business Support Centers",
      description: "Local organizations providing business guidance and support",
      resources: [] as any[]
    },
    {
      category: "Coworking & Incubators",
      description: "Workspace and incubation programs for entrepreneurs",
      resources: [] as any[]
    },
    {
      category: "Mentorship & Education",
      description: "Business mentoring and entrepreneurship programs",
      resources: [] as any[]
    }
  ];

  places.forEach((place, index) => {
    const details = place.details;
    const query = place.name.toLowerCase();
    
    let categoryIndex = 0;
    if (query.includes('cowork') || query.includes('incubator')) {
      categoryIndex = 1;
    } else if (query.includes('score') || query.includes('mentor')) {
      categoryIndex = 2;
    }

    const resource = {
      id: `place_${index + 1}`,
      name: details.name || place.name,
      description: `${details.name} provides business support and resources for entrepreneurs and small businesses in ${location}.`,
      type: 'organization',
      url: details.website || '',
      cost: 'Contact for details',
      rating: details.rating || 4.5,
      pros: ['Real local organization', 'Professional support', 'Verified by Google'],
      cons: ['Contact for availability'],
      bestFor: 'Local entrepreneurs and small businesses',
      location: details.formatted_address || location,
      contactInfo: details.formatted_phone_number || 'Contact via website'
    };

    categories[categoryIndex].resources.push(resource);
  });

  const totalResources = places.length;
  const activeCategories = categories.filter(cat => cat.resources.length > 0);

  return {
    categories: activeCategories,
    totalResources,
    recommendedFirst: activeCategories[0]?.resources.slice(0, 2).map(r => r.id) || [],
    summary: `Found ${totalResources} verified local business resources in ${location} using Google Places data.`
  };
}

function formatEnhancedResults(
  places: any[], 
  aiInsights: any, 
  location: string, 
  businessType: string, 
  industry: string, 
  stage: string
) {
  const categories = [
    {
      category: "Business Support Centers",
      description: "Local organizations providing business guidance and support",
      resources: [] as any[]
    },
    {
      category: "Coworking & Incubators",
      description: "Workspace and incubation programs for entrepreneurs",
      resources: [] as any[]
    },
    {
      category: "Mentorship & Education",
      description: "Business mentoring and entrepreneurship programs",
      resources: [] as any[]
    }
  ];

  // Create lookup map for AI insights by place_id
  const insightsMap = new Map(
    aiInsights.rankedResources.map((r: any) => [r.place_id, r])
  );

  places.forEach((place, index) => {
    const details = place.details;
    const placeId = details?.place_id;
    const query = place.searchKeyword?.toLowerCase() || place.name.toLowerCase();
    
    // Get AI insights for this place
    const aiData = insightsMap.get(placeId) || {};
    
    // Determine category
    let targetCategory = categories[0]; // Default: Business Support Centers
    if (query.includes('cowork') || query.includes('incubat') || query.includes('accelerator')) {
      targetCategory = categories[1];
    } else if (query.includes('score') || query.includes('mentor') || query.includes('chamber')) {
      targetCategory = categories[2];
    }

    const resource = {
      id: placeId || `place_${index + 1}`,
      name: details?.name || place.name,
      type: place.searchKeyword?.includes('SBDC') ? 'Business Development Center' :
            place.searchKeyword?.includes('SCORE') ? 'Business Mentoring' :
            place.searchKeyword?.includes('incubat') ? 'Incubator' :
            place.searchKeyword?.includes('cowork') ? 'Coworking Space' :
            'Business Support',
      
      // Use AI-enhanced description if available, otherwise use Google data
      description: aiData.whyValuable || 
                   `${details?.name || place.name} provides business support and resources for entrepreneurs in ${location}.`,
      
      url: details?.website || '',
      cost: 'Contact for details',
      rating: details?.rating || 0,
      
      pros: ['Real local organization', 'Professional support', 'Verified by Google'],
      cons: ['Contact for availability'],
      
      bestFor: aiData.whenToEngage || 'Local entrepreneurs and small businesses',
      location: details?.formatted_address || location,
      contactInfo: details?.formatted_phone_number || 'Contact via website',
      
      // AI-enhanced fields
      relevanceScore: aiData.relevanceScore || 5,
      questionsToAsk: aiData.questionsToAsk || [],
      isTopPick: aiInsights.topTwoPriority?.includes(placeId) || false
    };

    targetCategory.resources.push(resource);
  });

  // Sort resources within each category by AI relevance score (highest first)
  categories.forEach(cat => {
    cat.resources.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  });

  const totalResources = categories.reduce((sum, cat) => sum + cat.resources.length, 0);
  const activeCategories = categories.filter(cat => cat.resources.length > 0);

  return {
    categories: activeCategories,
    totalResources,
    
    // Recommended first steps (top 2 AI-prioritized resources)
    recommendedFirst: activeCategories
      .flatMap(cat => cat.resources)
      .filter(r => r.isTopPick)
      .slice(0, 2)
      .map(r => r.id),
    
    // AI-generated strategic summary
    summary: aiInsights.strategicSummary || 
             `Found ${totalResources} verified business resources in ${location}. Connect with local organizations for personalized support.`,
    
    // Include business context in response
    businessContext: {
      businessType,
      industry,
      stage
    }
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