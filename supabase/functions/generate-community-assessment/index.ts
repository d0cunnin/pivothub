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
      p_tool_name: "community-assessment",
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

    const systemPrompt = `You are an expert community development researcher and planner. Create a comprehensive Community Assessment Summary that can be used for planning and funding applications.

CRITICAL RULES:
- Generate 100% original content based ONLY on the user's specific inputs
- Write in plain language that can be dropped into grant applications or presentations
- Be specific to their community - no generic statements
- Use clear headings, bullet points, and short paragraphs
- Balance challenges with assets and opportunities

OUTPUT STRUCTURE (use markdown):

## Community Profile
Provide a 2-3 paragraph overview of the community based on their inputs - location, type, who lives there, and general character.

## Priority Needs & Issues
For each challenge they identified:
- Describe the issue
- How it manifests day-to-day (based on their input)
- Who is most affected
- Why it matters

## Community Assets & Strengths
Organize their assets into categories:
- **Organizations & Institutions**: List and briefly describe
- **Cultural & Social Capital**: Traditions, informal networks
- **Physical Assets**: Spaces, facilities, infrastructure
- **Human Capital**: Leaders, skilled residents, volunteers

## Gaps in Services or Support
Based on their input about what's working and what's not, identify:
- Services that don't exist but are needed
- Services that exist but are insufficient
- Coordination gaps between existing efforts

## Opportunities for Impact
Suggest 3-5 specific opportunities where new programs or initiatives could make a difference, based on the intersection of needs and assets.

## Suggested Focus Areas for Programs/Projects
Recommend 2-3 priority focus areas with brief rationale for why they should be prioritized.`;

    const userPrompt = `Create a Community Assessment Summary for:

COMMUNITY BASICS:
- Name: ${formData.communityName}
- Type: ${formData.communityType}

WHO LIVES THERE:
- Focus Populations: ${formData.focusPopulations || "Not specified"}
- Demographics: ${formData.demographicInfo || "Not specified"}

KEY ISSUES:
- Challenges: ${formData.challenges?.join(", ") || "Not specified"}
- How They Show Up: ${formData.challengesDetails || "Not specified"}

ASSETS & STRENGTHS:
- Organizations/Leaders: ${formData.existingOrganizations || "Not specified"}
- Traditions/Culture: ${formData.traditionsAndCulture || "Not specified"}
- Physical Assets: ${formData.physicalAssets || "Not specified"}

EXISTING EFFORTS:
- Current Programs: ${formData.currentPrograms || "Not specified"}
- What's Working: ${formData.whatWorking || "Not specified"}
- Remaining Gaps: ${formData.remainingGaps || "Not specified"}

COMMUNITY VOICE:
- How Heard From Residents: ${formData.howHeard?.join(", ") || "Not specified"}
- Key Themes: ${formData.keyThemes || "Not specified"}`;

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
        max_completion_tokens: 4000,
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

    console.log(`[generate-community-assessment] Completed in ${Date.now() - startTime}ms for user ${user.id}`);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-community-assessment:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
