import { withCreditRequest } from '../_shared/guard.ts';
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders, deductCreditsOnSuccess } from "../_shared/guard.ts";
import { generateText, systemUser } from "../_shared/aiGenerate.ts";
import {
  normalizeBusinessName, normalizeDomain, buildDomainLabels, normalizeHandle,
  interpretDnsResult, SOCIAL_PLATFORMS,
} from "../_shared/nameNormalization.ts";

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

serve(withCreditRequest(async (req) => {
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
    
    const normalized = normalizeBusinessName(validation.data.businessName);
    const businessName = normalized.display;
    const comparisonName = normalized.comparison;
    const variations = buildDomainLabels(normalized.slug).slice(0, MAX_DOMAIN_VARIANTS);

    const tlds = ['.com', '.net', '.org', '.io', '.co'].slice(0, MAX_TLD_CHECKS);
    const domainChecks: { domain: string; status: string; available: boolean | null }[] = [];
    let dnsQueryCount = 0;

    for (const variation of variations) {
      if (dnsQueryCount >= MAX_DNS_QUERIES) break;
      for (const tld of tlds) {
        if (dnsQueryCount >= MAX_DNS_QUERIES) break;
        const domain = normalizeDomain(variation + tld);
        if (!domain) continue;
        dnsQueryCount++;
        let dnsData: any = null;
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('DNS timeout')), DNS_TIMEOUT_MS)
          );
          const dnsPromise = fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`, {
            headers: { 'Accept': 'application/dns-json' }
          }).then(res => res.json());
          dnsData = await Promise.race([dnsPromise, timeoutPromise]);
        } catch {
          dnsData = null; // failed lookup stays unverified, never "available"
        }
        const status = interpretDnsResult(dnsData);
        domainChecks.push({ domain, status, available: status === 'taken' ? false : null });
      }
    }

    // Social platforms block automated profile lookups, so handles are returned
    // as platform-valid suggestions for manual checking, not availability claims.
    const socialChecks = Object.entries(SOCIAL_PLATFORMS).map(([platform, cfg]) => {
      const handle = normalizeHandle(businessName, platform);
      return {
        platform,
        handle,
        status: handle ? 'unverified' : 'invalid',
        available: null,
        url: handle ? cfg.url + handle : null,
      };
    });

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    let similarNames: any[] = [];
    let aiAnalysisSucceeded = false;
    
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
            `Conduct a preliminary business name conflict analysis for "${businessName}" (case-insensitive comparison value: "${comparisonName}").

CASE RULE: Capitalization does not make names different. "${comparisonName}", its uppercase form, and any mixed-case form are the SAME name. Compare on spelling, sound, wording and commercial context only.

EVIDENCE RULE: You have no live access to USPTO or state databases. Only list well-known, real businesses or marks you are confident exist. Never invent registrations, businesses, or search results. Describe risks as possible, not definite. If you are not confident of any conflicts, return [].

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
          const cleaned = aiText.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
          const parsed = JSON.parse(cleaned);
          if (!Array.isArray(parsed)) throw new Error('not an array');
          similarNames = parsed.slice(0, 12);
          aiAnalysisSucceeded = true;
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
      creditsCharged: aiAnalysisSucceeded ? 2 : 0,
      success: true,
      requestDurationMs: Date.now() - startTime
    });

    // Charge only when the AI trademark analysis actually succeeded.
    if (aiAnalysisSucceeded) {
      await deductCreditsOnSuccess(guardResult.supabase, userId!, 'name-checker', 2);
    }

    return new Response(
      JSON.stringify({
        businessName,
        comparisonName,
        domains: domainChecks.slice(0, 15),
        socialMedia: socialChecks,
        similarBusinesses: similarNames,
        aiAnalysisSucceeded,
        summary: {
          domainsTaken: domainChecks.filter(d => d.status === 'taken').length,
          domainsNoRecords: domainChecks.filter(d => d.status === 'no_records').length,
          domainsTotal: domainChecks.length,
          socialTotal: socialChecks.length,
          riskLevel: !aiAnalysisSucceeded ? 'Unknown' : similarNames.length > 5 ? 'High' : similarNames.length > 2 ? 'Medium' : 'Low'
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
}));
