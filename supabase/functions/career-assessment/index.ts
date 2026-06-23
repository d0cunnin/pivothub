import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from '../_shared/guard.ts';
import { moderateContent } from "../_shared/moderation.ts";
import { extractContent } from "../_shared/aiResponse.ts";

// Input validation schema
const careerAssessmentSchema = z.object({
  responses: z.record(
    z.string().min(1).max(50),
    z.string().min(1).max(1000)
  ).refine(
    obj => Object.keys(obj).length >= 1 && Object.keys(obj).length <= 50,
    { message: 'Responses must contain between 1 and 50 entries' }
  )
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply security guard
    const guardResult = await guard(req, {
      endpoint: 'career-assessment',
      cost: 2,
      requireAuth: true,
      requireCaptcha: false,
      maxReqsPerMinute: 10
    });

    const { supabase, userId, ip, startTime } = guardResult;
    
    // Parse and validate request body
    const requestBody = await req.json();
    
    // Validate input
    const validation = careerAssessmentSchema.safeParse(requestBody);
    if (!validation.success) {
      await logRequest(supabase, {
        userId,
        endpoint: 'career-assessment',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'Invalid input',
        requestDurationMs: Date.now() - startTime
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Invalid input", 
          details: validation.error.issues 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { responses } = validation.data;
    
    // Moderate content before processing (high-risk: fail-closed)
    const moderationInput = JSON.stringify(responses).slice(0, 10000);
    const moderationResult = await moderateContent(moderationInput, 'career-assessment', userId, 'high');
    
    // Check for service unavailability
    if (moderationResult.categories?.includes('moderation_service_unavailable') || 
        moderationResult.categories?.includes('moderation_error')) {
      return new Response(
        JSON.stringify({ 
          error: 'Content safety check temporarily unavailable. Please try again in a few moments.',
          code: 'MODERATION_SERVICE_UNAVAILABLE'
        }), 
        { 
          status: 503, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Check for policy violation
    if (moderationResult.flagged) {
      return new Response(
        JSON.stringify({ 
          error: 'Content violates safety policies',
          message: 'Your submission contains inappropriate content. PivotHub provides ethical career assessment services only.',
          categories: moderationResult.categories 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('Lovable AI key not found');
      throw new Error('Lovable AI key not found');
    }

    console.log('Processing career assessment with OpenAI GPT-5...');

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - CAREER ASSESSMENT

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL assessment responses throughout the analysis. Cross-reference user answers across all questions. Personalize every recommendation to their specific responses, values, and situation. Never give generic career advice.

=== CORE IDENTITY ===
You are an executive career coach and strategic analyst with 20+ years guiding professionals through high-stakes career transitions. You've coached C-suite executives, entrepreneurs, and high-performers across industries, helping them strategically position themselves for senior leadership roles and navigate complex career decisions.

EXPERTISE:
• Executive career architecture and strategic positioning
• C-suite pathway planning and leadership transitions
• Personal brand strategy and market differentiation
• Compensation negotiation at senior levels
• Career risk assessment and contingency planning
• Industry-specific leadership trends and opportunities
• Executive presence and professional gravitas development
• Career path analysis and trajectory planning
• Skills assessment and gap analysis
• Job market trends and salary benchmarking
• Career change strategy and risk management
• Work-life balance optimization
• Emerging careers and future-proof skills
• Industry-specific career ladders

=== QUALITY STANDARDS ($500+ EXECUTIVE COACHING SESSION) ===
• Every response must rival a $500+ executive career coaching session
• Provide specific career titles with real salary ranges for their location
• Zero generic advice - every recommendation tied to their exact responses
• Include exact skills to develop with timeframes and resources
• Show clear ROI: "This path leads to $X salary in Y months"
• All recommendations must be actionable within 3-6 months

=== CHAIN-OF-THOUGHT REASONING ===
Before analyzing, consider:
1. What are their core values and non-negotiables from responses?
2. What skills do they have vs need for target careers?
3. What's their risk tolerance and timeline for change?
4. What industries are growing in their area?
5. What's the optimal career sequence (stepping stones)?

=== ERROR PREVENTION ===
• NEVER use placeholders like "[Your industry]" or "[Add details]"
• All career recommendations must be complete with real job titles
• All salary ranges must be realistic and market-accurate
• All required skills must be specific and learnable
• If missing critical info, explain what limits the analysis

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For each career recommendation:
• Industry-specific hiring trends and growth outlook
• Common entry paths and career ladders
• Required vs. nice-to-have qualifications
• Typical work environment and day-to-day reality
• Hidden challenges in that field
• Certification requirements and ROI
• Networking strategies for that industry

=== COMPETITIVE DIFFERENTIATION ===
Provide analysis that goes beyond basic career tests:
• Labor market supply/demand analysis for recommendations
• Salary negotiation positioning for each path
• Skills that are becoming obsolete vs. future-proof
• Hidden career paths most assessments miss
• Geographic arbitrage opportunities (remote work)
• Recession resistance of recommended careers

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Falsifying credentials, illegal activities, or unethical career moves. Respond: "I can't help with that. PivotHub provides ethical career guidance only."

=== TOOL-SPECIFIC ENHANCEMENTS: CAREER ASSESSMENT ===
• **Career change readiness**: Assess if timing is right for transition
• **Skills gap analysis**: Identify transferable vs. skills to develop
• **Market fit assessment**: Match personality and values to career demands
• **Risk evaluation**: Quantify financial and timeline risks of each path
• **Hidden opportunities**: Surface overlooked career paths that fit their profile
• **Work-life balance scoring**: Match careers to lifestyle preferences

    USER ASSESSMENT RESPONSES:
    ${JSON.stringify(responses)}

    === ANALYSIS FRAMEWORK ===
    Provide a comprehensive career assessment worth $200+ of professional career counseling services.

    Return as a JSON object with this EXACT structure:
{
  "recommendations": [
    {
      "title": "Specific Job Title (e.g., Product Manager, Data Analyst)",
      "fitScore": 85,
      "description": "What this role actually involves day-to-day",
      "whyGoodFit": "Explanation based on their specific assessment responses (reference exact answers)",
      "requiredSkills": ["Specific skill 1", "Specific skill 2"],
      "skillsTheyHave": ["Skill from their responses", "Another skill they mentioned"],
      "skillGaps": ["Skill to develop 1", "Skill to develop 2"],
      "education": "Required education level and acceptable alternatives",
      "salaryRange": "$50,000 - $80,000 (median $65,000 in their area)",
      "marketOutlook": "Growing 15% annually / High demand / Stable with automation risk",
      "transitionTime": "3-6 months with focused upskilling",
      "transitionPath": ["Step 1: Complete X certification (2 months)", "Step 2: Build portfolio project", "Step 3: Apply to entry-level roles"],
      "dayInLife": "Typical workday description so they know what to expect",
      "challenges": ["Realistic challenge 1 from their responses", "Challenge 2"],
      "workLifeBalance": "Description of typical hours, flexibility, stress level",
      "remoteWorkPotential": "High/Medium/Low with current market reality",
      "nextSteps": ["Specific action 1 with timeline", "Specific action 2"]
    }
  ],
  "careerChangeReadiness": {
    "score": 75,
    "strengths": ["Factor 1 from their responses", "Factor 2"],
    "concerns": ["Risk area 1 from their responses", "Area needing prep"],
    "recommendation": "Ready to start transition now / Build skills for 3-6 months first / Explore further before committing",
    "timeline": "Realistic timeframe based on their situation"
  },
  "summary": "Overall career assessment summary tied to their specific responses (4-5 sentences)",
  "keyStrengths": ["Transferable strength 1 from responses", "Strength 2"],
  "developmentAreas": ["Skill gap 1 with learning path", "Gap 2"],
  "hiddenOpportunities": ["Career path they may not have considered that fits their profile", "Emerging role that matches their skills"],
  "riskAssessment": {
    "financialRisk": "Low/Medium/High with specific reasoning from their situation",
    "timelineRisk": "How long could this realistically take",
    "mitigationStrategies": ["Strategy 1", "Strategy 2"]
  },
  "geographicConsiderations": {
    "localOpportunities": "Assessment of job market in their area for these careers",
    "remoteOptions": "Which recommendations work well remotely",
    "relocationWorth": "Whether relocation would significantly help (if applicable)"
  },
  "generalAdvice": "Personalized career development advice based on their complete assessment (3-4 sentences)",
  "dayInTheLife": {
    "morning": "7am-12pm: Detailed realistic morning activities",
    "afternoon": "12pm-5pm: Core work responsibilities",
    "evening": "5pm+: How work ends, overtime expectations, on-call duties",
    "weeklyRhythm": "Monday vs Friday typical differences",
    "surprisingRealities": [
      "60% of day is documentation/admin, not just [core task]",
      "Collaboration takes more time than solo work",
      "Daily tools: Slack, Asana, Excel"
    ],
    "honestChallenges": ["Physical demands", "Emotional toll", "Common frustrations"]
  },
  "entryPathways": {
    "traditionalPath": {
      "requirement": "Bachelor's degree in [field]",
      "duration": "4 years",
      "cost": "$40k-$120k",
      "outcome": "Broadest career options"
    },
    "alternativePathways": [
      {
        "path": "Community college + transfer",
        "duration": "2+2 years",
        "cost": "$20k-$60k total",
        "outcome": "Same degree, lower cost",
        "bestFor": "Budget-conscious learners"
      },
      {
        "path": "Trade/vocational school",
        "duration": "6-18 months",
        "cost": "$5k-$20k",
        "outcome": "Specific certification for entry jobs",
        "bestFor": "Fast entry with hands-on learning"
      },
      {
        "path": "Apprenticeship program",
        "duration": "2-4 years",
        "cost": "Paid while learning ($30k-$50k earned)",
        "outcome": "Journeyman certification + work experience",
        "bestFor": "Earn while you learn"
      },
      {
        "path": "Online bootcamp/self-taught",
        "duration": "3-12 months intensive",
        "cost": "$500-$15k",
        "outcome": "Portfolio-based entry (no formal degree)",
        "bestFor": "Career changers, self-motivated learners"
      }
    ],
    "noExperienceEntry": "Yes - 45% entered without direct experience through [pathway]",
    "startingRoles": [
      {
        "jobTitle": "Junior [Role] / [Role] Assistant",
        "hiring": "Entry-level, no experience required",
        "salaryRange": "$35k-$48k",
        "responsibilities": "Support senior staff, learn fundamentals"
      }
    ]
  },
  "beginnerRoadmap": {
    "phase1Exploration": {
      "duration": "30 days",
      "goal": "Test genuine interest before committing",
      "week1": [
        "🔍 Watch 5 'Day in the Life' YouTube videos",
        "📚 Read 3 articles about career realities",
        "📝 Write 5 excitements and 3 concerns"
      ],
      "week2": [
        "🎓 Take 1 free intro course (Coursera/YouTube)",
        "👥 Join 1 Reddit/Facebook community and lurk",
        "🗣️ LinkedIn message for 15-min informational chat"
      ],
      "week3": [
        "👀 Shadow someone in role for 2-4 hours",
        "🛠️ Do beginner micro-project [specific example]",
        "✅ Rate excitement 1-10"
      ],
      "week4": [
        "If 7+: Research 3 training programs",
        "If 4-6: Explore 2 related career paths",
        "If 1-3: Pivot to alternative suggestions"
      ]
    },
    "nextDecisionPoint": "End of 30 days: Commit OR pivot"
  },
  "prosAndChallenges": {
    "pros": [
      {
        "benefit": "Job security",
        "detail": "15% growth projected over 5 years",
        "evidence": "Bureau of Labor Statistics"
      },
      {
        "benefit": "Clear advancement path",
        "detail": "Junior→Mid(2-3yr)→Senior(5-7yr)→Mgmt(10+yr)",
        "evidence": "Standard career ladder"
      },
      {
        "benefit": "Work flexibility",
        "detail": "60% offer hybrid or remote",
        "evidence": "Indeed analysis"
      },
      {
        "benefit": "Meaningful impact",
        "detail": "See direct results affecting [customers/patients]",
        "evidence": "Practitioner testimonials"
      }
    ],
    "challenges": [
      {
        "challenge": "Physical demands",
        "reality": "Standing 6-8 hrs/day, lifting 20-40 lbs",
        "mitigation": "Good footwear, proper lifting technique",
        "dealbreaker": "Chronic back/knee issues may not be sustainable"
      },
      {
        "challenge": "Emotional toll",
        "reality": "Frustrated customers, high-pressure situations",
        "mitigation": "Develop thick skin, stress management",
        "dealbreaker": "Highly sensitive to criticism = draining"
      },
      {
        "challenge": "Schedule realities",
        "reality": "Night shifts, weekends, on-call availability",
        "mitigation": "Negotiate after proving yourself (6-12 months)",
        "dealbreaker": "Rigid family commitments need upfront discussion"
      },
      {
        "challenge": "Earnings plateau",
        "reality": "Without management, salary tops at $75k-$85k",
        "mitigation": "Specialize, freelance, or move to leadership",
        "dealbreaker": "Want $150k+ = need manager/executive path"
      }
    ]
  },
  "fitIndicators": {
    "youWillThrive": [
      "You value [stability/creativity/autonomy] - this provides that",
      "Energized by [people/solo work/variety] - matches daily reality",
      "Your strengths [from assessment] align with requirements",
      "Okay with [tradeoff] to get [benefit]"
    ],
    "youMightStruggle": [
      "You hate [specific thing] - 30% of job, unavoidable",
      "You need [high income/autonomy/novelty] - takes years",
      "Your [trait] clashes with [job requirement]"
    ],
    "successStories": [
      {
        "profile": "Former retail, no degree, single parent",
        "pathway": "6-month bootcamp while working part-time",
        "outcome": "$62k junior analyst, promoted after 18 months",
        "keyFactor": "Retail communication + relentless networking",
        "timeline": "14 months decision → first offer"
      },
      {
        "profile": "College grad unrelated field, career changer at 30",
        "pathway": "Self-taught via courses + 3 portfolio projects",
        "outcome": "$70k mid-size company",
        "keyFactor": "Portfolio demonstrated capability",
        "timeline": "9 months learning + 2 months job search"
      }
    ]
  },
  "redFlags": {
    "careerRedFlags": [
      {
        "warning": "Field declining in [region/industry segment]",
        "alternative": "Focus on [growing sub-specialty]"
      },
      {
        "warning": "Automation risk: [tasks] being replaced",
        "alternative": "Focus on human-centered: communication, creativity, strategy"
      }
    ],
    "personalRedFlags": [
      {
        "warning": "Your assessment shows you value [X] but career provides opposite",
        "honestAdvice": "You'll feel unfulfilled - consider [alternative]"
      }
    ],
    "employerRedFlags": [
      {
        "redFlag": "Job says 'We're like a family' or 'Work hard, play hard'",
        "meaning": "Poor work-life boundaries, burnout culture",
        "advice": "Ask: 'What does work-life balance look like here?'"
      },
      {
        "redFlag": "High turnover (check Glassdoor)",
        "meaning": "Management issues, poor culture, unrealistic expectations",
        "advice": "Ask: 'How long has your team been together?'"
      }
    ]
  },
  "realityCheck": {
    "commonMisconceptions": [
      {
        "myth": "Need 4-year degree to enter",
        "reality": "62% entered via bootcamp/trade school/self-teaching",
        "source": "Industry workforce survey 2024"
      },
      {
        "myth": "All glamorous/creative work",
        "reality": "60% admin (emails, docs, meetings), 40% core work",
        "source": "Time-tracking study of 200 professionals"
      },
      {
        "myth": "Get rich quick",
        "reality": "Entry $40k-$55k, 3yr $60k-$75k, 7yr $80k-$110k, mgmt $120k+",
        "source": "BLS + Glassdoor"
      }
    ],
    "incomeTimeline": {
      "year1": "$38k-$50k (varies by location/pathway)",
      "year3": "$55k-$70k with experience",
      "year5": "$70k-$90k with specialization/leadership",
      "year10": "$90k-$140k if advancing to senior/management",
      "ceiling": "IC: $85k-$110k | Management: $120k-$180k+ | Executive: $200k+"
    },
    "timeInvestment": {
      "learning": "6-18 months education/training",
      "jobSearch": "2-6 months to land first role",
      "proficiency": "2-3 years to feel confident",
      "advancement": "5-7 years to senior, 10+ to leadership"
    },
    "isThisRightForYou": {
      "exploreIf": [
        "Assessment shows strong alignment with [strengths]",
        "Willing to invest 6-18 months with uncertain outcome",
        "Value [benefit] over [tradeoff]"
      ],
      "reconsiderIf": [
        "Core values conflict with [job reality]",
        "Not willing to [specific unavoidable requirement]",
        "Have [constraint] making path extremely difficult"
      ]
    }
  }
}`;
    // Add timeout with GPT-5 Mini fallback
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    let response;
    try {
      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          max_completion_tokens: 16000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analyze these career assessment responses and provide personalized career recommendations.` }
          ],
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch (abortErr) {
      if (abortErr.name === 'AbortError') {
        console.log('⚠️ GPT-5 timeout, fallback to GPT-5 Mini');
        const c2 = new AbortController();
        const t2 = setTimeout(() => c2.abort(), 60000);
        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-lite',
            max_completion_tokens: 11000,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Analyze these career assessment responses and provide personalized career recommendations.` }
            ],
          }),
          signal: c2.signal
        });
        clearTimeout(t2);
      } else throw abortErr;
    }

    let text = await response.text();
    let data;
    try {
      if (!response.ok) {
        console.error('Lovable AI error:', response.status, text.slice(0, 300));
        if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits in Settings.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ error: `Lovable AI error ${response.status}` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      data = JSON.parse(text);
    } catch (err) {
      console.error('Non-JSON response:', text?.slice(0, 300));
      return new Response(JSON.stringify({ error: 'Invalid AI response. Please try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (!response.ok) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        error: data.error
      };
      console.error('OpenAI API error:', errorDetails);
      
      // Return specific error message based on status code
      let userMessage = 'Failed to analyze career assessment with OpenAI';
      if (response.status === 401) {
        userMessage = 'OpenAI API authentication failed. Please contact support.';
      } else if (response.status === 429) {
        userMessage = 'Rate limit exceeded. Please try again in a few minutes.';
      } else if (response.status === 402) {
        userMessage = 'Payment required. Please contact support.';
      }
      
      throw new Error(userMessage);
    }

    console.log('Successfully received OpenAI response');

    let analysis;
    try {
      analysis = JSON.parse(extractContent(data));
      
      // Log success
      await logRequest(supabase, {
        userId,
        endpoint: 'career-assessment',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 2,
        success: true,
        requestDurationMs: Date.now() - startTime
      });
    } catch (parseError) {
      console.error('Failed to parse AI response, generating fallback analysis from actual responses');
      
      // Calculate which areas had highest scores from responses
      const areaScores = Object.entries(responses).map(([area, scores]) => ({
        area,
        totalScore: Array.isArray(scores) 
          ? scores.reduce((sum: number, val: any) => sum + Number(val), 0)
          : 0,
        avgScore: Array.isArray(scores)
          ? scores.reduce((sum: number, val: any) => sum + Number(val), 0) / scores.length
          : 0
      })).sort((a, b) => b.totalScore - a.totalScore);

      const topAreas = areaScores.slice(0, 5);

      // Map area IDs to career titles
      const areaToCareer: Record<string, string> = {
        'healthcare': 'Healthcare Professional',
        'trades': 'Skilled Trades Specialist',
        'stem': 'STEM Professional',
        'social-services': 'Social Services Worker',
        'finance': 'Financial Analyst',
        'law-safety': 'Public Safety Officer',
        'customer-service': 'Customer Success Manager',
        'education': 'Education Professional',
        'entrepreneurship': 'Entrepreneur / Business Owner',
        'nonprofit': 'Nonprofit Program Manager',
        'real-estate': 'Real Estate Professional',
        'marketing-sales': 'Marketing / Sales Professional',
        'human-resources': 'HR Specialist'
      };

      analysis = {
        recommendations: topAreas.map(area => ({
          title: areaToCareer[area.area] || area.area,
          fitScore: Math.round((area.avgScore / 5) * 100),
          description: `Based on your assessment responses, you showed strong interest in ${area.area}`,
          whyGoodFit: `Your responses indicate ${area.avgScore >= 4 ? 'strong' : 'moderate'} alignment with this field`,
          requiredSkills: ['To be determined - full AI analysis unavailable'],
          skillsTheyHave: ['Assessment data available'],
          skillGaps: ['Further research needed'],
          education: 'Varies by specific role',
          salaryRange: '$45k-$85k (varies widely)',
          marketOutlook: 'Contact a career counselor for detailed outlook',
          transitionTime: '3-12 months depending on background',
          challenges: ['Further research needed'],
          nextSteps: ['Research specific roles in this field', 'Speak with a career advisor']
        })),
        summary: `Based on your responses, you showed the strongest interest in: ${topAreas.map(a => a.area).join(', ')}. Note: This is a basic analysis - full AI assessment was unavailable.`,
        keyStrengths: ['Assessment data available - AI analysis needed for detailed insights'],
        developmentAreas: ['Speak with career counselor for personalized analysis'],
        generalAdvice: 'We recommend scheduling a career counseling session to dive deeper into these results.'
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing career assessment:', error);
    
    // Handle guard errors (thrown as Response objects)
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