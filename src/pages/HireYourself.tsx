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

const HireYourself = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Rocket className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
              HireYourself
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Launch your business with confidence. Get everything you need from idea to execution.
            </p>
            <Button variant="secondary" size="lg" className="shadow-glow">
              Start Your Business Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Business Tools */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Complete Business Toolkit
          </h2>
          
          <div className="space-y-12 max-w-6xl mx-auto">
            {/* Business Idea Generator */}
            <BusinessIdeaGenerator />
            
            {/* Name Checker */}
            <NameChecker />
            
            {/* Logo Generator */}
            <LogoGenerator />
            
            {/* Biography Generator */}
            <BiographyGenerator />
            
            {/* Legal Docs Generator */}
            <LegalDocsGenerator />
            
            {/* Startup Checklist */}
            <StartupChecklist />
            
            {/* Social Media Generator */}
            <SocialMediaGenerator />
            
            {/* Marketing Strategy Generator */}
            <MarketingStrategyGenerator />
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Quick Start Your Business
            </h2>
            <p className="text-lg text-muted-foreground">
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
              <Card key={index} className="p-6 text-center">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg">
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
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Success Stories
            </h2>
            <p className="text-lg text-muted-foreground">
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
              <Card key={index} className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full mx-auto mb-4"></div>
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
    </div>
  );
};

export default HireYourself;