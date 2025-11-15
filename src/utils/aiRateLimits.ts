// Lovable AI workspace rate limits by plan
export const RATE_LIMITS = {
  free: 20,      // 20 requests/min
  pro: 60,       // 60 requests/min  
  business: 120, // 120 requests/min
  enterprise: 300 // 300 requests/min
} as const;

export type WorkspacePlan = keyof typeof RATE_LIMITS;

// Default to pro tier for monitoring
export const DEFAULT_RATE_LIMIT = RATE_LIMITS.pro;

export const getAlertLevel = (percentageUsed: number): 'safe' | 'warning' | 'critical' => {
  if (percentageUsed >= 90) return 'critical';
  if (percentageUsed >= 60) return 'warning';
  return 'safe';
};

export const getAlertColor = (level: 'safe' | 'warning' | 'critical') => {
  switch (level) {
    case 'safe':
      return 'text-emerald-500';
    case 'warning':
      return 'text-amber-500';
    case 'critical':
      return 'text-destructive';
  }
};

export const getAlertBadgeColor = (level: 'safe' | 'warning' | 'critical') => {
  switch (level) {
    case 'safe':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'warning':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'critical':
      return 'bg-destructive/10 text-destructive border-destructive/20';
  }
};
