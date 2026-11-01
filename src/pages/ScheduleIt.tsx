import { ToolIntro, ToolAbout } from "@/components/tool-layout/ToolIntro";
import { Header } from "@/components/Header";
import { ToolHero } from "@/components/tool-layout/ToolHero";
import { WhatYouGet } from "@/components/tool-layout/WhatYouGet";
import { CalendarDays, ListChecks, Download } from "lucide-react";
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
      <ToolHero
        badge="SCHEDULE IT · TIME MANAGEMENT"
        title="Build Your Life Schedule"
        subtitle="A schedule built around your life, not one that ignores it."
        credits={"5 Credits"}
      >
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
      </ToolHero>

      <section className="pt-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <ToolAbout about='Turn your goals and tasks into a realistic schedule you can download as a PDF.' forWho='Busy people juggling work, family, school, or a side business.' />
          <WhatYouGet heading="What you'll get" items={[
            { icon: CalendarDays, name: "Weekly schedule", description: "A realistic week laid out hour by hour around your work, family and goals." },
            { icon: ListChecks, name: "Priorities & habits", description: "Your top priorities turned into daily habits you can actually keep." },
            { icon: Download, name: "PDF to print", description: "Download your schedule as a PDF to print or keep on your phone." },
          ]} />
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
