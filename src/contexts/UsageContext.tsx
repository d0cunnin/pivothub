import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CREDITS_CHANGED_EVENT } from "@/lib/invokeFunction";

interface UsageContextType {
  monthlyRequests: number;
  remainingRequests: number;
  totalAvailable: number;
  rolloverCredits: number;
  canUseTools: boolean;
  accountStatus: 'active' | 'suspended' | 'warning';
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
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [rolloverCredits, setRolloverCredits] = useState(0);
  const [accountStatus, setAccountStatus] = useState<'active' | 'suspended' | 'warning'>('active');
  const { user } = useAuth();

  const refreshUsage = async () => {
    if (!user) {
      setMonthlyRequests(0);
      setRemainingRequests(0);
      setTotalAvailable(0);
      setRolloverCredits(0);
      setAccountStatus('active');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscribers_public')
        .select('monthly_ai_requests, ai_request_limit, extra_credits, rollover_credits, account_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const total = (data.ai_request_limit || 5) + (data.extra_credits || 0) + (data.rollover_credits || 0);
        setMonthlyRequests(data.monthly_ai_requests || 0);
        setTotalAvailable(total);
        setRolloverCredits(data.rollover_credits || 0);
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

  // Credits are deducted server-side after a tool succeeds; refresh the
  // displayed balance whenever a tool call completes.
  useEffect(() => {
    if (!user) return;
    const onCreditsChanged = () => { refreshUsage(); };
    window.addEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
    return () => window.removeEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
  }, [user]);

  const canUseTools = accountStatus === 'active' && remainingRequests > 0;

  const value = {
    monthlyRequests,
    remainingRequests,
    totalAvailable,
    rolloverCredits,
    canUseTools,
    accountStatus,
    refreshUsage
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
};