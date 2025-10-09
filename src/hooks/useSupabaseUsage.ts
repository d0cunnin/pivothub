import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageMetrics {
  databaseSize: { used: number; limit: number; percentage: number };
  monthlyActiveUsers: { count: number; limit: number; percentage: number };
  databaseRows: { count: number; limit: number; percentage: number };
  storageBuckets: { count: number; totalSize: number };
  edgeFunctionCalls: { count: number; limit: number; percentage: number };
}

export const useSupabaseUsage = (refreshInterval: number = 300000) => {
  return useQuery({
    queryKey: ["supabase-usage"],
    queryFn: async (): Promise<UsageMetrics> => {
      // Estimate database size from row counts (approximate method)
      // Real DB size requires admin access, so we'll use estimates
      const estimatedDbSizeMB = 11.87; // Current known size
      
      // Count MAU (unique users who logged in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: mauCount } = await supabase
        .from("subscribers")
        .select("user_id", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      // Count total database rows across key tables
      const tables = [
        "profiles",
        "subscribers", 
        "assessment_results",
        "course_enrollments",
        "lesson_progress",
        "quiz_results",
        "activity_submissions",
        "tool_usage_analytics",
        "result_feedback",
        "user_preferences"
      ] as const;

      let totalRows = 0;
      for (const table of tables) {
        const { count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        totalRows += count || 0;
      }

      // Get storage buckets info
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketCount = buckets?.length || 0;

      // Estimate edge function calls from analytics (last 30 days)
      const { count: edgeCalls } = await supabase
        .from("tool_usage_analytics")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Calculate storage size (this is an approximation)
      let totalStorageSize = 0;
      if (buckets) {
        for (const bucket of buckets) {
          const { data: files } = await supabase.storage
            .from(bucket.name)
            .list();
          // Note: This is a simplified calculation
          totalStorageSize += (files?.length || 0) * 0.5; // Assume avg 0.5 MB per file
        }
      }

      // Free tier limits
      const DB_SIZE_LIMIT = 500; // MB
      const MAU_LIMIT = 50000;
      const ROW_LIMIT = 500000;
      const EDGE_FUNCTION_LIMIT = 2000000;

      return {
        databaseSize: {
          used: Math.round(estimatedDbSizeMB * 100) / 100,
          limit: DB_SIZE_LIMIT,
          percentage: Math.round((estimatedDbSizeMB / DB_SIZE_LIMIT) * 100 * 100) / 100,
        },
        monthlyActiveUsers: {
          count: mauCount || 0,
          limit: MAU_LIMIT,
          percentage: Math.round(((mauCount || 0) / MAU_LIMIT) * 100 * 100) / 100,
        },
        databaseRows: {
          count: totalRows,
          limit: ROW_LIMIT,
          percentage: Math.round((totalRows / ROW_LIMIT) * 100 * 100) / 100,
        },
        storageBuckets: {
          count: bucketCount,
          totalSize: Math.round(totalStorageSize * 100) / 100,
        },
        edgeFunctionCalls: {
          count: edgeCalls || 0,
          limit: EDGE_FUNCTION_LIMIT,
          percentage: Math.round(((edgeCalls || 0) / EDGE_FUNCTION_LIMIT) * 100 * 100) / 100,
        },
      };
    },
    refetchInterval: refreshInterval,
    staleTime: refreshInterval,
  });
};
