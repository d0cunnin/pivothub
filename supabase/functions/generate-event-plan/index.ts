import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { guard, corsHeaders } from "../_shared/guard.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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
      cost: 4,
      bodyLimit: 10000,
    });

    userId = guardResult.userId;

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

    // System prompt for event planning
    const systemPrompt = `You are an expert event planner specializing in comprehensive event strategy and marketing. Generate a detailed event plan based on the user's requirements.

You must return ONLY valid JSON in this exact format:
{
  "eventTitles": ["Title Option 1", "Title Option 2", "Title Option 3"],
  "eventDescription": "Compelling 2-3 paragraph event description that sells the event...",
  "colorPalette": [
    { "hex": "#2D3748", "name": "Deep Navy" },
    { "hex": "#3B82F6", "name": "Sky Blue" },
    { "hex": "#10B981", "name": "Emerald Green" }
  ],
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

Keep titles engaging and relevant to the category. Use professional color palettes that match the event type. Make marketing actions specific and actionable.`;

    const userPrompt = `Create a comprehensive event plan:

**Event Details:**
- Category: ${formData.eventCategory}
- Format: ${formData.eventFormat}
- Event Name: ${formData.eventName || 'Generate title options'}
- Date: ${formData.startDate || 'TBD'} to ${formData.endDate || 'TBD'}
- Expected Attendance: ${formData.attendanceRange || 'Not specified'}
- Budget: ${formData.budget || 'Not specified'}

**Target Audience:**
${formData.targetAudience || 'General audience'}

**Goals:**
${formData.primaryGoals?.join(', ') || 'Not specified'}

**Requirements:**
${formData.specificRequirements || 'None specified'}

**Marketing Resources:**
- Existing channels: ${formData.existingChannels || 'None'}
- Email list: ${formData.emailListSize || 'None'}
- Marketing budget: ${formData.marketingBudget || 'None'}
- Timeline to event: ${formData.timelineToEvent || 'Not specified'}

Generate event titles, description, color palette, and 6-week marketing timeline.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    let eventPlanData;
    try {
      const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      eventPlanData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Add platform recommendations to response
    const fullEventPlan = {
      ...eventPlanData,
      platformRecommendations,
    };

    // Log successful request
    await import("../_shared/guard.ts").then(({ logRequest }) =>
      logRequest({
        endpoint: "generate-event-plan",
        userId,
        success: true,
        creditsCharged: 4,
        durationMs: Date.now() - startTime,
      })
    );

    return new Response(JSON.stringify(fullEventPlan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-event-plan:", error);

    // Log failed request
    await import("../_shared/guard.ts").then(({ logRequest }) =>
      logRequest({
        endpoint: "generate-event-plan",
        userId,
        success: false,
        creditsCharged: 0,
        durationMs: Date.now() - startTime,
        errorMessage: error.message,
      })
    );

    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
