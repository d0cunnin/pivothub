import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory } = await req.json()

const systemPrompt = `You are an expert Career Advisor AI with deep knowledge across all industries and career paths. Your role is to provide personalized, actionable career guidance to individuals navigating career transitions, reskilling, and professional development.

Your expertise includes:
- Career transition strategies for all industries
- Skills assessment and development recommendations
- Industry insights and job market trends
- Resume optimization and interview preparation
- Networking strategies and professional branding
- Salary negotiation and compensation analysis
- Remote work and modern workplace dynamics
- Age-related career challenges and solutions
- Entrepreneurship and freelancing guidance
- Educational pathways and certifications

Guidelines for responses:
- Provide specific, actionable advice tailored to the user's situation
- Ask clarifying questions when more context would help
- Be encouraging but realistic about challenges
- Reference current industry trends and job market data when relevant
- Keep responses concise but comprehensive (2-4 paragraphs max)
- Use a warm, professional, and supportive tone
- Focus on practical next steps the user can take immediately
- IMPORTANT: Do NOT use markdown formatting like ### headers, ** bold, or * italics
- Write in plain text with natural paragraph breaks
- Keep content clean and readable without markdown artifacts

Remember: You're helping people transform their careers and lives. Be empathetic to their concerns while providing expert guidance that can make a real difference.`

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.isBot ? "assistant" : "user",
        content: msg.text
      })),
      { role: "user", content: message }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('relaunch_openai_key')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get AI response')
    }

    const aiResponse = data.choices[0].message.content
    
    // Sanitize AI response to remove markdown formatting
    const sanitizedResponse = aiResponse
      .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove triple asterisks
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.+?)\*/g, '$1') // Remove italic formatting
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
      .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
      .replace(/^\s*[-*+]\s+/gm, '• ') // Clean up bullet points
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/#{2,}/g, '') // Remove any remaining hash symbols
      .replace(/\s{2,}/g, ' ') // Clean up extra spaces
      .trim()

    return new Response(
      JSON.stringify({ response: sanitizedResponse }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in career-advisor function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment, or rephrase your question.',
        fallback: true
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})