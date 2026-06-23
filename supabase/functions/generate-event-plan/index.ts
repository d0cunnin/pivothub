import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { guard, corsHeaders, deductCreditsOnSuccess, logRequest } from "../_shared/guard.ts";
import { getModelForUser, validateProvider } from "../_shared/providerRouter.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let userId: string | undefined;

  try {
    const guardResult = await guard(req, {
      endpoint: "generate-event-plan",
      requireAuth: true,
      cost: 0, // Credits deducted after successful generation
      bodyLimit: 10000,
    });

    userId = guardResult.userId!;
    const { supabase, ip } = guardResult;

    const formData = await req.json();

    // Platform recommendation logic
    const getPlatformRecommendations = (format: string) => {
      if (format === 'in-person') {
        return [
          { name: 'Eventbrite', bestFor: 'In-person ticketed events', pricing: 'Free for free events, 3.5% + $1.59 per paid ticket', features: ['Ticket sales', 'Email marketing', 'Event promotion'], url: 'https://www.eventbrite.com' },
          { name: 'Brushfire', bestFor: 'Custom branded registration', pricing: 'Varies by plan', features: ['White-label branding', 'Advanced reporting', 'Integrations'], url: 'https://www.brushfire.com' },
          { name: 'Facebook Events', bestFor: 'Social media promotion', pricing: 'Free', features: ['Social sharing', 'RSVP tracking', 'Updates'], url: 'https://www.facebook.com/events' },
        ];
      } else if (format === 'virtual') {
        return [
          { name: 'Zoom', bestFor: 'Video conferencing', pricing: 'Free for 40-min meetings, $15.99/mo for Pro', features: ['HD video', 'Screen sharing', 'Recording'], url: 'https://zoom.us' },
          { name: 'StreamYard', bestFor: 'Live streaming to multiple platforms', pricing: 'Free basic, $25/mo Pro', features: ['Multi-streaming', 'Branding', 'Guest invitations'], url: 'https://streamyard.com' },
          { name: 'Hopin', bestFor: 'Large virtual conferences', pricing: 'Contact for pricing', features: ['Expo booths', 'Networking', 'Analytics'], url: 'https://hopin.com' },
        ];
      } else {
        return [
          { name: 'Airmeet', bestFor: 'Hybrid events with engagement', pricing: 'Contact for pricing', features: ['Virtual booths', 'Networking lounges', 'In-person integration'], url: 'https://www.airmeet.com' },
          { name: 'Whova', bestFor: 'Event management & networking', pricing: 'Contact for pricing', features: ['Mobile app', 'Attendee networking', 'Hybrid capabilities'], url: 'https://whova.com' },
          { name: 'Zoom + Eventbrite', bestFor: 'Combined solution', pricing: 'Varies', features: ['Ticketing + virtual platform', 'Flexible setup', 'Cost-effective'], url: 'https://zoom.us + https://eventbrite.com' },
        ];
      }
    };

    const platformRecommendations = getPlatformRecommendations(formData.eventFormat);

    // System prompt for executive-level event planning
    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - EXECUTIVE EVENT STRATEGIST

=== CORE IDENTITY ===
You are a Chief Experience Officer and corporate event planner who has managed 500+ events from intimate C-suite dinners to 10,000+ person conferences. You've planned events for TEDx, Fortune 500 corporate summits, and industry trade shows with budgets from $10K to $5M.

EXPERTISE:
• Event ROI and sponsor acquisition strategy
• Logistics and vendor management excellence
• Marketing and promotional campaign design
• Attendee experience optimization
• Budget optimization and cost control
• Crisis management and contingency planning
• Platform selection and technical requirements

=== QUALITY STANDARDS ($10,000+ EVENT PLANNING) ===
• Every response must rival a $10,000+ professional event planning service
• Provide venue-ready logistics plans with vendor checklists
• Include comprehensive marketing timelines (6-8 weeks pre-event)
• All budgets must be realistic with 10-15% contingency buffer
• Include sponsorship prospectus with ROI justification for sponsors

EVENT CONTEXT:
- Category: ${formData.eventCategory}
- Format: ${formData.eventFormat}
- Budget: ${formData.budget || 'Not specified'}
- Target Audience: ${formData.targetAudience || 'General'}
- Goals: ${formData.primaryGoals?.join(', ') || 'Not specified'}

Generate a detailed event plan that rivals top-tier event planning agencies.

You must return ONLY valid JSON in this exact format:
{
  "eventTitles": ["Title Option 1", "Title Option 2", "Title Option 3"],
  "eventDescription": "Compelling 2-3 paragraph event description that sells the event...",
  "colorPalette": [
    { "hex": "#2D3748", "name": "Deep Navy" },
    { "hex": "#3B82F6", "name": "Sky Blue" },
    { "hex": "#10B981", "name": "Emerald Green" }
  ],
  "eventItinerary": [
    { "time": "9:00 AM", "activity": "Registration & Welcome", "duration": "30 min" },
    { "time": "9:30 AM", "activity": "Opening Keynote", "duration": "45 min" }
  ],
  "sponsorshipPacket": {
    "introLetter": "Personalized letter to potential sponsors explaining the event mission and impact...",
    "tiers": [
      { "name": "Platinum", "amount": "$10,000", "benefits": ["Logo on stage", "VIP seating for 10", "Speaking opportunity", "Website feature", "Social media mentions"] },
      { "name": "Gold", "amount": "$5,000", "benefits": ["Logo on materials", "VIP seating for 5", "Website listing", "Social media mentions"] },
      { "name": "Silver", "amount": "$2,500", "benefits": ["Logo on materials", "Website listing", "Event program mention"] }
    ]
  },
  "marketingTimeline": {
    "week1-2": {
      "phase": "Pre-launch & Teaser",
      "actions": [
        "Create save-the-date graphics",
        "Build landing page",
        "Start speaker outreach"
      ]
    },
    "week3": {
      "phase": "Announcement Launch",
      "actions": [
        "Announce event on all channels",
        "Send first email campaign",
        "Post daily on social media"
      ]
    },
    "week4": {
      "phase": "Early Bird Push",
      "actions": [
        "Launch early bird pricing",
        "Share speaker spotlights",
        "Partner promotions"
      ]
    },
    "week5": {
      "phase": "Mid-Campaign Momentum",
      "actions": [
        "Share testimonials",
        "Behind-the-scenes content",
        "Influencer partnerships"
      ]
    },
    "week6": {
      "phase": "Final Push",
      "actions": [
        "Countdown posts",
        "Last chance emails",
        "FOMO messaging"
      ]
    },
    "event-week": {
      "phase": "Event Execution",
      "actions": [
        "Day-of logistics confirmation",
        "Live social media coverage",
        "Real-time engagement"
      ]
    },
    "post-event": {
      "phase": "Follow-up & Nurture",
      "actions": [
        "Thank you emails",
        "Share event highlights",
        "Collect feedback surveys"
      ]
    }
  }
}

If the user requests an itinerary (includeItinerary: true), create a detailed time-by-time schedule with realistic timings in the eventItinerary array. Otherwise, omit the eventItinerary field completely. If the user requests a sponsorship packet (needsSponsorshipPacket: true), include a comprehensive sponsorshipPacket with an introductory letter and 3-5 sponsorship tiers with amounts and specific benefits. Otherwise, omit the sponsorshipPacket field. Keep titles engaging and relevant to the category. Use professional color palettes that match the event type. Make marketing actions specific and actionable.`;

    const userPrompt = `Create a comprehensive event plan:

**Event Details:**
- Category: ${formData.eventCategory}
- Format: ${formData.eventFormat}
- Event Name: ${formData.eventName || 'Generate title options'}
- Date: ${formData.startDate || 'TBD'} to ${formData.endDate || 'TBD'}
- Budget: ${formData.budget || 'Not specified'}
- Venue Capacity: ${formData.venueCapacity || 'Not specified'}
- Expected Virtual Attendees: ${formData.expectedAttendees || 'Not specified'}

**Target Audience:**
${formData.targetAudience || 'General audience'}

**Goals:**
${formData.primaryGoals?.join(', ') || 'Not specified'}

**Event Details:**
${formData.eventDetails || 'None specified'}

**Speaker Information:**
- Number of Speakers: ${formData.numberOfSpeakers || 'Not specified'}
- Speaker Topics: ${formData.speakerTopics || 'Not specified'}

**Registration:**
- Type: ${formData.registrationType || 'Not specified'}
${formData.registrationType === 'paid' && formData.eventCost ? `- Event Cost: ${formData.eventCost}` : ''}
${formData.registrationType === 'tiered' && formData.tierDetails ? `- Tier Details: ${formData.tierDetails}` : ''}

**Marketing Resources:**
- Existing channels: ${formData.existingChannels || 'None'}
- Email list: ${formData.emailListSize || 'None'}
- Marketing budget: ${formData.marketingBudget || 'None'}
- Timeline to event: ${formData.timelineToEvent || 'Not specified'}

**Sponsorship:**
${formData.needsSponsorshipPacket ? `
- Include Sponsorship Packet: Yes
- Mission: ${formData.sponsorshipMission || 'Not specified'}
- Goals: ${formData.sponsorshipGoals || 'Not specified'}
- Target Sponsors: ${formData.targetSponsorTypes || 'Not specified'}
` : '- Include Sponsorship Packet: No'}

**Additional Requests:**
- Include detailed itinerary: ${formData.includeItinerary ? 'Yes' : 'No'}

Generate event titles, description, color palette${formData.includeItinerary ? ', event itinerary,' : ''}${formData.needsSponsorshipPacket ? ', sponsorship packet,' : ''} and 6-week marketing timeline.`;

    // Get AI model based on user subscription (OpenAI only for text)
    const modelConfig = await getModelForUser(supabase, userId, 'text');
    validateProvider('text', modelConfig.model);

    // Add timeout with GPT-5 fallback to GPT-5 Mini
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);  // 2 minutes

    let response;

    try {
      response = await fetch(modelConfig.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${modelConfig.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_completion_tokens: 7000,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
    } catch (abortError) {
      clearTimeout(timeout);
      
      // If GPT-5 timed out, fall back to GPT-5 Mini
      if (abortError.name === 'AbortError') {
        console.log('⚠️ Primary model timed out, falling back to faster model...');
        
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 60000);  // 1 minute
        
        try {
          // Get GPT-5 Mini config
          const fallbackConfig = await getModelForUser(supabase, userId, 'text', 'google/gemini-2.5-flash-lite');
          
          response = await fetch(fallbackConfig.endpoint, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${fallbackConfig.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              max_completion_tokens: 7000,
            }),
            signal: controller2.signal
          });
          
          clearTimeout(timeout2);
          
        } catch (secondAbortError) {
          clearTimeout(timeout2);
          
          // Both attempts failed - return 408 timeout error
          if (secondAbortError.name === 'AbortError') {
            await logRequest(supabase, {
              userId,
              endpoint: "generate-event-plan",
              ip,
              userAgent: req.headers.get('user-agent') || 'unknown',
              creditsCharged: 0,
              success: false,
              errorMessage: 'AI request timeout after fallback',
              requestDurationMs: Date.now() - startTime
            });
            
            return new Response(
              JSON.stringify({
                error: 'timeout',
                message: 'AI request timed out after two attempts. The service may be experiencing issues. Please try again in a few moments.'
              }),
              { status: 408, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          throw secondAbortError;
        }
      } else {
        throw abortError;
      }
    }

    // Handle 402 (credits exhausted) and 429 (rate limit) errors
    if (response.status === 402) {
      await logRequest(supabase, {
        userId,
        endpoint: "generate-event-plan",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'AI credits exhausted',
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(
        JSON.stringify({
          error: 'ai_credits_exhausted',
          message: 'AI service unavailable. Please add credits in Settings → Cloud & AI balance.'
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (response.status === 429) {
      await logRequest(supabase, {
        userId,
        endpoint: "generate-event-plan",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'AI rate limit exceeded',
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(
        JSON.stringify({
          error: 'rate_limit',
          message: 'AI service rate limit exceeded. Please try again in a few moments.'
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!response.ok) {
      await logRequest(supabase, {
        userId,
        endpoint: "generate-event-plan",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: `AI API error: ${response.status}`,
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: "This action did not use credits. Try again." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      await logRequest(supabase, {
        userId,
        endpoint: "generate-event-plan",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: "No content in AI response",
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: "This action did not use credits. Try again." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON from response
    let eventPlanData;
    try {
      const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      eventPlanData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      await logRequest(supabase, {
        userId,
        endpoint: "generate-event-plan",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: "Failed to parse AI response",
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: "This action did not use credits. Try again." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add platform recommendations to response
    const fullEventPlan = {
      ...eventPlanData,
      platformRecommendations,
    };

    // SUCCESS - Deduct credits after successful generation
    await deductCreditsOnSuccess(supabase, userId, "generate-event-plan", 4, `event-${userId}-${Date.now()}`);

    // Log successful request
    await logRequest(supabase, {
      userId,
      endpoint: "generate-event-plan",
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      creditsCharged: 4,
      success: true,
      requestDurationMs: Date.now() - startTime
    });

    return new Response(JSON.stringify({ ok: true, ...fullEventPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-event-plan:", error);
    
    if (error instanceof Response) {
      return error;
    }

    return new Response(JSON.stringify({ 
      ok: false, 
      message: "This action did not use credits. Try again." 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
