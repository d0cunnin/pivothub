import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Clock, Target } from "lucide-react";
import SideIncomeAssessment from "@/components/SideIncomeAssessment";
import SideIncomeReport from "@/components/SideIncomeReport";
import heroImage from "@/assets/hero-image.jpg";

export default function SideIncomeBlueprint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'intro' | 'assessment' | 'checkout' | 'report'>('intro');
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAssessmentComplete = useCallback(async (assessmentData: any) => {
    if (!user) {
      // Store assessment data and prompt to sign in
      localStorage.setItem('pendingAssessment', JSON.stringify(assessmentData));
      toast({
        title: "Sign in required",
        description: "Please sign in to continue with your purchase",
      });
      navigate("/auth?redirect=side-income-blueprint");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('side_income_assessments')
        .insert({
          user_id: user.id,
          assessment_data: assessmentData,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setAssessmentId(data.id);
      setStep('checkout');
      setShowCheckout(true);
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
  }, [user, navigate, toast]);

  // Check if returning from auth with pending assessment
  useEffect(() => {
    const success = searchParams.get('success');
    const assessmentParam = searchParams.get('assessment');
    
    if (success === 'true' && assessmentParam) {
      setAssessmentId(assessmentParam);
      setStep('report');
      return;
    }

    // Check for pending assessment after sign-in
    const pendingAssessment = localStorage.getItem('pendingAssessment');
    if (user && pendingAssessment && step === 'intro') {
      try {
        const assessmentData = JSON.parse(pendingAssessment);
        localStorage.removeItem('pendingAssessment');
        handleAssessmentComplete(assessmentData);
      } catch (error) {
        console.error('Error processing pending assessment:', error);
      }
    }
  }, [searchParams, user, step, handleAssessmentComplete]);

  const handleCheckoutConfirm = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your purchase",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier: 'side-income-blueprint', assessmentId }
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
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <DollarSign className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Your Personalized Side Income Blueprint
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

      {/* Main Content */}
      <section id="blueprint-info" className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="max-w-4xl mx-auto">

        <div className="text-center mb-8">
          <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              How It Works
            </h2>
          </div>
          <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
            Pay once, take a quick assessment, and receive your personalized blueprint instantly
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="premium-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-glow">
              1
            </div>
            <CardTitle className="text-lg mb-3">Make Payment</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground text-sm">
                One-time payment of $27 for lifetime access to your blueprint
              </p>
            </CardContent>
          </Card>

          <Card className="premium-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-glow">
              2
            </div>
            <CardTitle className="text-lg mb-3">Take Assessment</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground text-sm">
                Answer questions about your skills, time, and income goals
              </p>
            </CardContent>
          </Card>

          <Card className="premium-card p-6 text-center">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-glow">
              3
            </div>
            <CardTitle className="text-lg mb-3">Get Your Blueprint</CardTitle>
            <CardContent className="p-0">
              <p className="text-muted-foreground text-sm">
                Receive your personalized plan instantly
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 premium-card">
          <CardHeader>
            <CardTitle className="text-2xl">What's Included in Your Blueprint</CardTitle>
            <CardDescription>Everything you need to launch your side income in 90 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3 Custom Income Ideas</h3>
                <p className="text-muted-foreground text-sm">Personalized opportunities ranked by feasibility, with startup costs, time requirements, and income potential for each</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Week-by-Week Launch Plans</h3>
                <p className="text-muted-foreground text-sm">90-day roadmap broken down into weekly action steps—know exactly what to do each week</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">All Templates & Scripts</h3>
                <p className="text-muted-foreground text-sm">Ready-to-use resources including email templates, pitch scripts, and client outreach guides</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm font-bold">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Bonus Tax & Legal Guide</h3>
                <p className="text-muted-foreground text-sm">Essential information on business registration, tax considerations, and legal basics for your side income</p>
              </div>
            </div>
          </CardContent>
        </Card>

          <div className="text-center bg-gradient-card p-8 rounded-2xl shadow-elegant">
            <div className="mb-6">
              <span className="text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">$27</span>
              <span className="text-muted-foreground ml-2 text-lg">one-time payment</span>
            </div>
            <Button 
              size="lg" 
              onClick={() => setStep('assessment')}
              className="text-lg px-12 py-6 shadow-glow hover:scale-105 transition-elegant"
            >
              Get Your Blueprint Now
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              Pay once • Take assessment • Get instant blueprint
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Lifetime access • No recurring fees • 100% digital delivery
            </p>
          </div>
        </div>
        </div>
      </section>

      <CheckoutModal
        open={showCheckout}
        onOpenChange={setShowCheckout}
        onConfirm={handleCheckoutConfirm}
        planName="Side Income Blueprint"
        price="$27"
        isEbook={true}
      />
      
      <Footer />
    </div>
  );
}