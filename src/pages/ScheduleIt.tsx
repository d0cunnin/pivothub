import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { Helmet } from "react-helmet-async";
import { ScheduleItWizard } from "@/components/ScheduleItWizard";
import { ToolGuard } from "@/components/ToolGuard";
import { Badge } from "@/components/ui/badge";

const ScheduleIt = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Schedule It - Build Your Life Schedule | PivotHub</title>
        <meta name="description" content="Create a realistic weekly schedule that fits your actual life commitments, energy patterns, and business goals." />
      </Helmet>
      
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">SCHEDULE IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Build Your Life Schedule
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              A schedule built around your life, not one that ignores it.
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                variant="hero" 
                size="lg" 
                className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                onClick={() => document.getElementById('schedule-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Wizard */}
      <section id="schedule-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ToolGuard toolName="schedule-it" showCreditInfo={true}>
              <ScheduleItWizard />
            </ToolGuard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ScheduleIt;
