import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UsageContextType {
  monthlyRequests: number;
  remainingRequests: number;
  canUseTools: boolean;
  accountStatus: 'active' | 'suspended' | 'warning';
  checkAndIncrementUsage: () => Promise<{ canUse: boolean; reason?: string }>;
  refreshUsage: () => Promise<void>;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
};

interface UsageProviderProps {
  children: React.ReactNode;
}

export const UsageProvider: React.FC<UsageProviderProps> = ({ children }) => {
  const [monthlyRequests, setMonthlyRequests] = useState(0);
  const [remainingRequests, setRemainingRequests] = useState(0);
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended' | 'warning'>('active');
  const { user } = useAuth();

  const refreshUsage = async () => {
    if (!user) {
      setMonthlyRequests(0);
      setRemainingRequests(0);
      setAccountStatus('active');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscribers_public')
        .select('monthly_ai_requests, ai_request_limit, extra_credits, account_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const total = (data.ai_request_limit || 50) + (data.extra_credits || 0);
        setMonthlyRequests(data.monthly_ai_requests || 0);
        setRemainingRequests(Math.max(0, total - (data.monthly_ai_requests || 0)));
        const status = data.account_status as 'active' | 'suspended' | 'warning' | null;
        setAccountStatus(status || 'active');
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshUsage();
    }
  }, [user]);

  const checkAndIncrementUsage = async (): Promise<{ canUse: boolean; reason?: string }> => {
    if (!user) {
      return { canUse: false, reason: 'not_logged_in' };
    }

    try {
      const { data, error } = await supabase.rpc('check_and_increment_ai_usage', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as { can_use: boolean; reason: string; remaining: number; total_used: number };
      
      setMonthlyRequests(result.total_used);
      setRemainingRequests(result.remaining);

      return {
        canUse: result.can_use,
        reason: result.reason || undefined
      };
    } catch (error) {
      console.error('Error checking usage:', error);
      return { canUse: false, reason: 'error' };
    }
  };

  const canUseTools = accountStatus === 'active' && remainingRequests > 0;

  const value = {
    monthlyRequests,
    remainingRequests,
    canUseTools,
    accountStatus,
    checkAndIncrementUsage,
    refreshUsage
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
};