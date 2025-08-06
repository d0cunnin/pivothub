import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Clock } from "lucide-react";

export const PersonalityAssessment = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full md:w-auto transition-elegant hover:scale-105 px-8 py-4 text-base">
          <Brain className="mr-2 h-5 w-5" />
          Take Personality Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Personality Assessment</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Discover your unique personality traits and how they align with different career paths
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-4">Coming Soon!</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              We're developing a comprehensive personality assessment that will help you understand your working style, 
              communication preferences, and ideal work environments. This assessment will complement your interest and 
              skills assessments to provide a complete career profile.
            </p>
          </div>
          
          <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
            <h4 className="font-semibold text-foreground mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              What to Expect:
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-foreground">Discover your personality type and working style preferences</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-foreground">Learn about ideal team dynamics and leadership approaches</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-foreground">Get matched with careers that fit your personality</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span className="text-foreground">Receive personalized tips for professional development</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sign up for updates to be notified when this assessment becomes available!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};