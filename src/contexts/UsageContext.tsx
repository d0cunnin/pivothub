import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const currentUser=useRef(user?.id); currentUser.current=user?.id;

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
      const requestedUser=user.id;
      const {data,error}=await supabase.rpc('get_my_credit_balance');
      if(error)throw error;if(currentUser.current!==requestedUser)return;
      const balance=data as {remaining?:number;used?:number;paid_remaining?:number;account_status?:string};
      setMonthlyRequests(balance.used??0);setRemainingRequests(balance.remaining??0);
      setTotalAvailable((balance.remaining??0)+(balance.used??0));setRolloverCredits(balance.paid_remaining??0);
      setAccountStatus(balance.account_status==='suspended'?'suspended':balance.account_status==='warning'?'warning':'active');
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  useEffect(() => {
    setMonthlyRequests(0);setRemainingRequests(0);setTotalAvailable(0);setRolloverCredits(0);
    refreshUsage();
  }, [user]);

  // Credits are deducted server-side after a tool succeeds; refresh the
  // displayed balance whenever a tool call completes.
  useEffect(() => {
    if (!user) return;
    const onCreditsChanged = () => { refreshUsage(); };
    window.addEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
    window.addEventListener('focus',onCreditsChanged);
    const timer=window.setInterval(onCreditsChanged,30000);
    return () => {window.removeEventListener(CREDITS_CHANGED_EVENT,onCreditsChanged);window.removeEventListener('focus',onCreditsChanged);window.clearInterval(timer);};
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