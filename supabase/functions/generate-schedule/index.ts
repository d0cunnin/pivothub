import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { guard, corsHeaders, deductCreditsOnSuccess, logRequest } from "../_shared/guard.ts";
import { getModelForUser, validateProvider } from "../_shared/providerRouter.ts";
import { fetchWithTimeout, handleAIError, AIError } from "../_shared/aiTimeout.ts";

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

    // Truncate helper function to prevent prompt explosion
    const truncateText = (text: string | undefined | null, maxLength: number): string => {
      if (!text) return 'None';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // Truncate all text inputs to prevent token limit issues
    const truncatedData = {
      ...formData,
      workScheduleDetails: truncateText(formData.workScheduleDetails, 150),
      familyCommitments: truncateText(formData.familyCommitments, 150),
      recurringAppointments: truncateText(formData.recurringAppointments, 150),
      schoolCommitment: truncateText(formData.schoolCommitment, 100),
      workSchedule: truncateText(formData.workSchedule, 120),
      businessType: truncateText(formData.businessType, 120),
      sleepSchedule: truncateText(formData.sleepSchedule, 80),
      nonNegotiableBlocks: truncateText(formData.nonNegotiableBlocks, 150),
      specificActivities: truncateText(formData.specificActivities, 150),
    };

    // Optimized system prompt (concise version)
    const systemPrompt = `You are an executive time management coach specializing in sustainable, balanced schedules.

CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations, no preamble - just the raw JSON object exactly as specified below.

IMPORTANT CONSTRAINTS:
- **MAXIMUM 5-6 activities per day** (provide more detail)
- **Keep activity descriptions under 35 characters** (readable but informative)
- **Use clean time formats: "9:00a-12:00p"** (clear without verbosity)
- **Provide 4-5 recommendations, each under 50 characters** (actionable advice)
- Focus on meaningful, actionable tasks
- CRITICAL: ONLY schedule based on user's ACTUAL input - DO NOT invent activities
- DO NOT add example activities like "creative jam", "coffee with friend", or "hobby time" unless user specified them
- If user provided specific commitments (work, school, family), schedule those FIRST
- Use general labels like "Business Work", "Personal Time", "Rest" rather than inventing specific activities

REQUIREMENTS:
- Create realistic weekly schedules optimized for energy patterns
- Balance ALL 12 life domains: work, business, marriage, children, family, fitness, faith, health, study, personal development, creativity, rest
- Respect user's energy type and peak productivity times
- Include 10-15 minute buffers between activities
- Avoid overscheduling

CRITICAL SCHEDULING LOGIC (must follow):
1. **DO NOT place fitness/exercise immediately before or after long commutes** - this is physically unrealistic
2. **Fill ALL gaps** between major activities - no 2+ hour unscheduled blocks during waking hours
3. **Logical sequence**: Commute → Work → Commute → Rest/Transition → Evening activities
4. **Exercise placement**: Schedule during natural breaks (lunch hour, after work before dinner, weekends)
5. **Transition time**: Add 15-30 min "wind down" or "transition" activities between major blocks
6. **Evening structure**: After work commute, include dinner/rest (30-60 min) before evening activities
7. **Realistic timing**: Don't schedule intense activities (fitness, business work) immediately after exhausting ones (long work days, commutes)

SUMMARY CALCULATIONS:
- totalCommittedHours: Sum of ALL scheduled activities (work + school + business + family + etc)
- sideBusinessHours: Count ONLY activities with category "business" (this is what user is building)
- personalTime: Count activities with categories "rest", "personal-development", "creativity", "fitness"
- Include 4-5 actionable recommendations (under 50 characters each)

${truncatedData.hasExerciseRoutine === 'no' || !truncatedData.hasExerciseRoutine 
  ? '⚠️ CRITICAL PRIORITY: User does NOT exercise regularly. You MUST include "Start 30-min exercise routine 3x/week" as the TOP recommendation. Schedule exercise blocks during their peak energy times (fitness category).'
  : 'User has exercise routine - support it in the schedule with fitness category blocks.'}

RESPONSE FORMAT - Return ONLY valid JSON:
{
  "weeklySchedule": {
    "monday": [
      {"time": "6:00 AM - 8:00 AM", "activity": "Brief description", "category": "business"}
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
    "sideBusinessHours": 10,
    "personalTime": 15,
    "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
  }
}

Valid categories: work, business, marriage, children, family, fitness, faith, health, study, personal-development, creativity, rest

Keep activity descriptions under 50 characters.`;

    const userPrompt = `Schedule requirements:

WORK:
- Work hours: ${truncatedData.workHours}h/week
- Work type: ${truncatedData.workSchedule}
- Work schedule: ${truncatedData.workScheduleDetails || 'Not specified'}

EDUCATION & TRAINING:
- Currently enrolled: ${truncatedData.inSchool === 'yes' ? 'Yes' : 'No'}
${truncatedData.inSchool === 'yes' ? `- Schedule: ${truncatedData.schoolCommitment || 'Self-paced, no fixed schedule'}` : ''}

FAMILY & PERSONAL:
- Has family commitments: ${truncatedData.hasFamilyCommitments === 'yes' ? 'Yes' : 'No'}
${truncatedData.hasFamilyCommitments === 'yes' ? `- Details: ${truncatedData.familyCommitments || 'General family time'}` : ''}
- Recurring appointments: ${truncatedData.recurringAppointments || 'None'}

COMMUTE:
- Type: ${truncatedData.commuteType || 'Not specified'}
${truncatedData.commuteType === 'one-way' ? `- One-way duration: ${truncatedData.commuteTime || 0}h (${(parseFloat(truncatedData.commuteTime || '0') * 2).toFixed(2)}h total daily)` : ''}
${truncatedData.commuteType === 'round-trip' ? `- Total daily commute: ${truncatedData.commuteTime || 0}h` : ''}
${truncatedData.commuteType === 'none' ? '- No commute (remote/online)' : ''}
${truncatedData.commuteType && truncatedData.commuteType !== 'none' ? '- CRITICAL: Schedule commute to END before work starts and START when work ends' : ''}

ENERGY:
- Type: ${truncatedData.energyType}
- Peak times: ${truncatedData.peakProductivity?.join(', ') || 'Not specified'}
- Low energy: ${truncatedData.energyDips?.join(', ') || 'Not specified'}
- Sleep: ${truncatedData.sleepSchedule}
${truncatedData.hasExerciseRoutine === 'yes' ? `- Exercise: ${truncatedData.exerciseHours || 0}h/week, preferred time: ${truncatedData.exercisePreferredTime || 'flexible'}` : ''}

GOALS:
- Building: ${truncatedData.businessType}
- Target hours: ${truncatedData.weeklyHoursWanted || 'Not specified'}
- Realistic: ${truncatedData.weeklyHoursRealistic || 'Not specified'}
- Non-negotiables: ${truncatedData.nonNegotiableBlocks || 'None'}
- Specific activities: ${truncatedData.specificActivities || 'Not specified'}
${truncatedData.downtimeHours ? `- Desired relaxation time: ${truncatedData.downtimeHours}h/week for entertainment, hobbies, TV, gaming, reading` : ''}

CONSTRAINTS:
- Preferred environment: ${truncatedData.preferredEnvironment || 'Not specified'}
- Scheduling style: ${truncatedData.schedulingStyle || 'Not specified'}

Create a balanced weekly schedule in JSON format that:
1. Respects all commitments and constraints
2. Schedules ${truncatedData.weeklyHoursRealistic || truncatedData.weeklyHoursWanted || 0}h for business/side income
${truncatedData.hasExerciseRoutine === 'yes' ? `3. Includes ${truncatedData.exerciseHours || 0}h of exercise during ${truncatedData.exercisePreferredTime || 'flexible'} times` : '3. Includes physical activity'}
${truncatedData.downtimeHours ? `4. Protects ${truncatedData.downtimeHours}h for relaxation and entertainment` : '4. Includes adequate rest'}
5. Aligns with energy patterns and peak productivity times`;

    // Get AI model based on user subscription (OpenAI only for text)
    const modelConfig = await getModelForUser(supabase, userId, 'text');
    validateProvider('text', modelConfig.model);

    // Check for empty or trivially short user input
    if (!userPrompt || userPrompt.trim().length < 20) {
      console.warn('⚠️ User prompt seems too short or empty. Length:', userPrompt?.length);
    }

    // Pre-call diagnostics
    console.log('=== PRE-CALL DEBUG ===');
    console.log('ModelConfig:', { 
      provider: modelConfig.provider, 
      model: modelConfig.model, 
      endpoint: modelConfig.endpoint 
    });
    console.log('System prompt length:', systemPrompt.length);
    console.log('User prompt length:', userPrompt.length);
    console.log('Combined prompt length:', systemPrompt.length + userPrompt.length);
    console.log('System prompt preview:', systemPrompt.slice(0, 300));
    console.log('User prompt preview:', userPrompt.slice(0, 300));

    let response;
    
    // Call GPT-5 Mini (faster, optimized for structured JSON generation)
    try {
      response = await fetchWithTimeout(
        modelConfig.endpoint,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${modelConfig.apiKey}`,
            "Content-Type": "application/json",
          },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',  // Bypass OpenAI routing, faster JSON generation
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              max_completion_tokens: 5500,  // Increased for richer 5-6 activities/day
              response_format: { type: "json_object" }
            }),
        },
        120000 // 2 minute timeout - plenty for GPT-4o
      );
    } catch (error) {
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: error instanceof AIError ? error.message : 'AI request failed',
        requestDurationMs: Date.now() - startTime
      });
      
      return handleAIError(error, corsHeaders, {
        endpoint: 'generate-schedule',
        userId,
        startTime
      });
    }

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

    // Check for empty response body
    const contentLength = response.headers.get('Content-Length');
    if (contentLength && parseInt(contentLength) === 0) {
      console.error('=== EMPTY RESPONSE BODY ===');
      console.error('Status:', response.status);
      console.error('Headers:', Object.fromEntries(response.headers.entries()));
      
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: "AI returned 200 but with empty body",
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: "AI service returned an empty response. This may indicate rate limiting or service issues. This action did not use credits. Please wait a moment and try again." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();

    // Comprehensive post-call diagnostics
    console.log('=== FULL AI RESPONSE DEBUG ===');
    console.log('Status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    try {
      const aiDataStr = JSON.stringify(aiData);
      console.log('aiData length:', aiDataStr.length);
      console.log('aiData (first 4000 chars):', aiDataStr.slice(0, 4000));
    } catch (_e) {
      console.log('aiData: [unserializable]');
    }
    
    console.log('Choices array present:', !!aiData.choices);
    console.log('Choices length:', aiData.choices?.length);
    
    try {
      const firstChoiceStr = JSON.stringify(aiData.choices?.[0] || {});
      console.log('First choice object (trimmed):', firstChoiceStr.slice(0, 1000));
    } catch (_e) {
      console.log('First choice: [unserializable]');
    }
    
    console.log('Model used:', aiData.model);
    
    // Enhanced logging for debugging
    console.log('=== AI Response Structure ===');
    console.log('Has choices:', !!aiData.choices);
    console.log('Choices length:', aiData.choices?.length);
    console.log('First choice:', JSON.stringify(aiData.choices?.[0]?.message).substring(0, 200));

    // Validate choices array exists and has content
    if (!aiData.choices || !Array.isArray(aiData.choices) || aiData.choices.length === 0) {
      console.error('=== EMPTY CHOICES ARRAY ===');
      console.error('Full AI response:', JSON.stringify(aiData, null, 2));
      
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: "AI returned empty choices array",
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: "AI service returned an empty response. This may indicate rate limiting or quota issues. This action did not use credits. Please try again in a few moments." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content = aiData.choices[0]?.message?.content;
    const finishReason = aiData.choices[0]?.finish_reason;
    
    // Log content metadata
    console.log('Content present:', typeof content === 'string' && content.length > 0);
    console.log('Content length:', content?.length);
    console.log('Finish reason:', finishReason);
    
    // Empty content guard with detailed diagnostics
    if ((finishReason === 'stop' || !finishReason) && (!content || content.length === 0)) {
      console.error('=== EMPTY CONTENT WITH STOP/NULL FINISH_REASON ===');
      try {
        const aiDataSnapshot = JSON.stringify(aiData);
        console.error('aiData snapshot (first 4000):', aiDataSnapshot.slice(0, 4000));
      } catch (_e) {
        console.error('aiData snapshot: [unserializable]');
      }
    }
    
    // Log the raw AI response for debugging
    console.log('=== AI Response Debug ===');
    console.log('Status:', response.status);
    console.log('Finish reason:', finishReason);
    console.log('Content Length:', content?.length);
    console.log('Content Preview:', content?.slice(0, 300));
    console.log('Content End:', content?.slice(-200));

    // Check if response was truncated due to token limits
    if (finishReason === 'length') {
      console.error('=== TOKEN LIMIT HIT ===');
      console.error('Response was cut off due to length');
      
      await logRequest(supabase, {
        userId,
        endpoint: "generate-schedule",
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: "AI hit token limit (finish_reason: length)",
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(JSON.stringify({ 
        ok: false, 
        message: "Your input was too detailed and exceeded our processing capacity. Please try providing shorter, more concise information in the form fields. This action did not use credits." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        message: "AI service returned an empty response. This may indicate rate limiting, service issues, or model capacity limits. This action did not use credits. Please wait a moment and try again." 
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
        sideBusinessHours: 0,
        personalTime: 0,
        recommendations: ['Please review your schedule and adjust as needed.']
      };
    } else {
      // Ensure sideBusinessHours and personalTime exist even if AI didn't provide them
      if (typeof scheduleData.summary.sideBusinessHours !== 'number') {
        scheduleData.summary.sideBusinessHours = 0;
      }
      if (typeof scheduleData.summary.personalTime !== 'number') {
        scheduleData.summary.personalTime = 0;
      }
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
