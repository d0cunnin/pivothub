import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      localScores, 
      answersBreakdown, 
      sessionId, 
      assessmentStartTime, 
      timeElapsed 
    } = await req.json();

    console.log('Tech readiness assessment request:', { userId: user.id, sessionId, timeElapsed });

    // Server-side timer validation
    const startTime = new Date(assessmentStartTime).getTime();
    const currentTime = Date.now();
    const serverTimeElapsed = Math.floor((currentTime - startTime) / 1000);
    const timeDifference = Math.abs(serverTimeElapsed - timeElapsed);

    // Allow 30-second tolerance for network latency
    if (timeDifference > 30) {
      console.warn('Timer mismatch detected:', { serverTimeElapsed, clientTimeElapsed: timeElapsed, difference: timeDifference });
    }

    // Reject if assessment completed too quickly (minimum 10 minutes)
    if (timeElapsed < 600) {
      throw new Error('Assessment completed too quickly. Please take your time to answer thoughtfully.');
    }

    // Reject if assessment exceeded maximum time (110 minutes = expired + 10 min grace)
    if (timeElapsed > 6600) {
      throw new Error('Assessment time expired. Please retake the assessment.');
    }

    // Validate score ranges
    if (
      localScores.cognitive < 0 || localScores.cognitive > 100 ||
      localScores.behavioral < 0 || localScores.behavioral > 100 ||
      localScores.interest < 0 || localScores.interest > 100 ||
      localScores.overall < 0 || localScores.overall > 100
    ) {
      throw new Error('Invalid score values detected.');
    }

    // Check for duplicate session (prevent retaking within 3 hours)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: recentAssessments, error: duplicationError } = await supabaseClient
      .from('assessment_results')
      .select('id')
      .eq('user_id', user.id)
      .eq('assessment_type', 'tech-readiness')
      .gte('created_at', threeHoursAgo)
      .limit(1);

    if (duplicationError) {
      console.error('Error checking for duplicates:', duplicationError);
    }

    if (recentAssessments && recentAssessments.length > 0) {
      throw new Error('You have already completed this assessment recently. Please wait 3 hours before retaking.');
    }

    // Generate personalized report with GPT-5
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a Tech Career Assessment Expert analyzing a candidate's readiness for technology careers.

ASSESSMENT RESULTS:
- Tech Compatibility Score: ${localScores.overall}/100
- Cognitive Readiness: ${localScores.cognitive}/100
- Behavioral Readiness: ${localScores.behavioral}/100
- Interest Alignment: ${localScores.interest}/100
- Math Diagnostic: ${localScores.mathDiagnostic}/5

DETAILED BREAKDOWN:
- Logical Reasoning: ${answersBreakdown.logicalReasoningCorrect}/10 correct
- Quantitative Reasoning: ${answersBreakdown.quantitativeCorrect}/10 correct
- Problem-Solving: ${answersBreakdown.problemSolvingCorrect}/8 correct
- Spatial/Systems Thinking: ${answersBreakdown.spatialThinkingCorrect}/7 correct
- Math Diagnostic: ${answersBreakdown.mathDiagnosticCorrect}/5 correct

BEHAVIORAL SCORES (1-5 scale):
- Adaptability: ${answersBreakdown.adaptabilityScore}/5
- Persistence: ${answersBreakdown.persistenceScore}/5
- Frustration Tolerance: ${answersBreakdown.frustrationToleranceScore}/5
- Learning from Failure: ${answersBreakdown.learningFromFailureScore}/5
- Stress Management: ${answersBreakdown.stressManagementScore}/5
- Detail Orientation: ${answersBreakdown.detailOrientationScore}/5
- Collaboration: ${answersBreakdown.collaborationScore}/5
- Initiative: ${answersBreakdown.initiativeScore}/5

INTEREST SCORES (1-5 scale):
- Tech Curiosity: ${answersBreakdown.techCuriosityScore}/5
- Hands-On Preference: ${answersBreakdown.handsOnPreference}/5
- Problem-Solving Interest: ${answersBreakdown.problemSolvingInterest}/5
- Continuous Learning: ${answersBreakdown.continuousLearningScore}/5
- Logical Thinking: ${answersBreakdown.logicalThinkingInterest}/5
- Tech Career Interest: ${answersBreakdown.techCareerInterest}/5

SPECIAL FLAGS:
- Math needs practice: ${localScores.mathDiagnostic < 3}
- Low cognitive readiness: ${localScores.cognitive < 60}
- Low behavioral readiness: ${localScores.behavioral < 60}
- Low interest alignment: ${localScores.interest < 60}

ANALYSIS FRAMEWORK:
1. Tech Fit Assessment:
   - Overall 75+: Strong fit for tech careers
   - Overall 60-74: Moderate fit, some preparation needed
   - Overall <60: Needs significant preparation or consider alternate tracks

2. Best Tech Pathways (recommend 3-5 based on profile):
   - IT Support/Help Desk: High adaptability + frustration tolerance + hands-on preference
   - Cybersecurity: High cognitive + problem-solving + systems thinking
   - Data Analysis: High quantitative + logical reasoning + detail-oriented
   - UX/UI Design: High spatial thinking + hands-on + creativity
   - Software Development: High logical + quantitative + persistence
   - Network Administration: High spatial + problem-solving + systems thinking
   - Tech Project Management: High behavioral + adaptability + collaboration
   - Quality Assurance: High detail-oriented + persistence + logical
   - DevOps Engineer: High problem-solving + adaptability + systems thinking
   - Database Administrator: High quantitative + systems thinking + detail-oriented

3. Improvement Recommendations (if overall < 75):
   - Cognitive gaps: Math refresher courses, logic puzzles, coding fundamentals
   - Behavioral gaps: Stress management training, growth mindset development, resilience building
   - Interest gaps: Tech exploration courses, hands-on projects, tech meetups

4. Math Diagnostic Flag (if score < 3):
   - Must recommend math improvement plan
   - Suggest specific math topics to practice
   - Link to foundational math courses

5. Recommended PivotHub Courses (Learn It):
   - List 3-5 courses from PivotHub that align with readiness gaps or career paths
   - Reference path: /learnit

OUTPUT FORMAT (JSON only, no additional text):
{
  "techFitLevel": "strong|moderate|needs-prep|alternative-recommended",
  "overallAssessment": "2-3 sentence summary of tech readiness and career potential",
  "topTechPathways": [
    {
      "title": "IT Support Specialist",
      "fitScore": 85,
      "reason": "Your high adaptability and hands-on preference make this ideal",
      "keySkills": ["Customer service", "Troubleshooting", "Hardware/software basics"]
    }
  ],
  "strengthAreas": ["Logical reasoning", "Adaptability", "Tech curiosity"],
  "improvementAreas": [
    {
      "area": "Quantitative reasoning",
      "currentLevel": 60,
      "recommendation": "Practice math logic problems and data interpretation exercises"
    }
  ],
  "mathDiagnosticFlag": true,
  "mathImprovementPlan": "Focus on percentages, algebra, and time/rate calculations. Start with Khan Academy Math for Data Science course.",
  "recommendedCourses": [
    {
      "title": "Introduction to IT Support",
      "reason": "Builds foundational troubleshooting and customer service skills",
      "path": "/learnit"
    }
  ],
  "alternateTracks": ["Consider business analysis or project coordination roles that leverage your strengths"],
  "nextSteps": [
    "Complete PivotHub Introduction to IT Support course",
    "Practice 20 logic puzzles per week to build cognitive skills",
    "Join local tech meetups to build network"
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate a comprehensive tech readiness analysis based on the assessment results.' }
        ],
        max_completion_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate tech readiness report');
    }

    const aiData = await response.json();
    const analysisText = aiData.choices[0].message.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', analysisText);
      throw new Error('Invalid AI response format');
    }

    console.log('GPT-5 analysis generated successfully');

    // Save to database (RLS protected)
    const { error: saveError } = await supabaseClient
      .from('assessment_results')
      .insert({
        user_id: user.id,
        assessment_type: 'tech-readiness',
        results: localScores,
        detailed_analysis: analysis,
        score: localScores.overall,
      });

    if (saveError) {
      console.error('Error saving assessment results:', saveError);
    }

    // Log usage (2 credits)
    const { error: logError } = await supabaseClient
      .from('tool_usage_analytics')
      .insert({
        user_id: user.id,
        tool_name: 'tech-readiness-assessment',
        credits_used: 2,
        estimated_tokens: 3000,
        estimated_cost_usd: 0.015,
      });

    if (logError) {
      console.error('Error logging tool usage:', logError);
    }

    return new Response(
      JSON.stringify({ analysis }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in tech-readiness-assessment function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred processing your assessment' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
