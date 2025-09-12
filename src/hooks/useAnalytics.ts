import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsData {
  toolName: string;
  inputData: Record<string, any>;
  inputQualityScore?: number;
  responseData?: Record<string, any>;
  responseQualityScore?: number;
  modelUsed?: string;
  responseTimeMs?: number;
  sessionId?: string;
}

export const useAnalytics = () => {
  const trackUsage = async (data: AnalyticsData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const analyticsRecord = {
        user_id: user?.id || null,
        tool_name: data.toolName,
        input_data: data.inputData,
        input_quality_score: data.inputQualityScore,
        response_data: data.responseData,
        response_quality_score: data.responseQualityScore,
        model_used: data.modelUsed,
        response_time_ms: data.responseTimeMs,
        session_id: data.sessionId || uuidv4()
      };

      const { error } = await supabase
        .from('tool_usage_analytics')
        .insert(analyticsRecord);

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Error in trackUsage:', error);
    }
  };

  const submitFeedback = async (
    toolName: string, 
    resultId: string, 
    rating: number, 
    feedbackText?: string,
    suggestions?: string[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const feedback = {
        user_id: user?.id || null,
        tool_name: toolName,
        result_id: resultId,
        rating,
        feedback_text: feedbackText,
        improvement_suggestions: suggestions
      };

      const { error } = await supabase
        .from('result_feedback')
        .insert(feedback);

      if (error) {
        console.error('Feedback submission error:', error);
      }
    } catch (error) {
      console.error('Error in submitFeedback:', error);
    }
  };

  const getAnalytics = async (toolName?: string, days: number = 30) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('tool_usage_analytics')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (toolName) {
        query = query.eq('tool_name', toolName);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analytics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAnalytics:', error);
      return null;
    }
  };

  return {
    trackUsage,
    submitFeedback,
    getAnalytics
  };
};