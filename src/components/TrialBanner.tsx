import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * TrialBanner component - Currently disabled as trial system has been removed.
 * All users start with Explore Mode (5 free credits per month).
 * This component is kept for potential future trial implementation.
 */
export const TrialBanner: React.FC = () => {
  const { user, subscribed } = useAuth();
  const navigate = useNavigate();

  // Trial system removed - users now have Explore Mode by default
  // This component no longer displays anything
  return null;

  // Future trial implementation can be added here
  // Uncomment below if trial system is re-implemented:
  
  /*
  if (!user || subscribed) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-semibold">Welcome to Explore Mode!</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Get 5 free credits every month
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pricing')}
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          >
            View Plans
          </Button>
        </div>
      </div>
    </div>
  );
  */
};
