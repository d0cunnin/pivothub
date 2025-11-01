import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ModelConfig {
  provider: 'openai' | 'gemini';
  model: string;
  apiKey: string;
  endpoint: string;
}

/**
 * Get the appropriate AI model configuration based on user subscription and tool type
 * 
 * TEXT TOOLS: Always use OpenAI (GPT-5 for paid, GPT-4o for free)
 * IMAGE TOOLS: Always use Gemini Nano
 */
export async function getModelForUser(
  supabase: SupabaseClient,
  userId: string,
  toolType: 'text' | 'image'
): Promise<ModelConfig> {
  // CRITICAL: Images must use Gemini
  if (toolType === 'image') {
    return {
      provider: 'gemini',
      model: 'google/gemini-2.5-flash-image-preview',
      apiKey: Deno.env.get('LOVABLE_API_KEY')!,
      endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions'
    };
  }

  // TEXT GENERATION: Check user subscription tier
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier, subscribed')
    .eq('id', userId)
    .maybeSingle();

  const isPaid = userData?.subscribed === true && 
                 userData?.subscription_tier !== 'explore';

  // Use GPT-5 for all users (paid and free)
  return {
    provider: 'openai',
    model: 'gpt-5-2025-08-07',
    apiKey: Deno.env.get('pivothub-openai-key')!,
    endpoint: 'https://api.openai.com/v1/chat/completions'
  };
}

/**
 * Validates that text tools are not using Gemini
 * Throws error if a text tool attempts to use Gemini
 */
export function validateProvider(toolType: 'text' | 'image', model: string): void {
  if (toolType === 'text' && model.toLowerCase().includes('gemini')) {
    throw new Error(
      'PROVIDER_DOWNGRADE_BLOCKED: Text generation tools must use OpenAI. ' +
      'Gemini is only allowed for image generation.'
    );
  }
}
