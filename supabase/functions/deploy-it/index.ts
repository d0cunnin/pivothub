import { withCreditRequest } from '../_shared/guard.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { guard, deductCreditsOnSuccess, corsHeaders } from '../_shared/guard.ts';
import { systemUser } from '../_shared/aiGenerate.ts';
import { generateCoveredReport } from '../_shared/coveredReport.ts';
import { moderateContent } from '../_shared/moderation.ts';

const COST = 3;

const PLATFORMS: Record<string, string> = {
  'chatgpt': 'ChatGPT (custom GPT)',
  'gemini': 'Google Gemini (Gem)',
  'claude': 'Claude (Project)',
  'copilot': 'Microsoft Copilot (agent)',
  'automation': 'Zapier or Make (automation)',
  'not-sure': 'Not sure: recommend one',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(withCreditRequest(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let guardResult;
  try {
    guardResult = await guard(req, {
      endpoint: '/deploy-it',
      cost: COST,
      requireAuth: true,
      requireCaptcha: false
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Guard error:', err);
    return json({ error: err instanceof Error ? err.message : 'Guard check failed' }, 400);
  }

  const { supabase, userId } = guardResult;

  try {
    const body = await req.json();
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const agentName = str(body.agentName, 120);
    const purpose = str(body.purpose, 2000);
    const whoItHelps = str(body.whoItHelps, 500);
    const tone = str(body.tone, 60);
    const safetyRules = str(body.safetyRules, 2000);
    const platform = PLATFORMS[str(body.platform, 40)] ?? PLATFORMS['not-sure'];
    const tools: string[] = Array.isArray(body.tools) ? body.tools.filter((t: unknown) => typeof t === 'string').slice(0, 20) : [];

    if (!agentName || !purpose || !whoItHelps) {
      return json({ error: 'Please fill in the agent name, what it should do, and who it helps.' }, 400);
    }

    const moderation = await moderateContent(`${agentName} ${purpose} ${whoItHelps} ${safetyRules}`, 'deploy-it', userId);
    if (moderation.flagged) {
      return json({ error: 'This request includes content we cannot help with. Please revise it and try again.' }, 400);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('AI service not configured');

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const systemPrompt = `You are PivotHub's AI agent setup guide. You help non-technical people (small business owners, educators, job seekers, creators) plan and set up a simple AI assistant or automation on a consumer platform, in plain language a beginner can follow.

=== WHAT THE USER WANTS (the only source of facts) ===
Today's date: ${today}
Agent name: ${agentName}
What it should do: ${purpose}
Who it helps: ${whoItHelps}
Tone / personality: ${tone || 'not provided'}
Preferred platform: ${platform}
Tools to connect: ${tools.length ? tools.join(', ') : 'none selected'}
Their safety rules or limits: ${safetyRules || 'none provided'}

=== RULES ===
- Write for a beginner: short sentences, everyday words, explain any technical term in a few words. No enterprise language (no SOC2, HIPAA programs, "change management" or architecture diagrams).
- Be honest about what is possible. If what they want needs actions a chat assistant cannot take on its own (for example sending emails or moving files automatically), say so plainly and show the simplest way to do it (for example a Zapier or Make automation, or the platform's built-in connectors), or suggest a simpler version.
- Platform menus and features change often. Describe steps by what to look for ("open the option to create a new GPT"), say that names may differ slightly, and tell them to check the platform's own help page if something looks different. Never invent exact button names, prices, plan names or limits as fact; say "check current pricing" for costs, and note when a feature usually needs a paid plan.
- Respect their safety rules and add sensible ones (ask before deleting or sending, never share private data, keep a human in the loop for important decisions).
- Address every tool they selected.

=== WRITE THIS GUIDE IN MARKDOWN, WITH THESE SECTIONS IN ORDER ===
## Our Understanding of Your Agent
3-5 sentences in your own words: what the agent will do, for whom, and what success looks like.
## Is This the Right Approach?
Whether a chat assistant, an automation, or a mix fits this goal best, and why.
## Recommended Platform
If they chose one, confirm it fits or explain any limits and a better option. If they are not sure, recommend one and say why. Mention whether it usually needs a paid plan.
## What Your Agent Will and Won't Do
Two short lists that set clear expectations.
## Your Agent's Instructions (copy and paste)
A complete instruction text in a code block (\`\`\`), written in their tone, including role, tasks, step-by-step behavior, what to ask the user, and their safety rules. Use [brackets] for any detail they must fill in.
## Step-by-Step Setup
Numbered beginner steps on their platform, from creating an account to testing.
## Connecting Your Tools
For each selected tool: whether it can connect directly on this platform or needs an automation tool, simple steps, and the smallest permissions to grant. If no tools were selected, say whether any would help.
## Safety and Privacy Checklist
Their rules plus recommended ones, as a checklist.
## Test Your Agent
6-8 test messages to try, each with what a good response looks like, including one that checks each safety rule.
## Costs to Expect
What usually costs money (platform plan, automation tool tasks) as general guidance to check, not exact prices.
## Your Next Steps
3-5 actions to take this week.`;

    let guide: string;
    try {
      guide = await generateCoveredReport(
        LOVABLE_API_KEY,
        systemUser(systemPrompt, `Write the setup guide for "${agentName}".`),
        { maxTokens: 6000 },
        { 'Tool': tools },
      );
    } catch (err: any) {
      if (err?.status === 429) return json({ error: 'Rate limit exceeded. Please wait 1-2 minutes and try again.' });
      if (err?.status === 402) return json({ error: 'Our AI service is temporarily unavailable. Please try again later. You were not charged.' });
      console.error('[deploy-it] Generation failed:', err?.message);
      return json({ error: 'We could not create your guide right now. Please try again in a moment. You were not charged.' });
    }

    if (!guide || guide.trim().length < 500) {
      return json({ error: 'We could not create a complete guide. Please try again. You were not charged.' });
    }

    await deductCreditsOnSuccess(supabase, userId, '/deploy-it', COST);
    return json({ guide, platform, creditsUsed: COST });
  } catch (error: any) {
    if (error instanceof Response) return error;
    console.error('Error in deploy-it function:', error);
    return json({ error: 'Something went wrong. Please try again. You were not charged.' }, 500);
  }
}));
