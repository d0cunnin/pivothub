import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { question, answer, questionType, jobTitle } = await req.json();
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are an expert interview coach with extensive experience helping candidates improve their interview performance. Analyze the candidate's answer and provide detailed, actionable feedback.

    Question: ${question}
    Question Type: ${questionType}
    Job Title: ${jobTitle}
    Candidate's Answer: ${answer}

    Provide comprehensive feedback including:
    1. Overall assessment and score (1-10)
    2. Specific strengths in their answer
    3. Areas for improvement with detailed suggestions
    4. STAR method analysis (if applicable)
    5. Missing elements they should have included
    6. Suggested improved answer structure
    7. Industry-specific advice for this role
    8. Body language and delivery tips

    Focus on:
    - Specific, actionable improvements
    - Examples of better phrasing or content
    - What interviewers are really looking for
    - How to quantify achievements and impact
    - Communication style and confidence building

    Return as a JSON object with this structure:
    {
      "overallScore": 7.5,
      "strengths": ["strength1", "strength2"],
      "improvementAreas": [
        {
          "area": "Specific improvement needed",
          "suggestion": "Detailed suggestion on how to improve",
          "example": "Example of better phrasing"
        }
      ],
      "starAnalysis": {
        "situation": {
          "present": true,
          "feedback": "Well described situation"
        },
        "task": {
          "present": false,
          "feedback": "Need to clarify your specific task"
        },
        "action": {
          "present": true,
          "feedback": "Good action description"
        },
        "result": {
          "present": false,
          "feedback": "Missing quantifiable results"
        }
      },
      "missingElements": ["element1", "element2"],
      "improvedAnswerStructure": "Suggested structure for a stronger answer",
      "industryTips": ["tip1", "tip2"],
      "deliveryTips": ["tip1", "tip2"],
      "confidence": 6,
      "clarity": 8,
      "relevance": 7,
      "detailedFeedback": "Comprehensive written feedback paragraph"
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Please analyze this interview answer and provide detailed feedback.` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to analyze answer');
    }

    let feedback;
    try {
      feedback = JSON.parse(data.choices[0].message.content);
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

    return new Response(
      JSON.stringify({ feedback }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error analyzing interview answer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});