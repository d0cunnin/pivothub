import { ToolIntro, ToolAbout } from "@/components/tool-layout/ToolIntro";
import { Header } from "@/components/Header";
import { ToolHero } from "@/components/tool-layout/ToolHero";
import { WhatYouGet } from "@/components/tool-layout/WhatYouGet";
import { PartyPopper, ClipboardList, Wallet } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";
import { Helmet } from "react-helmet-async";
import { HostItWizard } from "@/components/HostItWizard";
import { ToolGuard } from "@/components/ToolGuard";
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";

const HostIt = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Host It - Plan Your Event | PivotHub</title>
        <meta
          name="description"
          content="Coordinate in-person, virtual, or hybrid events with complete planning for logistics, tech, speakers, sponsors, and promotion."
        />
      </Helmet>

      <Header />

      {/* Hero Section */}
      <ToolHero
        badge="HOST IT · EVENT PLANNING"
        title="Plan Your Event"
        subtitle="From Idea to Execution & Sponsorship: Your Complete Event Playbook."
        credits={"4 Credits"}
      >
        <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Button
                variant="hero"
                size="lg"
                className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                onClick={() => document.getElementById("event-form")?.scrollIntoView({ behavior: "smooth" })}
              >
                Get Started
              </Button>
            </div>
      </ToolHero>

      <section className="pt-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <ToolAbout about='Plan an in-person, virtual, or hybrid event — from the idea to logistics, speakers, sponsors, and promotion.' forWho='Event hosts, organizers, nonprofits, and small businesses.' />
          <WhatYouGet heading="What you'll get" items={[
            { icon: PartyPopper, name: "Event plan", description: "A full plan for your event — theme, venue ideas, guest flow and run of show." },
            { icon: ClipboardList, name: "Checklist & timeline", description: "Countdown tasks so you know what to do each week before the big day." },
            { icon: Wallet, name: "Budget guide", description: "A budget breakdown so you can see where your money goes." },
          ]} />
        </div>
      </section>

      {/* Event Wizard */}
      <section id="event-form" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            <ToolGuard toolName="host-it">
              <HostItWizard />
            </ToolGuard>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HostIt;
