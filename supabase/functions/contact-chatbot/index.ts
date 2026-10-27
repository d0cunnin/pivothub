import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { moderateContent } from "../_shared/moderation.ts";
import { guard } from "../_shared/guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are PivotHub's AI customer support assistant. Your ONLY role is to help users with platform-related questions.

**WHAT YOU CAN HELP WITH:**

1. **Subscription Plans:**
   - Free plan: 5 credits per month on the day they signed up; unused free credits do not carry over
   - Starter: $12/month, 40 credits
   - Pro: $24/month, 100 credits
   - All-Access: $35/month, 250 credits (includes everything)
   - Paid plan credits are added each time the monthly payment goes through and last 3 months, so unused credits carry over until then
   - Extra credit packs: $5 for 25, $10 for 70, $20 for 150 (paid plans only, one-time payment, credits last 3 months)
   - Credits are only used when a tool delivers results

   **Billing rules (state these exactly; never promise anything else):**
   - Changing plans happens in Settings. Bigger plan: pay the price difference for the rest of the month now; extra credits are added once that payment goes through. Smaller plan: starts on the next billing date.
   - Cancelling happens in Settings. No further charges; the plan stays until the end of the paid month, then the account moves to the Free plan. Credits already received can be used until they expire.
   - Failed payment: Stripe retries the card automatically. Update the card in Settings under Billing History & Payment Method. New monthly credits are added only after payment goes through.
   - Refunds: never automatic; reviewed individually by human support (support@pivothub.io or 269.998.4203). If a payment is refunded, the credits from that payment are removed. Never promise or deny a refund yourself.

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
   - Tech Readiness Assessment (2 credits)

   **Prep It:**
   - Career Advisor Chatbot (1 credit per message)
   - Interview Practice Session (3 credits - questions plus feedback on every answer)
   - Resume & Cover Letter Coach (2 credits)
   - Resume Builder (5 credits)

   **Learn It (tech & AI tools):**
   - Prompt It (1 credit), Code It (1 credit), Study It (2 credits)
   - Deploy It - AI agent blueprint (40 credits)

   **Create It:**
   - AI Platform Blueprint (70 credits)

   **Build It:**
   - Business Idea Generator (2 credits)
   - Business Name Checker (2 credits)
   - Business Foundation Builder (2 credits)
   - Business Plan Generator (4 credits)
   - Marketing Strategy Generator (3 credits)
   - Pitch Deck Generator (3 credits)
   - Logo Generator (2 credits)
   - Biography Generator (3 credits)
   - Legal Documents Generator (2 credits)
   - Startup Checklist (2 credits)
   - Social Media Content Generator (2 credits)
   - Business Mentor Chatbot (1 credit per message)
   - Business Resources Finder (1 credit)

   **Teach It:**
   - Teaching Materials Generator (5 credits)
   - Lesson Plan Generator (3 credits), Quiz Generator (2 credits), Rubric Builder (2 credits)

   **Launch It:**
   - Launch Strategy Generator (3 credits)

   **Fund It:**
   - LOI & Grant Proposal Generator (5 credits)
   - Grant Resources - external links (free)

   **Earn It:**
   - Side Income Blueprint (3 credits) - assessment plus a personalized plan with income ideas, a 90-day plan and PDF

   **Schedule It:** Schedule Builder (5 credits)
   **Host It:** Event Planning Generator (4 credits)
   **Speak It:** Speaker or Podcast Launch Plan (3 credits)
   **Garden It:** Garden Plan Generator (3 credits)
   **Act It:** Story Concept Generator (3 credits)
   **Develop It:** Program Builder (4), Grant Readiness (3), Community Assessment (3), Stakeholder Planner (3), Community Development Coach (1 per message)
   **Contract It:** Capability Statement (4 credits), Contract Readiness Assessment (3 credits)

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
- NEVER tell users we have a "free trial" - we have a "Free plan" (5 free credits per month)

---

**Quick Actions for Users:**
- View/cancel subscription → /settings page
- Start a paid plan → /pricing page
- Change an existing plan → /settings page
- Contact human support → support@pivothub.io or 269.998.4203

---

**Response Guidelines:**
- Be professional, helpful, and concise
- Keep responses under 150 words unless more detail is requested
- Always stay within your defined scope
- When unsure, direct users to human support
- Mention that paid plan credits last 3 months (Free plan credits do not carry over) when it helps`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Requires a signed-in user and rate-limits requests, since this calls the AI.
  try {
    await guard(req, { endpoint: 'contact-chatbot', cost: 0, requireAuth: true, maxReqsPerMinute: 20 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[contact-chatbot] Guard error:', err);
    return new Response(JSON.stringify({ error: 'Request could not be verified. Please sign in and try again.' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
      const moderationResult = await moderateContent(lastUserMessage.content, 'contact-chatbot', undefined, 'medium');
      
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
        model: 'google/gemini-3.8-flash',
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
