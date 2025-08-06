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
          <div className="flex items-center space-x-2 mb-6">
            <Zap className="h-6 w-6 text-accent" />
            <span className="text-accent font-semibold">Transform Your Career</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Unlock Your 
            <span className="text-accent"> Potential</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-6 text-white/90 max-w-2xl">
            Whether you're looking to reskill for better opportunities or launch your own business, 
            we provide the tools and guidance to relaunch your career and create positive economic impact.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              size="lg" 
              variant="hero"
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('choose-path')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="default"
              className="text-lg px-8 py-6"
              onClick={() => document.getElementById('choose-path')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Target className="mr-2 h-5 w-5" />
              Explore Paths
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-accent">5K+</div>
              <div className="text-white/80">People Empowered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">225+</div>
              <div className="text-white/80">Certifications</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">430+</div>
              <div className="text-white/80">Businesses Launched</div>
            </div>
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