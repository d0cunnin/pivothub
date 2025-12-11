import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credits
    const { data: creditCheck } = await supabaseClient.rpc("check_and_increment_ai_usage", {
      p_user_id: user.id,
      p_tool_name: "stakeholder-plan",
      p_credits_to_use: 3,
    });

    if (!creditCheck?.can_use) {
      return new Response(JSON.stringify({ 
        error: "Insufficient credits",
        reason: creditCheck?.reason || "limit_exceeded"
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { formData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build stakeholder details string
    const stakeholderInfo = Object.entries(formData.stakeholderDetails || {})
      .map(([name, details]: [string, any]) => {
        return `
${name}:
- Why They Matter: ${details.whyMatter || "Not specified"}
- Influence Level: ${details.influenceLevel || "medium"}
- Impact Level: ${details.impactLevel || "medium"}
- Engagement Level: ${details.engagementLevel || "consult"}
- Preferred Channels: ${details.channels?.join(", ") || "Not specified"}`;
      })
      .join("\n");

    const systemPrompt = `You are an expert stakeholder engagement strategist for community development projects. Create a comprehensive, practical stakeholder engagement plan.

CRITICAL RULES:
- Generate 100% original content based ONLY on the user's specific inputs
- Be practical and action-oriented
- Create content they can actually use
- Use clear headings, bullet points, and short paragraphs
- Tailor talking points to each stakeholder's perspective

OUTPUT STRUCTURE (use markdown):

## Stakeholder Overview

Create a table with columns:
| Stakeholder Group | Influence | Impact | Engagement Level | Priority |

Explain the priority ranking briefly.

## Engagement Strategy by Stakeholder Group

For EACH stakeholder group they selected:

### [Stakeholder Name]
**Role & Importance**: Why this group matters to the project
**Engagement Approach**: How to engage them based on their engagement level (inform/consult/partner/co-lead)
**Key Messages**: 2-3 main points to communicate to this group
**Potential Concerns**: What they might worry about and how to address it
**Success Metrics**: How to know engagement is working

## Communication Plan

Create a structured plan:
| Stakeholder | Method | Frequency | Responsible Party | Key Dates |

## Sample Talking Points

For each major stakeholder group, provide:
- Opening statement
- 2-3 key points
- Call to action
- Anticipated questions and responses

## Outreach Timeline

Based on their timeframe, create a phased timeline:
- **Phase 1 (Month 1)**: Initial outreach priorities
- **Phase 2 (Months 2-3)**: Deepening engagement
- **Phase 3 (Ongoing)**: Sustained engagement activities

Include specific activities for each phase.`;

    const userPrompt = `Create a Stakeholder Engagement Plan for:

PROJECT: ${formData.projectName}

ENGAGEMENT GOALS:
${formData.engagementGoals}

TIMEFRAME: ${formData.timeframe || "Not specified"}

STAKEHOLDERS TO ENGAGE:
${stakeholderInfo}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_completion_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    console.log(`[generate-stakeholder-plan] Completed in ${Date.now() - startTime}ms for user ${user.id}`);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-stakeholder-plan:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
