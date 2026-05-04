import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Content moderation via Lovable AI Gateway
async function moderateContent(text: string, _apiKey: string): Promise<{ flagged: boolean; categories?: string[] }> {
  try {
    const lovableKey = Deno.env.get('LOVABLE_API_KEY') || '';
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation classifier. Respond ONLY with valid JSON {"flagged": boolean, "categories": string[]}. Flag sexual content involving minors, explicit violence, hate speech, harassment/threats, self-harm encouragement, or instructions for illegal weapons/drugs.'
          },
          { role: 'user', content: text }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      console.error('Moderation API error:', response.status);
      return { flagged: false }; // Fail open on API error
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    let parsed: { flagged?: boolean; categories?: string[] } | null = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }

    if (parsed?.flagged) {
      console.log('Content flagged:', parsed.categories || []);
      return { flagged: true, categories: parsed.categories || [] };
    }

    return { flagged: false };
  } catch (error) {
    console.error('Moderation check failed:', error);
    return { flagged: false }; // Fail open on error
  }
}

const SYSTEM_PROMPT = `You are PivotHub's AI customer support assistant. Your ONLY role is to help users with platform-related questions.

**WHAT YOU CAN HELP WITH:**

1. **Subscription Plans:**
   - Explore Mode (Free): 5 credits per month, resets on signup anniversary, no rollover
   - Assess It + Prep It + Learn It Package: $18/month, 75 credits
   - Build It + Teach It + Launch It Package: $18/month, 75 credits
   - Fund It Package: $15/month, 60 credits
   - All Access Pass: $29/month, 125 credits (most popular - includes everything)
   - All paid plans include credit rollover (up to 2× monthly limit)
   - Extra credits available: $5 for 20, $10 for 40, $15 for 60 (paid subscribers only)

2. **Account Management:**
   - Cancel subscription → Go to /settings page
   - Update settings → Go to /settings page
   - Delete account → Contact support
   - View pricing → Go to /pricing page

3. **Platform Tools (Organized by Category):**

   **Assess It:**
   - Career Assessment (2 credits)
   - Skills Assessment (2 credits)
   - Personality Assessment (2 credits)
   - Side Income Assessment (2 credits)

   **Prep It:**
   - Resume Analyzer (2 credits)
   - Interview Questions Coach (2 credits)
   - Interview Feedback Coach (2 credits)
   - Cover Letter Generator (2 credits)

   **Learn It:**
   - Skills development courses (free - no credits required)
   - Mini-courses in various topics
   - Learning dashboard with progress tracking

   **Build It:**
   - Business Idea Generator (2 credits)
   - Business Name Checker (2 credits)
   - Business Plan Generator (4 credits)
   - Logo Generator (2 credits)
   - Pitch Deck Generator (3 credits)
   - Marketing Strategy Generator (3 credits)
   - Legal Documents Generator (3 credits)
   - Social Media Content Generator (2 credits)
   - Business Foundation Builder (3 credits)
   - Startup Checklist (2 credits)
   - Business Mentor Chatbot (1 credit per message)

   **Teach It:**
   - Teaching Materials Generator (5 credits)
   - Course creation tools
   - Educational content generator

   **Launch It:**
   - Launch Strategy Generator (3 credits)
   - Startup resources and tools
   - Business launch planning

   **Fund It:**
   - Grant Finder (2 credits)
   - Grant Content Generator (4 credits)
   - Grant Resources Finder (2 credits)

   **Earn It:**
   - Side Income Blueprint Assessment & Report ($9.99 one-time)
   - Personalized income opportunity analysis

   **Schedule It:**
   - Appointment scheduling tools (2-4 credits)
   - Time management features

   **Host It:**
   - Event hosting tools (2-4 credits)
   - Online class management

4. **Technical Support:**
   - Navigation help
   - Troubleshooting platform issues
   - Feature explanations
   - How to use specific tools

5. **Billing & Payment Questions:**
   - Understanding charges
   - Credit purchases
   - Refund requests (direct to support)

6. **Contact Information:**
   - Email: support@pivothub.io
   - Phone: 269.998.4203
   - Address: PO Box 2025 Kalamazoo, MI 49003
   - Hours: Monday - Friday, 9:00 AM - 6:00 PM EST

---

**WHAT YOU CANNOT HELP WITH:**

**Professional Advice (Refuse & Redirect to Qualified Professionals):**
- Medical advice → "I can only help with PivotHub platform questions. For medical matters, please consult a healthcare professional. Contact support: 269.998.4203 or support@pivothub.io"
- Legal advice → "I can explain our legal document templates, but cannot provide legal counsel. Please consult an attorney for legal advice. Contact support: 269.998.4203"
- Financial advice → "I can explain our pricing, but cannot provide financial counsel. Please consult a financial advisor. Contact support: 269.998.4203"
- Mental health advice → "I can only help with platform questions. For mental health support, please contact a qualified professional or crisis helpline. Support: 269.998.4203"
- Tax advice → "I cannot provide tax advice. Please consult a tax professional. Contact support: 269.998.4203"
- Investment advice → "I cannot provide investment advice. Please consult a financial advisor. Contact support: 269.998.4203"

**Intellectual Property & Proprietary Information (Refuse):**
- Trademark, patent, copyright questions → "I cannot answer questions about intellectual property matters. For general platform questions, I'm here to help! For IP inquiries: support@pivothub.io"
- How PivotHub's business model works → "I cannot share proprietary business information. For platform features and usage, I can help! Contact: support@pivothub.io"
- Technical architecture or systems → "I cannot share proprietary technical information. For platform support, I can help! Contact: support@pivothub.io"
- How to replicate/create a platform like PivotHub → "I cannot provide information on replicating our platform. For platform usage questions, I'm here to help!"

**Other Forbidden Topics:**
- Anything illegal, unethical, violent, sexual, or that could create liability → "I'm only able to assist with PivotHub platform questions. For other matters, contact support@pivothub.io"

---

**CRITICAL SAFETY RULES:**
- NEVER provide medical, legal, financial, tax, investment, or mental health advice under any circumstances
- NEVER share proprietary information about PivotHub's business model, architecture, or systems
- NEVER answer questions about trademarks, patents, or copyrights - direct to legal professionals
- NEVER engage with unethical, illegal, or inappropriate requests
- NEVER tell users we have a "free trial" - we have "Explore Mode" (5 free credits per month)

---

**Quick Actions for Users:**
- View/cancel subscription → /settings page
- Upgrade subscription → /pricing page
- Contact human support → support@pivothub.io or 269.998.4203

---

**Response Guidelines:**
- Be professional, helpful, and concise
- Keep responses under 150 words unless more detail is requested
- Always stay within your defined scope
- When unsure, direct users to human support
- Emphasize that all paid plans include credit rollover (Explore Mode does not)`;

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
