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
      p_tool_name: "contract-readiness",
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

    // Calculate scores based on form data
    const scores = calculateScores(formData);

    // Generate AI recommendations
    const recommendations = await generateRecommendations(formData, scores);

    console.log(`[generate-contract-readiness] Completed in ${Date.now() - startTime}ms for user ${user.id}`);

    return new Response(JSON.stringify({
      ...scores,
      recommendations
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-contract-readiness:", error);
    return new Response(JSON.stringify({ error: error.message || "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateScores(formData: any): { localScore: number; stateScore: number; federalScore: number; dodScore: number; overallScore: number } {
  let localScore = 0;
  let stateScore = 0;
  let federalScore = 0;
  let dodScore = 0;

  // Business Foundations (affects all scores)
  const businessFoundation = calculateBusinessFoundation(formData);
  
  // Local Government Score
  localScore = calculateLocalScore(formData, businessFoundation);
  
  // State Government Score
  stateScore = calculateStateScore(formData, businessFoundation);
  
  // Federal Government Score
  federalScore = calculateFederalScore(formData, businessFoundation);
  
  // DoD Score
  dodScore = calculateDoDScore(formData, businessFoundation);

  // Overall weighted average
  const overallScore = Math.round(
    (localScore * 0.2) + 
    (stateScore * 0.25) + 
    (federalScore * 0.35) + 
    (dodScore * 0.2)
  );

  return {
    localScore: Math.min(100, Math.max(0, localScore)),
    stateScore: Math.min(100, Math.max(0, stateScore)),
    federalScore: Math.min(100, Math.max(0, federalScore)),
    dodScore: Math.min(100, Math.max(0, dodScore)),
    overallScore: Math.min(100, Math.max(0, overallScore))
  };
}

function calculateBusinessFoundation(formData: any): number {
  let score = 0;
  
  if (formData.businessName) score += 5;
  if (formData.legalStructure) score += 10;
  if (formData.yearsInBusiness) {
    const years = formData.yearsInBusiness;
    if (years === "20+") score += 15;
    else if (years === "11-20") score += 12;
    else if (years === "6-10") score += 10;
    else if (years === "3-5") score += 7;
    else score += 3;
  }
  if (formData.employees) score += 5;
  if (formData.goodsServices) score += 10;
  if (formData.geographicArea?.length > 0) score += 5;
  if (formData.revenueRange) {
    const rev = formData.revenueRange;
    if (rev === "5m+") score += 15;
    else if (rev === "1m-5m") score += 12;
    else if (rev === "500k-1m") score += 10;
    else if (rev === "250k-500k") score += 7;
    else score += 3;
  }
  if (formData.insuranceTypes?.length > 0) {
    score += Math.min(15, formData.insuranceTypes.length * 3);
  }
  
  return score;
}

function calculateLocalScore(formData: any, businessFoundation: number): number {
  let score = businessFoundation * 0.3;
  
  if (formData.localVendorRegistered === "yes") score += 25;
  else if (formData.localVendorRegistered === "not-sure") score += 5;
  
  if (formData.knowsLocalPortals) score += 15;
  if (formData.knowsNIGPCodes) score += 15;
  if (formData.meetsLocalInsurance?.length > 0) {
    score += Math.min(15, formData.meetsLocalInsurance.length * 4);
  }
  if (formData.hasLocalGovExperience) score += 20;
  
  return Math.round(score);
}

function calculateStateScore(formData: any, businessFoundation: number): number {
  let score = businessFoundation * 0.3;
  
  if (formData.targetStates?.length > 0) score += 10;
  if (formData.hasStateVendorId) score += 20;
  if (formData.knowsStateBiddingPortal) score += 15;
  if (formData.stateCertifications?.length > 0) {
    score += Math.min(20, formData.stateCertifications.length * 5);
  }
  if (formData.knowsStateCodes) score += 10;
  if (formData.hasStateExperience) score += 20;
  
  return Math.round(score);
}

function calculateFederalScore(formData: any, businessFoundation: number): number {
  let score = businessFoundation * 0.25;
  
  if (formData.samRegistration === "yes") score += 25;
  else if (formData.samRegistration === "in-process") score += 10;
  
  if (formData.ueiNumber) score += 10;
  if (formData.cageCode) score += 10;
  if (formData.naicsCodes?.length > 0) {
    score += Math.min(15, formData.naicsCodes.length * 2);
  }
  if (formData.pscCodes) score += 5;
  if (formData.federalCertifications?.length > 0) {
    score += Math.min(15, formData.federalCertifications.length * 4);
  }
  if (formData.hasFederalExperience) score += 20;
  
  return Math.round(score);
}

function calculateDoDScore(formData: any, businessFoundation: number): number {
  let score = businessFoundation * 0.2;
  
  // Security clearances are crucial for DoD
  if (formData.securityClearance === "top-secret") score += 25;
  else if (formData.securityClearance === "secret") score += 20;
  else if (formData.securityClearance === "public-trust") score += 10;
  
  if (formData.interestedInDoD) score += 5;
  if (formData.willingSponsorClearance) score += 5;
  
  if (formData.understandsFCL === "yes") score += 15;
  else if (formData.understandsFCL === "somewhat") score += 7;
  
  if (formData.ownerMilitaryExp) score += 10;
  if (formData.employeeMilitaryBg?.length > 1) score += 10;
  
  if (formData.pursuingDefense) score += 5;
  
  if (formData.meetsCyberRequirements === "yes") score += 15;
  else if (formData.meetsCyberRequirements === "partially") score += 7;
  
  if (formData.hasDefenseWork) score += 15;
  
  return Math.round(score);
}

async function generateRecommendations(formData: any, scores: any): Promise<any[]> {
  const recommendations: any[] = [];

  // SAM.gov registration
  if (formData.samRegistration !== "yes") {
    recommendations.push({
      title: "Register on SAM.gov",
      priority: "high",
      description: "SAM.gov registration is required for all federal contracting. This is the first step for federal opportunities.",
      actionItems: [
        "Go to SAM.gov and create an account",
        "Gather required documentation (EIN, DUNS replacement UEI)",
        "Complete the registration process (can take 2-4 weeks)",
        "Set reminders for annual renewal"
      ]
    });
  }

  // NAICS codes
  if (!formData.naicsCodes || formData.naicsCodes.length === 0) {
    recommendations.push({
      title: "Identify Your NAICS Codes",
      priority: "high",
      description: "NAICS codes define what services you can bid on. Having the right codes is essential for finding opportunities.",
      actionItems: [
        "Review the NAICS code list at census.gov",
        "Identify codes that match your primary services",
        "Consider secondary codes for related services",
        "Register these codes in SAM.gov"
      ]
    });
  }

  // Small business certifications
  if (!formData.hasSmallBusinessCerts || formData.smallBusinessCerts?.length === 0) {
    recommendations.push({
      title: "Explore Small Business Certifications",
      priority: "medium",
      description: "Certifications like WOSB, SDVOSB, or 8(a) can give you access to set-aside contracts with less competition.",
      actionItems: [
        "Determine if you qualify for any socioeconomic programs",
        "Research certification requirements at SBA.gov",
        "Gather documentation for certification applications",
        "Consider hiring a consultant for complex certifications like 8(a)"
      ]
    });
  }

  // Local vendor registration
  if (formData.localVendorRegistered !== "yes") {
    recommendations.push({
      title: "Register as a Local Vendor",
      priority: "medium",
      description: "Local government contracts are often the best starting point for new government contractors.",
      actionItems: [
        "Visit your city and county procurement websites",
        "Complete vendor registration forms",
        "Identify local bid notification systems",
        "Network with local procurement officers"
      ]
    });
  }

  // Security clearances for DoD
  if (formData.interestedInDoD && formData.securityClearance === "none") {
    recommendations.push({
      title: "Plan for Security Clearances",
      priority: "medium",
      description: "Many DoD contracts require security clearances. Start planning early as the process takes 6-18 months.",
      actionItems: [
        "Understand the different clearance levels (Public Trust, Secret, Top Secret)",
        "Review Facility Clearance (FCL) requirements",
        "Identify key employees who may need clearances",
        "Consider partnering with cleared contractors initially"
      ]
    });
  }

  // Cybersecurity
  if (formData.pursuingDefense && formData.meetsCyberRequirements !== "yes") {
    recommendations.push({
      title: "Address Cybersecurity Requirements",
      priority: "high",
      description: "CMMC and other cybersecurity standards are mandatory for DoD contracts. Non-compliance is a disqualifier.",
      actionItems: [
        "Conduct a gap assessment against NIST 800-171",
        "Implement required security controls",
        "Consider engaging a CMMC Registered Practitioner",
        "Document your System Security Plan (SSP)"
      ]
    });
  }

  // Insurance
  if (!formData.insuranceTypes || formData.insuranceTypes.length < 3) {
    recommendations.push({
      title: "Review Insurance Coverage",
      priority: "medium",
      description: "Government contracts often require specific insurance types and minimum coverage amounts.",
      actionItems: [
        "Review typical government contract insurance requirements",
        "Ensure you have general liability, workers comp, and auto coverage",
        "Consider professional liability and cyber insurance",
        "Obtain bonding capacity for construction or large contracts"
      ]
    });
  }

  // Past performance
  if (!formData.hasFederalExperience && !formData.hasStateExperience && !formData.hasLocalGovExperience) {
    recommendations.push({
      title: "Build Past Performance",
      priority: "high",
      description: "Past performance is critical for winning government contracts. Start small and build your track record.",
      actionItems: [
        "Pursue subcontracting opportunities with prime contractors",
        "Bid on small purchase orders and micro-purchases",
        "Consider GSA Schedule contracts for recurring opportunities",
        "Document all government work for future proposals"
      ]
    });
  }

  return recommendations;
}
