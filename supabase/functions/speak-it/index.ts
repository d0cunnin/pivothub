import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from '../_shared/moderation.ts';
import { throttle_user } from '../_shared/guard.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SpeakItRequest {
  path: 'speaker' | 'podcaster';
  sharedData: {
    fullName: string;
    businessName?: string;
    niche: string;
    targetAudience: string;
    brandTone: string;
    socialHandles?: string;
    website?: string;
    brandColors: string[];
    hasProfessionalPhotos: boolean;
    qualifications: string;
  };
  speakerData?: {
    speakingGoals: string[];
    speakingTopics: Array<{ title: string; description: string }>;
    targetVenues: string[];
    pricingLevel: string;
    availability: string;
  };
  podcasterData?: {
    podcastTitle: string;
    format: string[];
    frequency: string;
    episodeLength: string;
    hasGuestStrategy: boolean;
    topicPillars: string[];
    platforms: string[];
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Throttle to 3 requests per hour
    await throttle_user(supabase, userId, 'speak-it', 3600, 3);

    const body: SpeakItRequest = await req.json();
    const { path, sharedData, speakerData, podcasterData } = body;

    // Validate required fields
    if (!path || !sharedData?.fullName || !sharedData?.niche || !sharedData?.targetAudience) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Moderate content
    const moderationText = `${sharedData.niche} ${sharedData.targetAudience} ${sharedData.qualifications}`;
    const moderation = await moderateContent(moderationText, supabase, userId, 'speak-it');
    if (moderation.flagged) {
      return new Response(JSON.stringify({ 
        error: 'Content flagged by moderation',
        details: moderation.categories 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check and increment credits (3 credits)
    const { data: usageData, error: usageError } = await supabase.rpc('check_and_increment_ai_usage', {
      p_user_id: userId,
      p_tool_name: 'speak-it',
      p_credits_to_use: 3,
    });

    if (usageError || !usageData?.can_use) {
      return new Response(JSON.stringify({
        error: 'Insufficient credits',
        reason: usageData?.reason || 'Unknown error',
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build system prompt based on path
    let systemPrompt = '';

    if (path === 'speaker') {
      systemPrompt = `You are a professional business consultant, brand specialist, marketing guru, and technical writer specializing in PUBLIC SPEAKING careers.

USER PROFILE:
- Full Name: ${sharedData.fullName}
- Business Name: ${sharedData.businessName || 'N/A'}
- Niche: ${sharedData.niche}
- Target Audience: ${sharedData.targetAudience}
- Brand Tone: ${sharedData.brandTone}
- Social Handles: ${sharedData.socialHandles || 'N/A'}
- Website: ${sharedData.website || 'N/A'}
- Brand Colors: ${sharedData.brandColors.join(', ')}
- Professional Photos: ${sharedData.hasProfessionalPhotos ? 'Yes' : 'No'}
- Qualifications: ${sharedData.qualifications}

SPEAKER DETAILS:
- Speaking Goals: ${speakerData?.speakingGoals.join(', ')}
- Speaking Topics: ${speakerData?.speakingTopics.map(t => `"${t.title}" - ${t.description}`).join(' | ')}
- Target Venues: ${speakerData?.targetVenues.join(', ')}
- Pricing Level: ${speakerData?.pricingLevel}
- Availability: ${speakerData?.availability}

GENERATE A COMPREHENSIVE PUBLIC SPEAKING LAUNCH PLAN with these sections:

## 1. Positioning & Credibility
Evaluate if qualifications align with niche. If misaligned, include "Credibility Advisory & Repositioning" section with specific suggestions. Assess expertise level and recommend positioning strategy.

## 2. Brand & Media Kit
Complete speaker media kit checklist:
- Multiple bio versions (50 words, 100 words, 250 words)
- Speaking topics with clear promises and outcomes
- Professional headshots requirements
- Brand color usage guidelines (use the provided colors: ${sharedData.brandColors.join(', ')})
- Contact page structure
- Website alignment recommendations
- Suggest handle alternatives if social usernames may be taken

## 3. Speaking Topics (Detailed Breakdown)
For each of the ${speakerData?.speakingTopics.length || 3} topics provided:
- Title (refined if needed)
- Core Promise to audience
- Target Audience profile
- 5-7 Key Takeaways
- Suggested talk length
- Ideal venue types

## 4. Pricing & Contracts
- Pricing tier examples based on selected level (${speakerData?.pricingLevel})
- Payment terms recommendations
- Cancellation clause examples
- Speaker agreement template outline
- Ethics guidance (what to charge, when to do free events)

## 5. Audience Access & Outreach
- Specific strategies for reaching target venues: ${speakerData?.targetVenues.join(', ')}
- Email outreach templates (3 versions: cold, warm, follow-up)
- LinkedIn connection message templates
- Partnership strategies for each venue type
- Gatekeeper navigation tactics

## 6. Practice & Mastery
- Toastmasters recommendation
- Free community speaking opportunities
- Record and review practice loop
- Feedback collection methods
- Continuous improvement strategies

## 7. Marketing & Visibility
8-week content calendar specifically for speakers:
- Week-by-week social media themes
- Content pillars aligned with speaking topics
- Platform-specific strategies (LinkedIn, Instagram, TikTok)
- Video content ideas
- Testimonial collection system

## 8. 90-Day Rollover Plan
- Month 1 - Foundation: Website, media kit, practice talks, initial content
- Month 2 - Outreach: Venue targeting, email campaigns, networking events
- Month 3 - Paid Opportunities: Booking strategy, contract negotiations, delivery excellence
- Key Performance Indicators (KPIs) for each month

## 9. Next Steps Checklist
- Immediate action items (this week)
- Short-term goals (this month)
- Long-term milestones (90 days)

FORMATTING REQUIREMENTS:
- Write at executive level with polished, professional language
- Break complex steps into small, beginner-friendly sub-steps
- Include specific examples, not generic advice
- Assume user has limited tech background for website/social media guidance
- Use action verbs and clear directives
- Use markdown formatting with clear headings, bullet points, and tables where appropriate`;
    } else {
      systemPrompt = `You are a professional business consultant, brand specialist, marketing guru, and technical writer specializing in PODCAST LAUNCHES.

USER PROFILE:
- Full Name: ${sharedData.fullName}
- Business/Podcast Name: ${podcasterData?.podcastTitle}
- Niche: ${sharedData.niche}
- Target Audience: ${sharedData.targetAudience}
- Brand Tone: ${sharedData.brandTone}
- Social Handles: ${sharedData.socialHandles || 'N/A'}
- Website: ${sharedData.website || 'N/A'}
- Brand Colors: ${sharedData.brandColors.join(', ')}
- Professional Photos: ${sharedData.hasProfessionalPhotos ? 'Yes' : 'No'}
- Background: ${sharedData.qualifications}

PODCAST DETAILS:
- Podcast Title: ${podcasterData?.podcastTitle}
- Format: ${podcasterData?.format.join(', ')}
- Frequency: ${podcasterData?.frequency}
- Episode Length: ${podcasterData?.episodeLength}
- Guest Strategy: ${podcasterData?.hasGuestStrategy ? 'Yes' : 'No'}
- Topic Pillars: ${podcasterData?.topicPillars.join(' | ')}
- Preferred Platforms: ${podcasterData?.platforms.join(', ')}

GENERATE A COMPREHENSIVE PODCAST LAUNCH PLAN with these sections:

## 1. Show Identity & Audience
- Podcast concept clarity
- Tone and style definition
- Show differentiation (what makes it unique)
- Detailed listener persona
- Value proposition statement

## 2. Brand & Media Kit (Podcast)
- Host bio (3 versions: short, medium, long)
- Show summary (elevator pitch, 50 words, 150 words)
- Cover art requirements:
  * Dimensions (3000x3000px minimum)
  * Brand color integration (use the provided colors: ${sharedData.brandColors.join(', ')})
  * Typography readability
  * Platform-specific guidelines
- Sponsor sheet template
- Website/social branding consistency checklist

## 3. Recording & Equipment Setup
Platform Recommendations (based on user selections: ${podcasterData?.platforms.join(', ')}):
- Spotify for Podcasters (Anchor legacy): Free, beginner-friendly, auto-distribution
- Riverside.fm: High-quality recording + video integration with Spotify
- Podbean: Monetization features, analytics
- Spreaker: Live broadcasting, embed players
- YouTube Podcasts: Video-first approach, discovery potential
- Kajabi Podcasts: Premium content, course integration
- Reminder: "No one-size-fits-all platform. Research features, analytics, and monetization before choosing."

Starter Equipment Suggestions (emphasize these are suggestions, cheaper alternatives exist):
- Microphones:
  * Shure MV7 ($249) - hybrid USB/XLR
  * Blue Yeti ($130) - USB plug-and-play
  * RØDE NT-USB ($169) - studio quality USB
  * Budget option: Use laptop/phone with external mic ($20-50)
- Headphones:
  * Audio-Technica M40x ($99)
  * Sony MDR-7506 ($99)
  * Budget option: Any closed-back headphones you own
- Cameras (for video podcasts):
  * Logitech StreamCam ($170)
  * Sony ZV-E10 ($700) - pro quality
  * Budget option: Phone camera with tripod
- Lighting:
  * Neewer LED Ring Light ($40)
  * Panel Lights ($60-100)
  * Budget option: Natural window light
- Editing Software:
  * Audacity (FREE) - basic editing
  * Descript ($12/mo) - video + transcription
  * Adobe Audition ($20.99/mo) - professional
  * Note: Some podcasters do not need editing software right away—platforms like Riverside have built-in editing

## 4. Guest Strategy ${podcasterData?.hasGuestStrategy ? '(ENABLED)' : '(NO GUESTS PLANNED)'}
${podcasterData?.hasGuestStrategy ? `
- Guest outreach email templates (3 versions)
- Interview preparation checklist
- Guest onboarding process
- Cross-promotion plan (how to leverage guest audiences)
- Recording setup for remote guests (Riverside.fm, Zoom alternatives)
` : `
- Solo episode structure best practices
- Monologue vs. storytelling formats
- Keeping solo content engaging
`}

## 5. Content & Topics
12-Episode Starter Lineup based on topic pillars: ${podcasterData?.topicPillars.join(', ')}
For each episode:
- Episode title (SEO-optimized)
- Hook (first 30 seconds)
- Key talking points
- Call-to-action (CTA)
- Content calendar template

## 6. Marketing & Growth
8-Week Launch Plan:
- Week 1-2: Teaser content, cover art reveal
- Week 3-4: Trailer release, email list building
- Week 5: Episode 1 launch + social blitz
- Week 6-8: Consistency rhythm, listener engagement

Social media repurposing strategies:
- Audiograms (Headliner, Wavve)
- Quote graphics
- Video clips for TikTok/Reels/Shorts
- Blog post summaries
- Platform-specific growth tactics (Apple Podcasts, Spotify, YouTube)

## 7. Monetization & Ethics
- Sponsorship readiness checklist
- Affiliate marketing integration
- Premium/paid feeds (Patreon, Supercast)
- Merchandise opportunities
- Transparency reminders (FTC disclosure requirements)
- When to start monetizing (download thresholds)

## 8. 90-Day Rollout Plan
- Month 1 - Prep: Equipment setup, pilot episodes, branding finalized
- Month 2 - Launch: First 4-6 episodes published, marketing activated
- Month 3 - Growth: Consistency established, guest pipeline, analytics review
- Key Performance Indicators:
  * Download targets by month
  * Listener retention rate
  * Social media engagement
  * Email list growth

## 9. Next Steps Checklist
- Immediate setup (this week)
- Pre-launch tasks (this month)
- Post-launch optimization (90 days)

FORMATTING REQUIREMENTS:
- Write at executive level with polished, professional language
- Break technical steps into small, beginner-friendly sub-steps
- Assume limited tech knowledge—explain equipment setup clearly
- Use action verbs and clear directives
- Include platform comparison tables
- Use markdown formatting with clear headings, bullet points, and tables`;
    }

    // Call OpenAI GPT-5
    const openaiKey = Deno.env.get('pivothub-openai-key');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a comprehensive ${path === 'speaker' ? 'public speaking' : 'podcast'} launch plan.` }
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText.slice(0, 200)}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedPlan = openaiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        success: true,
        plan: generatedPlan,
        creditsUsed: 3,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in speak-it function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
