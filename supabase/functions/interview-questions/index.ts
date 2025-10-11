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

    const systemPrompt = `You are an expert interview coach and psychology expert specializing in creating realistic, insightful interview questions. You understand the hidden agenda behind every interview question and can teach candidates how to truly impress hiring managers.

    Job Title: ${jobTitle}
    Industry: ${industry || 'Not specified'}
    Experience Level: ${level}
    Question Types: ${questionTypes.join(', ')}
    Job Description: ${jobDescription || 'Not provided'}

    Generate ${questionTypes.length * 3} high-quality, realistic interview questions that are actually asked for ${jobTitle} roles in ${industry || 'this industry'}.

    For EACH question, provide comprehensive insights that reveal the psychology and strategy behind it.

    IMPORTANT: Do NOT use markdown formatting like ### headers, ** bold, or * italics
    Return clean text in JSON format only
    
    Return as a JSON array with this EXACT structure:
    [
      {
        "id": "unique_id",
        "text": "Question text exactly as an interviewer would ask it?",
        "type": "behavioral|technical|situational",
        "difficulty": "${level}",
        "guidance": "What the interviewer is looking for in 1-2 sentences",
        "whyTheyAskThis": "2-3 sentences explaining the hidden psychology: What are they REALLY testing? What underlying concerns or red flags are they checking for? How does this question help them evaluate cultural fit, skills, or potential?",
        "redFlags": [
          "Red flag 1: Specific behavior or response that raises concerns",
          "Red flag 2: Another warning sign interviewers watch for",
          "Red flag 3: Common mistake candidates make"
        ],
        "idealAnswerStructure": {
          "framework": "STAR|Problem-Solution-Result|Technical Deep Dive",
          "situation": "What to include in situation setup (1 sentence guidance)",
          "task": "How to frame your specific responsibility (1 sentence)",
          "action": "Key elements to emphasize in your actions (2 sentences)",
          "result": "What kind of quantified outcome to highlight (1 sentence)"
        },
        "companyResearchTips": [
          "Research their tech stack from job posting or engineering blog",
          "Check recent company news and product launches",
          "Review Glassdoor for common interview questions at this company"
        ],
        "industryTerminology": [
          "CI/CD pipeline",
          "Microservices architecture",
          "Load balancing",
          "Technical debt"
        ],
        "followUpQuestions": [
          "How would you approach this differently now with what you learned?",
          "What would you do if the same issue happened again?",
          "How did you communicate this challenge to stakeholders?"
        ],
        "videoInterviewTips": {
          "bodyLanguage": "Specific posture, gesture, or eye contact advice for video",
          "tone": "How to modulate voice (confident but not arrogant, enthusiastic)",
          "pacing": "When to pause for emphasis, how fast to speak",
          "setup": "Camera angle, lighting, background recommendations"
        }
      }
    ]

    QUALITY STANDARDS:
    • Questions must be realistic for ${level} ${jobTitle} interviews
    • Industry terminology must be accurate for ${industry || 'the field'}
    • Provide strategic, psychology-based insights
    • Red flags should be specific and actionable
    • Follow-up questions should feel natural
    • Video tips should be concrete and helpful`;

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
        max_completion_tokens: 3500,
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