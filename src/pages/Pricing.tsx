import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Check, Star, Coins, Zap, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-image.jpg";

const Pricing = () => {
  const { user, subscribed, subscriptionTier } = useAuth();
  const { toast } = useToast();
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    planName: string;
    price: string;
    tier: string;
  }>({
    open: false,
    planName: '',
    price: '',
    tier: ''
  });
  
  const [selectedPathIndex, setSelectedPathIndex] = useState(1); // Default to Starter (index 1)
  const [purchasingCredits, setPurchasingCredits] = useState(false);

  const handlePurchaseCredits = async (credits: number) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase extra credits.",
        variant: "destructive",
      });
      window.location.href = "/auth";
      return;
    }

    // Check if user has active paid subscription
    if (!subscribed) {
      toast({
        title: "Subscription Required",
        description: "Extra credits are only available for active paid subscribers. Please upgrade to a paid plan first.",
        variant: "destructive",
      });
      // Scroll to subscription plans section
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setPurchasingCredits(true);
    try {
      toast({
        title: "Payments Coming Soon",
        description: "Extra credit purchases will be available once payments are reconnected.",
      });
      return;
    } catch (error: any) {
      let errorMessage = "Failed to create checkout session. Please try again.";
      
      if (error?.message?.includes('SUBSCRIPTION_REQUIRED')) {
        errorMessage = "You need an active subscription to purchase extra credits";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPurchasingCredits(false);
    }
  };

  const handleSubscribe = async (tier: string) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      window.location.href = "/auth";
      return;
    }

    try {
      toast({
        title: "Payments Coming Soon",
        description: "Subscription checkout will be available once payments are reconnected.",
      });
      return;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openCheckoutModal = (planName: string, price: string, tier: string) => {
    setCheckoutModal({
      open: true,
      planName,
      price,
      tier
    });
  };

  const allPlans = [
    {
      name: "Free",
      tagline: "No credit card required",
      price: "$0",
      credits: 5,
      features: [
        "5 Tool Credits each month",
        "Credits reset monthly on your signup date",
        "No rollover",
        "Email support",
      ],
      tier: "free",
      isFree: true,
    },
    {
      name: "Starter",
      tagline: "Get the basics",
      price: "$12",
      credits: 40,
      features: [
        "40 Tool Credits each month",
        "Unused credits roll over (up to 2× monthly amount)",
        "Can buy extra credit packs",
        "Email support",
      ],
      tier: "starter",
      isPopular: true,
    },
    {
      name: "Pro",
      tagline: "For regular users",
      price: "$24",
      credits: 100,
      features: [
        "100 Tool Credits each month",
        "Unused credits roll over (up to 2× monthly amount)",
        "Can buy extra credit packs",
        "Priority email support",
        "Early access to new tools",
      ],
      tier: "pro",
    },
    {
      name: "All-Access",
      tagline: "Everything, for power users",
      price: "$49",
      credits: 250,
      features: [
        "250 Tool Credits each month",
        "Unused credits roll over (up to 2× monthly amount)",
        "Can buy extra credit packs",
        "Priority support",
        "Early access to new tools",
        "Dedicated account manager",
      ],
      tier: "all-access",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
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
              Choose Your Path
            </h1>
            <div className="text-center max-w-4xl mx-auto">
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Start free with Explore Mode, then choose the path that fits your journey—or get everything with our All Access Pass.
            </p>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Subscription Plans */}
      <section className="section-spacing-sm bg-white">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Select Your Plan</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Choose the plan that matches your goals. Start free or unlock full access with a paid subscription.
            </p>
            
            <div className="text-base text-muted-foreground max-w-4xl mx-auto text-center space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">PivotHub Pricing Overview</h3>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground mb-2">Explore Mode (Free)</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>5 free credits each month</li>
                  <li>Credits reset on your signup anniversary</li>
                  <li>No rollover</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-bold text-foreground mb-2">Paid Plans</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Starter: $12/month for 40 credits</li>
                  <li>Pro: $24/month for 100 credits</li>
                  <li>All-Access: $49/month for 250 credits</li>
                  <li>Unused credits roll over (up to 2× your monthly limit)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-2">Extra Credit Packs (paid plans)</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>25 credits for $5, 70 credits for $10, 150 credits for $20</li>
                </ul>
              </div>
            </div>
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
                        openCheckoutModal(plan.name, plan.price, plan.tier);
                      }
                    }}
                  >
                    {plan.isFree ? "Start for Free" : `Choose ${plan.name}`}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
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
              <h2 className="text-4xl font-bold">Need More AI Requests?</h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-2">
              Running low on monthly AI requests? Purchase extra credits anytime to keep using PivotHub tools.
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
              Extra credits are only available to active paid subscribers (Starter, Pro, or All-Access plans).
              Free tier users must upgrade to purchase additional credits.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Pack */}
            <Card className="premium-card border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Starter Pack</CardTitle>
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
      />

      {/* Common Questions Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width max-w-4xl mx-auto">
            <h2 className="section-header text-center mb-12">Common Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What is Explore Mode?</h3>
                  <p className="text-muted-foreground text-sm">
                    Explore Mode is our <strong>free forever</strong> tier that gives you 5 credits every month based on your signup anniversary date. No credit card required. Perfect for testing tools or occasional use.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What are AI requests?</h3>
                  <p className="text-muted-foreground text-sm">
                    Each tool uses a certain number of credits based on complexity. Chatbots use 1 credit per message, most tools use 2-5 credits, and the large blueprint tools use more (Deploy It 40, Create It 70). You can see every tool's price on the Before You Start page.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">When do my credits reset?</h3>
                  <p className="text-muted-foreground text-sm">
                    <strong>Paid plans:</strong> On your billing anniversary each month. <strong>Explore Mode:</strong> On your signup anniversary each month.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I switch between paths?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! You can upgrade, downgrade, or switch to a different path anytime. Changes take effect immediately.
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