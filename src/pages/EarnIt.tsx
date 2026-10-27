import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { StructuredData, generateServiceSchema } from "@/components/StructuredData";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, CalendarCheck, DollarSign, Lightbulb, Wrench } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SideIncomeAssessment from "@/components/SideIncomeAssessment";
import SideIncomeReport from "@/components/SideIncomeReport";
import { ReportErrorBoundary } from "@/components/ReportErrorBoundary";
import heroImage from "@/assets/hero-image.jpg";

function SideIncomeBlueprintInner() {
  console.log("EarnIt render start");
  const { user } = useAuth();
  const { remainingRequests } = useUsage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'intro' | 'assessment' | 'report'>('intro');
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const serviceSchema = generateServiceSchema(
    "Side Income Assessment",
    "Financial Counseling",
    "https://pivothub.io/earnit"
  );

  const handleAssessmentComplete = useCallback(async (assessmentData: any) => {
    setLoading(true);
    try {
      console.log('Generating report with assessment data...');
      
      // Pass data directly to report component
      setAssessmentId(JSON.stringify(assessmentData)); // Store data as string in state
      setStep('report');
      
      toast({
        title: "Generating Your Blueprint",
        description: "Creating your personalized side income plan...",
      });
      
    } catch (error: any) {
      console.error('Error processing assessment:', error);
      toast({
        title: "Error",
        description: "Failed to process assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Check if assessment already completed (from URL parameter)
  useEffect(() => {
    const assessmentParam = searchParams.get('assessment');
    if (assessmentParam) {
      setAssessmentId(assessmentParam);
      setStep('report');
    }
  }, [searchParams]);

  const handleStartAssessment = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to generate your Earn It Blueprint.",
      });
      navigate('/auth?redirect=/earnit');
      return;
    }
    if (typeof remainingRequests === 'number' && remainingRequests < 3) {
      toast({
        title: "Not enough credits",
        description: `This blueprint uses 3 credits. You have ${remainingRequests} remaining.`,
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }
    setStep('assessment');
  };

  if (step === 'report') {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Your Side Income Blueprint | PivotHub</title>
          <meta name="description" content="Your personalized side income strategy and action plan." />
        </Helmet>
        <Header />
        <SideIncomeReport assessmentId={assessmentId} />
        <Footer />
      </div>
    );
  }

  if (step === 'assessment') {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Side Income Assessment | PivotHub</title>
          <meta name="description" content="Take our assessment to discover personalized side income opportunities." />
        </Helmet>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <SideIncomeAssessment 
            onComplete={handleAssessmentComplete}
            loading={loading}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const startNote = "3 credits · About 10 minutes · Free account required";

  const benefits = [
    {
      icon: Lightbulb,
      title: "Income ideas matched to you",
      text: "3-5 side income ideas ranked by how well they fit your time, skills, budget, and comfort with risk.",
    },
    {
      icon: DollarSign,
      title: "Real numbers for each idea",
      text: "Startup costs, hours per week, time to your first dollar, and month-by-month income estimates.",
    },
    {
      icon: CalendarCheck,
      title: "A 90-day plan",
      text: "Week-by-week steps for your first three months, plus quick wins and actions to take this week.",
    },
    {
      icon: Wrench,
      title: "Tools and resources",
      text: "Platforms, tools, and communities to help you get started. Download everything as a PDF.",
    },
  ];

  const steps = [
    { title: "Answer the questions", text: "About 10 minutes. Tell us your available time, skills, income goals, and budget." },
    { title: "Get your plan", text: "Your plan is ready right away. It uses 3 credits, charged only once your plan is delivered." },
    { title: "Download and start", text: "Save your plan as a PDF. PivotHub does not store it, so keep your copy." },
  ];

  const faqs = [
    {
      q: "How much does it cost?",
      a: "3 credits. Every free account gets 5 credits each month. Credits are only used once your plan is delivered. If something goes wrong, you are not charged.",
    },
    {
      q: "How long does it take?",
      a: "About 10 minutes to answer the questions. Your plan is created right after you finish.",
    },
    {
      q: "Do I need special skills or experience?",
      a: "No. The questions ask about your current skills and experience so the ideas match where you are starting, whether you are a beginner or a seasoned professional.",
    },
    {
      q: "Can I do this with a full-time job?",
      a: "Yes. You tell us how many hours you have each week, and the ideas and timelines are matched to that.",
    },
    {
      q: "Is my plan saved?",
      a: "No. PivotHub does not store your plan. Download the PDF when it is ready so you have a copy.",
    },
    {
      q: "What if I live outside the US?",
      a: "Many ideas, like freelancing, online services, and digital products, work from anywhere. Tax and legal tips are general, so check the rules where you live.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Side Income Blueprint | Discover Income Opportunities | PivotHub</title>
        <meta name="description" content="Discover personalized side income opportunities that match your skills, time, and goals. From freelancing to side businesses - find what works for your lifestyle." />
        <meta property="og:title" content="Side Income Blueprint | PivotHub" />
        <meta property="og:description" content="Discover personalized side income opportunities that match your skills and schedule." />
      </Helmet>

      <StructuredData data={serviceSchema} />

      <Header />

      {/* Hero */}
      <section className="py-20 bg-primary relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center px-6 py-3 rounded-3xl bg-white/15 mb-8 backdrop-blur-sm border border-white/20">
              <span className="text-2xl font-bold text-white tracking-wider">EARN IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              Find Side Income That Fits Your Life
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Answer a short questionnaire and get a personalized plan with income ideas matched to your skills, schedule, and budget, plus a 90-day plan to get started.
            </p>
            <Button
              variant="hero"
              size="lg"
              className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
              onClick={handleStartAssessment}
            >
              Get My Side Income Plan
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-white/80">{startNote}</p>
          </div>
        </div>
      </section>

      {/* What you'll get */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">What You'll Get</h2>
            <p className="text-lg text-muted-foreground text-center mb-10">
              A clear, personal plan instead of guessing which side hustle to try.
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map(({ icon: Icon, title, text }) => (
                <Card key={title} className="premium-card h-full">
                  <CardContent className="p-6 flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{title}</h3>
                      <p className="text-muted-foreground">{text}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <div key={step.title} className="rounded-2xl bg-white border p-6 text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-4">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Button variant="hero" size="lg" className="px-10" onClick={handleStartAssessment}>
                Get My Side Income Plan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">{startNote}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Common Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-left text-base font-semibold">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function SideIncomeBlueprint() {
  return (
    <ReportErrorBoundary>
      <SideIncomeBlueprintInner />
    </ReportErrorBoundary>
  );
}