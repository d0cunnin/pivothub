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
      p_tool_name: "program-design",
      p_credits_to_use: 4,
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

    const systemPrompt = `You are an expert community development program designer. Create a comprehensive, funder-ready Program Design Summary based on the user's inputs.

CRITICAL RULES:
- Generate 100% original content based ONLY on the user's specific inputs
- Never use generic filler or sample text
- Be practical and action-oriented
- Use clear headings, bullet points, and short paragraphs
- Avoid jargon; explain technical terms simply
- Make all content specific to their community and program

OUTPUT STRUCTURE (use markdown):
## Program Overview
Brief summary of the program

## Problem/Need Statement
Based on their problem description, who is affected, and why it matters now

## Target Population Description
Based on their age groups, demographics, and specific groups

## Program Goals & SMART Outcomes
Transform their outcomes into SMART format (Specific, Measurable, Achievable, Relevant, Time-bound)

## Core Activities & Delivery Model
Based on their activities, frequency, and delivery mode

## Timeline & Phases
Create phases: Planning → Launch → Implementation → Evaluation
Based on their start date and program length

## Roles & Partnerships
Based on their staff/volunteers, facilities, and partners

## Basic Budget Framework
If budget info provided, organize into categories with rough estimates

## Sustainability & Growth Ideas
Suggest 3-5 practical ways to sustain and grow the program

## Pitch Paragraph
A compelling 3-4 sentence paragraph they can paste into proposals or websites`;

    const userPrompt = `Create a Program Design Summary for:

BASIC INFO:
- Program Name: ${formData.programName}
- Organization: ${formData.organizationName || "Independent initiative"}
- Location: ${formData.cityRegion}

PROBLEM & NEED:
- Problem: ${formData.problem}
- Who's Affected: ${formData.whoAffected}
- Why Now: ${formData.whyImportant || "Not specified"}

TARGET POPULATION:
- Age Groups: ${formData.ageGroups?.join(", ") || "Not specified"}
- Demographics: ${formData.demographics || "Not specified"}
- Specific Groups: ${formData.specificGroups || "Not specified"}

VISION & OUTCOMES:
- Long-term Vision: ${formData.longTermVision}
- Measurable Outcomes: ${formData.outcomes}

ACTIVITIES:
- Main Activities: ${formData.mainActivities}
- Frequency: ${formData.frequency || "Not specified"}
- Delivery Mode: ${formData.deliveryMode || "Not specified"}

RESOURCES:
- Staff/Volunteers: ${formData.existingStaff || "Not specified"}
- Facilities: ${formData.facilities || "Not specified"}
- Partners: ${formData.keyPartners || "Not specified"}

TIMELINE:
- Start Date: ${formData.startDate || "Not specified"}
- Program Length: ${formData.programLength || "Not specified"}

BUDGET:
- Cost Categories: ${formData.budgetCategories || "Not specified"}
- Funding Sources: ${formData.fundingSources || "Not specified"}`;

    let content: string;
    try {
      content = await generateText(LOVABLE_API_KEY, systemUser(systemPrompt, userPrompt), { maxTokens: 6000 });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings → Cloud → Usage.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[generate-program-design] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`[generate-program-design] Completed in ${Date.now() - startTime}ms for user ${user.id}`);

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-program-design:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
