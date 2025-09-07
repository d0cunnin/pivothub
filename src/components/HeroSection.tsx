import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Zap } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[80vh] flex items-center">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl text-white">
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Pivot Your Way to the Future
            <span className="text-accent"> in a Digital World.</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-6 text-white/90 max-w-2xl">
            PivotHub gives you the tools, training, and talent connections to pivot forward — no matter where you're starting from.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-8 justify-center sm:justify-start">
            <Button 
              size="lg" 
              variant="heroWhite"
              className="text-sm px-4 py-3 flex-shrink-0"
              onClick={() => window.location.href = '/assessments'}
            >
              Assess Your Path
            </Button>
            <Button 
              size="lg" 
              variant="heroWhite"
              className="text-sm px-4 py-3 flex-shrink-0"
              onClick={() => window.location.href = '/job-prep'}
            >
              Relaunch Your Career
            </Button>
            <Button 
              size="lg" 
              variant="heroWhite"
              className="text-sm px-4 py-3 flex-shrink-0"
              onClick={() => window.location.href = '/learn-a-skill'}
            >
              Learn a New Skill
            </Button>
            <Button 
              size="lg" 
              variant="heroWhite"
              className="text-sm px-4 py-3 flex-shrink-0"
              onClick={() => window.location.href = '/hire-yourself'}
            >
              Hire Yourself
            </Button>
            <Button 
              size="lg" 
              variant="heroWhite"
              className="text-sm px-4 py-3 flex-shrink-0"
              onClick={() => window.location.href = '/freelancer-marketplace'}
            >
              Tech Freelancer Hub
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};