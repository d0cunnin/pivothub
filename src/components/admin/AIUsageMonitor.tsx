import { useAIRateMonitor } from "@/hooks/useAIRateMonitor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Users, Zap, TrendingUp } from "lucide-react";
import { getAlertBadgeColor, getAlertColor } from "@/utils/aiRateLimits";

export const AIUsageMonitor = () => {
  const { metrics, isLoading } = useAIRateMonitor();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Usage Monitor</CardTitle>
          <CardDescription>Loading real-time metrics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const lastUpdate = new Date().toLocaleTimeString();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                AI Usage Monitor
              </CardTitle>
              <CardDescription>Last updated: {lastUpdate}</CardDescription>
            </div>
            <Badge className={getAlertBadgeColor(metrics.alertLevel)}>
              {metrics.alertLevel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Rate</span>
              <span className={`text-2xl font-bold ${getAlertColor(metrics.alertLevel)}`}>
                {metrics.requestsLastMinute} / {metrics.rateLimit} req/min
              </span>
            </div>
            <Progress value={metrics.percentageUsed} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.percentageUsed.toFixed(1)}% of rate limit
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Last 60 seconds</p>
                <p className="text-2xl font-bold">{metrics.requestsLastMinute}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="text-2xl font-bold">{metrics.creditsLastMinute}</p>
              </div>
            </div>
          </div>

          {/* Active Tools */}
          <div>
            <h3 className="text-sm font-medium mb-2">Active Tools ({metrics.activeTools.length})</h3>
            <div className="flex flex-wrap gap-2">
              {metrics.activeTools.length > 0 ? (
                metrics.activeTools.map((tool, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tool}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No active tools in the last minute</p>
              )}
            </div>
          </div>

          {/* Minute-by-Minute Breakdown */}
          <div>
            <h3 className="text-sm font-medium mb-3">Last 10 Minutes</h3>
            <div className="space-y-2">
              {metrics.minuteByMinute.length > 0 ? (
                metrics.minuteByMinute.map((minute, idx) => {
                  const time = new Date(minute.minute).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const percentage = (minute.requestCount / metrics.rateLimit) * 100;
                  
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{time}</span>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <span className="text-xs font-medium w-20 text-right">
                        {minute.requestCount} req
                      </span>
                      <span className="text-xs text-muted-foreground w-16 text-right">
                        {minute.uniqueUsers} users
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No activity in the last 10 minutes</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
