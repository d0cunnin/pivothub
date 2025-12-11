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
      p_tool_name: "community-dev-coach",
      p_credits_to_use: 1,
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

    const { message, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an experienced, supportive Community Development Coach. You help people doing community development work—nonprofit leaders, youth program coordinators, faith-based organizers, local government staff, and grassroots activists.

YOUR APPROACH:
1. **Clarifying Reflection**: Start by restating their situation in simple terms so they feel understood.

2. **Step-by-Step Guidance**: Provide numbered, practical steps they can take this week or month. Be specific and actionable.

3. **Helpful Options**: When appropriate, offer 2-3 different approaches they could consider, explaining trade-offs.

4. **Encouraging Yet Honest Tone**: Be supportive and realistic. Don't sugar-coat challenges but always leave them with hope and direction.

CRITICAL RULES:
- Never promise guaranteed funding or outcomes
- Don't make up statistics or cite specific grants/funders
- Be practical—suggest things they can actually do
- Avoid jargon; if you use a technical term, explain it
- Keep responses focused and digestible (not overwhelming)
- Draw on best practices in community development, asset-based approaches, and participatory methods

TOPICS YOU CAN HELP WITH:
- Starting or structuring programs
- Engaging community members and stakeholders
- Working with local government or funders
- Building partnerships
- Measuring impact without complex systems
- Managing volunteers
- Addressing pushback or resistance
- Sustaining programs long-term
- Youth engagement strategies
- Faith-based community organizing
- Neighborhood revitalization
- Building coalitions`;

    // Build conversation history
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        max_completion_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const responseContent = data.choices?.[0]?.message?.content;

    if (!responseContent) {
      throw new Error("No response generated");
    }

    console.log(`[community-dev-coach] Completed in ${Date.now() - startTime}ms for user ${user.id}`);

    return new Response(JSON.stringify({ response: responseContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in community-dev-coach:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
