import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { moderateContent } from '../_shared/moderation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ActItRequest {
  projectTitle: string;
  genres: string[];
  format: string;
  targetAudience?: string;
  tone?: string;
  timePeriod?: string;
  settingPreference?: string;
  centralTheme?: string;
  hasFaithElements?: boolean;
  faithElementsDetails?: string;
  lengthPreference?: string;
}

const FORMAT_LABELS: Record<string, string> = {
  'stage-play': 'Stage Play',
  'film-feature': 'Film (Feature Length)',
  'short-film': 'Short Film',
  'web-series': 'Web Series',
  'one-act-play': 'One-Act Play',
  'skit-scene': 'Skit / Scene',
};

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

    // Rate limiting: 3 requests per hour
    const { error: throttleError } = await supabase.rpc('throttle_user', {
      p_user_id: userId,
      p_endpoint: 'act-it',
      p_window_seconds: 3600,
      p_max_reqs: 3
    });

    if (throttleError) {
      console.error('Throttle error:', throttleError);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ActItRequest = await req.json();
    const { 
      projectTitle, 
      genres, 
      format, 
      targetAudience, 
      tone, 
      timePeriod, 
      settingPreference, 
    centralTheme, 
    hasFaithElements,
    faithElementsDetails,
    lengthPreference 
  } = body;

    // Validate required fields
    if (!projectTitle || !genres?.length || !format) {
      return new Response(JSON.stringify({ error: 'Missing required fields: projectTitle, genres, and format are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Moderate content
    const moderationText = `${projectTitle} ${genres.join(' ')} ${centralTheme || ''} ${targetAudience || ''}`;
    const moderation = await moderateContent(moderationText, supabase, userId, 'act-it');
    if (moderation.flagged) {
      return new Response(JSON.stringify({ 
        error: 'Content flagged by moderation',
        details: moderation.categories 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check and deduct credits (3 credits)
    const { data: usageData, error: usageError } = await supabase.rpc('check_and_increment_ai_usage', {
      p_user_id: userId,
      p_tool_name: 'act-it',
      p_credits_to_use: 3,
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

    // Build the system prompt
    const formatLabel = FORMAT_LABELS[format] || format;
    
    const systemPrompt = `You are ACT IT, a creative development assistant that helps users build story concepts for film and stage productions.

Your role is to generate a clear, structured story outline based on the user's inputs. The output should feel professional, creative, and production-ready, while remaining flexible for further development.

=== BEHAVIOR RULES ===
- Do NOT write a full script unless explicitly asked
- Focus on structure, clarity, and creativity
- Match the tone to the selected genre
- Avoid clichés unless genre-appropriate
- Keep language accessible and production-friendly
- All content must be original, specific to this project, practical, and action-oriented with no generic filler

=== USER INPUTS ===
Project Title: ${projectTitle}
Genre(s): ${genres.join(', ')}
Format: ${formatLabel}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${tone ? `Tone: ${tone}` : ''}
${timePeriod ? `Time Period: ${timePeriod}` : ''}
${settingPreference ? `Setting Preference: ${settingPreference}` : ''}
${centralTheme ? `Central Theme/Message: ${centralTheme}` : ''}
${hasFaithElements ? `Faith/Cultural Elements: Include the following faith-based or cultural themes - ${faithElementsDetails || 'general faith/cultural elements'}` : ''}
${lengthPreference ? `Length Preference: ${lengthPreference}` : ''}

=== OUTPUT FORMAT ===
Generate a comprehensive story development package with the following sections. Use markdown formatting with ## for main sections and ### for subsections.

## 1. Concept Overview
A polished 1-2 paragraph summary capturing:
- The central story idea
- The genre and emotional tone
- The main conflict
- Why this story matters
(This can be used directly for pitch decks, grant proposals, or production meetings)

## 2. Genre & Tone
Brief explanation of:
- How the chosen genre(s) influence the story
- Emotional tone and pacing
- How the ${formatLabel} format shapes structure and storytelling

## 3. Setting
Detailed description of:
- Time period (${timePeriod || 'as appropriate to the story'})
- Primary and secondary locations
- Atmosphere and mood
- Cultural, societal, or environmental context
${genres.some(g => ['Sci-Fi', 'Futuristic', 'Dystopian', 'Fantasy'].includes(g)) ? '- World-building logic that keeps the story consistent' : ''}

## 4. Main Characters
For each major character (protagonist, antagonist, 2-3 supporting), create a profile including:
- **Name** and **Role** in the story
- **Core personality traits**
- **Internal struggle or desire**
- **External conflict**
- **Relationships** to other characters
- **Character arc** (how they change by the end)

## 5. Story Background
Narrative context explaining:
- What happened before the story begins
- Social, personal, or systemic forces influencing the characters
- The event or tension that launches the plot

## 6. Plot Outline
${format === 'short-film' || format === 'one-act-play' || format === 'skit-scene' ? `
Structure for ${formatLabel}:
### Opening
- Key events and setup

### Turning Point
- The central conflict or revelation

### Resolution
- How the story concludes

Include: Key events, character decisions, emotional stakes for each section.
` : `
Three-act structure for ${formatLabel}:
### Act I - Setup & Inciting Incident
- Introduction of world and characters
- The event that disrupts the status quo

### Act II - Rising Action & Complications
- Escalating conflicts and obstacles
- Character development and relationship changes
- Midpoint shift

### Act III - Climax & Resolution
- Final confrontation
- Resolution and aftermath
- Emotional payoff

Include: Key events, character decisions, emotional stakes for each act.
`}

## 7. Core Themes & Messages
- List and explain 3-5 core themes (identity, justice, redemption, survival, love, faith, power, etc.)
- Moral or philosophical questions explored
- Intended audience takeaway
${hasFaithElements ? '- How faith or cultural elements are woven into the narrative' : ''}

## 8. ${format.includes('film') || format === 'short-film' || format === 'web-series' ? 'Visual Direction Notes' : 'Stage Direction Notes'}
${format.includes('film') || format === 'short-film' || format === 'web-series' ? `
For screen:
- Visual mood (lighting, color palette, pacing)
- Cinematic style references
- Emotional rhythm of key scenes
- Key visual motifs or symbols
` : `
For stage:
- Set design suggestions
- Symbolic staging ideas
- Scene transitions and space usage
- Lighting and sound mood
`}

## 9. Expansion Suggestions
Optional creative next steps:
- Ideas for additional scenes or subplots
- Sequel or series potential
- Ways to deepen character arcs
- Alternative endings worth exploring`;

    // Call Lovable AI
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes

    let lovableResponse;

    try {
      lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate a comprehensive story development package for "${projectTitle}" - a ${formatLabel} in the ${genres.join('/')} genre.` }
          ],
          max_completion_tokens: 6000,
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);
    } catch (abortError: any) {
      clearTimeout(timeout);
      
      if (abortError.name === 'AbortError') {
        console.log('⚠️ Primary model timed out, falling back to faster model...');
        
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 60000);
        
        try {
          lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Generate a comprehensive story development package for "${projectTitle}" - a ${formatLabel} in the ${genres.join('/')} genre.` }
              ],
              max_completion_tokens: 5000,
            }),
            signal: controller2.signal
          });
          
          clearTimeout(timeout2);
        } catch (fallbackError) {
          clearTimeout(timeout2);
          console.error('Fallback model also failed:', fallbackError);
          return new Response(JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        throw abortError;
      }
    }

    if (!lovableResponse.ok) {
      const errorText = await lovableResponse.text();
      console.error('AI gateway error:', lovableResponse.status, errorText);
      
      if (lovableResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Please try again in a few minutes.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (lovableResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI service credits exhausted. Please contact support.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'AI generation failed. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await lovableResponse.json();
    const concept = aiResponse.choices?.[0]?.message?.content;

    if (!concept) {
      console.error('No content in AI response:', aiResponse);
      return new Response(JSON.stringify({ error: 'AI returned empty response. Please try again.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Act It concept generated for user ${userId}: "${projectTitle}"`);

    return new Response(JSON.stringify({ 
      concept,
      creditsUsed: 3,
      remaining: usageData.remaining
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Act It error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
