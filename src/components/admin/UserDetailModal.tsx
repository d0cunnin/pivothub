import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { User, Activity, FileText, Calendar } from "lucide-react";

interface UserDetailModalProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export const UserDetailModal = ({ userId, userEmail, isOpen, onClose }: UserDetailModalProps) => {
  const { data: profile } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  const { data: toolUsage } = useQuery({
    queryKey: ["user-tool-usage", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tool_usage_analytics")
        .select("tool_name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  const { data: assessments } = useQuery({
    queryKey: ["user-assessments", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_results")
        .select("assessment_type, score, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  const { data: subscription } = useQuery({
    queryKey: ["user-subscription", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscribers_public")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Basic Info</h3>
            <div className="space-y-2">
              <p><strong>Email:</strong> {userEmail}</p>
              <p><strong>Display Name:</strong> {profile?.display_name || "Not set"}</p>
              <p><strong>Joined:</strong> {profile?.created_at ? format(new Date(profile.created_at), "PPP") : "Unknown"}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Subscription Status
            </h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Badge variant={subscription?.subscribed ? "default" : "secondary"}>
                  {subscription?.subscribed ? "Active" : "Inactive"}
                </Badge>
                {subscription?.is_trial_active && <Badge variant="outline">Trial</Badge>}
              </div>
              {subscription?.subscription_tier && (
                <p><strong>Tier:</strong> {subscription.subscription_tier}</p>
              )}
              {subscription?.subscription_end && (
                <p><strong>Ends:</strong> {format(new Date(subscription.subscription_end), "PPP")}</p>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Tool Usage ({toolUsage?.length || 0} total)
            </h3>
            <div className="space-y-2">
              {toolUsage?.map((usage, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{usage.tool_name}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(usage.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
              {!toolUsage?.length && <p className="text-sm text-muted-foreground">No activity yet</p>}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assessments Completed ({assessments?.length || 0})
            </h3>
            <div className="space-y-2">
              {assessments?.map((assessment, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{assessment.assessment_type}</span>
                  <span className="text-muted-foreground">
                    Score: {assessment.score ? Number(assessment.score).toFixed(1) : "N/A"}
                  </span>
                </div>
              ))}
              {!assessments?.length && <p className="text-sm text-muted-foreground">No assessments completed</p>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
