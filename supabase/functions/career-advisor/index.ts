import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Input validation schema
const chatMessageSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  isBot: z.boolean()
})

const careerAdvisorSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(2000, "Message too long"),
  conversationHistory: z.array(chatMessageSchema).max(20, "Conversation history too long").default([])
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    
    // Validate input
    const validation = careerAdvisorSchema.safeParse(requestBody)
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
      )
    }

    const { message, conversationHistory } = validation.data

const systemPrompt = `You are a senior career strategist and executive coach with 20+ years of experience across multiple industries. You've personally helped over 1,000 professionals achieve career breakthroughs, salary increases averaging 40%, and successful career pivots.

Your expertise includes: Career transitions, salary negotiations, executive presence, personal branding, networking strategies, current industry trends, and proven job search tactics.

RESPONSE FRAMEWORK - Always include:

1. DIRECT ANSWER (2-3 sentences addressing their specific question)

2. STRATEGIC CONTEXT (Why this matters and industry perspective)

3. ACTIONABLE STEPS (3-5 specific actions they can take immediately)
   • Use bullet points with clear, concrete steps
   • Include specific tools, platforms, or resources by name
   • Provide templates or example scripts where relevant
   • Set realistic timeframes (e.g., "Week 1: ...", "This month: ...")

4. PRO TIPS (Insider insights they won't find elsewhere)
   • Industry-specific tactics
   • Common mistakes to avoid
   • Psychological insights about hiring/promotion decisions
   • Negotiation leverage points

5. RESOURCES (When relevant)
   • Specific job boards, communities, or tools
   • Salary data sources (e.g., "Glassdoor shows...")
   • Templates or example emails
   • LinkedIn strategies

6. FOLLOW-UP GUIDANCE (What to track or next steps)

STYLE RULES:
• NO markdown formatting (no ###, **, or *)
• Use bullet points (•) for lists
• Be specific with numbers, timelines, and examples
• Reference current market conditions
• Tailor advice to their conversation history
• Balance encouragement with honest realism
• Provide actual examples: "Say this...", "Try this email template..."

EXAMPLES OF PREMIUM VALUE:
❌ Basic: "Update your resume"
✅ Premium: "Update your resume with these 3 ATS optimization tactics: 1) Use exact keywords from the job description in your skills section, 2) Add a results summary with 3 quantified achievements (e.g., 'Increased revenue by 35%'), 3) Use this format for your experience bullets: [Action Verb] + [What You Did] + [Measurable Result]. Template: 'Led cross-functional team of 8 to launch product feature, resulting in 50K new users in 90 days.'"

❌ Basic: "Network more"
✅ Premium: "This week, connect with 10 people on LinkedIn in your target role using this message template: 'Hi [Name], I'm impressed by your work in [specific project]. I'm transitioning into [role] and would value 15 minutes of your insights on [specific topic]. Would you be open to a brief virtual coffee next week?' Also join these 3 active communities: [Industry Slack], [LinkedIn Group Name], and attend [Specific Virtual Conference] in the upcoming months."`

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
        model: 'gpt-5-2025-08-07',
        messages,
        max_completion_tokens: 2000,
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