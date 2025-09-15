import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UsageContextType {
  toolUsageCount: number;
  canUseTools: boolean;
  needsSignup: boolean;
  needsSubscription: boolean;
  incrementUsage: () => void;
  resetUsage: () => void;
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
  const [toolUsageCount, setToolUsageCount] = useState(0);
  const { user, subscribed, isTrialActive } = useAuth();

  useEffect(() => {
    // Load usage count from localStorage
    const savedUsage = localStorage.getItem('tool_usage_count');
    if (savedUsage) {
      setToolUsageCount(parseInt(savedUsage, 10));
    }
  }, []);

  const incrementUsage = () => {
    const newCount = toolUsageCount + 1;
    setToolUsageCount(newCount);
    localStorage.setItem('tool_usage_count', newCount.toString());
  };

  const resetUsage = () => {
    setToolUsageCount(0);
    localStorage.removeItem('tool_usage_count');
  };

  // Determine usage limits based on user status
  const needsSignup = !user && toolUsageCount >= 2;
  
  // If user has active subscription or trial, no limitations
  // If user is logged in but no trial/subscription, they get 5 tools per month
  const needsSubscription = user && !subscribed && !isTrialActive && toolUsageCount >= 5;

  const canUseTools = !needsSignup && !needsSubscription;

  const value = {
    toolUsageCount,
    canUseTools,
    needsSignup,
    needsSubscription,
    incrementUsage,
    resetUsage
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
};