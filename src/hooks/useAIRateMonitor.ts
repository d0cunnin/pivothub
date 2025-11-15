import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { DEFAULT_RATE_LIMIT, getAlertLevel } from "@/utils/aiRateLimits";

export interface MinuteData {
  minute: string;
  requestCount: number;
  totalCredits: number;
  uniqueUsers: number;
  toolsUsed: string[];
}

export interface AIRateMetrics {
  requestsLastMinute: number;
  activeUsers: number;
  creditsLastMinute: number;
  activeTools: string[];
  minuteByMinute: MinuteData[];
  rateLimit: number;
  percentageUsed: number;
  alertLevel: 'safe' | 'warning' | 'critical';
}

export const useAIRateMonitor = (refreshInterval: number = 5000) => {
  const [realtimeUpdate, setRealtimeUpdate] = useState(0);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('ai-usage-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tool_usage_analytics'
        },
        () => {
          // Trigger refetch by updating state
          setRealtimeUpdate(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch current rate
  const { data: currentRate, isLoading: currentRateLoading } = useQuery({
    queryKey: ['ai-current-rate', realtimeUpdate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_ai_current_rate' as any)
        .select('*')
        .single();

      if (error) throw error;
      return data as unknown as {
        requests_last_minute: number;
        active_users: number;
        credits_last_minute: number;
        active_tools: string[];
      };
    },
    refetchInterval: refreshInterval,
  });

  // Fetch minute-by-minute data
  const { data: minuteData, isLoading: minuteDataLoading } = useQuery({
    queryKey: ['ai-minute-data', realtimeUpdate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_ai_usage_by_minute' as any)
        .select('*')
        .limit(10);

      if (error) throw error;
      return data as unknown as Array<{
        minute: string;
        request_count: number;
        total_credits: number;
        unique_users: number;
        tools_used: string[];
      }>;
    },
    refetchInterval: refreshInterval,
  });

  const metrics: AIRateMetrics = {
    requestsLastMinute: currentRate?.requests_last_minute ?? 0,
    activeUsers: currentRate?.active_users ?? 0,
    creditsLastMinute: currentRate?.credits_last_minute ?? 0,
    activeTools: currentRate?.active_tools ?? [],
    minuteByMinute: minuteData?.map(m => ({
      minute: m.minute,
      requestCount: m.request_count,
      totalCredits: m.total_credits,
      uniqueUsers: m.unique_users,
      toolsUsed: m.tools_used
    })) ?? [],
    rateLimit: DEFAULT_RATE_LIMIT,
    percentageUsed: ((currentRate?.requests_last_minute ?? 0) / DEFAULT_RATE_LIMIT) * 100,
    alertLevel: getAlertLevel(((currentRate?.requests_last_minute ?? 0) / DEFAULT_RATE_LIMIT) * 100)
  };

  return {
    metrics,
    isLoading: currentRateLoading || minuteDataLoading,
    refresh: () => setRealtimeUpdate(prev => prev + 1)
  };
};
