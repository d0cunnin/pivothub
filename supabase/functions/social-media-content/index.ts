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
    const { businessType, targetAudience, products, tone } = await req.json();
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are a social media marketing expert specializing in creating engaging, platform-specific content for businesses. Generate 5-7 diverse social media content ideas based on the business details provided.

    Business Type: ${businessType}
    Target Audience: ${targetAudience}
    Products/Services: ${products}
    Brand Tone: ${tone}

    For each content idea, provide:
    1. Platform (Instagram, LinkedIn, Facebook, Twitter/X, TikTok, etc.)
    2. Content type (behind-the-scenes, tips, testimonials, etc.)
    3. Engaging content text
    4. 5-7 relevant hashtags
    5. Best posting times

    Focus on:
    - Platform-specific best practices
    - Audience engagement strategies
    - Current social media trends
    - Brand voice consistency
    - Actionable and valuable content

    Return as a JSON array with this structure:
    [
      {
        "platform": "Platform name",
        "contentType": "Content type",
        "content": "Engaging post content here...",
        "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
        "bestTime": "Best posting time range"
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
          { role: 'user', content: `Create social media content ideas for this ${businessType} business.` }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    let contentIdeas;
    try {
      contentIdeas = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback content if JSON parsing fails
      contentIdeas = [
        {
          platform: "Instagram",
          contentType: "Behind-the-scenes",
          content: "Show your audience the process behind your work! People love seeing the human side of businesses.",
          hashtags: ["#BehindTheScenes", "#SmallBusiness", "#Entrepreneur", "#WorkInProgress", "#BusinessLife"],
          bestTime: "1-3 PM or 6-9 PM"
        },
        {
          platform: "LinkedIn",
          contentType: "Industry Insights",
          content: "Share your expertise on industry trends and position yourself as a thought leader in your field.",
          hashtags: ["#IndustryInsights", "#BusinessTips", "#Leadership", "#Innovation", "#ProfessionalGrowth"],
          bestTime: "8-10 AM or 12-2 PM"
        }
      ];
    }

    return new Response(
      JSON.stringify({ contentIdeas }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating social media content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});