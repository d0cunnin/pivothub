import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, Lightbulb, ArrowRight, ArrowLeft } from 'lucide-react';

interface TutorialStep {
  title: string;
  description: string;
  goodExample: {
    title: string;
    content: string;
    explanation: string;
  };
  badExample: {
    title: string;
    content: string;
    explanation: string;
  };
  tips: string[];
}

interface BestPracticesTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
}

const tutorialSteps: Record<string, TutorialStep[]> = {
  'business-idea-generator': [
    {
      title: 'Describe Your Skills Effectively',
      description: 'Specific skills lead to better business ideas tailored to your expertise.',
      goodExample: {
        title: 'Good Example',
        content: 'Digital marketing, SEO optimization, content creation, social media strategy, Google Ads management',
        explanation: 'Specific, actionable skills that can be directly applied to business opportunities.'
      },
      badExample: {
        title: 'Avoid This',
        content: 'Marketing',
        explanation: 'Too vague - doesn\'t give the AI enough information to suggest relevant opportunities.'
      },
      tips: [
        'List 3-5 specific skills',
        'Include both technical and soft skills',
        'Be precise about your expertise level',
        'Mention certifications or specializations'
      ]
    },
    {
      title: 'Define Clear Interests',
      description: 'Your passions help identify business ideas you\'ll be motivated to pursue.',
      goodExample: {
        title: 'Good Example',
        content: 'Sustainable living, helping small businesses grow, fitness for busy professionals, educational technology for children',
        explanation: 'Specific interest areas with clear target audiences.'
      },
      badExample: {
        title: 'Avoid This',
        content: 'Technology, health',
        explanation: 'Too broad - makes it hard to identify specific market opportunities.'
      },
      tips: [
        'Identify specific problems you care about',
        'Think about target audiences',
        'Consider your personal experiences',
        'Include emerging trends you\'re passionate about'
      ]
    }
  ],
  'career-advisor': [
    {
      title: 'Ask Specific Questions',
      description: 'Detailed questions lead to more actionable career advice.',
      goodExample: {
        title: 'Good Example',
        content: 'I\'m a marketing coordinator with 3 years experience wanting to transition to product management. What skills should I develop, and what\'s the best way to make this transition in the tech industry?',
        explanation: 'Includes current role, experience level, specific goal, and context.'
      },
      badExample: {
        title: 'Avoid This',
        content: 'How do I get a better job?',
        explanation: 'Too vague - doesn\'t provide context about current situation or goals.'
      },
      tips: [
        'Include your current role and experience',
        'Specify your career goals',
        'Mention relevant industry or company size',
        'Ask about specific challenges you\'re facing'
      ]
    }
  ]
};

export const BestPracticesTutorial = ({ isOpen, onClose, toolName }: BestPracticesTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = tutorialSteps[toolName] || [];

  if (steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Best Practices Guide
          </DialogTitle>
          <DialogDescription>
            Learn how to get the best results from this AI tool
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentStep ? 'bg-primary' : 
                    index < currentStep ? 'bg-primary/50' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Current Step Content */}
          <div className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-2">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
              <p className="text-muted-foreground mt-1">{currentStepData.description}</p>
            </div>

            {/* Examples */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Good Example */}
              <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    {currentStepData.goodExample.title}
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white dark:bg-green-900/40 rounded border">
                    <p className="text-sm">{currentStepData.goodExample.content}</p>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {currentStepData.goodExample.explanation}
                  </p>
                </div>
              </Card>

              {/* Bad Example */}
              <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-red-800 dark:text-red-200">
                    {currentStepData.badExample.title}
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-white dark:bg-red-900/40 rounded border">
                    <p className="text-sm">{currentStepData.badExample.content}</p>
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {currentStepData.badExample.explanation}
                  </p>
                </div>
              </Card>
            </div>

            {/* Tips */}
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                Pro Tips
              </h4>
              <ul className="space-y-2">
                {currentStepData.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={isLastStep ? handleClose : handleNext}
              className="flex items-center gap-2"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};