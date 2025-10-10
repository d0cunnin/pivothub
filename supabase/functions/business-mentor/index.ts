import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  isBot: z.boolean()
});

const businessMentorSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
  conversationHistory: z.array(chatMessageSchema).max(20, "Conversation history too long").default([])
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Validate input
    const validation = businessMentorSchema.safeParse(requestBody);
    if (!validation.success) {
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

    const { message, conversationHistory } = validation.data;

    const openAIApiKey = Deno.env.get('relaunch_openai_key');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }
    
    console.log('Processing business mentor chat with GPT-5...');

    const systemPrompt = `You are an experienced business mentor with 20+ years of experience helping entrepreneurs build successful companies. You provide practical, actionable advice with specific examples and next steps.

IMPORTANT GUIDELINES:
- Give specific, actionable advice with concrete examples
- Reference current business trends and proven strategies when relevant
- Ask clarifying questions to better understand their situation
- Structure responses with clear sections and bullet points
- Include both immediate actions (this week) and strategic moves (1-3 months)
- Be encouraging but realistic about challenges
- Draw from real business case studies and examples
- Provide resource recommendations when helpful

Response Style:
- Keep responses focused and practical (300-500 words)
- Use bullet points for action items
- Include specific metrics or benchmarks when relevant
- End with a follow-up question to continue the conversation

Context: You're chatting with an entrepreneur who needs guidance on their business journey.`;

    // Format messages for OpenAI API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.isBot ? 'assistant' : 'user',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    console.log('Calling OpenAI API for business mentor chat...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: messages,
        max_completion_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const aiResponse = data.choices[0].message.content;

    // Clean up the response
    const sanitizedResponse = aiResponse
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .trim();

    return new Response(JSON.stringify({ 
      response: sanitizedResponse 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in business-mentor function:', error);
    
    // Provide helpful fallback response
    const fallbackResponse = "I apologize, but I'm having trouble connecting right now. Here's some general advice: Start by clearly defining your target customer and their biggest pain point. Focus on solving one problem really well before expanding. Would you like to share more about your specific business challenge so I can provide more targeted guidance when the connection is restored?";
    
    return new Response(JSON.stringify({ 
      response: fallbackResponse,
      error: 'Temporary service issue'
    }), {
      status: 200, // Return 200 to provide fallback response
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});