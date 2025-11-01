import { createClient } from 'jsr:@supabase/supabase-js@2';

const OPENAI_API_KEY = Deno.env.get('pivothub-openai-key');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export interface ModerationResult {
  flagged: boolean;
  categories?: string[];
}

/**
 * Moderates text content using OpenAI's omni-moderation-latest model
 * Logs all moderation attempts to the moderation_log table
 * 
 * @param text - The text content to moderate
 * @param functionName - Name of the function calling moderation (for logging)
 * @param userId - Optional user ID for tracking
 * @param riskLevel - 'high' (fail-closed) or 'medium' (fail-open) for API errors
 * @returns ModerationResult with flagged status and categories
 */
export async function moderateContent(
  text: string,
  functionName: string,
  userId?: string,
  riskLevel: 'high' | 'medium' = 'medium'
): Promise<ModerationResult> {
  // Truncate text to 32k characters for OpenAI moderation API limit
  const truncatedText = text.slice(0, 32000);

  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI Moderation API error (${response.status}):`, errorText);
      
      // Risk-based failure mode
      if (riskLevel === 'high') {
        // Fail-closed: Block request for high-risk functions
        await logModeration(truncatedText, functionName, userId, true, ['moderation_service_unavailable']);
        return { flagged: true, categories: ['moderation_service_unavailable'] };
      } else {
        // Fail-open: Allow request to proceed for medium-risk functions
        await logModeration(truncatedText, functionName, userId, false, ['api_error']);
        return { flagged: false, categories: ['api_error'] };
      }
    }

    const data = await response.json();
    const result = data.results?.[0];
    
    if (!result) {
      console.error('No moderation result returned from OpenAI');
      
      // Risk-based failure mode
      if (riskLevel === 'high') {
        await logModeration(truncatedText, functionName, userId, true, ['moderation_error']);
        return { flagged: true, categories: ['moderation_error'] };
      } else {
        await logModeration(truncatedText, functionName, userId, false, ['no_result']);
        return { flagged: false, categories: ['no_result'] };
      }
    }

    const flagged = result.flagged || false;
    const categories = flagged 
      ? Object.entries(result.categories || {})
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category)
      : [];

    // Log the moderation result
    await logModeration(truncatedText, functionName, userId, flagged, categories);

    // Update user reputation if content is flagged
    if (flagged && userId) {
      await updateUserReputation(userId);
    }

    return { flagged, categories };
  } catch (error) {
    console.error('Error in moderateContent:', error);
    
    // Risk-based failure mode
    if (riskLevel === 'high') {
      // Fail-closed: Block request for high-risk functions
      await logModeration(truncatedText, functionName, userId, true, ['moderation_error']);
      return { flagged: true, categories: ['moderation_error'] };
    } else {
      // Fail-open: Allow request to proceed for medium-risk functions
      await logModeration(truncatedText, functionName, userId, false, ['exception']);
      return { flagged: false, categories: ['exception'] };
    }
  }
}

/**
 * Logs moderation attempts to the database
 */
async function logModeration(
  text: string,
  functionName: string,
  userId: string | undefined,
  flagged: boolean,
  categories: string[]
): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    await supabase.from('moderation_log').insert({
      user_id: userId || null,
      function_name: functionName,
      input_text: text.slice(0, 1000), // Store only first 1000 chars
      flagged,
      categories: categories.length > 0 ? categories : null,
    });
  } catch (error) {
    // Non-critical: Log the error but don't fail the request
    console.error('Failed to log moderation:', error);
  }
}

/**
 * Updates user reputation when content is flagged
 */
async function updateUserReputation(userId: string): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Increment moderation_flags counter and update last_flag_date
    await supabase
      .from('subscribers_public')
      .update({
        moderation_flags: supabase.rpc('increment', { column: 'moderation_flags' }),
        last_flag_date: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } catch (error) {
    // Non-critical: Log the error but don't fail the request
    console.error('Failed to update user reputation:', error);
  }
}
