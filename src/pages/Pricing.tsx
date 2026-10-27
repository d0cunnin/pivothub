import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Check, Star, Coins, Zap, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentCheckout } from "@/components/PaymentCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { getStripeEnvironment } from "@/lib/payments/stripe";
import heroImage from "@/assets/hero-image.jpg";

const Pricing = () => {
  const { user, subscribed, refreshSubscription } = useAuth();
  const [paymentPriceId, setPaymentPriceId] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState("");
  const { toast } = useToast();
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    planName: string;
    price: string;
    tier: string;
    credits?: number;
    isOneTime?: boolean;
  }>({
    open: false,
    planName: '',
    price: '',
    tier: ''
  });
  

  const purchasingCredits = false;
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    if (!sessionId || !user) return;
    let cancelled = false;
    async function confirmPayment() {
      try {
        const { data, error } = await supabase.functions.invoke('payment-status', { body: { sessionId, environment: getStripeEnvironment() } });
        if (error || data?.error) throw new Error(data?.error ?? 'Unable to confirm payment. Please contact support.');
        if (!cancelled) {
          setPaymentResult(data.credits > 0
            ? data.environment === 'sandbox' ? `Test purchase confirmed: ${data.credits} Tool Credits recorded. Your live balance is unchanged.` : `Payment confirmed. ${data.credits} Tool Credits have been added to your account.`
            : 'Your payment is awaiting confirmation. Tool Credits will be added once payment is confirmed.');
          await refreshSubscription();
        }
      } catch (e) { if (!cancelled) setPaymentResult(e instanceof Error ? e.message : 'Unable to confirm payment.'); }
    }
    confirmPayment();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handlePurchaseCredits = (credits: number) => {
    if (!user) { window.location.href = '/auth'; return; }
    if (!subscribed) {
      toast({ title: 'Subscription Required', description: 'Extra Tool Credits require an active paid subscription.', variant: 'destructive' });
      return;
    }
    const packs = {
      25: { name: 'Small Pack', price: '$5', id: 'small_pack' },
      70: { name: 'Boost Pack', price: '$10', id: 'boost_pack' },
      150: { name: 'Power Pack', price: '$20', id: 'power_pack' },
    };
    const pack = packs[credits as keyof typeof packs];
    if (pack) setCheckoutModal({ open: true, planName: pack.name, price: pack.price, tier: pack.id, credits, isOneTime: true });
  };

  const handleSubscribe = (tier: string) => {
    if (!user) { window.location.href = '/auth'; return; }
    const prices: Record<string, string> = { starter: 'starter_monthly', pro: 'pro_monthly', 'all-access': 'all_access_monthly' };
    setPaymentPriceId(prices[tier] ?? tier);
  };

  const openCheckoutModal = (planName: string, price: string, tier: string, credits: number) => {
    setCheckoutModal({ open: true, planName, price, tier, credits, isOneTime: false });
  };

  const allPlans = [
    {
      name: "Free",
      tagline: "No credit card required",
      price: "$0",
      credits: 5,
      tier: "free",
      isFree: true,
    },
    {
      name: "Starter",
      tagline: "Get the basics",
      price: "$12",
      credits: 40,
      tier: "starter",
      isPopular: true,
    },
    {
      name: "Pro",
      tagline: "For regular users",
      price: "$24",
      credits: 100,
      tier: "pro",
    },
    {
      name: "All-Access",
      tagline: "Everything, for power users",
      price: "$49",
      credits: 250,
      tier: "all-access",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <PaymentTestModeBanner />
      {paymentResult && <div role="status" className="bg-muted border-b border-border px-6 py-4 text-center">{paymentResult}</div>}
      {paymentPriceId && <PaymentCheckout priceId={paymentPriceId} onClose={() => setPaymentPriceId(null)} />}
      
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
              <span className="text-3xl font-bold text-white tracking-wider">PRICING</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Simple, Clear Pricing
            </h1>
            <div className="text-center max-w-4xl mx-auto">
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Start with the Free plan, then upgrade to Starter, Pro, or All-Access whenever you need more Tool Credits.
            </p>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Subscription Plans */}
      <section className="section-spacing-sm bg-white">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">Compare Plans</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Every plan works with every tool. Plans differ only in how many Tool Credits you get each month.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-base text-muted-foreground mb-10">
            <span className="font-semibold text-foreground">All plans include:</span>
            <span className="flex items-center"><Check className="h-4 w-4 text-primary mr-1" />Access to every tool</span>
            <span className="flex items-center"><Check className="h-4 w-4 text-primary mr-1" />Saved results</span>
            <span className="flex items-center"><Check className="h-4 w-4 text-primary mr-1" />Email support</span>
            <span className="flex items-center"><Check className="h-4 w-4 text-primary mr-1" />Cancel anytime</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {allPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col rounded-3xl p-2 ${plan.isPopular ? 'border-2 border-primary shadow-glow' : 'border'}`}
              >
                {plan.isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.tagline}</CardDescription>
                  <div className="pt-4">
                    <span className="text-5xl font-bold text-primary">{plan.price}</span>
                    {!plan.isFree && <span className="text-xl text-muted-foreground">/mo</span>}
                  </div>
                  <p className="font-semibold text-foreground pt-2">{plan.credits} Tool Credits / month</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-6">
                  <Button
                    className="w-full"
                    size="lg"
                    variant={plan.isPopular ? "default" : "outline"}
                    onClick={() => {
                      if (plan.isFree) {
                        window.location.href = "/auth";
                      } else {
                        openCheckoutModal(plan.name, plan.price, plan.tier, plan.credits);
                      }
                    }}
                  >
                    {plan.isFree ? "Start for Free" : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Extra Credits Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-4">
              <Coins className="h-8 w-8 text-primary mr-3" />
              <h2 className="text-4xl font-bold">Need Extra Tool Credits?</h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-2">
              Running low? Add an extra credit pack anytime to keep using PivotHub tools.
            </p>
            <p className="text-base text-muted-foreground max-w-3xl mx-auto">
              Extra credits are added immediately to your account and can be used within your current billing month.
            </p>
          </div>

          {/* Subscription Requirement Alert */}
          <Alert className="mb-8 bg-amber-50 border-amber-200 max-w-4xl mx-auto">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Paid Subscription Required</AlertTitle>
            <AlertDescription className="text-amber-800">
              Extra credits are only available to active paid subscribers (Starter, Pro, or All-Access).
              Free plan users must upgrade to purchase additional credits.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Small Pack */}
            <Card className="premium-card border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Small Pack</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-primary">$5</span>
                </div>
                <CardDescription className="text-base font-medium text-foreground">
                  25 Extra Credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Perfect for occasional needs
                  </p>
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Added instantly to your account
                  </p>
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Valid for current billing month
                  </p>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handlePurchaseCredits(25)}
                  disabled={purchasingCredits}
                >
                  {purchasingCredits ? "Processing..." : "Purchase 25 Credits"}
                </Button>
              </CardContent>
            </Card>

            {/* Boost Pack - Highlighted */}
            <Card className="premium-card border-2 border-primary shadow-lg hover:shadow-glow transition-all bg-gradient-to-br from-primary/10 to-secondary/10 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                <Star className="h-3 w-3 mr-1" />
                Best Value
              </Badge>
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Boost Pack</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-primary">$10</span>
                </div>
                <CardDescription className="text-base font-medium text-foreground">
                  70 Extra Credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Perfect for active users
                  </p>
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Added instantly to your account
                  </p>
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Valid for current billing month
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handlePurchaseCredits(70)}
                  disabled={purchasingCredits}
                >
                  {purchasingCredits ? "Processing..." : "Purchase 70 Credits"}
                </Button>
              </CardContent>
            </Card>

            {/* Power Pack */}
            <Card className="premium-card border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg bg-gradient-to-br from-emerald-500/5 to-green-600/5">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl mb-2">Power Pack</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-primary">$20</span>
                </div>
                <CardDescription className="text-base font-medium text-foreground">
                  150 Extra Credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Maximum credits for heavy usage
                  </p>
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Added instantly to your account
                  </p>
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Valid for current billing month
                  </p>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handlePurchaseCredits(150)}
                  disabled={purchasingCredits}
                >
                  {purchasingCredits ? "Processing..." : "Purchase 150 Credits"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-base text-muted-foreground">
              💡 <strong>Note:</strong> Extra credits are only available for paid subscribers and expire at the end of your billing month. {!user && "Sign in to purchase credits."}
            </p>
          </div>
        </div>
      </section>

      <CheckoutModal
        open={checkoutModal.open}
        onOpenChange={(open) => setCheckoutModal(prev => ({ ...prev, open }))}
        onConfirm={() => handleSubscribe(checkoutModal.tier)}
        planName={checkoutModal.planName}
        price={checkoutModal.price}
        credits={checkoutModal.credits}
        isOneTime={checkoutModal.isOneTime}
      />

      {/* Common Questions Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width max-w-4xl mx-auto">
            <h2 className="section-header text-center mb-12">Common Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What is the Free plan?</h3>
                  <p className="text-muted-foreground text-sm">
                    The Free plan is <strong>free forever</strong> and that gives you 5 credits every month based on your signup anniversary date. No credit card required. Perfect for testing tools or occasional use.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What are Tool Credits?</h3>
                  <p className="text-muted-foreground text-sm">
                    Each tool uses a certain number of credits based on complexity. Chatbots use 1 credit per message, most tools use 2-5 credits, and the large blueprint tools use more (Deploy It 40, Create It 70). You can see every tool's price on the Before You Start page.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">When do my credits reset?</h3>
                  <p className="text-muted-foreground text-sm">
                    <strong>Paid plans:</strong> On your billing anniversary each month. <strong>Free plan:</strong> On your signup anniversary each month.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I switch plans?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! You can upgrade, downgrade, or switch plans anytime. Manage billing and cancellation in Account Settings. Contact support for plan changes; do not start a second subscription.
                  </p>
                </div>
              </div>
            </div>

            {/* View All FAQs CTA */}
            <div className="text-center mt-12">
              <Link to="/faq">
                <Button size="lg" variant="outline">
                  View All Frequently Asked Questions →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;