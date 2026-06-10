import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateJson, systemUser } from "../_shared/aiGenerate.ts";

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
      p_tool_name: "capability-statement",
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

    // Build the prompt
    const prompt = buildCapabilityPrompt(formData);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let result: any;
    try {
      result = await generateJson(LOVABLE_API_KEY, systemUser(SYSTEM_PROMPT, prompt), { maxTokens: 4000 });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: "AI service quota exceeded." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("[generate-capability-statement] Generation failed:", err?.message);
      return new Response(JSON.stringify({ error: "AI service is temporarily unavailable. Please try again in a moment." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[generate-capability-statement] Completed in ${Date.now() - startTime}ms for user ${user.id}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-capability-statement:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

const SYSTEM_PROMPT = `You are a government contracting expert creating Capability Statements. Generate professional, concise, government-ready content.

RULES:
- Use bullet points, not paragraphs
- All text must be 100% original based only on user input
- No sample text, templates, or generic phrases
- Professional, keyword-rich, clear language
- Follow standard capability statement format

Return ONLY valid JSON with these exact keys:
{
  "companyData": "Formatted company info with codes and certifications as bullet points",
  "coreCompetencies": "3-7 keyword-driven capability bullets",
  "differentiators": "1-3 concise differentiator bullets",
  "pastPerformance": "Past performance or relevant experience summary"
}`;

function buildCapabilityPrompt(formData: any): string {
  const parts: string[] = [];

  parts.push("Generate a Capability Statement for:");
  parts.push(`\nCOMPANY: ${formData.businessName}`);
  
  if (formData.address) parts.push(`Address: ${formData.address}`);
  if (formData.website) parts.push(`Website: ${formData.website}`);
  if (formData.phone) parts.push(`Phone: ${formData.phone}`);
  if (formData.email) parts.push(`Email: ${formData.email}`);
  
  if (formData.pocName) {
    parts.push(`\nPOC: ${formData.pocName}${formData.pocTitle ? `, ${formData.pocTitle}` : ""}`);
    if (formData.pocPhone) parts.push(`POC Phone: ${formData.pocPhone}`);
    if (formData.pocEmail) parts.push(`POC Email: ${formData.pocEmail}`);
  }

  parts.push("\nCODES:");
  if (formData.uei) parts.push(`UEI: ${formData.uei}`);
  if (formData.cageCode) parts.push(`CAGE: ${formData.cageCode}`);
  const naicsCodes = formData.naicsCodesInput 
    ? formData.naicsCodesInput.split(',').map((c: string) => c.trim()).filter((c: string) => c.length > 0)
    : [];
  if (naicsCodes.length > 0) {
    parts.push(`NAICS: ${naicsCodes.join(", ")}`);
    if (formData.primaryNaics) parts.push(`Primary NAICS: ${formData.primaryNaics}`);
  }
  if (formData.pscCodes) parts.push(`PSC/FSC: ${formData.pscCodes}`);
  if (formData.nigpCodes) parts.push(`NIGP: ${formData.nigpCodes}`);

  if (formData.certifications?.length > 0) {
    parts.push(`\nCERTIFICATIONS: ${formData.certifications.join(", ")}`);
  }
  if (formData.contractVehicles) {
    parts.push(`CONTRACT VEHICLES: ${formData.contractVehicles}`);
  }
  if (formData.acceptsGovCard) {
    parts.push("Accepts Government Purchase Cards: Yes");
  }

  parts.push("\nSERVICES/PRODUCTS:");
  parts.push(formData.servicesProducts || "Not provided");
  
  if (formData.competencyBullets) {
    parts.push(`\nADDITIONAL CAPABILITIES: ${formData.competencyBullets}`);
  }
  if (formData.targetAgency) {
    parts.push(`TARGET AGENCY: ${formData.targetAgency}`);
  }

  parts.push("\nDIFFERENTIATORS:");
  if (formData.differentiator1) parts.push(`1. ${formData.differentiator1}`);
  if (formData.differentiator2) parts.push(`2. ${formData.differentiator2}`);
  if (formData.differentiator3) parts.push(`3. ${formData.differentiator3}`);
  if (formData.measurableStrengths) parts.push(`Measurable Strengths: ${formData.measurableStrengths}`);
  if (formData.uniqueProcesses) parts.push(`Unique Processes/Tools: ${formData.uniqueProcesses}`);
  if (formData.credentials) parts.push(`Credentials/Training: ${formData.credentials}`);

  if (formData.hasPastPerformance && formData.references?.length > 0) {
    parts.push("\nPAST PERFORMANCE:");
    formData.references.forEach((ref: any, i: number) => {
      if (ref.customerName && ref.projectTitle) {
        parts.push(`\nReference ${i + 1}:`);
        parts.push(`Customer: ${ref.customerName}`);
        parts.push(`Project: ${ref.projectTitle}`);
        if (ref.description) parts.push(`Description: ${ref.description}`);
        if (ref.value) parts.push(`Value: ${ref.value}`);
        if (ref.contractNumber) parts.push(`Contract #: ${ref.contractNumber}`);
      }
    });
  } else if (formData.relevantExperience) {
    parts.push("\nRELEVANT EXPERIENCE:");
    parts.push(formData.relevantExperience);
  }

  return parts.join("\n");
}

