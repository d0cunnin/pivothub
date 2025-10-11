import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import SideIncomeAssessment from "@/components/SideIncomeAssessment";
import SideIncomeReport from "@/components/SideIncomeReport";
import heroImage from "@/assets/hero-image.jpg";

export default function SideIncomeBlueprint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'intro' | 'assessment' | 'report'>('intro');
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const handleAssessmentComplete = useCallback(async (assessmentData: any) => {
    if (!user || !hasPaid) {
      toast({
        title: "Payment required",
        description: "Please complete payment before submitting assessment",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('side_income_assessments')
        .insert({
          user_id: user.id,
          assessment_data: assessmentData,
          payment_status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;

      setAssessmentId(data.id);
      setStep('report');
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, hasPaid, toast]);

  // Check if returning from successful payment
  useEffect(() => {
    const success = searchParams.get('success');
    const session_id = searchParams.get('session_id');
    
    if (success === 'true' && session_id) {
      setHasPaid(true);
      setStep('assessment');
      toast({
        title: "Payment successful!",
        description: "Please complete the assessment to get your blueprint.",
      });
      return;
    }

    // Check if assessment already completed
    const assessmentParam = searchParams.get('assessment');
    if (assessmentParam) {
      setAssessmentId(assessmentParam);
      setStep('report');
    }
  }, [searchParams, toast]);

  const handleStartCheckout = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to purchase your blueprint",
        variant: "destructive"
      });
      navigate("/auth?redirect=/earnit");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: 'earnit' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'report') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SideIncomeReport assessmentId={assessmentId} />
        <Footer />
      </div>
    );
  }

  if (step === 'assessment') {
    return (
      <div className="min-h-screen bg-background">
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
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
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
              Your Personalized Earn It Blueprint
            </h1>
            <div className="text-center max-w-4xl mx-auto">
              <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Get a custom plan to build sustainable side income based on your unique situation, skills, and goals
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
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Introduction Section */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-4xl mx-auto mb-16">
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed text-left">
              Stop wasting time testing random side hustle ideas that don't fit your life. Your personalized Earn It Blueprint analyzes your unique situation—your skills, available time, financial goals, and risk tolerance—to recommend 3 specific income opportunities that are perfect for YOU. Whether you're a stay-at-home parent looking for flexible income, a 9-to-5er wanting extra cash without quitting your job, a retiree seeking meaningful work, or a student building financial independence, this blueprint provides a proven roadmap to launch your side income in 90 days. No generic advice. No trial and error. Just a clear, actionable plan tailored to your life, complete with templates, scripts, and week-by-week guidance. Most people who follow their blueprint earn their first dollar within 30 days and build sustainable $1,500+ monthly income streams within 4-6 months.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section id="blueprint-info" className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  How It Works
                </h2>
              </div>
            </div>
            <p className="text-lg text-foreground/80 mb-12 text-left">
              Three simple steps from payment to personalized plan
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <Card className="premium-card p-8">
                <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl shadow-glow">
                  1
                </div>
                <CardTitle className="text-xl mb-4 text-center">Secure Payment</CardTitle>
                <CardContent className="p-0 space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>One-time $27 payment</strong> via secure Stripe checkout. Payment is required first to prevent spam and ensure we're serving serious entrepreneurs. Your information is protected with 256-bit encryption, the same security banks use.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    After payment, you'll immediately access the assessment portal. No monthly fees, no hidden charges—just a single payment for lifetime access to your blueprint.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-8">
                <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl shadow-glow">
                  2
                </div>
                <CardTitle className="text-xl mb-4 text-center">Complete Assessment</CardTitle>
                <CardContent className="p-0 space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>15-20 minute assessment</strong> that digs deep into your unique situation. We'll ask about your current skills, work experience, available time per week, financial goals, risk tolerance, and preferred income types.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>Pro tip:</strong> The more detailed your answers, the more personalized your recommendations. Our AI analyzes 50+ data points to match you with the perfect opportunities. Take your time and be honest—there are no wrong answers.
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-8">
                <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl shadow-glow">
                  3
                </div>
                <CardTitle className="text-xl mb-4 text-center">Get Your Blueprint</CardTitle>
                <CardContent className="p-0 space-y-3">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    <strong>Instant delivery</strong> of your personalized blueprint the moment you complete the assessment. No waiting, no manual review—your custom plan is generated immediately and available in your account dashboard.
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Access your blueprint anytime, from any device. Download it as PDF, revisit action steps, and update your progress as you build your side income. <strong>Lifetime access included.</strong>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is Perfect For */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Who This Is Perfect For</h2>
            </div>
            <p className="text-lg text-foreground/80 mb-12 text-left">
              Your Earn It Blueprint works for anyone ready to build sustainable side income
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-3 text-white text-2xl">
                    💼
                  </div>
                  <CardTitle className="text-lg">The 9-to-5er</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Goal:</strong> $500-$2,000/month extra without quitting your job
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Example match:</strong> Weekend consulting, online course creation, freelance writing
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-3">
                    "I kept my job security while building $1,800/month on the side doing weekend consulting."
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-3 text-white text-2xl">
                    👨‍👩‍👧
                  </div>
                  <CardTitle className="text-lg">The Parent</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Goal:</strong> Flexible income around family time
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Example match:</strong> Virtual assistance, Etsy shop, social media management
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-3">
                    "I work during nap times and after bedtime, earning $1,200/month as a VA."
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-3 text-white text-2xl">
                    🎓
                  </div>
                  <CardTitle className="text-lg">The Student</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Goal:</strong> Build income while studying
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Example match:</strong> Tutoring, campus services, digital products
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-3">
                    "I went from broke college student to earning $800/month tutoring online."
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-3 text-white text-2xl">
                    🏖️
                  </div>
                  <CardTitle className="text-lg">The Retiree</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Goal:</strong> Supplement retirement with meaningful work
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Example match:</strong> Consulting, teaching, hobby monetization
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-3">
                    "I turned 40 years of experience into a $2,500/month consulting practice."
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-3 text-white text-2xl">
                    🔄
                  </div>
                  <CardTitle className="text-lg">The Career Transitioner</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Goal:</strong> Test new field before fully committing
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Example match:</strong> Freelancing, project work, small business
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-3">
                    "I tested UX design as a side gig before transitioning full-time with confidence."
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-3 text-white text-2xl">
                    💪
                  </div>
                  <CardTitle className="text-lg">The Debt Crusher</CardTitle>
                </CardHeader>
                <CardContent className="p-0 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Goal:</strong> Fast extra income to pay off loans
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Example match:</strong> High-demand services, quick-turn projects
                  </p>
                  <p className="text-xs text-muted-foreground italic mt-3">
                    "I paid off $15,000 in credit card debt in 18 months with side income."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included - Detailed */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What's Included in Your Blueprint</h2>
            </div>
            <p className="text-lg text-foreground/80 mb-12 text-left">
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
                    <h4 className="font-semibold mb-2">How We Match You:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Our AI analyzes your assessment answers across 50+ data points, comparing your skills, available time, financial goals, and risk tolerance against a database of 200+ proven income models. You receive 3 personalized recommendations ranked by feasibility score (1-10).
                    </p>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">Real Example:</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      <strong>If you have:</strong> Teaching experience, 10 hours/week, $1,000/month goal, low risk tolerance
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>You might get:</strong>
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 mt-2 ml-4">
                      <li>• <strong>Online Tutoring</strong> (Feasibility: 9.2/10) - $500-2,000/mo potential, $0 startup, first dollar in 1-2 weeks</li>
                      <li>• <strong>Course Creation</strong> (Feasibility: 7.8/10) - $300-1,500/mo potential, $100 startup, first dollar in 6-8 weeks</li>
                      <li>• <strong>Educational Content Writing</strong> (Feasibility: 8.5/10) - $400-1,200/mo potential, $0 startup, first dollar in 2-3 weeks</li>
                    </ul>
                  </div>

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

              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-lg font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">Week-by-Week Launch Plans</CardTitle>
                      <CardDescription>90-day roadmap with daily action steps for each income idea</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pl-14">
                  <div>
                    <h4 className="font-semibold mb-2">What This Means:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      No more wondering "what do I do next?" Every blueprint includes a detailed 90-day timeline broken into 12 weekly milestones. Each week has 5-7 specific action items, time estimates, and success criteria so you know exactly what to focus on.
                    </p>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 text-sm">Sample Week Breakdown:</h4>
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div>
                        <strong>Week 1: Foundation & Research (5 hours)</strong>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Research top 10 competitors in your niche (2 hours)</li>
                          <li>• Set up business email and basic online presence (1 hour)</li>
                          <li>• Define your unique value proposition (1 hour)</li>
                          <li>• Create pricing structure using provided calculator (1 hour)</li>
                        </ul>
                      </div>
                      <div>
                        <strong>Week 2: Build Your Foundation (8 hours)</strong>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Create professional portfolio/website (4 hours)</li>
                          <li>• Design service packages (2 hours)</li>
                          <li>• Write client-ready proposals using templates (2 hours)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Timeline Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• <strong>Daily time commitments:</strong> Know how many hours to dedicate each day</li>
                      <li>• <strong>Progress milestones:</strong> Clear checkpoints to track your success</li>
                      <li>• <strong>Flexible pacing:</strong> Behind schedule? We include catch-up strategies</li>
                      <li>• <strong>Priority flags:</strong> Know which tasks are critical vs. nice-to-have</li>
                      <li>• <strong>Tools & resources:</strong> Links to recommended platforms and services</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-lg font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">All Templates & Scripts</CardTitle>
                      <CardDescription>Copy-paste resources to save 40+ hours of work</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pl-14">
                  <div>
                    <h4 className="font-semibold mb-2">What's Included:</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Don't waste time creating everything from scratch. Your blueprint includes 15-20 proven templates customized for your specific income ideas. Just fill in the blanks and start using them immediately.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Client Communication:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Cold email outreach scripts (3 variations)</li>
                        <li>• Client proposal templates</li>
                        <li>• Service agreement contracts</li>
                        <li>• Follow-up email sequences</li>
                        <li>• Client onboarding checklist</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Business Operations:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Invoice templates (3 formats)</li>
                        <li>• Pricing calculator spreadsheet</li>
                        <li>• Time tracking sheet</li>
                        <li>• Expense tracker</li>
                        <li>• Client intake forms</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Marketing Materials:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Social media post templates</li>
                        <li>• Portfolio/website copy framework</li>
                        <li>• Service description templates</li>
                        <li>• Testimonial request scripts</li>
                        <li>• Referral request templates</li>
                      </ul>
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg">
                      <h5 className="font-semibold text-sm mb-2">Sales & Pitching:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Elevator pitch templates</li>
                        <li>• Discovery call scripts</li>
                        <li>• Objection handling guide</li>
                        <li>• Pricing presentation templates</li>
                        <li>• Value proposition worksheets</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <strong>Customization guidance:</strong> Each template includes industry-specific variations and customization tips so you're not sending generic messages. Learn how to adapt templates for your unique voice and target audience.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-lg font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">Bonus Tax & Legal Guide</CardTitle>
                      <CardDescription>Essential information to stay compliant and maximize deductions</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pl-14">
                  <div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                      Starting a side income comes with important tax and legal considerations. Your blueprint includes a comprehensive guide covering the essentials every side hustler needs to know—no legal jargon, just clear explanations and actionable steps.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Topics Covered:</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• <strong>Business Structure:</strong> LLC vs. Sole Proprietor—which is right for you and when to make the switch</li>
                      <li>• <strong>Tax Basics:</strong> Quarterly estimated taxes, how much to set aside, and payment schedules</li>
                      <li>• <strong>Deductions Guide:</strong> 20+ common business expenses you can write off (home office, equipment, software, etc.)</li>
                      <li>• <strong>Recordkeeping:</strong> Simple systems to track income and expenses (free tools included)</li>
                      <li>• <strong>When to Hire Help:</strong> At what income level should you consult a CPA or lawyer?</li>
                      <li>• <strong>State Considerations:</strong> How to check state-specific requirements for your income type</li>
                      <li>• <strong>Insurance Basics:</strong> When you need liability insurance and how to get it</li>
                    </ul>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong>Important:</strong> This guide provides general educational information to help you understand the basics. Always consult with a qualified tax professional or attorney for advice specific to your situation. We'll tell you exactly when it's time to hire professional help.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes This Different */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Makes This Different</h2>
            </div>
            <p className="text-lg text-foreground/80 mb-12 text-left">
              Why your Earn It Blueprint beats other side income approaches
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">📄</span>
                    vs. Generic Side Hustle Articles
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Them:</strong> One-size-fits-all listicles like "50 Side Hustles to Try" with no personalization
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Your Blueprint:</strong> AI-analyzed recommendations based on YOUR specific skills, time, goals, and situation—not random ideas that might not fit your life
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">🎓</span>
                    vs. Business Courses
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Them:</strong> 20+ hours of video content, generic strategies, expensive ($200-$2,000), requires weeks to complete
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Your Blueprint:</strong> Immediate actionable plan you can start today, specific to your situation, only $27, takes 20 minutes to complete
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    vs. Consulting Services
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Them:</strong> $500-$3,000 for 1-on-1 consulting, requires multiple sessions, limited follow-up
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Your Blueprint:</strong> Fraction of the cost at $27, lifetime access to your plan, update anytime, all templates included
                  </p>
                </CardContent>
              </Card>

              <Card className="premium-card p-6">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">🔄</span>
                    vs. Trial and Error
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    <strong>Them:</strong> Months testing random ideas, wasted money on wrong ventures, frustration and burnout
                  </p>
                  <p className="text-sm text-foreground">
                    <strong>Your Blueprint:</strong> Skip the guesswork—start with validated matches to your profile, proven roadmap, clear action steps from day one
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Real Success Stories */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Real Success Stories</h2>
            </div>
            <p className="text-lg text-foreground/80 mb-12 text-left">
              People who followed their blueprint and built sustainable side income
            </p>

            <div className="space-y-6 mb-12">
              <Card className="premium-card p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center text-white font-bold">
                        JM
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Jessica M. - Virtual Assistant</h3>
                        <p className="text-sm text-muted-foreground">Stay-at-home mom, 2 kids</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Initial situation:</strong> Needed flexible income around kids' schedules, no recent work experience, 10-15 hours/week available
                      </p>
                      <p>
                        <strong className="text-foreground">Blueprint recommendations:</strong> Virtual assistance for small business owners (top match), social media management, online bookkeeping
                      </p>
                      <p>
                        <strong className="text-foreground">Action steps:</strong> Followed week-by-week plan, used cold email templates to land first 3 clients in Week 4, built portfolio with client testimonials
                      </p>
                      <p>
                        <strong className="text-foreground">Results:</strong> Now earning $1,400/month working 12 hours/week, all during nap times and evenings. First payment came Week 3.
                      </p>
                    </div>
                    <blockquote className="mt-4 pl-4 border-l-4 border-primary/30 italic text-sm">
                      "I was skeptical at first, but the blueprint gave me exactly what I needed—a clear path forward. The templates saved me so much time, and I had my first client within a month. Now I earn more than I expected while still being present for my kids."
                    </blockquote>
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center text-white font-bold">
                        DL
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">David L. - Weekend Consultant</h3>
                        <p className="text-sm text-muted-foreground">Full-time software engineer</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Initial situation:</strong> Wanted extra income without quitting stable job, 15 years tech experience, weekends available
                      </p>
                      <p>
                        <strong className="text-foreground">Blueprint recommendations:</strong> Technical consulting for startups (top match), code review services, online course creation
                      </p>
                      <p>
                        <strong className="text-foreground">Action steps:</strong> Used LinkedIn outreach templates, offered free consultation to first 2 prospects to build testimonials, set up simple website using blueprint guide
                      </p>
                      <p>
                        <strong className="text-foreground">Results:</strong> $2,100/month from 3 retainer clients, working only Saturdays. Paid off $8,000 in credit card debt in 6 months.
                      </p>
                    </div>
                    <blockquote className="mt-4 pl-4 border-l-4 border-primary/30 italic text-sm">
                      "The blueprint matched me with consulting—something I hadn't seriously considered. The week-by-week plan kept me accountable, and the pitch templates helped me close my first clients. Best $27 I ever spent."
                    </blockquote>
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center text-white font-bold">
                        RH
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Rosa H. - Online Tutor</h3>
                        <p className="text-sm text-muted-foreground">Retired teacher, age 63</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <p>
                        <strong className="text-foreground">Initial situation:</strong> Wanted meaningful work to supplement retirement, 30 years teaching experience, flexible schedule
                      </p>
                      <p>
                        <strong className="text-foreground">Blueprint recommendations:</strong> Online tutoring (top match), educational content writing, course creation
                      </p>
                      <p>
                        <strong className="text-foreground">Action steps:</strong> Signed up for tutoring platform recommended in blueprint, used profile template to create compelling bio, started with 2 students in Week 2
                      </p>
                      <p>
                        <strong className="text-foreground">Results:</strong> $1,600/month tutoring 8 hours/week. Now mentoring other retired teachers on how to do the same.
                      </p>
                    </div>
                    <blockquote className="mt-4 pl-4 border-l-4 border-primary/30 italic text-sm">
                      "I thought my teaching career was behind me, but the blueprint showed me how to use my experience in a new way. I love working with students again on my own terms, and the extra income makes retirement so much more comfortable."
                    </blockquote>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline & Expectations */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Timeline & Expectations</h2>
            </div>
            <p className="text-lg text-foreground/80 mb-12 text-left">
              Realistic income progression when you follow your blueprint
            </p>

            <div className="space-y-6 mb-12">
              <Card className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                    Week 0
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Purchase & Assessment</h3>
                    <p className="text-sm text-muted-foreground">
                      <strong>Time commitment:</strong> 20 minutes • <strong>Action:</strong> Complete payment and assessment • <strong>Result:</strong> Receive your personalized blueprint instantly
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                    Weeks<br/>1-2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Research & Planning Phase</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Time commitment:</strong> 5-8 hours/week • <strong>Income:</strong> $0 (foundation building)
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Research your market and competition</li>
                      <li>• Set up basic online presence (email, profiles)</li>
                      <li>• Define your unique value proposition</li>
                      <li>• Create pricing structure using calculator</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                    Weeks<br/>3-4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Setup & Foundation Phase</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Time commitment:</strong> 8-12 hours/week • <strong>Income:</strong> $0-$200 (first sales possible!)
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Build portfolio or simple website</li>
                      <li>• Create service packages and offerings</li>
                      <li>• Start outreach to first prospects</li>
                      <li>• Land first 1-2 clients or make first sales</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                    Weeks<br/>5-8
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Launch & Early Actions Phase</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Time commitment:</strong> 10-15 hours/week • <strong>Income:</strong> $200-$500/month
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Deliver first projects and collect testimonials</li>
                      <li>• Refine your pitch based on real feedback</li>
                      <li>• Scale outreach efforts systematically</li>
                      <li>• Build referral systems with happy clients</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                    Weeks<br/>9-12
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Growth & Optimization Phase</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Time commitment:</strong> 10-15 hours/week • <strong>Income:</strong> $500-$1,500/month
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Streamline processes using templates</li>
                      <li>• Raise prices as you gain confidence</li>
                      <li>• Focus on highest-value activities</li>
                      <li>• Build repeatable systems for client acquisition</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="premium-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">
                    Month<br/>4+
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">Scaling Strategies</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      <strong>Time commitment:</strong> 12-20 hours/week • <strong>Income:</strong> $1,500-$3,000+/month
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Add complementary income streams</li>
                      <li>• Create passive income elements (courses, products)</li>
                      <li>• Build team or outsource low-value tasks</li>
                      <li>• Establish sustainable, semi-automated business</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="premium-card p-6 bg-muted/30">
              <CardContent className="p-0">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  Realistic Income Progression Chart
                </h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span><strong>Month 1:</strong> Setup phase</span>
                    <span className="font-semibold">$0-$200</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span><strong>Month 2:</strong> First clients/sales</span>
                    <span className="font-semibold">$200-$500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span><strong>Month 3:</strong> Momentum building</span>
                    <span className="font-semibold">$500-$1,500</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span><strong>Month 4-6:</strong> Established stream</span>
                    <span className="font-semibold text-primary">$1,500-$3,000+</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic">
                  * Results vary based on effort, market conditions, and chosen income idea. These ranges represent typical outcomes for users who follow their blueprint consistently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
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

      {/* Final CTA */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-card p-12 rounded-2xl shadow-elegant">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Ready to Build Your Side Income?
              </h2>
              <p className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto">
                Stop guessing and start with a clear, personalized plan. Join 1,000+ people who've launched sustainable side income with their Earn It Blueprint.
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
                  <span className="text-sm">Lifetime Access</span>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">$27</span>
                <span className="text-muted-foreground ml-2 text-lg">one-time payment</span>
              </div>

              <Button 
                size="lg" 
                onClick={handleStartCheckout}
                disabled={loading}
                className="text-lg px-16 py-7 shadow-glow hover:scale-105 transition-elegant mb-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Get Your Blueprint Now'
                )}
              </Button>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-primary">🔒</span>
                  <span>Secure payment via Stripe • No recurring fees</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-primary">⚡</span>
                  <span>Instant delivery • 15-minute assessment • Lifetime access</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-primary">💰</span>
                  <span>Less than a meal out for a complete side income roadmap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}