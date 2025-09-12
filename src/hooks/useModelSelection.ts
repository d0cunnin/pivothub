import { UserPreferences } from './useUserPreferences';

export type AIModel = 'gpt-5-2025-08-07' | 'gpt-5-mini-2025-08-07' | 'gpt-4.1-2025-04-14' | 'o3-2025-04-16';

export interface ModelConfig {
  model: AIModel;
  maxTokens: number;
  useTemperature: boolean;
  temperature?: number;
}

export const useModelSelection = () => {
  const getOptimalModel = (
    toolType: 'creative' | 'analytical' | 'conversational' | 'structured',
    preferences: UserPreferences,
    inputComplexity: 'simple' | 'moderate' | 'complex' = 'moderate'
  ): ModelConfig => {
    
    // Determine base model based on tool type and preferences
    let model: AIModel = 'gpt-5-2025-08-07'; // Default
    
    if (preferences.preferredModel === 'fast') {
      model = 'gpt-5-mini-2025-08-07';
    } else if (preferences.preferredModel === 'creative') {
      if (toolType === 'creative' || toolType === 'conversational') {
        model = 'gpt-4.1-2025-04-14';
      } else {
        model = 'gpt-5-2025-08-07';
      }
    } else if (preferences.preferredModel === 'balanced') {
      if (inputComplexity === 'complex' && toolType === 'analytical') {
        model = 'o3-2025-04-16'; // Use reasoning model for complex analysis
      } else if (toolType === 'creative') {
        model = 'gpt-4.1-2025-04-14';
      } else {
        model = 'gpt-5-2025-08-07';
      }
    }
    
    // Determine token limits based on detail preference
    let maxTokens = 1000; // Default
    if (preferences.detailLevel === 'concise') {
      maxTokens = 600;
    } else if (preferences.detailLevel === 'detailed') {
      maxTokens = 1500;
    }
    
    // Determine if we can use temperature (newer models don't support it)
    const useTemperature = ['gpt-4o', 'gpt-4o-mini'].includes(model);
    const temperature = useTemperature ? (preferences.tone === 'creative' ? 0.8 : 0.7) : undefined;
    
    return {
      model,
      maxTokens,
      useTemperature,
      temperature
    };
  };
  
  const getSystemPromptModifiers = (preferences: UserPreferences, focus?: string) => {
    let modifiers = [];
    
    // Detail level modifiers
    switch (preferences.detailLevel) {
      case 'concise':
        modifiers.push('Provide concise, to-the-point responses. Focus on the most essential information.');
        break;
      case 'detailed':
        modifiers.push('Provide comprehensive, detailed responses with thorough explanations and examples.');
        break;
      default:
        modifiers.push('Provide well-balanced responses with appropriate detail and clarity.');
    }
    
    // Tone modifiers
    switch (preferences.tone) {
      case 'professional':
        modifiers.push('Maintain a professional, business-appropriate tone throughout.');
        break;
      case 'friendly':
        modifiers.push('Use a friendly, approachable, and encouraging tone.');
        break;
      case 'creative':
        modifiers.push('Be creative, inspiring, and think outside the box in your responses.');
        break;
    }
    
    // Experience level modifiers
    switch (preferences.experienceLevel) {
      case 'beginner':
        modifiers.push('Explain concepts clearly for someone new to this area. Define technical terms and provide context.');
        break;
      case 'advanced':
        modifiers.push('Provide advanced insights suitable for experienced professionals. Use industry terminology appropriately.');
        break;
      default:
        modifiers.push('Assume intermediate knowledge and provide explanations that are neither too basic nor too advanced.');
    }
    
    // Industry-specific modifiers
    if (preferences.industry) {
      modifiers.push(`Tailor responses specifically for the ${preferences.industry} industry when relevant.`);
    }
    
    // Focus modifiers (for regeneration)
    if (focus) {
      switch (focus) {
        case 'detailed':
          modifiers.push('Focus on providing more comprehensive details and in-depth analysis.');
          break;
        case 'concise':
          modifiers.push('Focus on brevity and highlight only the most crucial points.');
          break;
        case 'creative':
          modifiers.push('Focus on creative, innovative, and out-of-the-box solutions.');
          break;
        case 'professional':
          modifiers.push('Focus on professional, business-oriented approaches and language.');
          break;
        case 'alternative':
          modifiers.push('Provide alternative approaches and different perspectives than typical solutions.');
          break;
      }
    }
    
    return modifiers.join(' ');
  };
  
  return {
    getOptimalModel,
    getSystemPromptModifiers
  };
};