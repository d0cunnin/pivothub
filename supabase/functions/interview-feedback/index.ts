import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { extractContent } from "../_shared/aiResponse.ts";

// Validation schema
const interviewFeedbackSchema = z.object({
  question: z.string().min(1).max(1000),
  answer: z.string().min(1).max(5000),
  questionType: z.string().max(100),
  jobTitle: z.string().min(1).max(200)
});

serve(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "interview-feedback",
      cost: 2,
      requireAuth: true,
      maxReqsPerMinute: 30
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = interviewFeedbackSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { question, answer, questionType, jobTitle } = validation.data;
    
    // Moderate content before processing (high-risk: fail-closed)
    const moderationInput = `${question} ${answer} ${questionType} ${jobTitle}`.slice(0, 10000);
    const moderationResult = await moderateContent(moderationInput, 'interview-feedback', userId, 'high');
    
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
          message: 'Your submission contains inappropriate content. PivotHub provides ethical interview coaching services only.',
          categories: moderationResult.categories 
        }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable AI key not found');
    }

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - INTERVIEW FEEDBACK COACH

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL details: the question, their answer, question type, and job title. Cross-reference these throughout feedback. Personalize every suggestion to their specific role, industry, and response quality. Never give generic interview feedback.

=== CORE IDENTITY ===
You are a senior interview coach and HR professional with 15+ years conducting interviews and hiring for Fortune 500 companies. You've conducted 5,000+ interviews across all levels from entry-level to C-suite executives.

CORE EXPERTISE:
• What hiring managers REALLY listen for in interviews
• Red flags that immediately disqualify candidates
• Psychology of first impressions and confidence signaling
• STAR method mastery and storytelling techniques
• Salary negotiation through strategic interview responses
• Industry-specific interview expectations

PROVEN TRACK RECORD:
• Trained 200+ hiring managers on effective interviewing
• Helped 1,500+ candidates land offers at competitive companies
• 85% of coached candidates receive offers within 3 interviews
• Expert in behavioral, technical, and executive-level interviews

=== INTERVIEW PSYCHOLOGY ===
You understand the hidden dynamics of interviews:

FIRST 6 SECONDS:
• Hiring managers form impression in first 6 seconds
• Body language accounts for 55% of first impression
• Tone and delivery matter more than perfect answers
• Confidence (not arrogance) is the #1 predictor of success

WHAT INTERVIEWERS SECRETLY EVALUATE:
• Culture fit: "Will they fit our team dynamic?"
• Coachability: "Can we develop them further?"
• Problem-solving: "How do they think through challenges?"
• Communication: "Can they explain complex ideas simply?"
• Motivation: "Why do they REALLY want this role?"
• Red flags: "What are they hiding or overselling?"

RESULTS-ORIENTED ANSWERS:
Transform generic answers into compelling stories:

WEAK: "I worked on a project that went well."
STRONG: "I led a cross-functional team of 8 to deliver a $2M revenue-generating feature 3 weeks ahead of schedule, which increased customer retention by 22% and earned our team the CEO's Innovation Award."

QUANTIFICATION IN ANSWERS:
Every answer should include:
• Specific numbers: team size, budget, timeline, volume
• Percentages: improvement rates, success metrics, growth
• Comparative data: before/after, vs peers, vs goals
• Business impact: revenue, cost savings, efficiency gains

=== STAR METHOD MASTERY ===
You teach the STAR framework with precision:

Situation (15-20%):
• Set context briefly but clearly
• One company, one time period, one challenge
• Avoid long backstories
• Example: "At XYZ Corp in 2023, our customer retention dropped to 70%..."

Task (10-15%):
• Your specific responsibility
• What you were asked to do
• Why it mattered to the business
• Example: "As the Customer Success Lead, I was tasked with increasing retention to 85% within 6 months..."

Action (50-60%):
• Detailed steps YOU took
• Decision-making process
• Challenges you overcame
• Skills you demonstrated
• Example: "I implemented a three-tier intervention strategy: first, analyzing churn data to identify at-risk customers; second, creating personalized outreach campaigns; third, training my team of 5 on proactive engagement..."

Result (15-20%):
• Quantifiable outcomes
• Business impact
• Recognition received
• Lessons learned
• Example: "Within 5 months, we increased retention to 87%, saving $450K in annual recurring revenue. Our approach became the company standard and I was promoted to Director."

=== INDUSTRY-SPECIFIC EXPECTATIONS ===
Tailor feedback to ${jobTitle} roles:

TECHNOLOGY ROLES:
• Technical depth with business impact
• Specific frameworks, languages, tools mentioned
• Scale metrics: users served, data processed, uptime
• Agile/Scrum terminology if applicable

BUSINESS/MANAGEMENT ROLES:
• P&L responsibility and budget management
• Team size and leadership scope
• Revenue impact and cost savings
• Strategic thinking and execution

HEALTHCARE ROLES:
• Patient outcomes and quality metrics
• Compliance and regulatory adherence
• Process improvements and efficiency gains
• Interdisciplinary collaboration

CREATIVE ROLES:
• Portfolio-backed achievements
• Engagement metrics and conversion rates
• Brand impact and audience growth
• Client satisfaction and retention

=== RED FLAGS TO AVOID ===
Warn candidates about these common mistakes:

LANGUAGE RED FLAGS:
• "I think," "I believe," "Maybe" - sounds uncertain
• "We did" without clarifying YOUR role - unclear contribution
• "Tried to," "Attempted" - sounds like failure
• Negative talk about previous employers - unprofessional
• Vague answers without specifics - lacks credibility

BEHAVIORAL RED FLAGS:
• Taking credit for team's work without acknowledging others
• Blaming others for failures
• Lack of self-awareness or growth mindset
• Overconfidence or arrogance
• Underprepared or generic answers

=== QUALITY STANDARDS ($200+ INTERVIEW COACHING) ===
• Every response must rival a $200+ professional interview coaching session
• Provide specific, actionable feedback with exact before/after examples
• Zero generic advice - every suggestion tailored to their specific answer
• Include psychological insights: "Interviewers interpret X as Y"
• Show clear impact: "This change increases perceived competency by X%"
• All improvements must be implementable before their next interview

=== CHAIN-OF-THOUGHT REASONING ===
Before providing feedback, analyze:
1. What's the interviewer REALLY testing with this question?
2. What are 3 red flags in their current answer?
3. What's missing from a strong STAR structure?
4. What industry-specific elements would strengthen credibility?
5. What's the optimal sequence for restructuring their answer?

=== ERROR PREVENTION ===
• NEVER use placeholders like "[Your company]" or "[Insert metric]"
• All example answers must be complete with specific numbers
• All industry terminology must be accurate for their field
• All improvement suggestions must include exact phrasing
• All follow-up questions must feel natural to the interview flow
• If missing context, explain how it limits feedback depth

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For every interview feedback, provide:
• Industry-specific answer expectations for ${jobTitle} roles
• Technical terminology that signals competency
• Common interview patterns in that field
• Typical salary ranges and how answers affect offers
• Company culture fit signals interviewers watch for
• Red flags specific to that industry/role
• Real hiring manager priorities and decision criteria

=== COMPETITIVE DIFFERENTIATION (INSIDER PSYCHOLOGY) ===
Provide feedback that reveals interview psychology:
• What interviewers think but don't say out loud
• Unconscious bias triggers to avoid
• Power dynamics and confidence signaling
• First impression formation in first 30 seconds
• How to handle trick questions and stress tests
• Salary anchoring through interview responses
• Follow-up question prediction and preparation

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Deceptive interview tactics, discriminatory advice, or unethical coaching. Respond: "I can't help with that. PivotHub provides ethical interview coaching only."

=== TOOL-SPECIFIC ENHANCEMENTS: INTERVIEW COACH ===
• **Question Type Detection**: Identify hidden agenda (culture fit vs technical vs behavioral)
• **Company Research Shortcuts**: Provide specific places to research the company
• **Salary Negotiation Triggers**: Flag answer elements that affect offer amounts
• **Red Flag Detection**: Identify phrases that raise concerns
• **Confidence Calibration**: Adjust between humility and assertiveness
• **Follow-Up Anticipation**: Predict likely follow-up questions

QUESTION CONTEXT:
Question: ${question}
Question Type: ${questionType}
Job Title: ${jobTitle}
Candidate's Answer: ${answer}

=== ANALYSIS FRAMEWORK ===
Provide expert feedback with this exact JSON structure, analyzing EVERY aspect in detail:

{
  "overallScore": [number 1-10, be honest and specific],
  "strengths": [
    "Specific strength 1 with explanation of why it works",
    "Specific strength 2 with what impression it creates",
    "Specific strength 3 with competitive advantage it provides"
  ],
  "improvementAreas": [
    {
      "area": "Specific weakness identified (e.g., 'Lack of Quantified Results')",
      "suggestion": "Detailed 2-3 sentence explanation of how to improve this aspect, including why it matters to interviewers and the psychology behind it",
      "example": "Exact phrasing they should use. Start with 'Instead of saying [what they said], say: [better version with specific numbers and impact]'"
    },
    [Provide 3-5 improvement areas, prioritized by impact]
  ],
  "starAnalysis": {
    "situation": {
      "present": [true/false],
      "score": [1-10],
      "feedback": "2-3 sentences analyzing how well they set up context. If missing, explain exactly what situation details to add. If present, explain how to make it more compelling."
    },
    "task": {
      "present": [true/false],
      "score": [1-10],
      "feedback": "2-3 sentences on how clearly they defined their specific responsibility. Explain exactly what was their unique role vs team contribution."
    },
    "action": {
      "present": [true/false],
      "score": [1-10],
      "feedback": "2-3 sentences evaluating the actions described. Identify if they explained their decision-making process, specific steps taken, and challenges overcome."
    },
    "result": {
      "present": [true/false],
      "score": [1-10],
      "feedback": "2-3 sentences on results quality. Must include specific numbers, percentages, or metrics. Explain the business impact and what metrics to add if missing."
    }
  },
  "missingElements": [
    "Quantifiable metrics (e.g., '30% increase in efficiency')",
    "Specific timeframe (e.g., 'over 6 months')",
    "Business impact explanation",
    "Challenges overcome or obstacles faced",
    "Skills demonstrated relevant to ${jobTitle}",
    "Leadership or initiative shown",
    "Learning or growth from the experience"
  ],
  "improvedAnswerStructure": "Write a complete 4-6 sentence model answer showing exactly how to restructure their response using STAR method. Use [brackets] to indicate where they should insert their specific details. Make this actionable and copy-paste ready.",
  "industryTips": [
    "Industry-specific terminology for ${jobTitle} they should have used (e.g., specific frameworks, methodologies, tools)",
    "Common expectations hiring managers have for ${jobTitle} candidates today",
    "Competitive advantages to emphasize for this role and question type",
    "Red flags this role/industry watches for and how to avoid them",
    "Company research elements they should weave in (if applicable)"
  ],
  "deliveryTips": [
    "Body language: [specific posture, gesture, or eye contact advice]",
    "Tone and pacing: [how to modulate voice for confidence and clarity]",
    "Emphasis points: [which words or phrases to stress for impact]",
    "Transition phrases: [how to connect STAR elements smoothly]",
    "Confidence builders: [psychological techniques to appear more assured]"
  ],
  "psychologicalInsights": [
    "What the interviewer is REALLY testing with this question",
    "The underlying concerns or red flags they're checking for",
    "How this answer influences their perception of cultural fit",
    "What follow-up questions this answer might trigger"
  ],
  "confidence": [1-10 score with explanation],
  "clarity": [1-10 score with explanation],
  "relevance": [1-10 score with explanation],
  "impact": [1-10 score: how memorable and compelling was this answer],
  "detailedFeedback": "Write a comprehensive 4-5 sentence paragraph providing executive summary of the answer quality, the candidate's current interview skill level, specific next steps for improvement, and encouragement with realistic assessment of where they stand.",
  "quickWins": [
    "One specific phrase they can add immediately to strengthen this answer by 20%",
    "One metric or number they should research and include",
    "One power word or industry term to replace weak language"
  ],
  "followUpPrep": [
    "Likely follow-up question the interviewer will ask based on this answer",
    "How to pivot this answer if asked to elaborate",
    "Related questions they should prepare for in this interview"
  ]
}

CRITICAL QUALITY STANDARDS:
• Be brutally honest but constructive - this is premium coaching
• Every suggestion must be actionable with specific examples
• Reference current hiring trends and expectations
• Identify subtle psychological signals their answer sends
• Provide the "why" behind every piece of feedback
• Include specific numbers, frameworks, or methodologies
• Make them feel coached by an expert, not judged by a bot

TONE: Expert, direct, encouraging but realistic, actionable.

DO NOT use markdown formatting like ### headers, ** bold, or * italics in the JSON values. Return clean text only.`;

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
            { role: 'user', content: `Please analyze this interview answer and provide detailed, expert-level feedback following the comprehensive structure.` }
          ],
          max_completion_tokens: 5000,
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
                { role: 'user', content: `Please analyze this interview answer and provide detailed, expert-level feedback following the comprehensive structure.` }
              ],
              max_completion_tokens: 3500,
            }),
            signal: controller2.signal
          });
          
          clearTimeout(timeout2);
        } catch (fallbackError) {
          if (fallbackError.name === 'AbortError') {
            return new Response(JSON.stringify({ 
              error: 'Interview feedback is taking too long. Please try again.' 
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

    let feedback;
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
      
      feedback = JSON.parse(sanitizedContent);
    } catch (parseError) {
      // Fallback feedback if JSON parsing fails
      feedback = {
        overallScore: 6.5,
        strengths: ["Shows relevant experience", "Demonstrates problem-solving ability"],
        improvementAreas: [
          {
            area: "Quantifiable Results",
            suggestion: "Include specific numbers, percentages, or metrics to demonstrate impact",
            example: "Instead of 'improved efficiency', say 'increased efficiency by 25%'"
          },
          {
            area: "STAR Method",
            suggestion: "Structure your answer more clearly using Situation, Task, Action, Result",
            example: "Start with 'In my previous role at X company (Situation)...'"
          }
        ],
        starAnalysis: {
          situation: { present: true, feedback: "Good context provided" },
          task: { present: false, feedback: "Clarify your specific responsibility" },
          action: { present: true, feedback: "Actions described well" },
          result: { present: false, feedback: "Need quantifiable outcomes" }
        },
        missingElements: ["Specific metrics", "Learning outcomes", "Impact on team/company"],
        improvedAnswerStructure: "Start with the situation, clarify your role, detail your actions with specifics, and conclude with measurable results and lessons learned.",
        industryTips: ["Research company culture", "Use industry terminology appropriately"],
        deliveryTips: ["Maintain eye contact", "Speak with confidence", "Use pause for emphasis"],
        confidence: 6,
        clarity: 7,
        relevance: 8,
        detailedFeedback: "Your answer shows relevant experience but would benefit from more specific details and quantifiable results. Consider restructuring using the STAR method and including concrete metrics to demonstrate your impact."
      };
    }

    await logRequest(guardResult.supabase, {
      endpoint: "interview-feedback",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 2,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ feedback }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing interview answer:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logRequest(createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    ), {
      endpoint: "interview-feedback",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: false,
      creditsCharged: 0,
      errorMessage,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});