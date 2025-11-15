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
      endpoint: "generate-schedule",
      requireAuth: true,
      cost: 0, // Credits deducted after successful generation
      bodyLimit: 10000,
    });

    userId = guardResult.userId!;
    const { supabase, ip } = guardResult;

    const formData = await req.json();

    // System prompt for executive time management
    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - EXECUTIVE TIME STRATEGIST

=== CORE IDENTITY ===
You are a Chief Productivity Officer and executive coach who has optimized schedules for 200+ C-suite executives, founders, and high-performers. You understand energy management, decision fatigue, deep work principles, and work-life integration at the highest levels.

EXPERTISE:
• Time blocking and energy management
• Deep work vs. shallow work optimization
• Meeting architecture and calendar defense
• Work-life integration (not balance)
• Delegation and leverage strategies
• Recovery and sustainable performance
• Executive presence and time sovereignty

=== QUALITY STANDARDS ($3,000+ EXECUTIVE COACHING) ===
• Every response must rival a $3,000+ executive coaching engagement
• Provide schedules that respect circadian rhythms and energy patterns
• Include strategic time allocation across all 12 life domains
• All schedules must be sustainable for 90+ days (not sprint-only)
• Include quarterly review checkpoints and adjustment protocols

USER CONTEXT:
- Work: ${formData.workHours} hours/week (${formData.workSchedule})
- Energy Type: ${formData.energyType}
- Peak Productivity: ${formData.peakProductivity?.join(', ')}
- Business Goals: ${formData.businessType}
- Available Time: ${formData.weeklyHoursRealistic || formData.weeklyHoursWanted} hours/week

Generate a realistic, executive-level weekly schedule that optimizes for sustainable high performance.

IMPORTANT: Your schedule MUST include time blocks for these key life domains:
1. Work / Career - Primary employment and career development
2. Business / Entrepreneurship - Side business, startups, ventures
3. Marriage / Relationship - Quality time with spouse/partner
4. Children / Parenting - Active parenting, homework help, activities
5. Family Time - Extended family, family meals, traditions
6. Fitness / Exercise - Physical activity, gym, sports
7. Faith / Spiritual Life - Prayer, worship, meditation, spiritual practices
8. Health & Wellness - Medical appointments, mental health, self-care
9. Study / Learning - Formal education, skill development, courses
10. Personal Development - Reading, journaling, coaching, therapy
11. Creativity - Creative hobbies, artistic expression, projects
12. Rest & Recovery - Sleep, downtime, relaxation, sabbath

Key principles:
- Respect energy patterns (don't schedule deep work during low-energy times)
- Include buffer time between activities (10-15 minutes)
- Balance ALL life domains - avoid neglecting any area
- Be realistic - don't overschedule
- Respect non-negotiable time blocks
- Provide specific time blocks (e.g., "Monday 6:00 AM - 8:00 AM: Side Business - Content Creation")
- Include recommendations for long-term sustainability
- Consider the user's family commitments, marriage, faith, and personal wellbeing

CRITICAL: Return ONLY valid JSON. Do not include any explanatory text, markdown formatting, or comments.
The response must start with { and end with }

Return ONLY valid JSON in this exact format:
{
  "weeklySchedule": {
    "monday": [
      { "time": "6:00 AM - 8:00 AM", "activity": "Side Business - Content Creation", "category": "business" },
      { "time": "8:00 AM - 9:00 AM", "activity": "Morning Routine & Family Breakfast", "category": "family" }
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
    "familyTime": 20,
    "personalDevelopment": 5,
    "fitnessHours": 4,
    "faithTime": 3,
    "restHours": 56,
    "recommendations": [
      "Start with 2 hours per day for your side business",
      "Schedule 30 minutes daily for marriage quality time",
      "Block Friday evenings for family time"
    ]
  }
}

Categories must be one of: "work", "business", "marriage", "children", "family", "fitness", "faith", "health", "study", "personal-development", "creativity", "rest"`;

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

    // Get AI model based on user subscription (OpenAI only for text)
    const modelConfig = await getModelForUser(supabase, userId, 'text');
    validateProvider('text', modelConfig.model);

    const response = await fetch(modelConfig.endpoint, {
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
        max_completion_tokens: 10000, // Increased for full weekly schedule generation
      }),
    });

    if (!response.ok) {
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
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
    
    // Log the raw AI response for debugging
    console.log('=== AI Response Debug ===');
    console.log('Status:', response.status);
    console.log('Content Length:', content?.length);
    console.log('Content Preview:', content?.slice(0, 300));
    console.log('Content End:', content?.slice(-200));

    if (!content) {
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
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

    // Parse JSON from response with robust extraction
    let scheduleData;
    try {
      console.log('=== JSON Parsing Attempt ===');
      console.log('Raw content length:', content.length);
      console.log('First 500 chars:', content.slice(0, 500));
      
      let jsonString = content.trim();
      
      // Remove markdown code blocks
      jsonString = jsonString.replace(/```json\s*/gi, '');
      jsonString = jsonString.replace(/```\s*/g, '');
      
      // Remove any leading/trailing text before first { and after last }
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error('No JSON object found in response');
      }
      
      jsonString = jsonString.substring(firstBrace, lastBrace + 1).trim();
      
      console.log('Extracted JSON length:', jsonString.length);
      console.log('JSON starts with:', jsonString.slice(0, 100));
      console.log('JSON ends with:', jsonString.slice(-100));
      
      scheduleData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("=== JSON PARSE ERROR ===");
      console.error("Error:", parseError);
      console.error("Full AI response:", content);
      
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: `Failed to parse AI response: ${parseError.message}`,
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: "AI response was malformed. This action did not use credits. Try again." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate schedule structure
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const missingDays = requiredDays.filter(day => 
      !scheduleData.weeklySchedule?.[day] || 
      !Array.isArray(scheduleData.weeklySchedule[day]) ||
      scheduleData.weeklySchedule[day].length === 0
    );
    
    if (missingDays.length > 0) {
      console.error('=== INCOMPLETE SCHEDULE ===');
      console.error('Missing days:', missingDays);
      console.error('Schedule data:', JSON.stringify(scheduleData, null, 2));
      
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: `Incomplete schedule - missing days: ${missingDays.join(', ')}`,
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: `Schedule is incomplete. Missing: ${missingDays.join(', ')}. This action did not use credits. Try again.`
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate summary exists
    if (!scheduleData.summary) {
      console.error('=== MISSING SUMMARY ===');
      scheduleData.summary = {
        totalCommittedHours: 0,
        totalAvailableHours: 168,
        recommendations: ['Please review your schedule and adjust as needed.']
      };
    }
    
    console.log('=== SCHEDULE VALIDATION PASSED ===');
    console.log('All days present:', requiredDays.join(', '));
    console.log('Total time blocks:', Object.values(scheduleData.weeklySchedule).flat().length);

    // SUCCESS - Deduct credits after successful generation
    await deductCreditsOnSuccess(supabase, userId, "generate-schedule", 3, `schedule-${userId}-${Date.now()}`);

    // Log successful request
    await logRequest(supabase, {
      userId,
      endpoint: "generate-schedule",
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      creditsCharged: 3,
      success: true,
      requestDurationMs: Date.now() - startTime
    });

    return new Response(JSON.stringify({ ok: true, ...scheduleData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in generate-schedule:", error);
    
    if (error instanceof Response) {
      return error;
    }

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
