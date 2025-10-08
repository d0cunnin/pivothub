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
    
    const googleApiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    
    if (!googleApiKey) {
      console.error('Google Places API key not found, using fallback');
      return fallbackResponse();
    }

    console.log('Searching for business resources in location:', location);

    // Search for different types of business resources
    const searchQueries = [
      `small business development center ${location}`,
      `SCORE business mentoring ${location}`,
      `business incubator ${location}`,
      `coworking space ${location}`,
      `entrepreneurship center ${location}`
    ];

    const allPlaces: any[] = [];

    // Fetch results for each query
    for (const query of searchQueries) {
      try {
        const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${googleApiKey}`;
        const placesResponse = await fetch(placesUrl);
        
        if (placesResponse.ok) {
          const placesData = await placesResponse.json();
          if (placesData.results && placesData.results.length > 0) {
            // Get details for the top result
            const place = placesData.results[0];
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,business_status&key=${googleApiKey}`;
            const detailsResponse = await fetch(detailsUrl);
            
            if (detailsResponse.ok) {
              const detailsData = await detailsResponse.json();
              if (detailsData.result) {
                allPlaces.push({
                  ...place,
                  details: detailsData.result
                });
              }
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching places for query "${query}":`, err);
      }
    }

    if (allPlaces.length === 0) {
      console.log('No places found, using fallback');
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