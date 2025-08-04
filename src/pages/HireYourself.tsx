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
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              HireYourself
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Launch your business with confidence. Get everything you need from idea to execution.
            </p>
            <Button variant="hero" size="lg" className="shadow-glow hover-scale">
              Start Your Business Journey
            </Button>
          </div>
        </div>
        
        {/* Bottom decorative strip */}
        <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-r from-secondary via-accent to-primary opacity-80"></div>
      </section>

      {/* Quick Start */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-card"></div>
        
        {/* Decorative background shapes */}
        <div className="absolute top-20 left-20 w-40 h-40 bg-accent/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-20 w-56 h-56 bg-primary/8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-28 h-28 bg-secondary/6 rounded-full blur-xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
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
        
        {/* Colorful bottom divider */}
        <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-r from-primary via-accent via-secondary to-primary opacity-40"></div>
      </section>

      {/* Business Tools */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-hero"></div>
        
        {/* Decorative background elements */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-secondary/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-accent/8 rounded-full blur-xl"></div>
        
        {/* Diagonal stripes */}
        <div className="absolute top-0 right-0 w-full h-full opacity-5">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary to-secondary transform rotate-12 origin-top"></div>
          <div className="absolute top-0 right-8 w-1 h-full bg-gradient-to-b from-accent to-primary transform rotate-12 origin-top"></div>
          <div className="absolute top-0 right-16 w-1 h-full bg-gradient-to-b from-secondary to-accent transform rotate-12 origin-top"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
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
          
          <div className="space-y-20 max-w-6xl mx-auto">
            {/* Business Idea Generator with decorative divider */}
            <div className="animate-fade-in relative" style={{ animationDelay: '0.1s' }}>
              <BusinessIdeaGenerator />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
            
            {/* Name Checker */}
            <div className="animate-fade-in relative" style={{ animationDelay: '0.2s' }}>
              <NameChecker />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
            </div>
            
            {/* Logo Generator */}
            <div className="animate-fade-in relative" style={{ animationDelay: '0.3s' }}>
              <LogoGenerator />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
            </div>
            
            {/* Biography Generator */}
            <div className="animate-fade-in relative" style={{ animationDelay: '0.4s' }}>
              <BiographyGenerator />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
            
            {/* Legal Docs Generator */}
            <div className="animate-fade-in relative" style={{ animationDelay: '0.5s' }}>
              <LegalDocsGenerator />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-secondary to-transparent"></div>
            </div>
            
            {/* Startup Checklist */}
            <div className="animate-fade-in relative" style={{ animationDelay: '0.6s' }}>
              <StartupChecklist />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
            </div>
            
            {/* Social Media Generator */}
            <div className="animate-fade-in relative" style={{ animationDelay: '0.7s' }}>
              <SocialMediaGenerator />
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
            
            {/* Marketing Strategy Generator */}
            <div className="animate-fade-in" style={{ animationDelay: '0.8s' }}>
              <MarketingStrategyGenerator />
            </div>
          </div>
        </div>
        
        {/* Bottom decorative strip */}
        <div className="absolute bottom-0 left-0 w-full h-3 bg-gradient-to-r from-accent via-primary to-secondary opacity-60"></div>
      </section>

      {/* Success Stories Preview */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        
        {/* Background decorative elements */}
        <div className="absolute top-16 right-16 w-36 h-36 bg-accent/8 rounded-full blur-2xl"></div>
        <div className="absolute bottom-16 left-16 w-44 h-44 bg-secondary/6 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-primary/10 rounded-full blur-lg"></div>
        
        <div className="container mx-auto px-4 relative z-10">
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
        
        {/* Final decorative strip */}
        <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-r from-secondary via-primary via-accent to-secondary opacity-50"></div>
      </section>

      <Footer />
      <BusinessMentorChatbot />
    </div>
  );
};

export default HireYourself;