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
      <section className="py-20 bg-gradient-hero relative">
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              HireYourself
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Launch your business with confidence. Get everything you need from idea to execution.
            </p>
            <Button variant="secondary" size="lg" className="shadow-glow hover-scale">
              Start Your Business Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Business Tools */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-hero"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl mb-4 shadow-soft">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Complete Business Toolkit
              </h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto">
              Everything you need to transform your idea into a thriving business
            </p>
          </div>
          
          <div className="space-y-16 max-w-6xl mx-auto">
            {/* Business Idea Generator */}
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <BusinessIdeaGenerator />
            </div>
            
            {/* Name Checker */}
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <NameChecker />
            </div>
            
            {/* Logo Generator */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <LogoGenerator />
            </div>
            
            {/* Biography Generator */}
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <BiographyGenerator />
            </div>
            
            {/* Legal Docs Generator */}
            <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <LegalDocsGenerator />
            </div>
            
            {/* Startup Checklist */}
            <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <StartupChecklist />
            </div>
            
            {/* Social Media Generator */}
            <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
              <SocialMediaGenerator />
            </div>
            
            {/* Marketing Strategy Generator */}
            <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <MarketingStrategyGenerator />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/60 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-card"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block p-6 bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl mb-4 shadow-soft">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Quick Start Your Business
              </h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto">
              Follow our proven 4-step process to launch your business in weeks, not months
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
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
              <Card key={index} className="p-6 text-center border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-glow">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Preview */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block p-6 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-2xl mb-4 shadow-soft">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Success Stories
              </h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto">
              See how others have transformed their lives through entrepreneurship
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
              }
            ].map((story, index) => (
              <Card key={index} className="p-6 border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <div className="w-12 h-12 bg-gradient-hero rounded-full"></div>
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-foreground">{story.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{story.business}</p>
                  <p className="text-secondary font-medium">{story.result}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <BusinessMentorChatbot />
    </div>
  );
};

export default HireYourself;