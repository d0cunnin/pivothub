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
      endpoint: "generate-schedule",
      requireAuth: true,
      cost: 2,
      bodyLimit: 10000,
    });

    userId = guardResult.userId;

    const formData = await req.json();

    // System prompt optimized for realistic scheduling
    const systemPrompt = `You are an expert life coach and productivity consultant specializing in creating realistic, sustainable schedules. Generate a personalized weekly schedule based on the user's inputs.

Key principles:
- Respect energy patterns (don't schedule deep work during low-energy times)
- Include buffer time between activities (10-15 minutes)
- Balance work/life/rest - avoid burnout
- Be realistic - don't overschedule
- Respect non-negotiable time blocks
- Provide specific time blocks (e.g., "Monday 6:00 AM - 8:00 AM: Side Business - Content Creation")
- Include recommendations for sustainability

Return ONLY valid JSON in this exact format:
{
  "weeklySchedule": {
    "monday": [
      { "time": "6:00 AM - 8:00 AM", "activity": "Side Business - Content Creation", "category": "side-business" },
      { "time": "8:00 AM - 9:00 AM", "activity": "Morning Routine", "category": "personal" }
    ],
    "tuesday": [...],
    "wednesday": [...],
    "thursday": [...],
    "friday": [...],
    "saturday": [...],
    "sunday": [...]
  },
  "summary": {
    "totalCommittedHours": 40,
    "totalAvailableHours": 168,
    "sideBusinessHours": 15,
    "personalTime": 30,
    "recommendations": [
      "Start with 2 hours per day for your side business",
      "Schedule breaks every 90 minutes during deep work"
    ]
  }
}

Categories must be: "work", "personal", "side-business", or "rest"`;

    const userPrompt = `Create a weekly schedule based on these details:

**Current Commitments:**
- Work: ${formData.workHours} hours/week (${formData.workSchedule})
- School: ${formData.schoolCommitment || 'None'}
- Family: ${formData.familyCommitments || 'None'}
- Recurring appointments: ${formData.recurringAppointments || 'None'}
- Commute: ${formData.commuteTime || '0'} hours/day

**Energy Patterns:**
- Energy type: ${formData.energyType}
- Peak productivity: ${formData.peakProductivity?.join(', ') || 'Not specified'}
- Energy dips: ${formData.energyDips?.join(', ') || 'Not specified'}
- Sleep schedule: ${formData.sleepSchedule || 'Not specified'}

**Business Goals:**
- Building: ${formData.businessType}
- Hours wanted: ${formData.weeklyHoursWanted || 'Not specified'}
- Hours realistic: ${formData.weeklyHoursRealistic || 'Not specified'}
- Activities: ${formData.specificActivities || 'Not specified'}

**Constraints:**
- Non-negotiable: ${formData.nonNegotiableBlocks || 'None'}
- Preferred environment: ${formData.preferredEnvironment || 'Flexible'}
- Scheduling style: ${formData.schedulingStyle || 'Flexible'}

Generate a realistic weekly schedule that respects all constraints and energy patterns.`;

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
        temperature: 0.7,
        max_tokens: 3000,
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
    let scheduleData;
    try {
      // Remove markdown code blocks if present
      const jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scheduleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response");
    }

    // Log successful request
    await import("../_shared/guard.ts").then(({ logRequest }) =>
      logRequest({
        endpoint: "generate-schedule",
        userId,
        success: true,
        creditsCharged: 2,
        durationMs: Date.now() - startTime,
      })
    );

    return new Response(JSON.stringify(scheduleData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-schedule:", error);

    // Log failed request
    await import("../_shared/guard.ts").then(({ logRequest }) =>
      logRequest({
        endpoint: "generate-schedule",
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
