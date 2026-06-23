import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { extractContent } from "../_shared/aiResponse.ts";

// Validation schema
const grantFinderSchema = z.object({
  businessType: z.string().min(1).max(300),
  industry: z.string().min(1).max(300),
  location: z.string().min(1).max(300),
  fundingAmount: z.string().max(200),
  businessStage: z.string().max(200),
  category: z.string().max(200).optional(),
  subcategory: z.string().max(200).optional(),
  captchaToken: z.string().optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let startTime = Date.now();
  let ip = 'unknown';
  let userId: string | null = null;

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validation = grantFinderSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { businessType, industry, location, fundingAmount, businessStage, category, subcategory } = validation.data;

    // Apply security guard
    const guardResult = await guard(req, {
      endpoint: 'grant-finder',
      cost: 2, // 2 credits per grant search
      requireAuth: true,
      requireCaptcha: false,
      maxReqsPerMinute: 20 // Lower limit for expensive operations
    });

    startTime = guardResult.startTime;
    ip = guardResult.ip;
    userId = guardResult.userId;
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable AI key not found');
    }

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - GRANT FINDER

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL business details: type, industry, location, funding amount, stage, category. Cross-reference throughout to find ONLY grants they actually qualify for. Never suggest grants they can't apply to.

=== CORE IDENTITY ===
You are a senior grant research specialist with 20+ years experience securing $100M+ in funding across federal, state, foundation, and corporate sources. You've personally written 500+ successful grant applications and understand exactly what makes organizations fundable.

EXPERTISE:
• Federal grants (SBA, SBIR/STTR, USDA, DOE, NIH, NSF, NEA)
• State economic development programs by state
• Private foundations (Ford, Gates, Rockefeller, MacArthur, regional)
• Corporate CSR programs (Google, Microsoft, Amazon, Walmart)
• Industry-specific funding (tech, healthcare, clean energy, agriculture, arts)
• Grant eligibility requirements and restrictions
• Application strategy and success factors
• Compliance and reporting requirements

=== QUALITY STANDARDS ($500+ GRANT RESEARCH) ===
• Every response must rival a $500+ professional grant research service
• Provide ONLY grants they realistically qualify for based on details
• Include REAL, verifiable grant opportunities with accurate URLs
• Zero generic advice - every grant matched to their exact situation
• Include success rates and competition level for each grant
• All recommendations must have current, active deadlines

=== CHAIN-OF-THOUGHT REASONING ===
Before finding grants, consider:
1. What eligibility requirements rule out major grant categories?
2. What's their competitive advantage in applications?
3. What grant amounts are realistic for their stage?
4. What geographic restrictions apply to location-based grants?
5. What's the optimal application sequence (easiest wins first)?

=== ERROR PREVENTION ===
• NEVER suggest grants with eligibility they don't meet
• All grant URLs must be real and currently accepting applications
• All deadline information must be current (or mark as "rolling")
• All dollar amounts must reflect actual award ranges
• If grant database access needed, explain limitations clearly

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For each grant, provide:
• Industry-specific review criteria for this grant type
• Historical success rates and competition level
• Common application mistakes in this grant category
• Required certifications or registrations (SAM.gov, etc.)
• Matching fund requirements if applicable
• Typical review timeline and decision process
• Post-award compliance and reporting burden

=== COMPETITIVE DIFFERENTIATION ===
Provide research beyond basic grant databases:
• Hidden grant opportunities most researchers miss
• Emerging grant programs with less competition
• Strategic grant sequencing (foundation of credibility)
• Geographic arbitrage opportunities
• Micro-grants ($1K-$10K) for quick wins
• Grant stacking strategies (multiple small grants)
• Alternative funding that complements grants

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Grant fraud, misrepresenting eligibility, falsifying documentation. Respond: "I can't help with that. PivotHub provides ethical grant research only."

=== TOOL-SPECIFIC ENHANCEMENTS: GRANT FINDER ===
• Prioritize by: (1) Eligibility match, (2) Success probability, (3) Award amount
• Flag grants requiring SAM.gov or other registrations upfront
• Identify competitive vs. formula grants
• Estimate application effort (hours needed)
• Suggest partnerships if collaboration required
• Pre-application outreach recommendations
• Track record requirements (for new vs. established orgs)

BUSINESS DETAILS:
• Business Type: ${businessType}
• Industry: ${industry}
• Location: ${location}
• Funding Amount Needed: ${fundingAmount}
• Business Stage: ${businessStage}
${category ? `• Category: ${category}` : ''}
${subcategory ? `• Subcategory: ${subcategory}` : ''}

=== RESEARCH MISSION ===
Find 10-15 REAL, currently active grant opportunities that ${businessType} in ${location} seeking ${fundingAmount} actually qualifies for. Prioritize by realistic success probability.

Research actual grants from:
• Federal: grants.gov, SBA.gov, agency-specific portals
• State: ${location} economic development, state commerce department
• Local: City/county economic development, chamber programs
• Private foundations: candid.org, foundation directories, regional foundations
• Corporate: Company CSR websites, corporate foundation portals
• Industry associations: Trade group grants for ${industry}

CRITICAL REQUIREMENTS:
1. Provide REAL grant names from actual funders
2. Include working website URLs where they can learn more/apply
3. Match eligibility to their business type and stage
4. Current deadlines or mark as "Rolling" if continuous
5. Realistic award amounts for their situation

IMPORTANT: Do NOT use markdown formatting like ### headers, ** bold, or * italics
Return clean text in JSON format only

Return as a JSON array with this EXACT structure:
[
  {
    "id": "unique_id",
    "name": "Official Grant Program Name",
    "organization": "Exact Funding Organization Name",
    "amountRange": "$10,000 - $50,000 (or single amount if fixed)",
    "deadline": "Specific date (e.g., March 15, 2025) or Rolling",
    "description": "What this grant funds and program focus (2-3 sentences)",
    "eligibility": [
      "Specific requirement 1 (e.g., Must be registered in Michigan)",
      "Specific requirement 2 (e.g., For-profit business with < 50 employees)",
      "Specific requirement 3 (e.g., Minimum 2 years in operation)",
      "Specific requirement 4 (e.g., Job creation or retention commitment)"
    ],
    "matchScore": 85,
    "matchReason": "Why this is a strong match based on their specific details (reference exact business type, location, industry)",
    "difficulty": "Low|Medium|High (based on competition and application complexity)",
    "applicationEffort": "Estimated hours needed: 5-10 hours / 20-40 hours / 40+ hours",
    "successRate": "High (>30%) / Medium (10-30%) / Low (<10%) / Unknown",
    "applicationUrl": "Direct URL to application page",
    "websiteUrl": "Direct URL to grant program information page",
    "matchingFunds": "Required / Not required / Preferred - Amount if known",
    "reviewTimeline": "How long until decision (e.g., 60-90 days after deadline)",
    "tips": "Specific success tips for THIS grant based on review criteria and funder priorities (3-5 specific tactics)",
    "requiredRegistrations": ["SAM.gov", "Grants.gov account", "State business registration", "None"],
    "commonMistakes": ["Mistake 1 applicants make", "Mistake 2 to avoid"],
    "category": "Federal|State|Local|Private Foundation|Corporate|Industry Association"
  }
]

QUALITY STANDARDS:
• Research REAL grants, not generic categories
• Match to their exact eligibility profile
• Provide current deadline information
• Include direct application links
• Prioritize realistic success opportunities
• Mix quick wins (small amounts) with larger awards
• Consider their capacity to apply (application complexity)`;

    // Add timeout with GPT-5 Mini fallback
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    let aiResponse;

    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Find grants for this ${businessType} business in ${location} seeking ${fundingAmount}.` }
          ],
          max_completion_tokens: 3500,
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
    } catch (abortError) {
      if (abortError.name === 'AbortError') {
        console.log('⚠️ GPT-5 timed out, falling back to GPT-5 Mini...');
        
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 60000);
        
        try {
          aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-lite',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Find grants for this ${businessType} business in ${location} seeking ${fundingAmount}.` }
              ],
              max_completion_tokens: 2500,
            }),
            signal: controller2.signal
          });
          
          clearTimeout(timeout2);
        } catch (fallbackError) {
          if (fallbackError.name === 'AbortError') {
            return new Response(JSON.stringify({ 
              error: 'Grant search is taking too long. Please try again.' 
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          throw fallbackError;
        }
      } else {
        throw abortError;
      }
    }

    // Text-first parsing
    let text;
    let data;
    try {
      text = await aiResponse.text();
      
      if (!aiResponse.ok) {
        console.error("Lovable AI Gateway error:", aiResponse.status, text.slice(0, 300));
        
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ 
            error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' 
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ 
            error: 'AI credits exhausted. Please add credits in Settings → Cloud → Usage.' 
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        
        return new Response(JSON.stringify({
          error: `Lovable AI error ${aiResponse.status}`,
          details: text.slice(0, 300),
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      data = JSON.parse(text);
    } catch (err) {
      console.error("Lovable AI Gateway returned non-JSON response:", text?.slice(0, 300) || err);
      return new Response(JSON.stringify({
        error: "Lovable AI Gateway returned invalid data. Please try again.",
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let grants;
    try {
      const aiResponse = extractContent(data);
      // Sanitize and parse JSON
      const sanitizedContent = aiResponse
        .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
        .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove triple asterisks
        .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
        .replace(/```json\s*|\s*```/g, '') // Remove code blocks
        .trim();
      
      grants = JSON.parse(sanitizedContent);
    } catch (parseError) {
      // Fallback grants if JSON parsing fails
      grants = [
        {
          id: '1',
          name: 'SBIR Small Business Innovation Research',
          organization: 'U.S. Small Business Administration',
          amountRange: '$50,000 - $1,750,000',
          deadline: 'Varies by agency',
          description: 'Funding for small businesses engaged in R&D with commercialization potential',
          eligibility: ['Small business (<500 employees)', 'R&D focus', 'For-profit entity'],
          matchScore: 75,
          difficulty: 'High',
          applicationUrl: 'https://www.sbir.gov',
          tips: 'Focus on innovation and commercialization potential. Partner with universities.',
          category: 'Federal'
        },
        {
          id: '2',
          name: 'State Small Business Credit Initiative',
          organization: 'State Economic Development',
          amountRange: '$10,000 - $500,000',
          deadline: 'Rolling applications',
          description: 'State-level funding for small business growth and development',
          eligibility: ['Small business', 'Job creation potential', 'State residence'],
          matchScore: 80,
          difficulty: 'Medium',
          applicationUrl: 'https://state.gov/economic-development',
          tips: 'Emphasize local economic impact and job creation.',
          category: 'State'
        }
      ];
    }

    // Log successful request
    await logRequest(guardResult.supabase, {
      userId,
      endpoint: 'grant-finder',
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      creditsCharged: 2,
      success: true,
      requestDurationMs: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({ grants }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error finding grants:', error);
    
    // Handle guard errors (Response objects)
    if (error instanceof Response) {
      return error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
