import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, FileText, TrendingUp } from "lucide-react";

export const PlatformAnalytics = () => {
  const { data: toolUsage } = useQuery({
    queryKey: ["platform-tool-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_usage_analytics")
        .select("tool_name")
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      
      const counts = data.reduce((acc: Record<string, number>, item) => {
        acc[item.tool_name] = (acc[item.tool_name] || 0) + 1;
        return acc;
      }, {});
      
      return {
        total: data.length,
        topTools: Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))
      };
    }
  });

  const { data: assessmentStats } = useQuery({
    queryKey: ["platform-assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_results")
        .select("assessment_type, score");
      
      if (error) throw error;
      return {
        total: data.length,
        avgScore: data.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / data.length || 0
      };
    }
  });

  const { data: userStats } = useQuery({
    queryKey: ["platform-users"],
    queryFn: async () => {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      const { count: activeSubscribers } = await supabase
        .from("subscribers_public")
        .select("*", { count: "exact", head: true })
        .eq("subscribed", true);
      
      return { totalUsers: totalUsers || 0, activeSubscribers: activeSubscribers || 0 };
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tool Uses</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{toolUsage?.total || 0}</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
          <p className="text-xs text-muted-foreground">Registered accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assessments</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assessmentStats?.total || 0}</div>
          <p className="text-xs text-muted-foreground">
            Avg score: {assessmentStats?.avgScore.toFixed(1) || 0}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userStats?.activeSubscribers || 0}</div>
          <p className="text-xs text-muted-foreground">Paying customers</p>
        </CardContent>
      </Card>
    </div>
  );
};
