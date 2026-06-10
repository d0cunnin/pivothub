import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, deductCreditsOnSuccess, corsHeaders } from '../_shared/guard.ts';
import { generateJson, systemUser } from '../_shared/aiGenerate.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let guardResult;
  try {
    guardResult = await guard(req, {
      endpoint: '/deploy-it',
      cost: 10,
      requireAuth: true,
      requireCaptcha: false
    });
  } catch (err) {
    console.error('Guard error:', err);
    if (err instanceof Response) {
      return err;
    }
    return new Response(JSON.stringify({ error: err.message || 'Guard check failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { supabase, userId, ip, startTime } = guardResult;

  try {
    const { agentName, purpose, whoItHelps, tone, tools, safetyRules } = await req.json();

    if (!agentName || !purpose || !whoItHelps) {
      throw new Error('Agent name, purpose, and target audience are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Lovable AI key not configured');
    }

    const toolsList = tools && tools.length > 0 ? tools.join(', ') : 'No tools specified';
    const userPrompt = `Agent Name: ${agentName}
Purpose: ${purpose}
Who It Helps: ${whoItHelps}
Tone: ${tone || 'Professional'}
Tools to Connect: ${toolsList}
Safety Rules: ${safetyRules || 'No specific rules provided'}`;

    const systemPrompt = `PIVOTHUB MASTER PROMPT FRAMEWORK - ENTERPRISE AI IMPLEMENTATION STRATEGIST

=== CORE IDENTITY ===
You are a Chief Technology Officer and AI implementation expert who has deployed enterprise AI systems for Fortune 500 companies. You understand production-ready AI architecture, scalability, security, and ROI measurement.

EXPERTISE:
• AI agent architecture and design
• Production deployment and scaling strategies
• Security and compliance (SOC2, GDPR, HIPAA)
• ROI measurement and optimization
• Change management and user adoption
• Integration with existing systems
• Performance monitoring and observability

=== QUALITY STANDARDS ($10,000+ IMPLEMENTATION CONSULTING) ===
• Every response must rival a $10,000+ enterprise consulting engagement
• Provide production-ready implementation blueprints
• Include security, compliance, and scalability considerations
• All architectures must include monitoring and observability plans
• Include change management and user adoption strategies

AGENT CONTEXT:
- Agent Name: ${agentName}
- Purpose: ${purpose}
- Target Users: ${whoItHelps}
- Tone: ${tone || 'Professional'}
- Tools: ${toolsList}

Create a comprehensive AI agent deployment strategy that rivals enterprise-grade consulting.

Format your response as JSON with these keys:
- executiveSummary: string (3-4 sentence strategic overview)
- blueprint: string (detailed implementation plan with phases)
- architecture: string (system design and integration strategy)
- securityCompliance: string (security measures and compliance considerations)
- changeManagement: string (user adoption and training strategy)
- monitoringStrategy: string (performance tracking and optimization)
- tips: string (implementation best practices)
- resources: array of strings (technical resources and documentation)`;

    let result: any;
    try {
      result = await generateJson(LOVABLE_API_KEY, systemUser(systemPrompt, userPrompt), { maxTokens: 1500 });
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in Settings → Cloud → Usage.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      console.error('[deploy-it] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await deductCreditsOnSuccess(
      supabase,
      userId,
      '/deploy-it',
      10
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in deploy-it function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
