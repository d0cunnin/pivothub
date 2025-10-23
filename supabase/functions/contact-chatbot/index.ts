import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content moderation function using Lovable AI (via OpenAI compatible endpoint)
async function moderateContent(text: string, apiKey: string): Promise<{ flagged: boolean; categories?: string[] }> {
  try {
    // Use OpenAI moderation API directly for content filtering
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('relaunch_openai_key') || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        model: 'omni-moderation-latest'
      }),
    });

    if (!response.ok) {
      console.error('Moderation API error:', response.status);
      return { flagged: false }; // Fail open on API error
    }

    const data = await response.json();
    const result = data.results?.[0];
    
    if (result?.flagged) {
      const flaggedCategories = Object.keys(result.categories || {})
        .filter(key => result.categories[key]);
      console.log('Content flagged:', flaggedCategories);
      return { flagged: true, categories: flaggedCategories };
    }

    return { flagged: false };
  } catch (error) {
    console.error('Moderation check failed:', error);
    return { flagged: false }; // Fail open on error
  }
}

const SYSTEM_PROMPT = `You are PivotHub's AI customer support assistant. Your role is to help users with:

1. Questions about subscription plans (Free Trial, Pro, Premium)
2. Account management (cancellation, settings, deletion)
3. Platform features:
   - Upskill: Career assessments and skills development courses
   - HireYourself: Business launch tools including business plans, pitch decks, legal docs
   - TeachIt: Teaching materials generator for educators
   - LaunchIt: Startup resources and strategy tools
   - Grant Writing: Grant finder and proposal generator
   - Side Income Blueprint: Personalized side income assessment and report ($9.99)
4. Technical support and navigation
5. Billing and payment inquiries

Company Information:
- Email: support@pivothub.io
- Phone: +1 (555) 123-4567
- Address: PO Box 2025 Kalamazoo, MI 49003
- Hours: Mon - Fri: 9:00 AM - 6:00 PM EST

When users need to manage their account, direct them to:
- View/cancel subscription → /settings page
- Upgrade subscription → /pricing page
- Contact human support → Use the contact form

Be helpful, concise, and always offer next steps. Keep responses under 150 words unless the user asks for more detail.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('API key not configured');
    }

    // Check content moderation on the last user message
    const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    if (lastUserMessage?.content) {
      console.log('Checking content moderation...');
      const moderationResult = await moderateContent(lastUserMessage.content, LOVABLE_API_KEY);
      
      if (moderationResult.flagged) {
        console.warn('Content blocked by moderation:', moderationResult.categories);
        return new Response(
          JSON.stringify({ 
            error: 'inappropriate_content',
            message: 'Your message contains inappropriate content and cannot be processed. Please keep the conversation professional and respectful.'
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    console.log('Processing chat request with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    // Stream the response
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in contact-chatbot function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
