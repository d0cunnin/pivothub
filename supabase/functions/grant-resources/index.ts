import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { moderateContent } from "../_shared/moderation.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const grantResourcesSchema = z.object({
  location: z.string().min(1).max(300),
  category: z.string().max(200).optional(),
  subcategory: z.string().max(200).optional()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validation = grantResourcesSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { location, category, subcategory } = validation.data;
    
    // Content moderation for user input (medium risk - fail open)
    const moderationText = `${category || ''} ${subcategory || ''}`;
    if (moderationText.trim()) {
      const moderationResult = await moderateContent(moderationText, 'grant-resources', undefined, 'medium');
      
      if (moderationResult.flagged) {
        console.warn('Grant resources input flagged by moderation:', moderationResult.categories);
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

    console.log('Starting Google Places search for grant resources');
    console.log('Request params:', { location, category, subcategory });

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

    // Step 2: Search for grant assistance resources using nearbysearch
    const searchKeywords = [
      'grant writing assistance',
      'small business development center',
      'community foundation',
      'SBA office',
      'nonprofit resource center',
      'grant consulting'
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
          // Get details for top 2 results per keyword
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

    console.log(`Total grant resource places found: ${allPlaces.length}`);

    if (allPlaces.length === 0) {
      console.log('No places found from Google Places API, using fallback');
      return fallbackResponse();
    }

    // Format the results
    const resources = formatGrantResourceResults(allPlaces, location);

    return new Response(
      JSON.stringify({ resources }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error finding grant resources:', error);
    return fallbackResponse();
  }
});

function formatGrantResourceResults(places: any[], location: string) {
  const resources = places.map((place, index) => {
    const details = place.details;
    const query = place.searchKeyword.toLowerCase();
    
    let resourceType = 'Grant Assistance';
    if (query.includes('sba') || query.includes('small business development')) {
      resourceType = 'Small Business Development Center';
    } else if (query.includes('foundation')) {
      resourceType = 'Community Foundation';
    } else if (query.includes('nonprofit')) {
      resourceType = 'Nonprofit Resource Center';
    }

    return {
      id: `place_${index + 1}`,
      name: details.name || place.name,
      type: resourceType,
      description: `Local grant assistance and support services for nonprofits and organizations.`,
      address: details.formatted_address || location,
      phone: details.formatted_phone_number || 'Contact via website',
      website: details.website || '',
      rating: details.rating || 4.5,
      hours: details.opening_hours?.weekday_text || [],
      category: resourceType
    };
  });

  return {
    resources,
    totalResources: resources.length,
    location,
    summary: `Found ${resources.length} local grant assistance resources in ${location}.`
  };
}

function fallbackResponse() {
  const resources = {
    resources: [
      {
        id: "1",
        name: "Foundation Center (Candid)",
        type: "Grant Database",
        description: "Comprehensive database of grants and funding opportunities from foundations nationwide.",
        address: "Online Resource",
        phone: "(800) 424-9836",
        website: "https://candid.org",
        rating: 4.8,
        hours: [],
        category: "Grant Database"
      },
      {
        id: "2",
        name: "Grants.gov",
        type: "Federal Grants",
        description: "Official U.S. government portal for finding and applying for federal grants.",
        address: "Online Resource",
        phone: "(800) 518-4726",
        website: "https://www.grants.gov",
        rating: 4.7,
        hours: [],
        category: "Government Resource"
      },
      {
        id: "3",
        name: "Local SBDC Office",
        type: "Small Business Development Center",
        description: "Free business consulting including grant writing assistance. Visit sba.gov to find your local office.",
        address: "Nationwide",
        phone: "Visit website",
        website: "https://www.sba.gov/local-assistance/find/",
        rating: 4.8,
        hours: [],
        category: "Business Support"
      }
    ],
    totalResources: 3,
    location: "Nationwide",
    summary: "National grant resources available. For local assistance, visit your nearest Small Business Development Center."
  };

  return new Response(
    JSON.stringify({ resources }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    }
  );
}