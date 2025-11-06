import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Activity, UserPlus, FileText, Zap } from "lucide-react";

type ActivityItem = {
  type: "tool_usage" | "assessment" | "new_user";
  name: string;
  time: string;
  icon: any;
  isNew?: boolean;
};

export const ActivityFeed = () => {
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Initial data fetch
    const fetchInitialData = async () => {
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

      setRecentActivity(activities);
    };

    fetchInitialData();

    // Subscribe to real-time tool usage
    const toolChannel = supabase
      .channel('tool-usage-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tool_usage_analytics'
      }, (payload) => {
        const newActivity: ActivityItem = {
          type: "tool_usage",
          name: payload.new.tool_name,
          time: payload.new.created_at,
          icon: Zap,
          isNew: true
        };
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 19)]);
        // Remove isNew flag after animation
        setTimeout(() => {
          setRecentActivity(prev => prev.map(a => ({ ...a, isNew: false })));
        }, 2000);
      })
      .subscribe();

    // Subscribe to real-time assessments
    const assessmentChannel = supabase
      .channel('assessment-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'assessment_results'
      }, (payload) => {
        const newActivity: ActivityItem = {
          type: "assessment",
          name: payload.new.assessment_type,
          time: payload.new.created_at,
          icon: FileText,
          isNew: true
        };
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 19)]);
        setTimeout(() => {
          setRecentActivity(prev => prev.map(a => ({ ...a, isNew: false })));
        }, 2000);
      })
      .subscribe();

    // Subscribe to real-time new users
    const userChannel = supabase
      .channel('user-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        const newActivity: ActivityItem = {
          type: "new_user",
          name: payload.new.display_name || "New User",
          time: payload.new.created_at,
          icon: UserPlus,
          isNew: true
        };
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 19)]);
        setTimeout(() => {
          setRecentActivity(prev => prev.map(a => ({ ...a, isNew: false })));
        }, 2000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(toolChannel);
      supabase.removeChannel(assessmentChannel);
      supabase.removeChannel(userChannel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Activity Feed
          <Badge variant="default" className="bg-green-500 text-white ml-auto">
            <span className="inline-block w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
            LIVE
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {recentActivity?.map((activity, idx) => {
              const Icon = activity.icon;
              return (
                <div 
                  key={`${activity.type}-${activity.time}-${idx}`} 
                  className={`flex items-start gap-3 pb-3 border-b last:border-0 transition-all duration-500 ${
                    activity.isNew ? 'animate-in fade-in slide-in-from-top-2' : ''
                  }`}
                >
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
                      <Badge variant="outline" className="text-xs capitalize">
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
