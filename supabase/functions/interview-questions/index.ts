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
    const { jobTitle, industry, level, questionTypes, jobDescription } = await req.json();
    
    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

    const systemPrompt = `You are an expert interview coach specializing in creating realistic, tailored interview questions. Generate ${questionTypes.length * 3} high-quality interview questions based on the provided job details.

    Job Title: ${jobTitle}
    Industry: ${industry || 'Not specified'}
    Experience Level: ${level}
    Question Types: ${questionTypes.join(', ')}
    Job Description: ${jobDescription || 'Not provided'}

    For each question, provide:
    1. The question text
    2. Question type (behavioral, technical, or situational)
    3. Difficulty level
    4. Brief guidance on what the interviewer is looking for

    Focus on:
    - Real questions commonly asked for this role
    - Industry-specific scenarios and challenges
    - Level-appropriate complexity
    - Current industry trends and technologies
    
    IMPORTANT: Do NOT use markdown formatting like ### headers, ** bold, or * italics
    Return clean text in JSON format only
    
    Return as a JSON array with this structure:
    [
      {
        "id": "unique_id",
        "text": "Question text here?",
        "type": "behavioral|technical|situational",
        "difficulty": "${level}",
        "guidance": "Brief explanation of what interviewers want to hear"
      }
    ]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate interview questions for this ${jobTitle} position.` }
        ],
        max_completion_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate questions');
    }

    let questions;
    try {
      const aiResponse = data.choices[0].message.content;
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
      const content = data.choices[0].message.content;
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
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});