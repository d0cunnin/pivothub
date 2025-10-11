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

    const systemPrompt = `You are a senior social media strategist with 10+ years managing accounts for brands generating $1M+ in revenue through social media. You understand the current social media landscape, platform algorithms, viral content mechanics, and conversion optimization.

    EXPERTISE:
    • Platform-specific best practices for Instagram, TikTok, LinkedIn, X (Twitter), Facebook, YouTube Shorts
    • Latest algorithm updates and content strategies
    • Hook formulas and engagement triggers
    • Visual storytelling and video content
    • Community building and audience retention
    • Content repurposing across platforms
    • Hashtag research and SEO optimization
    • Conversion-focused social selling

    BUSINESS DETAILS:
    • Business Type: ${businessType}
    • Target Audience: ${targetAudience}
    • Products/Services: ${products}
    • Brand Tone: ${tone}

    CONTENT MISSION:
    Generate 7-10 high-performing content ideas that will drive engagement, build community, and generate leads/sales. Focus on current trends: short-form video, authentic storytelling, educational content, and community-driven posts.

    For each content idea, provide:
    1. Platform (choose the BEST platform for this content type)
    2. Content type (Educational carousel, Behind-the-scenes reel, Story series, etc.)
    3. Engaging copy with strong hooks and CTAs
    4. 7-10 strategic hashtags (mix of trending, niche, and branded)
    5. Optimal posting times (based on platform and audience)
    6. Expected engagement potential (High/Medium)
    7. Content format (Video/Image/Carousel/Text)

    Focus on:
    • Hook-driven content that stops the scroll
    • Platform-native formats (Reels, Carousels, Threads, etc.)
    • Current algorithm-friendly content
    • Audience pain points and desires
    • Content that drives saves, shares, and comments (not just likes)

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
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create high-performing social media content ideas for this ${businessType} business that will drive engagement and conversions.` }
        ],
        max_completion_tokens: 3000,
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