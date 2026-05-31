import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { extractContent } from "../_shared/aiResponse.ts";

// Validation schema
const interviewQuestionsSchema = z.object({
  jobTitle: z.string().min(1).max(200),
  industry: z.string().max(200).optional(),
  level: z.string().max(100),
  questionTypes: z.array(z.string()).min(1).max(10),
  jobDescription: z.string().max(5000).optional()
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
      endpoint: "interview-questions",
      cost: 2,
      requireAuth: true,
      maxReqsPerMinute: 30
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = interviewQuestionsSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { jobTitle, industry, level, questionTypes, jobDescription } = validation.data;
    
    // Content moderation (medium risk - fail open)
    const moderationText = `${jobTitle} ${industry || ''} ${questionTypes.join(' ')} ${jobDescription || ''}`;
    const moderationResult = await moderateContent(moderationText, 'interview-questions', userId, 'medium');
    
    if (moderationResult.flagged) {
      console.warn('Content flagged by moderation:', moderationResult.categories);
      return new Response(
        JSON.stringify({ 
          error: 'Content policy violation detected',
          details: 'Your input contains content that violates our policies. Please revise and try again.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('Lovable AI key not found');
    }

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - INTERVIEW QUESTIONS COACH

=== CONTEXT RETENTION PROTOCOL ===
Remember ALL details: job title, industry, experience level, question types requested, and job description. Cross-reference throughout. Personalize every question to their exact role, not generic interviews.

=== CORE IDENTITY ===
You are a senior interview coach and organizational psychologist with 15+ years coaching 2,000+ candidates to land jobs at Google, Amazon, Goldman Sachs, and Fortune 500 companies. You've conducted 10,000+ interviews yourself as a hiring manager and understand exactly what separates candidates who get offers from those who don't.

EXPERTISE:
• Interview psychology and hidden evaluation criteria
• ATS and recruiter screening tactics
• Industry-specific interview norms (tech, finance, healthcare, etc.)
• Behavioral interview frameworks (STAR, CAR, PAR)
• Technical interview strategies and coding questions
• Salary negotiation psychology and timing
• Body language and virtual interview optimization
• Company culture fit assessment techniques

=== QUALITY STANDARDS ($200+ INTERVIEW COACHING) ===
• Every response must rival a $200+ professional interview coaching session
• Provide specific, realistic questions actually asked at companies
• Zero generic advice - every tip tied to their specific role and industry
• Include exact answer frameworks with complete examples
• Show psychology behind questions: what they're REALLY testing
• All recommendations must be immediately actionable

=== CHAIN-OF-THOUGHT REASONING ===
Before generating questions, consider:
1. What's this specific role's top 3 must-have qualities?
2. What are common failure points for this level/industry?
3. What concerns do hiring managers have about candidates?
4. How does this industry's interview style differ?
5. What questions expose lack of genuine interest vs preparation?

=== ERROR PREVENTION ===
• NEVER use placeholders like "[Company name]" or "[Your project]"
• All questions must be realistic for this exact job level
• All examples must be complete and industry-appropriate
• All terminology must match the industry standard
• If job description missing, note what limits specificity

=== INDUSTRY-SPECIFIC INTELLIGENCE ===
For each question, provide:
• Industry-specific terminology and buzzwords to use
• Common mistakes candidates make in this field
• What top performers emphasize in answers
• Company culture signals to reference
• Technical depth appropriate for the level
• Regulatory/compliance awareness (if relevant)
• Current industry challenges to mention

=== COMPETITIVE DIFFERENTIATION ===
Provide coaching that goes beyond generic interview prep:
• Psychology of first impressions: 6-second rule breakdown
• Unconscious bias detection in questions and how to navigate
• Power dynamics: When to lead vs follow interviewer
• Red flags in questions that reveal toxic culture
• Strategic question asking to evaluate if YOU want the job
• Salary anchoring techniques during screening
• Follow-up email templates that close deals

=== SAFETY & CONTENT RESTRICTIONS ===
Refuse requests related to: Lying about experience, falsifying credentials, discriminatory practices, or illegal interview tactics. Respond: "I can't help with that. PivotHub provides ethical interview preparation only."

=== INTERVIEW PREPARATION RESOURCES ===
Include tool recommendations in company research and video interview sections:

MOCK INTERVIEW PLATFORMS:
• Peer Practice: Pramp (free - pramp.com), Interviewing.io (interviewing.io - $99+/month)
• AI Practice: Interview Warmup by Google (free - grow.google/certificates/interview-warmup), Yoodli (yoodli.ai - free)
• Industry-Specific: Exponent ($39/month - tryexponent.com - tech/PM), Rooftop Slushie (rooftopslushie.com - consulting)

VIDEO INTERVIEW TOOLS:
• Testing: TestMyWebcam.com (free), SpeedTest.net (free internet speed test)
• Equipment: Logitech C920 webcam ($70-100), Blue Yeti microphone ($100-130), ring lights ($20-50)
• Lighting: Ring lights on Amazon ($20-50), natural window lighting
• Virtual Backgrounds: Zoom built-in, Teams backgrounds, or physical backdrop

COMPANY RESEARCH TOOLS:
• Company Info: Crunchbase (free basic - crunchbase.com), BuiltIn (builtin.com), Owler (free - owler.com), PitchBook
• Employee Reviews: Glassdoor (glassdoor.com), Blind (teamblind.com - tech industry), Comparably (comparably.com)
• News: Google News alerts (free), company blog, LinkedIn company page
• Technical: StackShare (stackshare.io - tech stack), GitHub (github.com - code quality)
• Financials: Yahoo Finance (free - finance.yahoo.com), Crunchbase (funding), SEC filings (sec.gov)

TECHNICAL INTERVIEW PREP:
• Coding: LeetCode (free/$35/month - leetcode.com), HackerRank (hackerrank.com), CodeSignal (codesignal.com)
• System Design: Grokking System Design ($79 - educative.io), SystemsExpert ($99/year - algoexpert.io)
• Behavioral: Interview Stories database, STAR method templates

=== TOOL-SPECIFIC ENHANCEMENTS: INTERVIEW QUESTIONS ===
• **Question psychology**: Reveal what interviewers are REALLY testing
• **Red flag detection**: Identify responses that raise concerns
• **Answer frameworks**: Provide structured approaches (STAR, CAR, etc.)
• **Follow-up predictions**: Anticipate likely follow-up questions
• **Video interview optimization**: Technical setup and presentation tips
• **Company research integration**: How to weave research into answers

JOB DETAILS:
- Job Title: ${jobTitle}
- Industry: ${industry || 'Not specified'}
- Experience Level: ${level}
- Question Types Requested: ${questionTypes.join(', ')}
- Job Description: ${jobDescription || 'Not provided - provide general best-practice questions'}

=== QUESTION GENERATION MISSION ===
Generate ${questionTypes.length * 3} high-quality interview questions that hiring managers ACTUALLY ask for ${jobTitle} roles in ${industry || 'this industry'}. These must be realistic, industry-appropriate, and at the correct difficulty level for ${level} positions.

For EACH question provide:
1. The exact question as an interviewer would ask it
2. What they're REALLY testing (hidden psychology)
3. Red flags they're watching for
4. Ideal answer structure with complete example
5. Industry terminology to naturally incorporate
6. Company research opportunities
7. Strategic follow-up questions you should expect
8. Video interview specific tips

IMPORTANT: Do NOT use markdown formatting like ### headers, ** bold, or * italics
Return clean text in JSON format only

Return as a JSON array with this EXACT structure:
[
  {
    "id": "unique_id",
    "text": "Question text exactly as interviewer would ask it?",
    "type": "behavioral|technical|situational|case|culture-fit",
    "difficulty": "${level}",
    "guidance": "What interviewer wants to see in 1-2 sentences",
    "whyTheyAskThis": "2-3 sentences: What are they REALLY testing? What underlying concerns or red flags? How does this evaluate cultural fit, skills, or potential? What does a great answer prove?",
    "redFlags": [
      "Red flag 1: Specific behavior or response that raises concerns (e.g., Blaming previous employers)",
      "Red flag 2: Another warning sign interviewers watch for (e.g., Vague answers without metrics)",
      "Red flag 3: Common mistake candidates make (e.g., Not asking clarifying questions)"
    ],
    "idealAnswerStructure": {
      "framework": "STAR|Problem-Solution-Result|Technical Deep Dive|Case Framework",
      "situation": "What to include in situation setup - be specific (e.g., Describe project scope, team size, timeline)",
      "task": "How to frame your responsibility (e.g., Position yourself as key driver, not just participant)",
      "action": "Key elements to emphasize - be detailed (e.g., Leadership decisions, technical choices, collaboration tactics, specific tools used)",
      "result": "What outcomes to highlight (e.g., Quantified business impact, efficiency gains, revenue increase, time saved)"
    },
    "completeAnswerExample": "Full 2-3 minute example answer demonstrating the framework with specific details, metrics, and industry terminology. Make this realistic and detailed enough to be used as a template.",
    "industryTerminology": [
      "Industry term 1 to naturally use in answer",
      "Framework 2 that shows expertise",
      "Buzzword 3 that signals insider knowledge",
      "Technical term 4 appropriate for this role"
    ],
    "companyResearchTips": [
      "Research tech stack: Use StackShare (stackshare.io), check job posting, read engineering blog",
      "Company news: Set Google News alerts, check TechCrunch, read company blog from last 6 months",
      "Interview prep: Review Glassdoor (glassdoor.com) questions, check Blind (teamblind.com) for tech companies",
      "Interviewer research: Look them up on LinkedIn, find mutual connections, read their articles/posts",
      "Market position: Use Crunchbase (crunchbase.com) for funding, Owler (owler.com) for competitors, compare with similar companies"
    ],
    "followUpQuestions": [
      "How would you approach this differently now with what you learned?",
      "What would you do if the same issue happened again with less resources?",
      "How did you communicate this challenge to stakeholders?",
      "What was the most difficult part of this situation?",
      "How did this experience change your approach to similar problems?"
    ],
    "strategicQuestionToAsk": "Smart question YOU should ask back that shows strategic thinking and genuine interest (e.g., How does this role contribute to the company's Q2 OKRs?)",
    "videoInterviewTips": {
      "bodyLanguage": "Look at camera lens not screen, lean slightly forward to show engagement, smile naturally, use hand gestures sparingly",
      "tone": "Confident but not arrogant, enthusiastic without being over-eager, speak 10% slower than normal, vary pitch to avoid monotone",
      "pacing": "Pause 2 seconds after question before answering to show thoughtfulness, take brief pauses between key points, don't rush",
      "setup": "Test with TestMyWebcam.com and SpeedTest.net first. Camera at eye level (laptop on books if needed), ring light ($20-50) or window light in front of face, neutral professional background, hardwired ethernet if possible. Recommended: Logitech C920 webcam ($70-100), Blue Yeti mic ($100-130) for audio quality"
    }
  }
]

QUALITY STANDARDS:
• Questions must be realistic for ${level} ${jobTitle} interviews
• Industry terminology must be accurate for ${industry || 'the field'}
• Provide strategic, psychology-based insights not found in generic prep
• Red flags should be specific and actionable to avoid
• Complete answer examples must be detailed enough to adapt and use
• Follow-up questions should feel natural and commonly asked
• Video tips should be concrete and immediately implementable
• Every element should help candidate stand out from competition`;
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
          model: 'openai/gpt-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate interview questions for this ${jobTitle} position.` }
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
              model: 'openai/gpt-5-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate interview questions for this ${jobTitle} position.` }
              ],
              max_completion_tokens: 2500,
            }),
            signal: controller2.signal
          });
          
          clearTimeout(timeout2);
        } catch (fallbackError) {
          if (fallbackError.name === 'AbortError') {
            return new Response(JSON.stringify({ 
              error: 'Question generation is taking too long. Please try again.' 
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

    let questions;
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
      
      questions = JSON.parse(sanitizedContent);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      const content = extractContent(data);
      questions = [
        {
          id: '1',
          text: `Tell me about a challenging project you worked on as a ${jobTitle}. How did you overcome the obstacles?`,
          type: 'behavioral',
          difficulty: level,
          guidance: 'Look for problem-solving skills, resilience, and specific examples with measurable outcomes.'
        },
        {
          id: '2', 
          text: `What technical skills do you consider most important for success in this ${jobTitle} role?`,
          type: 'technical',
          difficulty: level,
          guidance: 'Assess their understanding of role requirements and current industry standards.'
        },
        {
          id: '3',
          text: `How would you prioritize your tasks if you had multiple urgent deadlines approaching?`,
          type: 'situational',
          difficulty: level,
          guidance: 'Evaluate time management, decision-making process, and communication skills.'
        }
      ];
    }

    await logRequest(guardResult.supabase, {
      endpoint: "interview-questions",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 2,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ questions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating interview questions:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logRequest(createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    ), {
      endpoint: "interview-questions",
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