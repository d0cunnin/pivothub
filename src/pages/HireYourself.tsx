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
import { GrantFinder } from "@/components/GrantFinder";
import { BusinessPlanGenerator } from "@/components/BusinessPlanGenerator";
import { PitchDeckGenerator } from "@/components/PitchDeckGenerator";
import { BusinessResourceFinder } from "@/components/BusinessResourceFinder";
import heroImage from "@/assets/hero-image.jpg";

const HireYourself = () => {
  console.log("HireYourself component rendering...");
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              HireYourself
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
            <div className="animate-fade-in space-y-4 lg:mr-4">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Quick Start Your Business
                </h2>
              </div>
              <p className="text-lg text-foreground/80">
                Follow our proven 4-step process to launch your business in weeks, not months
              </p>
            </div>
            
            <div className="lg:ml-4 self-center">
              <img 
                src="/lovable-uploads/6dbaa8ab-9c93-4c2a-b08e-63196b35ecab.png" 
                alt="Successful entrepreneur celebrating with keys to success" 
                className="w-full h-auto max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border border-white/10"
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

      {/* Complete Business Toolkit */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          {/* Header with Business Image */}
          <div className="grid lg:grid-cols-2 gap-8 items-center mb-12">
            <div className="animate-fade-in space-y-4">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="section-header">
                  Complete Business Toolkit
                </h2>
              </div>
              <p className="section-description">
                Everything you need to launch and grow your business, from idea validation to legal documentation
              </p>
              
              {/* Tools List */}
              <div className="bg-gradient-card/30 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <h4 className="font-semibold text-foreground mb-3 text-sm">Available Tools:</h4>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>• Business Idea Generator</span>
                  <span>• Name & Domain Checker</span>
                  <span>• Biography Generator</span>
                  <span>• Logo Designer</span>
                  <span>• Startup Checklist</span>
                  <span>• Legal Documents</span>
                  <span>• Business Mentor AI</span>
                  <span>• Business Plan Creator</span>
                  <span>• Pitch Deck Builder</span>
                  <span>• Marketing Strategy</span>
                  <span>• Social Media Content</span>
                  <span>• Grant Finder</span>
                  <span>• Resource Library</span>
                </div>
              </div>
            </div>
            
            <div className="animate-fade-in lg:ml-4 self-center">
              <img 
                src="/lovable-uploads/8d6ceafa-b82d-4c50-a345-214b613d62c1.png" 
                alt="Complete business toolkit and resources" 
                className="w-full h-auto max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
          
          {/* Tetris-style Tool Layout */}
          <div className="space-y-6">
            {/* Row 1: Business Idea Generator (full width) */}
            <div className="animate-fade-in-scale">
              <BusinessIdeaGenerator />
            </div>
            
            {/* Row 2: Name Checker & Biography Generator */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.1s' }}>
                <NameChecker />
              </div>
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
                <BiographyGenerator />
              </div>
            </div>
            
            {/* Row 3: Logo Generator & Startup Checklist & Business Mentor (1+1+1) */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
                <LogoGenerator />
              </div>
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.4s' }}>
                <StartupChecklist />
              </div>
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.5s' }}>
                <BusinessMentorChatbot />
              </div>
            </div>
            
            {/* Row 4: Legal Docs & Business Plan Generator */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.6s' }}>
                <LegalDocsGenerator />
              </div>
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.7s' }}>
                <BusinessPlanGenerator />
              </div>
            </div>
            
            {/* Row 5: Pitch Deck (full width) */}
            <div className="animate-fade-in-scale" style={{ animationDelay: '0.8s' }}>
              <PitchDeckGenerator />
            </div>
            
            {/* Row 6: Marketing Strategy & Social Media & Grant Finder */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="animate-fade-in-scale" style={{ animationDelay: '0.9s' }}>
                <MarketingStrategyGenerator />
              </div>
              <div className="animate-fade-in-scale" style={{ animationDelay: '1.0s' }}>
                <SocialMediaGenerator />
              </div>
              <div className="animate-fade-in-scale" style={{ animationDelay: '1.1s' }}>
                <GrantFinder />
              </div>
            </div>
            
            {/* Row 7: Business Resource Finder (full width) */}
            <div className="animate-fade-in-scale" style={{ animationDelay: '1.2s' }}>
              <BusinessResourceFinder />
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Success Stories Preview */}
      <section className="section-transition py-32 bg-gradient-section-1 relative overflow-hidden">
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
          
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Sarah Chen",
                business: "Physician-Entrepreneur",
                result: "$50K revenue in first year",
                image: "/lovable-uploads/d4fd30c6-edb3-46e3-825a-996fe8d56933.png"
              },
              {
                name: "Marcus Johnson", 
                business: "E-commerce Store",
                result: "Replaced full-time salary in 8 months",
                image: "/lovable-uploads/c092a2c3-3bb8-4c05-8364-539309ef079c.png"
              },
              {
                name: "Lisa Rodriguez",
                business: "Food Truck Owner",
                result: "Built 6-figure business while working part-time",
                image: "/lovable-uploads/e2d88637-eb38-414f-88a9-64e130ef90f8.png"
              },
              {
                name: "David Kim",
                business: "Tech Startup",
                result: "Secured Series A funding in 18 months",
                image: "/lovable-uploads/6c437a8b-65d7-4a74-92f8-893a974d4f08.png"
              }
            ].map((story, index) => (
              <Card key={index} className="premium-card p-6 group cursor-pointer transition-elegant hover:scale-105 animate-fade-in-scale" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 overflow-hidden rounded-2xl group-hover:shadow-glow transition-elegant">
                    <img 
                      src={story.image} 
                      alt={`${story.name} - Success Story`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{story.name}</h3>
                  <p className="text-muted-foreground mb-2 text-sm">{story.business}</p>
                  <p className="text-secondary font-semibold text-sm">{story.result}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
};

export default HireYourself;