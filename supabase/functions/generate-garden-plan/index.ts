import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check credits (3 credits required)
    const { data: creditResult } = await supabase.rpc('check_and_increment_ai_usage', {
      p_user_id: user.id,
      p_credits_to_use: 3,
      p_tool_name: 'garden-it'
    });

    if (!creditResult?.allowed) {
      return new Response(JSON.stringify({ 
        error: 'credits_exhausted',
        message: 'Insufficient credits. Garden It requires 3 credits.'
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { 
      zipCode, 
      cityState, 
      gardenType, 
      gardenSize, 
      dimensions,
      sunExposure, 
      wateringLimits, 
      petsOrKids,
      experienceLevel,
      whatToGrow,
      priorities,
      soilType,
      compostAccess,
      soilPH
    } = body;

    // Validate US location
    if (zipCode && !/^\d{5}$/.test(zipCode)) {
      return new Response(JSON.stringify({ 
        error: 'invalid_location',
        message: 'Please provide a valid 5-digit US ZIP code.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const location = zipCode || cityState;
    const currentDate = new Date();
    const month = currentDate.toLocaleString('en-US', { month: 'long' });

    const systemPrompt = `You are an expert gardening advisor for the United States. You provide personalized gardening recommendations based on location, season, and user preferences.

CRITICAL RULES:
1. ONLY provide recommendations for United States locations
2. Use ESTIMATED language for frost dates (e.g., "typically around March 15" not "March 15 exactly")
3. NEVER recommend restricted, illegal, or invasive plants
4. Keep advice practical, safe, and beginner-friendly
5. If pets or kids are present, AVOID toxic plants (tomato leaves, foxglove, etc.)
6. Adjust recommendations based on experience level

Current month: ${month}
Current date: ${currentDate.toISOString().split('T')[0]}

Respond ONLY with valid JSON matching this exact structure:
{
  "ok": true,
  "locationSnapshot": {
    "region": "string (e.g., Southeast, Pacific Northwest)",
    "zone": "string (USDA zone, e.g., 7b, 8a)",
    "currentSeason": "string (e.g., Late Spring, Early Summer)",
    "plantingWindow": "string (e.g., March 15 - May 30)",
    "disclaimer": "Dates are estimates based on average conditions for your area."
  },
  "plantNow": [
    {
      "name": "Plant name",
      "whyItFits": "Why this plant suits user conditions",
      "whenToPlant": "Specific timing advice",
      "sun": "Sun requirements",
      "soil": "Soil preferences",
      "water": "Watering guidance",
      "spacing": "Spacing requirements",
      "daysToHarvest": "Days to harvest or bloom",
      "commonIssues": "Common problems and prevention"
    }
  ],
  "plantNext": [array of same plant structure for upcoming planting window],
  "fourWeekPlan": {
    "week1": { "title": "Preparation", "tasks": ["task1", "task2"] },
    "week2": { "title": "Planting", "tasks": ["task1", "task2"] },
    "week3": { "title": "Early Care", "tasks": ["task1", "task2"] },
    "week4": { "title": "Monitoring", "tasks": ["task1", "task2"] }
  },
  "shoppingList": {
    "seeds": ["item1", "item2"],
    "soil": ["item1", "item2"],
    "containers": ["item1", "item2"],
    "tools": ["item1", "item2"]
  },
  "nextSteps": ["suggestion1", "suggestion2", "suggestion3"]
}

Provide 3-5 plants for "plantNow" and 2-3 for "plantNext". Tailor to the user's goals and priorities.`;

    const userPrompt = `Create a personalized garden plan for:

LOCATION:
- ZIP Code/City: ${location}

GARDEN SETUP:
- Type: ${gardenType || 'Not specified'}
- Size: ${gardenSize || 'Not specified'}
- Dimensions: ${dimensions || 'Not specified'}

ENVIRONMENT:
- Sun Exposure: ${sunExposure || 'Not specified'}
- Watering Limitations: ${wateringLimits || 'No'}
- Pets/Kids Present: ${petsOrKids || 'No'}

EXPERIENCE & GOALS:
- Experience Level: ${experienceLevel || 'Beginner'}
- What to Grow: ${whatToGrow?.join(', ') || 'Mixed'}
- Priorities: ${priorities?.join(', ') || 'General gardening'}

SOIL INFO:
- Soil Type: ${soilType || 'Unknown'}
- Compost Access: ${compostAccess || 'Unknown'}
- Soil pH: ${soilPH || 'Unknown'}

Generate a comprehensive garden plan with plant recommendations appropriate for this location and current season.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      console.error('AI gateway error:', status);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'credits_exhausted' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(JSON.stringify({ error: 'Empty AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON from response
    let parsedPlan;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1]?.trim() || content.trim();
      parsedPlan = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw content:', content);
      return new Response(JSON.stringify({ 
        error: 'parse_error',
        message: 'Failed to parse garden plan. Please try again.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log usage
    await supabase.from('tool_usage_analytics').insert({
      user_id: user.id,
      tool_name: 'garden-it',
      credits_used: 3,
      estimated_tokens: 4000,
    });

    console.log('Garden plan generated successfully for user:', user.id);

    return new Response(JSON.stringify(parsedPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Garden plan error:', error);
    return new Response(JSON.stringify({ 
      error: 'server_error',
      message: 'An unexpected error occurred. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
