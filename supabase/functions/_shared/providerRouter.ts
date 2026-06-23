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
 * All models are routed through the Lovable AI Gateway (LOVABLE_API_KEY); no
 * direct OpenAI key is ever used.
 *
 * TEXT TOOLS:  Gemini 2.5 Flash (fast JSON, stays under the edge timeout)
 * IMAGE TOOLS: Gemini 2.5 Flash Image
 */
export async function getModelForUser(
  supabase: SupabaseClient,
  userId: string,
  toolType: 'text' | 'image',
  overrideModel?: string
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

  return {
    provider: 'gemini',
    model: overrideModel || 'google/gemini-2.5-flash',
    apiKey: Deno.env.get('LOVABLE_API_KEY')!,
    endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions'
  };
}


/**
 * Validates that a model was resolved before a request is sent.
 *
 * Historically this blocked Gemini for text tools (when text ran on OpenAI).
 * Text generation now runs on Gemini 2.5 Flash via the Lovable gateway, so the
 * only failure worth guarding against is an empty/missing model string.
 */
export function validateProvider(toolType: 'text' | 'image', model: string): void {
  if (!model || !model.trim()) {
    throw new Error('PROVIDER_CONFIG_ERROR: No model resolved for ' + toolType + ' generation.');
  }
}
