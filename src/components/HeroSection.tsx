import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/hero-video.mp4";
import { Rocket, Compass } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] lg:min-h-[80vh] flex items-center">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
      </div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl text-white">
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Your hub to pivot, grow, and build the future
            <span className="text-accent"> with AI-powered tools</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl">
            Discover AI-powered tools that help you pivot, build, earn, launch, and grow all in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Button 
              size="lg" 
              variant="heroWhite"
              className="text-base px-8 py-6 font-semibold hover:scale-105 transition-transform"
              onClick={() => window.location.href = '/auth'}
            >
              <Rocket className="mr-2 h-5 w-5" />
              Start Your Pivot
            </Button>
            <Button 
              size="lg" 
              variant="heroWhite"
              className="text-base px-8 py-6 font-semibold hover:scale-105 transition-transform"
              onClick={() => document.getElementById('explore-hub')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Compass className="mr-2 h-5 w-5" />
              Explore the Hub
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