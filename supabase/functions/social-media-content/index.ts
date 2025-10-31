import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";

// Validation schema
const socialMediaSchema = z.object({
  businessName: z.string().min(1).max(300),
  businessNiche: z.string().min(1).max(1000),
  platforms: z.array(z.string()).min(1).max(6),
  tone: z.string().max(100)
});

serve(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "social-media-content",
      cost: 2,
      requireAuth: true,
      maxReqsPerMinute: 25
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = socialMediaSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { businessName, businessNiche, platforms, tone } = validation.data;
    
    // Content moderation (medium risk - fail open)
    const moderationText = `${businessName} ${businessNiche}`;
    const moderationResult = await moderateContent(moderationText, 'social-media-content', userId, 'medium');
    
    if (moderationResult.flagged) {
      console.warn('Content flagged by moderation:', moderationResult.categories);
      return new Response(
        JSON.stringify({ 
          error: 'Content policy violation detected',
          details: 'Your business information contains content that violates our policies. Please revise and try again.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const platformNames = platforms.map(p => {
      const map: Record<string, string> = {
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        tiktok: 'TikTok',
        facebook: 'Facebook',
        youtube: 'YouTube',
        twitter: 'X (Twitter)'
      };
      return map[p] || p;
    }).join(', ');

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - 30-DAY SOCIAL MEDIA CONTENT CALENDAR

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL business details: name, niche, platforms, brand tone. Create platform-specific content calendar that's ready to execute.

=== CORE IDENTITY ===
You are a senior social media strategist who creates complete 30-day content calendars. You understand platform algorithms, optimal posting schedules, and how to maintain consistent brand presence while maximizing engagement.

EXPERTISE:
• Platform-specific content formats and best practices
• Content pillar framework (educate, entertain, inspire, promote)
• Optimal posting frequency per platform
• Hashtag strategy (trending + niche + branded)
• Visual content planning (image vs video recommendations)
• Algorithm-friendly content types
• Engagement optimization tactics

=== QUALITY STANDARDS ===
• Every post must be platform-native and ready to publish
• Captions should be compelling with strong hooks
• Hashtags must be strategic mix of reach and relevance
• Visual suggestions must be specific and actionable
• Posting times optimized for maximum engagement
• Content pillars balanced across 30 days

=== BUSINESS DETAILS ===
Business Name: ${businessName}
Business Niche: ${businessNiche}
Target Platforms: ${platformNames}
Brand Tone: ${tone}

=== CONTENT CALENDAR MISSION ===
Create a complete 30-day social media content calendar with:
• ${platforms.length > 1 ? 'Mix of posts across selected platforms' : 'All posts for ' + platformNames}
• Variety of content types (posts, reels, carousels, stories, etc.)
• Balance of content pillars: Educational (40%), Entertaining (30%), Inspirational (20%), Promotional (10%)
• Strategic hashtag combinations for each post
• Specific visual/video recommendations
• Optimal posting times based on platform and audience

Each day's post must include:
1. Specific date and day number
2. Platform for that post
3. Content type/format
4. Ready-to-use caption with strong hook
5. Strategic hashtags (7-10 per post)
6. Detailed visual/video suggestion
7. Optimal posting time window

IMPORTANT DISTRIBUTION GUIDELINES:
${platforms.length === 1 
  ? `- Create 30 posts all for ${platformNames}`
  : `- Rotate between platforms: ${platformNames}
- Ensure roughly equal distribution across selected platforms
- Some platforms post more frequently (Instagram/TikTok daily, LinkedIn 3-4x/week)`}

Return as JSON array with this EXACT structure:
[
  {
    "day": 1,
    "date": "Monday, Jan 6",
    "platform": "Instagram",
    "contentType": "Carousel Post",
    "caption": "Ready-to-use caption with hook, value, and CTA. Use emojis where appropriate. Keep authentic to ${tone} tone.",
    "hashtags": [
      "#trending1",
      "#niche2",
      "#niche3",
      "#industry4",
      "#branded5",
      "#audience6",
      "#community7"
    ],
    "visualSuggestion": "Specific description of what to show: 'Slide 1: Bold text overlay on brand color background saying [exact text]. Slide 2: Behind-the-scenes photo of [specific scene]. Slide 3: [etc.]'",
    "bestTime": "Tuesday-Thursday 11am-1pm EST"
  }
]

QUALITY CHECKLIST:
✓ All 30 days filled with unique, valuable content
✓ Platform mix matches user's selections
✓ Captions are engaging and on-brand
✓ Hashtags are strategic (not random)
✓ Visual suggestions are specific and executable
✓ Content pillars balanced (educate, entertain, inspire, promote)
✓ Posting times optimized per platform`;

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
          { role: 'user', content: `Create a comprehensive 30-day social media content calendar for ${businessName}. Start from today's date and create exactly 30 days of content.` }
        ],
        max_completion_tokens: 8000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    let contentCalendar;
    try {
      contentCalendar = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback calendar if JSON parsing fails
      contentCalendar = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        platform: platforms[i % platforms.length],
        contentType: "Post",
        caption: `Day ${i + 1} content for ${businessName}. Share your story and connect with your audience!`,
        hashtags: ["#business", "#socialmedia", "#content", `#${businessName.replace(/\s+/g, '')}`],
        visualSuggestion: "Brand-aligned visual showcasing your products/services",
        bestTime: "Peak engagement hours"
      }));
    }

    await logRequest({
      endpoint: "social-media-content",
      userId,
      ip,
      success: true,
      creditsCharged: 2,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ contentCalendar }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating social media content:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logRequest({
      endpoint: "social-media-content",
      userId,
      ip,
      success: false,
      creditsCharged: 0,
      errorMessage,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
