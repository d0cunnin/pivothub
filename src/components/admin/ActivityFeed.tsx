import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Activity, UserPlus, FileText, Zap } from "lucide-react";

export const ActivityFeed = () => {
  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const [toolUsage, assessments, newUsers] = await Promise.all([
        supabase
          .from("tool_usage_analytics")
          .select("tool_name, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("assessment_results")
          .select("assessment_type, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("profiles")
          .select("id, display_name, created_at")
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      const activities = [
        ...(toolUsage.data || []).map(item => ({
          type: "tool_usage" as const,
          name: item.tool_name,
          time: item.created_at,
          icon: Zap
        })),
        ...(assessments.data || []).map(item => ({
          type: "assessment" as const,
          name: item.assessment_type,
          time: item.created_at,
          icon: FileText
        })),
        ...(newUsers.data || []).map(item => ({
          type: "new_user" as const,
          name: item.display_name || "New User",
          time: item.created_at,
          icon: UserPlus
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 20);

      return activities;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {recentActivity?.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {activity.type === "tool_usage" && `Tool: ${activity.name}`}
                        {activity.type === "assessment" && `Assessment: ${activity.name}`}
                        {activity.type === "new_user" && `New User: ${activity.name}`}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {activity.type.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
            {!recentActivity?.length && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
