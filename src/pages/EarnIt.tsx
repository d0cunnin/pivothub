import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { StructuredData, generateServiceSchema } from "@/components/StructuredData";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import SideIncomeAssessment from "@/components/SideIncomeAssessment";
import SideIncomeReport from "@/components/SideIncomeReport";
import heroImage from "@/assets/hero-image.jpg";

export default function SideIncomeBlueprint() {
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
    "https://pivothub.lovable.app/earnit"
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
    // No auth or credit checks - free to use
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

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Side Income Blueprint | Discover Income Opportunities | PivotHub</title>
        <meta name="description" content="Discover personalized side income opportunities that match your skills, time, and goals. From freelancing to side businesses - find what works for your lifestyle." />
        <meta property="og:title" content="Side Income Blueprint | PivotHub" />
        <meta property="og:description" content="Discover personalized side income opportunities that match your skills and schedule." />
        <link rel="canonical" href="https://pivothub.lovable.app/earnit" />
      </Helmet>
      
      <StructuredData data={serviceSchema} />
      
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
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">EARN IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Discover Income Opportunities That Fit Your Life
            </h1>
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-6 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                From freelancing to side businesses - discover legitimate ways to earn extra income that align with your skills, schedule, and goals.
              </p>
              <p className="text-lg text-white/80 mb-10 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                Get a custom plan based on your unique situation, skills, and goals
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                variant="hero" 
                size="lg" 
                className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                onClick={() => document.getElementById('blueprint-info')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Your Blueprint
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-8 bg-white relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto mb-8">
            <div>
              <p className="text-xl md:text-2xl text-foreground leading-relaxed text-left">
                Stop wasting time on side hustle ideas that do not fit your life. The Earn It Blueprint helps you discover three income opportunities that align with your skills, time, financial goals, and comfort level. It gives you a clear roadmap to start earning within 90 days whether you are a stay-at-home parent, working professional, retiree, or student.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <img 
                src="/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png" 
                alt="Successful entrepreneur with keys to new opportunities" 
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section id="blueprint-info" className="py-12 bg-accent relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  How It Works
                </h2>
              </div>
            </div>
            <p className="text-lg text-white/90 mb-12 text-left">
              Two simple steps to your personalized income plan
            </p>

            <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
              <Card className="bg-white p-8">
                <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl shadow-glow">
                  1
                </div>
                <CardTitle className="text-xl mb-4 text-center text-foreground">Complete Assessment</CardTitle>
                <CardContent className="p-0 space-y-3">
                  <p className="text-foreground text-sm leading-relaxed">
                    <strong>8-minute assessment</strong> that digs deep into your unique situation. We'll ask about your current skills, work experience, available time per week, financial goals, risk tolerance, and preferred income types.
                  </p>
                  <p className="text-foreground text-sm leading-relaxed">
                    <strong>Pro tip:</strong> The more detailed your answers, the more personalized your recommendations. Our AI analyzes 50+ data points to match you with the perfect opportunities. Take your time and be honest—there are no wrong answers.
                  </p>
                  <div className="mt-4 p-3 bg-success/10 rounded-lg">
                    <p className="text-xs text-foreground font-medium">
                      ✓ Requires active account
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white p-8">
                <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl shadow-glow">
                  2
                </div>
                <CardTitle className="text-xl mb-4 text-center text-foreground">Get Your Blueprint</CardTitle>
                <CardContent className="p-0 space-y-3">
                  <p className="text-foreground text-sm leading-relaxed">
                    <strong>Instant delivery</strong> of your personalized blueprint the moment you complete the assessment. No waiting, no manual review—your custom plan is generated immediately and <strong>included with your subscription</strong>.
                  </p>
                  <p className="text-foreground text-sm leading-relaxed">
                    Download it as PDF and access your blueprint anytime from any device. <strong>Get started right now with no barriers.</strong>
                  </p>
                  <div className="mt-4 p-3 bg-success/10 rounded-lg">
                    <p className="text-xs text-foreground font-medium">
                      ✓ Uses credits from your plan
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Ready to Build Your Side Income */}
      <section className="py-12 bg-white relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-card p-12 rounded-2xl shadow-elegant">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Build Your Side Income?
              </h2>
              <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
                Get your custom blueprint with your subscription. Three personalized income ideas with a complete 90-day plan.
              </p>

              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-sm">3 Custom Income Ideas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-sm">90-Day Launch Plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-sm">All Templates Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-primary text-xl">✓</span>
                  <span className="text-sm">Included</span>
                </div>
              </div>

              <div className="mb-8">
                <div className="inline-block p-6 bg-gradient-card rounded-2xl border-2 border-primary/20">
                  <span className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">INCLUDED</span>
                  <p className="text-sm text-muted-foreground mt-2">Account required</p>
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={handleStartAssessment}
                disabled={loading}
                className="text-lg px-16 py-7 shadow-glow hover:scale-105 transition-elegant mb-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Get Your Blueprint'
                )}
              </Button>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-primary">✓</span>
                  <span>Account required</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-primary">⚡</span>
                  <span>Instant delivery • 8-minute assessment</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-primary">💰</span>
                  <span>3 personalized income ideas with 90-day plan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included - Detailed */}
      <section className="py-12 bg-accent relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">What's Included in Your Blueprint</h2>
            </div>
            <p className="text-lg text-white mb-12 text-left">
              Everything you need to launch your side income in 90 days or less
            </p>

            <div className="space-y-6 mb-12">
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-lg font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">3 Custom Income Ideas</CardTitle>
                      <CardDescription>AI-analyzed opportunities ranked by your unique feasibility score</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pl-14">
                  <div>
                    <h4 className="font-semibold mb-2">Each Idea Includes:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• <strong>Income Potential:</strong> Realistic ranges based on part-time effort</li>
                      <li>• <strong>Startup Costs:</strong> Detailed breakdown of initial investment needed</li>
                      <li>• <strong>Time to First Dollar:</strong> When you can expect your first payment</li>
                      <li>• <strong>Time Commitment:</strong> Hours per week required at each stage</li>
                      <li>• <strong>Skill Requirements:</strong> What you need and how to fill gaps</li>
                      <li>• <strong>Competition Analysis:</strong> Market demand vs. supply in your area</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-white relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            <p className="text-lg text-foreground/80 mb-12 text-left">
              Everything you need to know before getting started
            </p>

            <div className="space-y-4">
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">How is this personalized to me?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your blueprint is generated using advanced AI that analyzes 50+ data points from your assessment, including your current skills, work experience, available time, financial goals, risk tolerance, preferred work style, and personal circumstances. The system compares your profile against a database of 200+ proven income models to recommend the 3 best matches with personalized feasibility scores, customized timelines, and tailored action steps.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">What if I don't like my recommendations?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your blueprint includes 3 different income ideas ranked by feasibility, giving you options to choose from. Each recommendation is matched to your profile, but you can focus on whichever opportunity excites you most. Additionally, the blueprint explains why each idea was recommended, helping you understand the logic and potentially discover opportunities you hadn't considered.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">Can I get a refund?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Due to the instant digital delivery and personalized nature of the blueprint, all sales are final. However, we're confident you'll find tremendous value in your customized plan. If you have concerns about the quality or accuracy of your blueprint, please contact our support team and we'll work with you to address any issues.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">How long does the assessment take?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The assessment typically takes 15-20 minutes to complete. We recommend taking your time and providing detailed, honest answers—the quality of your blueprint depends on the quality of your responses. You can pause and resume if needed, though most users prefer to complete it in one sitting while their thoughts are fresh.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">Do I need any special skills or experience?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    No! The blueprint is designed for all experience levels, from complete beginners to seasoned professionals. The assessment asks about your current skills and experience to ensure recommendations match your starting point. Many successful users started with no relevant experience—the blueprint identifies opportunities where you can leverage what you already know or learn quickly.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">Can I do this if I have a full-time job?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Absolutely! Many of our most successful users maintain full-time jobs while building side income. The assessment asks about your available time per week, and recommendations are matched accordingly. Timelines are flexible—if you can only dedicate 5-10 hours per week, your plan adapts with realistic milestones. You're not required to quit your job or take major risks.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">What if I live outside the US?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    The blueprint works for international users! Most recommended income ideas (freelancing, online services, digital products, consulting) can be done from anywhere with an internet connection. The tax and legal guide covers general principles, but you'll need to research country-specific regulations. Many platforms mentioned in templates and resources serve global markets.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">Is this legitimate or a scam?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This is 100% legitimate. You receive a comprehensive, AI-generated personalized blueprint immediately after completing your assessment. No pyramid schemes, no "get rich quick" promises, no recurring charges. Just practical, actionable guidance based on proven income models. Payment is processed securely through Stripe, and you get lifetime access to your plan. We're transparent about realistic timelines and income expectations—this is about building sustainable side income, not overnight wealth.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-lg">Will I get ongoing support after purchase?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your $27 purchase includes lifetime access to your blueprint and all included templates. You can revisit your plan, track progress, and reference materials anytime through your account. While we don't offer 1-on-1 coaching, your blueprint is designed to be self-sufficient with clear, step-by-step guidance. If you have technical issues accessing your blueprint, our support team is available to help.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}