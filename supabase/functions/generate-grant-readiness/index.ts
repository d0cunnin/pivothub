import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateText, systemUser } from "../_shared/aiGenerate.ts";

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
      p_tool_name: "grant-readiness",
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

    const systemPrompt = `You are an expert grant writing consultant and nonprofit advisor. Assess the organization's grant readiness and help prepare draft narrative sections for proposals.

CRITICAL RULES:
- Generate 100% original content based ONLY on the user's specific inputs
- Be honest about gaps and areas needing improvement
- Provide practical, actionable advice
- Use clear headings, bullet points, and short paragraphs
- Avoid jargon; explain technical terms simply

OUTPUT STRUCTURE (use markdown):

## Grant Readiness Snapshot

### Overall Readiness Level
Rate as: Early Stage / Building Capacity / Grant-Ready / Strong Candidate
Explain why based on their inputs.

### Strengths You Already Have
List 3-5 specific strengths based on their responses

### Gaps to Address Before Seeking Larger Funding
List specific gaps with brief explanations

---

## Draft Grant Narrative Sections

### Needs/Problem Statement
Write a compelling 2-3 paragraph needs statement using their problem description and any data they provided.

### Project Description
Write 2-3 paragraphs describing what they will do and how, based on their project info.

### Target Population Description
Write 1-2 paragraphs about who they serve.

### Outcomes & Evaluation Plan
Create a structured outcomes section with their desired outcomes and measurement approach.

### Budget Summary
Organize their budget info into standard grant budget categories.

---

## Action Checklist
Provide 5-10 specific next steps they should take before applying for grants, prioritized by importance.`;

    const userPrompt = `Assess grant readiness and create narrative drafts for:

ORGANIZATION BASICS:
- Name: ${formData.organizationName}
- Legal Status: ${formData.legalStatus}
- Years in Operation: ${formData.yearsInOperation || "Not specified"}

MISSION & VISION:
- Mission: ${formData.missionStatement}
- 3-5 Year Vision: ${formData.visionStatement || "Not specified"}

PROJECT INFO:
- Project Name: ${formData.projectName}
- Description: ${formData.projectDescription}
- Who It Serves: ${formData.whoItServes || "Not specified"}
- Geographic Area: ${formData.geographicArea || "Not specified"}

CAPACITY:
- Staff/Volunteer Capacity: ${formData.staffCapacity || "Not specified"}
- Past Programs/Experience: ${formData.pastPrograms || "None specified"}
- Systems in Place: ${formData.systemsInPlace?.join(", ") || "None specified"}

OUTCOMES:
- Desired Outcomes: ${formData.desiredOutcomes}
- Measurement Plan: ${formData.measurementPlan || "Not specified"}

BUDGET:
- Estimated Cost: ${formData.estimatedCost || "Not specified"}
- Existing Funding: ${formData.existingFunding || "None"}
- In-Kind Resources: ${formData.inKindResources || "None specified"}

SUPPORTING DATA:
${formData.supportingData || "No data provided"}`;

    const maxTokens = 5000;
    let content: string;
    try {
      content = await generateText(LOVABLE_API_KEY, systemUser(systemPrompt, userPrompt), { maxTokens });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings → Cloud → Usage.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[generate-grant-readiness] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[generate-grant-readiness] Completed in ${Date.now() - startTime}ms for user ${user.id}`);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-grant-readiness:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
