import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Free users can use 2 tools before requiring signup
  const needsSignup = toolUsageCount >= 2;
  
  // For now, we'll assume subscription is needed after signup
  // This can be expanded later with actual subscription logic
  const needsSubscription = false; // toolUsageCount >= 5 && user && !subscribed;

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