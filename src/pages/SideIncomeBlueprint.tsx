import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, Clock, Target } from "lucide-react";
import SideIncomeAssessment from "@/components/SideIncomeAssessment";
import SideIncomeReport from "@/components/SideIncomeReport";

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
    return <SideIncomeReport assessmentId={assessmentId} />;
  }

  if (step === 'assessment') {
    return (
      <div className="container mx-auto px-4 py-8">
        <SideIncomeAssessment 
          onComplete={handleAssessmentComplete}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Personalized Side Income Blueprint
          </h1>
          <p className="text-xl text-muted-foreground">
            Get a custom plan to build sustainable side income based on your unique situation
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <DollarSign className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Personalized Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                3-5 specific income opportunities tailored to your skills and goals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>90-Day Action Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Month-by-month roadmap with specific milestones and tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>Resources & Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Curated list of platforms, courses, and communities to accelerate your success
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What You'll Get</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Skills & Assets Analysis</h3>
                <p className="text-muted-foreground">Deep dive into your unique strengths and how to monetize them</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ranked Income Opportunities</h3>
                <p className="text-muted-foreground">Multiple paths with startup costs, time commitment, and income potential</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Immediate Action Steps</h3>
                <p className="text-muted-foreground">Quick wins you can start implementing today</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-primary text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">90-Day Implementation Plan</h3>
                <p className="text-muted-foreground">Month-by-month milestones to keep you on track</p>
              </div>
            </div>
          </CardContent>
        </Card>

          <div className="text-center">
          <div className="mb-6">
            <span className="text-5xl font-bold">$27</span>
            <span className="text-muted-foreground ml-2">one-time payment</span>
          </div>
          <Button 
            size="lg" 
            onClick={() => setStep('assessment')}
            className="text-lg px-8"
          >
            Start Your Assessment
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Complete the assessment, then pay to receive your personalized blueprint
          </p>
        </div>
      </div>

      <CheckoutModal
        open={showCheckout}
        onOpenChange={setShowCheckout}
        onConfirm={handleCheckoutConfirm}
        planName="Side Income Blueprint"
        price="$27"
        isEbook={true}
      />
    </div>
  );
}