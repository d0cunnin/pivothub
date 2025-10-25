import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { moderateContent } from "../_shared/moderation.ts";

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

    // Format the results
    const resources = formatGooglePlacesResults(allPlaces, location);

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