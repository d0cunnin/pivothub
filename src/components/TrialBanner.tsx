import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const TrialBanner: React.FC = () => {
  const { user, isTrialActive, trialDaysRemaining } = useAuth();
  const navigate = useNavigate();

  // Only show for logged-in users with active trial
  if (!user || !isTrialActive) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-semibold">Free Trial Active</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/pricing')}
            className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
};