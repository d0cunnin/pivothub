import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const nameCheckerSchema = z.object({
  businessName: z.string().min(1).max(300)
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const validation = nameCheckerSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { businessName } = validation.data;

    // Clean up the business name for domain checking
    const cleanName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const variations = [
      cleanName,
      cleanName + 'co',
      cleanName + 'inc',
      cleanName + 'llc',
      cleanName + 'app',
      cleanName + 'online'
    ];

    // Check domain availability for common TLDs
    const tlds = ['.com', '.net', '.org', '.io', '.co'];
    const domainChecks = [];

    for (const variation of variations) {
      for (const tld of tlds) {
        const domain = variation + tld;
        try {
          // Simple DNS lookup to check if domain exists
          const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
            method: 'GET',
            headers: { 'Accept': 'application/dns-json' }
          });
          const dnsData = await response.json();
          
          domainChecks.push({
            domain,
            available: dnsData.Status !== 0 || !dnsData.Answer,
            price: '$12.99/year' // Approximate pricing
          });
        } catch (error) {
          // If DNS lookup fails, assume available (cautious approach)
          domainChecks.push({
            domain,
            available: true,
            price: '$12.99/year'
          });
        }
      }
    }

    // Check social media handles (simulated - real implementation would use APIs)
    const socialPlatforms = [
      { name: 'Instagram', baseUrl: 'https://instagram.com/' },
      { name: 'Twitter', baseUrl: 'https://twitter.com/' },
      { name: 'Facebook', baseUrl: 'https://facebook.com/' },
      { name: 'LinkedIn', baseUrl: 'https://linkedin.com/company/' },
      { name: 'YouTube', baseUrl: 'https://youtube.com/c/' },
      { name: 'TikTok', baseUrl: 'https://tiktok.com/@' }
    ];

    const socialChecks = [];
    for (const platform of socialPlatforms) {
      const handles = [cleanName, businessName.toLowerCase().replace(/\s+/g, ''), businessName.toLowerCase().replace(/\s+/g, '_')];
      
      for (const handle of handles) {
        try {
          // Simple HTTP check to see if profile exists
          const response = await fetch(platform.baseUrl + handle, {
            method: 'HEAD',
            redirect: 'manual'
          });
          
          socialChecks.push({
            platform: platform.name,
            handle,
            available: response.status === 404,
            url: platform.baseUrl + handle
          });
          break; // Only check first available handle per platform
        } catch (error) {
          socialChecks.push({
            platform: platform.name,
            handle,
            available: true, // Assume available on error
            url: platform.baseUrl + handle
          });
          break;
        }
      }
    }

    // Business name similarity check using OpenAI
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    let similarNames = [];
    
    if (openAIApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-5-2025-08-07',
            messages: [
              { 
                role: 'system', 
                content: `PIVOTHUB MASTER PROMPT FRAMEWORK - BUSINESS NAME CHECKER

=== CONTEXT RETENTION PROTOCOL ===
Remember the exact business name provided. Analyze thoroughly for all types of conflicts: exact matches, phonetic similarities, semantic overlaps, and translation equivalents. Consider industry context and trademark law.

=== CORE IDENTITY ===
You are a senior trademark attorney and brand strategist with 20+ years conducting name clearance searches for Fortune 500 companies and startups. You've successfully registered 1,000+ trademarks and prevented costly infringement cases. You understand USPTO database, common law trademarks, and international naming conflicts.

EXPERTISE:
• Federal trademark search (USPTO TESS database patterns)
• State trademark and business name registrations
• Common law trademark identification
• Phonetic similarity assessment (sound-alike analysis)
• Semantic conflict detection (meaning-based conflicts)
• Foreign language translation conflicts
• Industry-specific naming conventions
• Brand positioning and differentiation strategy

=== QUALITY STANDARDS ($300+ TRADEMARK SEARCH) ===
• Every response must rival a $300+ professional trademark clearance search
• Identify ALL significant conflict risks, not just obvious ones
• Provide specific business names with real risk assessment
• Explain legal reasoning for each risk level
• Include both registered and common law trademark conflicts
• All recommendations must prevent costly legal issues

=== CHAIN-OF-THOUGHT REASONING ===
Before analyzing, consider:
1. What are exact matches in USPTO and state databases?
2. What sound-alike names could cause confusion?
3. What famous brands operate in similar semantic space?
4. Are there foreign language translations that conflict?
5. What industry-specific conflicts exist?

=== ERROR PREVENTION ===
• NEVER invent fake business names or trademarks
• All conflicts must be realistic and researched
• All risk assessments must follow trademark law principles
• All similarity types must be legally accurate
• If real-time database access unavailable, note limitations

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For name conflicts, provide:
• Industry where conflict exists and overlap risk
• Trademark class conflicts (if known)
• Geographic scope of existing trademark
• Commercial strength of existing brand
• Likelihood of confusion factors (legal test)
• Dilution risk if famous mark involved

=== COMPETITIVE DIFFERENTIATION ===
Provide analysis beyond basic name search:
• Common law trademark risks (unregistered but protected)
• Social media handle conflicts and brand consistency
• Domain name availability patterns
• SEO implications of name conflicts
• International expansion naming issues
• Misspelling and typosquatting vulnerabilities

=== TOOL-SPECIFIC ENHANCEMENTS ===
• Phonetic similarity algorithm (Soundex-style analysis)
• Semantic field mapping for related concepts
• Translation checks for major languages
• Famous marks doctrine application
• Genericness and descriptiveness assessment
• Rebranding cost estimate if conflicts found` 
              },
              { 
                role: 'user', 
                content: `Conduct a comprehensive business name trademark conflict analysis for "${businessName}".

SEARCH CATEGORIES:
1. EXACT MATCHES: Identical names in any industry or trademark class
2. PHONETIC CONFLICTS: Sound-alike names that could cause confusion (e.g., "Lyft" vs "Lift")
3. SEMANTIC CONFLICTS: Names with similar meaning or operate in related concept space
4. TRANSLATION CONFLICTS: Foreign language equivalents that could conflict
5. FAMOUS MARKS: Well-known brands in similar semantic territory (even different industries)

For each potential conflict, assess:
• Actual risk level based on trademark law likelihood of confusion factors
• Why it's a conflict (specific legal reasoning)
• Industry overlap and market confusion potential
• Recommended action (avoid, modify, acceptable risk)

Return up to 12 highest-risk conflicts as JSON array:
[
  {
    "name": "Existing Business or Trademark Name",
    "industry": "Specific industry and market segment",
    "similarity": "Exact|Phonetic|Semantic|Translation|Famous Mark",
    "risk": "High|Medium|Low",
    "reason": "Specific legal reasoning: Why this creates trademark conflict based on likelihood of confusion factors. Include market overlap, consumer confusion potential, and strength of existing mark.",
    "recommendation": "Avoid entirely|Modify spelling/styling|Acceptable risk with monitoring|Safe to proceed",
    "trademarkStatus": "Federally Registered|State Registered|Common Law|Famous Mark",
    "geographicScope": "National|State/Regional|International"
  }
]

QUALITY STANDARDS:
• Identify real potential conflicts based on trademark law
• Prioritize by actual legal risk (not just similarity)
• Explain legal reasoning clearly
• Consider industry context and market overlap
• Provide actionable recommendations
• Note if conflicts are registered trademarks vs. common law` 
              }
            ],
            max_completion_tokens: 1500,
          }),
        });

        const aiData = await response.json();
        if (response.ok) {
          try {
            similarNames = JSON.parse(aiData.choices[0].message.content);
          } catch (parseError) {
            similarNames = [];
          }
        }
      } catch (error) {
        console.error('Error checking similar names:', error);
      }
    }

    return new Response(
      JSON.stringify({
        businessName,
        domains: domainChecks.slice(0, 15), // Limit results
        socialMedia: socialChecks,
        similarBusinesses: similarNames,
        summary: {
          domainsAvailable: domainChecks.filter(d => d.available).length,
          domainsTotal: domainChecks.length,
          socialAvailable: socialChecks.filter(s => s.available).length,
          socialTotal: socialChecks.length,
          riskLevel: similarNames.length > 5 ? 'High' : similarNames.length > 2 ? 'Medium' : 'Low'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error checking name availability:', error);
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