import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Rocket, Lightbulb, FileText, Search, DollarSign, MessageSquare, Presentation, Palette, User, Scale, CheckSquare, Share2, TrendingUp } from "lucide-react";
import { BusinessIdeaGenerator } from "@/components/BusinessIdeaGenerator";
import { NameChecker } from "@/components/NameChecker";
import { LogoGenerator } from "@/components/LogoGenerator";
import { BiographyGenerator } from "@/components/BiographyGenerator";
import { LegalDocsGenerator } from "@/components/LegalDocsGenerator";
import { StartupChecklist } from "@/components/StartupChecklist";
import { SocialMediaGenerator } from "@/components/SocialMediaGenerator";
import { MarketingStrategyGenerator } from "@/components/MarketingStrategyGenerator";
import { BusinessMentorChatbot } from "@/components/BusinessMentorChatbot";

const HireYourself = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <Rocket className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white leading-tight animate-slide-up">
              HireYourself
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-12 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Launch your business with confidence. Get everything you need from idea to execution.
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button variant="hero" size="lg" className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg">
                Start Your Business Journey
              </Button>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Quick Start */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-10">
            <div className="animate-fade-in space-y-4">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Quick Start Your Business
                </h2>
              </div>
              <p className="text-lg text-foreground/80">
                Follow our proven 4-step process to launch your business in weeks, not months
              </p>
            </div>
            
            <div className="premium-card overflow-hidden">
              <img 
                src="/lovable-uploads/6dbaa8ab-9c93-4c2a-b08e-63196b35ecab.png" 
                alt="Successful entrepreneur celebrating with keys to success" 
                className="w-full h-64 object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Validate Idea",
                description: "Use our tools to research and validate your business concept"
              },
              {
                step: "2", 
                title: "Plan & Strategy",
                description: "Create your business plan and marketing strategy"
              },
              {
                step: "3",
                title: "Legal & Branding",
                description: "Set up your business legally and create your brand identity"
              },
              {
                step: "4",
                title: "Launch & Scale",
                description: "Go to market and grow your business with ongoing support"
              }
            ].map((item, index) => (
              <Card key={index} className="premium-card p-6 text-center group cursor-pointer transition-elegant hover:scale-105">
                <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-glow group-hover:shadow-strong transition-elegant">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Business Tools */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-10">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Complete Business Toolkit
              </h2>
            </div>
            <p className="text-lg text-foreground/80 mt-4">
              Everything you need to transform your idea into a thriving business
            </p>
          </div>
          
          <div className="space-y-16">
            {/* Business Idea Generator */}
            <div className="animate-fade-in-scale">
              <BusinessIdeaGenerator />
            </div>
            
            {/* Name Checker */}
            <div className="animate-fade-in-scale relative" style={{ animationDelay: '0.2s' }}>
              <NameChecker />
              <div className="section-divider mt-16"></div>
            </div>
            
            {/* Logo Generator */}
            <div className="animate-fade-in-scale relative" style={{ animationDelay: '0.3s' }}>
              <LogoGenerator />
              <div className="section-divider mt-16"></div>
            </div>
            
            {/* Biography Generator */}
            <div className="animate-fade-in-scale relative" style={{ animationDelay: '0.4s' }}>
              <BiographyGenerator />
              <div className="section-divider mt-16"></div>
            </div>
            
            {/* Legal Docs Generator */}
            <div className="animate-fade-in-scale relative" style={{ animationDelay: '0.5s' }}>
              <LegalDocsGenerator />
              <div className="section-divider mt-16"></div>
            </div>
            
            {/* Startup Checklist */}
            <div className="animate-fade-in-scale relative" style={{ animationDelay: '0.6s' }}>
              <StartupChecklist />
              <div className="section-divider mt-16"></div>
            </div>
            
            {/* Social Media Generator */}
            <div className="animate-fade-in-scale relative" style={{ animationDelay: '0.7s' }}>
              <SocialMediaGenerator />
              <div className="section-divider mt-16"></div>
            </div>
            
            {/* Marketing Strategy Generator */}
            <div className="animate-fade-in-scale" style={{ animationDelay: '0.8s' }}>
              <MarketingStrategyGenerator />
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Success Stories Preview */}
      <section className="section-transition py-32 bg-gradient-section-3 relative overflow-hidden">
        {/* Elegant ambient elements */}
        <div className="floating-orb top-20 right-20 w-56 h-56 bg-accent/4 animate-float"></div>
        <div className="floating-orb bottom-20 left-20 w-64 h-64 bg-secondary/3 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb top-1/3 left-1/3 w-40 h-40 bg-primary/5 animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block p-8 bg-gradient-card rounded-3xl mb-6 shadow-elegant backdrop-blur-sm animate-fade-in-scale">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Success Stories
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              See how others have transformed their lives through entrepreneurship
            </p>
          </div>
          
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  business: "Digital Marketing Agency",
                  result: "$50K revenue in first year"
                },
                {
                  name: "Marcus Johnson", 
                  business: "E-commerce Store",
                  result: "Replaced full-time salary in 8 months"
                },
                {
                  name: "Lisa Rodriguez",
                  business: "Consulting Practice",
                  result: "Built 6-figure business while working part-time"
                },
                {
                  name: "David Kim",
                  business: "Tech Startup",
                  result: "Secured Series A funding in 18 months"
                }
              ].map((story, index) => (
                <Card key={index} className="premium-card p-6 group cursor-pointer transition-elegant hover:scale-105 animate-fade-in-scale" style={{ animationDelay: `${index * 0.15}s` }}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:shadow-glow transition-elegant">
                      <div className="w-10 h-10 bg-gradient-hero rounded-xl shadow-soft"></div>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{story.name}</h3>
                    <p className="text-muted-foreground mb-2 text-sm">{story.business}</p>
                    <p className="text-secondary font-semibold text-sm">{story.result}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="premium-card overflow-hidden">
              <img 
                src="/lovable-uploads/ff570306-7c9e-46e8-9820-4eeea020f969.png" 
                alt="Professional entrepreneur planning business strategy" 
                className="w-full h-96 object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Business Mentor AI Section */}
      <section className="section-transition py-32 bg-gradient-section-1 relative">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block p-8 bg-gradient-card rounded-3xl mb-6 shadow-elegant backdrop-blur-sm animate-fade-in-scale">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Get Expert Business Advice
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Chat with our AI Business Mentor for personalized guidance on your entrepreneurial journey
            </p>
          </div>
          
          <div className="animate-fade-in-scale" style={{ animationDelay: '0.4s' }}>
            <BusinessMentorChatbot />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HireYourself;