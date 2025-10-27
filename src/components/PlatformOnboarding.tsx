import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OnboardingPhase {
  phase: number;
  title: string;
  description: string;
  tools: {
    name: string;
    path: string;
    description: string;
    icon: string;
  }[];
}

const phases: OnboardingPhase[] = [
  {
    phase: 1,
    title: 'Discover & Learn',
    description: 'Start your journey by understanding your strengths and learning new skills',
    tools: [
      {
        name: 'Assess It',
        path: '/assessit',
        description: 'Discover your skills, personality, and career potential with AI-powered assessments',
        icon: '🎯'
      },
      {
        name: 'Learn It',
        path: '/learnit',
        description: 'Access courses and interactive learning modules to develop your skills',
        icon: '📚'
      },
      {
        name: 'Schedule It',
        path: '/scheduleit',
        description: 'Plan and organize your events, workshops, and learning schedule',
        icon: '📅'
      }
    ]
  },
  {
    phase: 2,
    title: 'Build & Prepare',
    description: 'Create your business foundation and prepare for job opportunities',
    tools: [
      {
        name: 'Build It',
        path: '/buildit',
        description: 'Generate business ideas, plans, and foundational documents with AI assistance',
        icon: '🏗️'
      },
      {
        name: 'Prep It',
        path: '/prepit',
        description: 'Perfect your resume, practice interviews, and prepare for career success',
        icon: '💼'
      },
      {
        name: 'Earn It',
        path: '/earnit',
        description: 'Explore side income opportunities and monetize your skills',
        icon: '💰'
      }
    ]
  },
  {
    phase: 3,
    title: 'Launch & Grow',
    description: 'Take your ideas public and scale your success',
    tools: [
      {
        name: 'Host It',
        path: '/hostit',
        description: 'Create and manage events with comprehensive planning tools',
        icon: '🎪'
      },
      {
        name: 'Teach It',
        path: '/teachit',
        description: 'Develop teaching materials and share your knowledge with others',
        icon: '👨‍🏫'
      },
      {
        name: 'Launch It',
        path: '/launchit',
        description: 'Launch your business with marketing strategies and pitch decks',
        icon: '🚀'
      },
      {
        name: 'Fund It',
        path: '/fundit',
        description: 'Access grant writing tools and funding research resources',
        icon: '💸'
      }
    ]
  }
];

interface PlatformOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PlatformOnboarding = ({ open, onOpenChange }: PlatformOnboardingProps) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async () => {
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving onboarding completion:', error);
      }
    }
    toast.success('Welcome to PivotHub! 🎉', {
      description: 'You can always revisit this guide from your dashboard.'
    });
    onOpenChange(false);
  };

  const handleToolClick = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const currentPhaseData = phases[currentPhase];
  const isLastPhase = currentPhase === phases.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl">Welcome to PivotHub</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Your all-in-one platform for career growth and business success
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Phase Progress */}
          <div className="flex gap-2 justify-center">
            {phases.map((phase, idx) => (
              <Badge
                key={phase.phase}
                variant={idx === currentPhase ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setCurrentPhase(idx)}
              >
                Phase {phase.phase}
              </Badge>
            ))}
          </div>

          {/* Current Phase */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">{currentPhaseData.title}</h3>
            <p className="text-muted-foreground">{currentPhaseData.description}</p>
          </div>

          {/* Tools Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {currentPhaseData.tools.map((tool) => (
              <Card
                key={tool.path}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleToolClick(tool.path)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{tool.icon}</span>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-semibold">{tool.name}</h4>
                      <p className="text-sm text-muted-foreground">{tool.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Educational Callout for Last Phase */}
          {isLastPhase && (
            <Alert className="bg-primary/5 border-primary/20">
              <Lightbulb className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Not sure where to start?</strong> Our Getting Started Guide will help you choose the right path based on your goals and experience level.
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentPhase(Math.max(0, currentPhase - 1))}
              disabled={currentPhase === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <span className="text-sm text-muted-foreground">
              Phase {currentPhase + 1} of {phases.length}
            </span>

            {isLastPhase ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleComplete}>
                  Skip to Dashboard
                </Button>
                <Button onClick={() => {
                  handleComplete();
                  navigate('/before-you-start');
                }}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Read Getting Started Guide
                </Button>
              </div>
            ) : (
              <Button onClick={() => setCurrentPhase(currentPhase + 1)}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
