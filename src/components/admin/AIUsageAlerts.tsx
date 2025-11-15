import { useEffect, useRef } from "react";
import { useAIRateMonitor } from "@/hooks/useAIRateMonitor";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AIUsageAlerts = () => {
  const { metrics, serviceHealth } = useAIRateMonitor();
  const { toast } = useToast();
  const lastAlertLevel = useRef<'safe' | 'warning' | 'critical'>('safe');
  const lastServiceStatus = useRef<'operational' | 'paused' | 'degraded'>('operational');
  const hasShownNotification = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const currentLevel = metrics.alertLevel;
    const previousLevel = lastAlertLevel.current;

    // Only trigger if alert level increased
    if (currentLevel !== previousLevel) {
      // Warning threshold (60-89%)
      if (currentLevel === 'warning' && !hasShownNotification.current['warning']) {
        toast({
          title: "⚠️ Rate Limit Warning",
          description: `You're at ${metrics.percentageUsed.toFixed(0)}% of your AI rate limit (${metrics.requestsLastMinute}/${metrics.rateLimit} requests/min).`,
          variant: "default",
        });
        hasShownNotification.current['warning'] = true;
        logAlert('warning');
      }

      // Critical threshold (90%+)
      if (currentLevel === 'critical' && !hasShownNotification.current['critical']) {
        toast({
          title: "🚨 Critical Rate Limit",
          description: `You're at ${metrics.percentageUsed.toFixed(0)}% of your AI rate limit! Consider implementing request queuing or upgrading your workspace plan.`,
          variant: "destructive",
        });

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Critical AI Rate Limit', {
            body: `${metrics.requestsLastMinute}/${metrics.rateLimit} requests per minute`,
            icon: '/favicon.png'
          });
        }

        hasShownNotification.current['critical'] = true;
        logAlert('critical');
      }

      lastAlertLevel.current = currentLevel;
    }

    // Reset notification flags when returning to safe
    if (currentLevel === 'safe') {
      hasShownNotification.current = {};
    }
  }, [metrics.alertLevel, metrics.percentageUsed, metrics.requestsLastMinute, metrics.rateLimit, toast]);

  // Monitor service health changes
  useEffect(() => {
    if (!serviceHealth) return;
    
    const currentStatus = serviceHealth.status;
    const previousStatus = lastServiceStatus.current;

    // Alert on service degradation
    if (currentStatus !== previousStatus) {
      if (currentStatus === 'paused' && !hasShownNotification.current['service_paused']) {
        toast({
          title: "🚨 AI Service Down",
          description: "Lovable AI workspace is paused. Add credits immediately to restore service.",
          variant: "destructive",
          duration: Infinity, // Keep showing until dismissed
        });

        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('AI Service Down', {
            body: 'Lovable AI workspace is paused - credits exhausted',
            icon: '/favicon.png'
          });
        }

        hasShownNotification.current['service_paused'] = true;
      }

      if (currentStatus === 'degraded' && !hasShownNotification.current['service_degraded']) {
        toast({
          title: "⚠️ AI Service Degraded",
          description: serviceHealth.error_message || "AI service is experiencing issues. Response times may be slower.",
          variant: "default",
        });
        hasShownNotification.current['service_degraded'] = true;
      }

      // Reset flags when service returns to operational
      if (currentStatus === 'operational' && previousStatus !== 'operational') {
        hasShownNotification.current['service_paused'] = false;
        hasShownNotification.current['service_degraded'] = false;
        
        toast({
          title: "✅ AI Service Restored",
          description: "AI service is operational again.",
          variant: "default",
        });
      }

      lastServiceStatus.current = currentStatus;
    }
  }, [serviceHealth, toast]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const logAlert = async (level: 'warning' | 'critical') => {
    await supabase.from('rate_limit_alerts').insert({
      alert_level: level,
      requests_per_minute: metrics.requestsLastMinute,
      rate_limit: metrics.rateLimit,
      percentage_used: metrics.percentageUsed,
      active_tools: metrics.activeTools
    });
  };

  // Show persistent alert for warning/critical levels
  if (metrics.alertLevel === 'warning' || metrics.alertLevel === 'critical') {
    return (
      <Alert variant={metrics.alertLevel === 'critical' ? 'destructive' : 'default'} className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {metrics.alertLevel === 'critical' ? 'Critical Rate Limit' : 'Rate Limit Warning'}
        </AlertTitle>
        <AlertDescription>
          Current usage: {metrics.requestsLastMinute}/{metrics.rateLimit} requests per minute ({metrics.percentageUsed.toFixed(0)}%).
          {metrics.alertLevel === 'critical' && (
            <span className="block mt-1 font-medium">
              Consider implementing request queuing or upgrading your workspace plan.
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};
