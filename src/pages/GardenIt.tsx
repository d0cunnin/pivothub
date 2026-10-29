import { ToolIntro, ToolAbout } from "@/components/tool-layout/ToolIntro";
import { Header } from "@/components/Header";
import { WhatYouGet } from "@/components/tool-layout/WhatYouGet";
import { Sprout, Leaf, ShoppingCart } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { Helmet } from "react-helmet-async";
import { GardenItWizard } from "@/components/GardenItWizard";
import { ToolGuard } from "@/components/ToolGuard";

const GardenIt = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Garden It - Plan Your Garden by Location and Season | PivotHub</title>
        <meta name="description" content="A gardening companion that helps you plan what to plant, when to plant, and how to prepare and maintain a garden based on your geographic location in the United States." />
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
              <span className="text-3xl font-bold text-white tracking-wider">GARDEN IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Plan Your Garden by Location and Season
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              A gardening companion that helps you plan what to plant, when to plant, and how to prepare your garden.
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                variant="hero" 
                size="lg" 
                className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                onClick={() => document.getElementById('garden-form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="pt-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <ToolAbout about='Get a garden plan made for your space, climate, and goals — what to plant, when, and how to care for it.' forWho='Home gardeners, community gardens, and beginners.' />
          <WhatYouGet heading="What you'll get" items={[
            { icon: Sprout, name: "Garden plan", description: "A layout of what to plant and where, matched to your space and climate." },
            { icon: Leaf, name: "Plant cards", description: "Care notes for each plant — watering, sunlight and when to harvest." },
            { icon: ShoppingCart, name: "Shopping list", description: "Everything you need to buy to get started, in one list." },
          ]} />
        </div>
      </section>

      {/* Garden Wizard */}
      <section id="garden-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ToolGuard toolName="garden-it" showCreditInfo={true}>
              <GardenItWizard />
            </ToolGuard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GardenIt;
