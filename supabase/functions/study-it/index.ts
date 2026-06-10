import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from '../_shared/moderation.ts';
import { generateText, systemUser } from '../_shared/aiGenerate.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface StudyItRequest {
  topic: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Rate limiting: 5 requests per hour
    const { error: throttleError } = await supabase.rpc('throttle_user', {
      p_user_id: userId,
      p_endpoint: 'study-it',
      p_window_seconds: 3600,
      p_max_reqs: 5
    });

    if (throttleError) {
      console.error('Throttle error:', throttleError);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: StudyItRequest = await req.json();
    const { topic } = body;

    // Validate required field
    if (!topic?.trim()) {
      return new Response(JSON.stringify({ error: 'Missing required field: topic' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Moderate content
    const moderation = await moderateContent(topic, 'study-it', userId, 'medium');
    if (moderation.flagged) {
      return new Response(JSON.stringify({ 
        error: 'Content flagged by moderation',
        details: moderation.categories 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check and deduct credits (2 credits)
    const { data: usageData, error: usageError } = await supabase.rpc('check_and_increment_ai_usage', {
      p_user_id: userId,
      p_tool_name: 'study-it',
      p_credits_to_use: 2,
    });

    if (usageError || !usageData?.can_use) {
      return new Response(JSON.stringify({
        error: 'Insufficient credits',
        reason: usageData?.reason || 'Unknown error',
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build the system prompt with strict behavior rules
    const systemPrompt = `You are STUDY IT, a biblical reference assistant.

Your role is to present accurate, neutral, scripture-based reference information for a given biblical topic. You must NOT interpret, teach, preach, apply, or expand beyond the required sections.

Your output must remain factual, concise, and structured.

=== STRICT BEHAVIOR RULES ===
You MUST NOT:
- Preach or exhort
- Teach or interpret scripture
- Add reflections, devotionals, or applications
- Harmonize or explain passages
- Add conclusions or summaries
- Include modern commentary
- Add personal opinions or theological positions
- Provide spiritual guidance or advice

You MUST:
- Present only biblical reference data
- Use neutral, academic tone
- Provide factual etymology information
- Include actual Strong's Concordance entries
- List scripture references without explanation
- Keep all content factual and verifiable

=== REQUIRED OUTPUT SECTIONS ===
Generate EXACTLY the following 5 sections in this order, using markdown ## headers:

## 1. Definition
A concise, biblically grounded definition of the topic.
- Neutral and academic tone
- No exhortation or application
- No modern commentary
- 2-4 sentences maximum

## 2. Etymology
A brief breakdown of:
- Original biblical language(s) (Hebrew and/or Greek)
- Root words with original script (e.g., חֵן, χάρις)
- Transliteration
- Literal or primary meanings
- Factual and academic only

## 3. Strong's Concordance Entries
Relevant Strong's entries associated with the topic, including:
- Strong's number (e.g., H2580, G5485)
- Original word in Hebrew/Greek script
- Transliteration
- Short definition
Include only directly related entries. Format as a bullet list.

## 4. Old Testament Scriptures
A list of key Old Testament references connected to the topic.
- Book, chapter, and verse only (e.g., Genesis 6:8)
- No paraphrasing
- No explanations or commentary
- List 5-15 most relevant references

## 5. New Testament Scriptures
A list of key New Testament references connected to the topic.
- Book, chapter, and verse only (e.g., John 1:14)
- No paraphrasing
- No explanations or commentary
- List 5-15 most relevant references

=== FORMAT REQUIREMENTS ===
- Use markdown formatting
- Use ## for section headers
- Use bullet points for lists
- Use **bold** for Hebrew/Greek terms
- Keep content minimal, clean, and study-ready
- No additional sections, conclusions, or summaries`;

    // Call Lovable AI
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const maxTokens = 4000;
    let content: string;
    try {
      content = await generateText(
        lovableKey,
        systemUser(systemPrompt, `Generate a structured biblical reference for the topic: "${topic.trim()}"`),
        { maxTokens }
      );
    } catch (err: any) {
      if (err?.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Please try again in a few minutes.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (err?.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('[study-it] Generation failed:', err?.message);
      return new Response(JSON.stringify({ error: 'AI service is temporarily unavailable. Please try again in a moment.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Study It reference generated for user ${userId}: "${topic}"`);

    return new Response(JSON.stringify({
      content,
      creditsUsed: 2,
      remaining: usageData.remaining
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Study It error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
