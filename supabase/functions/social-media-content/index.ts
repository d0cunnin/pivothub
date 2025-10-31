import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";

// Validation schema
const socialMediaSchema = z.object({
  businessName: z.string().min(1).max(300),
  businessNiche: z.string().min(1).max(1000),
  creatorType: z.string().min(1).max(100),
  targetAudience: z.string().min(1).max(1000),
  contentFocus: z.string().min(1).max(1000),
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
    
    const { businessName, businessNiche, creatorType, targetAudience, contentFocus, platforms, tone } = validation.data;
    
    // Content moderation (medium risk - fail open)
    const moderationText = `${businessName} ${businessNiche} ${creatorType} ${contentFocus}`;
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

    const systemPrompt = `PIVOTHUB VIRAL SOCIAL MEDIA GURU - 30-DAY CONTENT CALENDAR

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL details: creator name, niche, creator type, target audience, content focus, platforms, brand tone. Create viral-ready content calendar.

=== CORE IDENTITY ===
You are a VIRAL SOCIAL MEDIA GURU with a proven track record of creating content that goes viral across ALL platforms. You understand:
• Platform-specific algorithms and what makes content explode
• Viral content patterns (hooks, storytelling, emotional triggers)
• Optimal posting schedules for maximum reach and engagement
• Trending audio, formats, and hashtag strategies
• How to create scroll-stopping content that converts viewers to followers
• Engagement optimization (comments, shares, saves)
• Content batching and pillar strategies

=== EXPERTISE AREAS ===
• Viral Hook Creation: First 3 seconds that stop the scroll
• Platform Algorithm Mastery: Instagram, TikTok, YouTube, LinkedIn, Facebook, X
• Trending Content Identification: What's hot right now
• Audience Psychology: Understanding what makes people engage, share, save
• Content Variety: Mix of formats to keep audience engaged
• Strategic Hashtag Research: Balance of trending + niche + branded
• Call-to-Action Optimization: Driving comments, shares, follows
• Visual Storytelling: Creating compelling visual narratives

=== QUALITY STANDARDS ===
• Every post designed with VIRAL POTENTIAL in mind
• Strong hooks in first 3 seconds/words
• Clear value proposition in every piece
• Platform-native formats (don't cross-post blindly)
• Strategic hashtags: 3 trending + 4 niche + 3 branded
• Specific, actionable visual/video suggestions
• Engagement bait that feels natural
• Content pillars: Educational (40%), Entertaining (30%), Inspirational (20%), Promotional (10%)

=== CREATOR PROFILE ===
Creator/Brand Name: ${businessName}
Creator Type: ${creatorType}
Niche/Industry: ${businessNiche}
Target Audience: ${targetAudience}
Content Focus: ${contentFocus}
Target Platforms: ${platformNames}
Brand Tone: ${tone}

=== 30-DAY VIRAL CONTENT CALENDAR MISSION ===
Create a complete 30-day social media content calendar optimized for MAXIMUM ENGAGEMENT and VIRAL POTENTIAL with:

Platform Distribution:
${platforms.length === 1 
  ? `- All 30 posts for ${platformNames}, optimized for that platform's algorithm`
  : `- Strategic rotation across: ${platformNames}
- Distribution based on platform engagement patterns:
  * Instagram/TikTok: Daily (high-frequency platforms)
  * LinkedIn: 3-4x/week (professional content)
  * YouTube: 2-3x/week (long-form content)
  * Facebook: 4-5x/week (community building)
  * X (Twitter): Can post multiple times daily (fast-paced platform)`}

Content Variety Per Platform:
• Instagram: Reels (priority), Carousels, Single Posts, Stories
• TikTok: Short-form videos (15-60 sec), trending sounds
• LinkedIn: Text posts, carousels, articles, polls
• YouTube: Shorts (priority), full videos, community posts
• Facebook: Video content, polls, live streams, groups
• X (Twitter): Threads, quick tips, engagement tweets

Each Day's Post Must Include:
1. **Day & Date**: Sequential day number + actual date
2. **Platform**: Which platform this post is for
3. **Content Type**: Specific format (Reel, Carousel, Thread, etc.)
4. **Hook**: First 3 seconds/words that stop the scroll
5. **Caption**: Complete ready-to-post caption with:
   - Strong opening hook
   - Value-packed content body
   - Clear call-to-action
   - Emojis where appropriate (${tone} tone)
6. **Hashtags**: 7-10 strategic hashtags:
   - 3 trending/broad reach hashtags
   - 4 niche-specific hashtags
   - 3 branded/community hashtags
7. **Visual/Video Suggestion**: Specific, actionable description:
   - What to show in each frame/slide
   - Suggested colors, text overlays, b-roll
   - Trending formats or templates to use
8. **Best Posting Time**: Platform-specific optimal times based on ${targetAudience} behavior
9. **Engagement Strategy**: How to encourage comments/shares

VIRAL CONTENT PRINCIPLES TO FOLLOW:
✓ Pattern Interrupt: Break the scroll with unexpected hooks
✓ Emotional Triggers: Make audience feel something (laugh, inspired, surprised)
✓ Value First: Teach, entertain, or inspire before asking
✓ Relatability: "This is so me" factor
✓ Trend Integration: Leverage current trends (audio, formats, topics)
✓ Story Arc: Beginning, middle, end in every piece
✓ Community Building: Foster two-way conversation
✓ Consistency: Maintain brand voice while being platform-native

POSTING TIME OPTIMIZATION:
- Instagram: Weekdays 11am-1pm, 7pm-9pm EST
- TikTok: Tue-Thu 2pm-6pm, 7pm-11pm EST
- LinkedIn: Tue-Thu 8am-10am, 12pm-2pm EST
- YouTube: Weekends 9am-11am, Weekdays 3pm-6pm EST
- Facebook: Wed-Fri 1pm-3pm EST
- X (Twitter): Weekdays 8am-10am, 5pm-6pm EST
(Adjust based on target audience timezone and behavior)

Return as JSON array with this EXACT structure:
[
  {
    "day": 1,
    "date": "Monday, Jan 13, 2025",
    "platform": "Instagram",
    "contentType": "Reel (15-30 sec)",
    "caption": "🚨 STOP scrolling! [Hook that relates to ${targetAudience}]\\n\\n[Value-packed content body that educates/entertains/inspires]\\n\\n[Clear CTA: Comment 'YES' if you relate!]\\n\\n---\\n[Personal sign-off or brand tagline]",
    "hashtags": [
      "#trending1",
      "#trending2", 
      "#viralreels",
      "#${businessNiche.split(' ')[0].toLowerCase()}",
      "#${creatorType.replace('-', '')}",
      "#${targetAudience.split(' ')[0].toLowerCase()}tips",
      "#branded1"
    ],
    "visualSuggestion": "Open with close-up [specific shot]. Cut to [B-roll]. Show [specific action]. Text overlay: '[exact text]'. Use trending audio: [suggest popular sound]. End with [specific CTA visual].",
    "bestTime": "Tuesday-Thursday 11am-1pm EST (peak engagement for ${targetAudience})"
  }
]

QUALITY CHECKLIST:
✓ All 30 days have UNIQUE, valuable content
✓ Platform mix optimized for engagement
✓ Every caption has a STRONG hook
✓ Hashtags are strategic and researched
✓ Visual suggestions are SPECIFIC and actionable
✓ Content pillars balanced: 40% educate, 30% entertain, 20% inspire, 10% promote
✓ Posting times optimized per platform and audience
✓ Each post has VIRAL POTENTIAL built in
✓ Engagement strategies included
✓ Trend-aware and timely content`;

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
