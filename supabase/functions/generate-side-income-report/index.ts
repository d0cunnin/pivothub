import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

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

    if (assessment.payment_status !== 'paid') {
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
- Skills: ${assessmentData.skills?.join(', ')}
- Interests: ${assessmentData.interests?.join(', ')}
- Goals: ${assessmentData.goals}
- Budget: ${assessmentData.startupBudget}

Create 3-5 specific, actionable side income paths ranked by feasibility.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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

    // Save the report
    const { data: newReport, error: insertError } = await supabase
      .from('side_income_reports')
      .insert({
        assessment_id: assessmentId,
        user_id: assessment.user_id,
        report_content: reportContent
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