import { ToolIntro, ToolAbout } from "@/components/tool-layout/ToolIntro";
import { Header } from "@/components/Header";
import { ToolHero } from "@/components/tool-layout/ToolHero";
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
      <ToolHero
        badge="GARDEN IT · GARDEN PLANNING"
        title="Plan Your Garden by Location and Season"
        subtitle="A gardening companion that helps you plan what to plant, when to plant, and how to prepare your garden."
        credits={"3 Credits"}
      >
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
      </ToolHero>

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
