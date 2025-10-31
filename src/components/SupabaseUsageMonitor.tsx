import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSupabaseUsage } from "@/hooks/useSupabaseUsage";
import { Database, Users, HardDrive, Archive, Zap, AlertTriangle, Clock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const getStatusColor = (percentage: number) => {
  if (percentage >= 90) return "destructive";
  if (percentage >= 80) return "default";
  if (percentage >= 60) return "secondary";
  return "outline";
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return "bg-destructive";
  if (percentage >= 80) return "bg-orange-500";
  if (percentage >= 60) return "bg-yellow-500";
  return "bg-primary";
};

const getWarningLevel = (percentage: number) => {
  if (percentage >= 90) return { level: "critical", message: "Critical - Upgrade immediately to avoid service disruption" };
  if (percentage >= 80) return { level: "high", message: "High usage - Plan to upgrade soon" };
  if (percentage >= 60) return { level: "warning", message: "Approaching limit - Consider monitoring closely" };
  return null;
};

export const SupabaseUsageMonitor = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { data: metrics, isLoading, dataUpdatedAt } = useSupabaseUsage();

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Usage Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading usage data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const criticalMetrics = [
    metrics.databaseSize.percentage,
    metrics.monthlyActiveUsers.percentage,
    metrics.databaseRows.percentage,
    metrics.edgeFunctionCalls.percentage,
  ].filter(p => p >= 60);

  const lastUpdated = new Date(dataUpdatedAt).toLocaleTimeString();

  return (
    <Card className="mb-8 border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Supabase Usage Monitor
              {criticalMetrics.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {criticalMetrics.length} Alert{criticalMetrics.length > 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdated} • Auto-refreshes every 5 minutes
            </CardDescription>
          </div>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? "Collapse" : "Expand"}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Critical Warnings */}
            {criticalMetrics.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Required:</strong> {criticalMetrics.length} metric{criticalMetrics.length > 1 ? "s are" : " is"} approaching or exceeding plan limits.
                  Consider upgrading your Supabase plan to avoid service disruption.
                </AlertDescription>
              </Alert>
            )}

            {/* Database Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Database Storage</span>
                  <Badge variant={getStatusColor(metrics.databaseSize.percentage)}>
                    {metrics.databaseSize.percentage}%
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.databaseSize.used} MB / {metrics.databaseSize.limit} MB
                </span>
              </div>
              <Progress value={metrics.databaseSize.percentage} className="h-2" />
              {getWarningLevel(metrics.databaseSize.percentage) && (
                <p className="text-xs text-orange-600">
                  ⚠️ {getWarningLevel(metrics.databaseSize.percentage)?.message}
                </p>
              )}
            </div>

            {/* Monthly Active Users */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Monthly Active Users</span>
                  <Badge variant={getStatusColor(metrics.monthlyActiveUsers.percentage)}>
                    {metrics.monthlyActiveUsers.percentage}%
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.monthlyActiveUsers.count.toLocaleString()} / {metrics.monthlyActiveUsers.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={metrics.monthlyActiveUsers.percentage} className="h-2" />
              {getWarningLevel(metrics.monthlyActiveUsers.percentage) && (
                <p className="text-xs text-orange-600">
                  ⚠️ {getWarningLevel(metrics.monthlyActiveUsers.percentage)?.message}
                </p>
              )}
            </div>

            {/* Database Rows */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Database Rows</span>
                  <Badge variant={getStatusColor(metrics.databaseRows.percentage)}>
                    {metrics.databaseRows.percentage}%
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.databaseRows.count.toLocaleString()} / {metrics.databaseRows.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={metrics.databaseRows.percentage} className="h-2" />
              {getWarningLevel(metrics.databaseRows.percentage) && (
                <p className="text-xs text-orange-600">
                  ⚠️ {getWarningLevel(metrics.databaseRows.percentage)?.message}
                </p>
              )}
            </div>

            {/* Storage Buckets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Storage Buckets</span>
                  <Badge variant="outline">{metrics.storageBuckets.count} buckets</Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  ~{metrics.storageBuckets.totalSize} MB estimated
                </span>
              </div>
            </div>

            {/* Edge Function Calls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Edge Function Invocations (Monthly)</span>
                  <Badge variant={getStatusColor(metrics.edgeFunctionCalls.percentage)}>
                    {metrics.edgeFunctionCalls.percentage}%
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  {metrics.edgeFunctionCalls.count.toLocaleString()} / {metrics.edgeFunctionCalls.limit.toLocaleString()}
                </span>
              </div>
              <Progress value={metrics.edgeFunctionCalls.percentage} className="h-2" />
              {getWarningLevel(metrics.edgeFunctionCalls.percentage) && (
                <p className="text-xs text-orange-600">
                  ⚠️ {getWarningLevel(metrics.edgeFunctionCalls.percentage)?.message}
                </p>
              )}
            </div>

            {/* Info Footer */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                📊 Monitoring Supabase usage limits. For detailed analytics, visit{" "}
                <a 
                  href="https://supabase.com/dashboard/project/fkvjsgqjgissolpdqbdh" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Supabase Dashboard
                </a>
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
