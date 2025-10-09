import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sanitize AI output to remove excessive markdown formatting
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    .replace(/#{3,}/g, '') // Remove excessive ###
    .replace(/\*{3,}/g, '') // Remove excessive ***
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold markdown
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic markdown
    .replace(/`([^`]+)`/g, '$1') // Remove code markdown
    .trim();
}

// Recursively sanitize all string values in an object
function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  return obj;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { assessmentId } = await req.json();

    if (!assessmentId) {
      throw new Error('Assessment ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('relaunch_openai_key')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the assessment
    const { data: assessment, error: fetchError } = await supabase
      .from('side_income_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (fetchError || !assessment) {
      throw new Error('Assessment not found');
    }

    // Check if payment is completed (accept both 'paid' and 'completed' status)
    if (assessment.payment_status !== 'paid' && assessment.payment_status !== 'completed') {
      throw new Error('Payment required to generate report');
    }

    // Check if report already exists
    const { data: existingReport } = await supabase
      .from('side_income_reports')
      .select('*')
      .eq('assessment_id', assessmentId)
      .maybeSingle();

    if (existingReport) {
      return new Response(
        JSON.stringify({ report: existingReport }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const assessmentData = assessment.assessment_data as any;

    // Generate comprehensive report using AI
    const systemPrompt = `You are an expert business consultant specializing in helping people create side income streams. Generate a comprehensive, actionable blueprint based on the user's assessment.

IMPORTANT: Provide clean, professional text without any markdown formatting. Do not use asterisks (*), hash symbols (#), or other markdown syntax in your response text. Write in clear, readable prose.

Structure the response as a JSON object with these sections:
{
  "executive_summary": "Brief overview and key recommendations",
  "skills_analysis": "Analysis of their skills and how to monetize them",
  "recommended_paths": [
    {
      "title": "Path name",
      "description": "Detailed description",
      "startup_cost": "Cost range",
      "time_commitment": "Hours per week",
      "income_potential": "Monthly income range",
      "steps": ["Step 1", "Step 2", ...]
    }
  ],
  "immediate_actions": ["Action 1", "Action 2", ...],
  "resources": [
    {
      "category": "Tools/Courses/Communities",
      "items": ["Resource 1", "Resource 2", ...]
    }
  ],
  "ninety_day_plan": {
    "month_1": ["Goal 1", "Goal 2", ...],
    "month_2": ["Goal 1", "Goal 2", ...],
    "month_3": ["Goal 1", "Goal 2", ...]
  }
}`;

    const userPrompt = `Create a personalized side income blueprint for:

Current Situation:
- Employment: ${assessmentData.employmentStatus}
- Monthly Income: ${assessmentData.currentIncome}
- Available Time: ${assessmentData.timeAvailable} hours/week
- Timeline: ${assessmentData.timeframe}
- Work Environment: ${assessmentData.workEnvironment}
- Client Interaction: ${assessmentData.clientInteraction}
- Skills: ${assessmentData.skills?.join(', ')}
- Goals: ${assessmentData.goals}
- Budget: ${assessmentData.startupBudget}
- Risk Tolerance: ${assessmentData.riskTolerance}
${assessmentData.constraints ? `- Constraints: ${assessmentData.constraints}` : ''}
${assessmentData.dealBreakers ? `- Deal Breakers: ${assessmentData.dealBreakers}` : ''}

Create 3-5 specific, actionable side income paths ranked by feasibility based on their unique situation.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('Failed to generate report');
    }

    const aiData = await aiResponse.json();
    const reportContent = JSON.parse(aiData.choices[0].message.content);
    
    // Sanitize the report content to remove excessive markdown
    const sanitizedReport = sanitizeObject(reportContent);

    // Save the report
    const { data: newReport, error: insertError } = await supabase
      .from('side_income_reports')
      .insert({
        assessment_id: assessmentId,
        user_id: assessment.user_id,
        report_content: sanitizedReport
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving report:', insertError);
      throw new Error('Failed to save report');
    }

    return new Response(
      JSON.stringify({ report: newReport }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-side-income-report:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});