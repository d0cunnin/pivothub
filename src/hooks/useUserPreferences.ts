import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  detailLevel: 'concise' | 'balanced' | 'detailed';
  tone: 'professional' | 'friendly' | 'creative';
  industry: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredModel: 'fast' | 'balanced' | 'creative';
}

const defaultPreferences: UserPreferences = {
  detailLevel: 'balanced',
  tone: 'professional',
  industry: '',
  experienceLevel: 'intermediate',
  preferredModel: 'balanced'
};

export const useUserPreferences = (toolName: string) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPreferences(defaultPreferences);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .eq('tool_name', toolName)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
      }

      const userPrefs = (data?.preferences as Partial<UserPreferences>) || {};
      setPreferences({ ...defaultPreferences, ...userPrefs });
    } catch (error) {
      console.error('Error in loadPreferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Save to localStorage for non-authenticated users
        localStorage.setItem(`${toolName}_preferences`, JSON.stringify(newPreferences));
        setPreferences(prev => ({ ...prev, ...newPreferences }));
        return;
      }

      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          tool_name: toolName,
          preferences: updatedPreferences
        });

      if (error) {
        console.error('Error saving preferences:', error);
      }
    } catch (error) {
      console.error('Error in savePreferences:', error);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, [toolName]);

  return {
    preferences,
    savePreferences,
    isLoading
  };
};