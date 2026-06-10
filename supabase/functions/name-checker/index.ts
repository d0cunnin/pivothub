import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { generateText, systemUser } from "../_shared/aiGenerate.ts";

// Validation schema with strict limits
const nameCheckerSchema = z.object({
  businessName: z.string()
    .min(2, "Name too short")
    .max(50, "Name too long - maximum 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_&'.]+$/, "Only letters, numbers, spaces, and basic punctuation allowed"),
  captchaToken: z.string().optional(),
});

// DNS query limits to prevent abuse
const MAX_DOMAIN_VARIANTS = 6;
const MAX_TLD_CHECKS = 5;
const MAX_DNS_QUERIES = 10;
const DNS_TIMEOUT_MS = 3000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let startTime = Date.now();
  let ip = 'unknown';
  let userId: string | null = null;

  try {
    // Apply security guard FIRST (before reading body)
    const guardResult = await guard(req, {
      endpoint: 'name-checker',
      cost: 2, // 2 credits per name check
      requireAuth: true,
      requireCaptcha: false,
      maxReqsPerMinute: 20
    });

    startTime = guardResult.startTime;
    ip = guardResult.ip;
    userId = guardResult.userId;

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
    ].slice(0, MAX_DOMAIN_VARIANTS); // Limit variations

    // Check domain availability for common TLDs (LIMITED)
    const tlds = ['.com', '.net', '.org', '.io', '.co'].slice(0, MAX_TLD_CHECKS);
    const domainChecks = [];
    let dnsQueryCount = 0;

    for (const variation of variations) {
      if (dnsQueryCount >= MAX_DNS_QUERIES) break;

      for (const tld of tlds) {
        if (dnsQueryCount >= MAX_DNS_QUERIES) break;

        const domain = variation + tld;
        try {
          dnsQueryCount++;

          // DNS lookup with timeout using Google's DNS API (more reliable than Deno.resolveDns)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('DNS timeout')), DNS_TIMEOUT_MS)
          );
          
          const dnsPromise = fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
            method: 'GET',
            headers: { 'Accept': 'application/dns-json' }
          }).then(res => res.json());

          const dnsData = await Promise.race([dnsPromise, timeoutPromise]) as any;
          
          domainChecks.push({
            domain,
            available: dnsData.Status !== 0 || !dnsData.Answer,
            price: '$12.99/year'
          });
        } catch (error) {
          // If DNS lookup fails or times out, assume available
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

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    console.log('[BOOT] Lovable AI key exists:', !!lovableApiKey);
    console.log('[BOOT] Key prefix:', lovableApiKey?.substring(0, 10));
    let similarNames = [];
    
    if (lovableApiKey) {
      try {
        const aiText = await generateText(
          lovableApiKey,
          systemUser(
            `PIVOTHUB MASTER PROMPT FRAMEWORK - BUSINESS NAME CHECKER

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
• Rebranding cost estimate if conflicts found`,
            `Conduct a comprehensive business name trademark conflict analysis for "${businessName}".

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
          ),
          { maxTokens: 1500 },
        );
        try {
          similarNames = JSON.parse(aiText);
        } catch (parseError) {
          similarNames = [];
        }
      } catch (err: any) {
        if (err?.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        if (err?.status === 402) {
          return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings → Cloud → Usage.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        console.error('[name-checker] Generation failed:', err?.message);
        // Non-fatal: similar-names analysis failed but the rest of the response is still valid
        similarNames = [];
      }
    }

    // Log successful request
    await logRequest(guardResult.supabase, {
      userId,
      endpoint: 'name-checker',
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      creditsCharged: 2,
      success: true,
      requestDurationMs: Date.now() - startTime
    });

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

  } catch (error: any) {
    console.error('Error checking name availability:', error);
    
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
