import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Check, Coins, AlertCircle } from "lucide-react";
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

  // Shared feature wording so plans can be compared line by line.
  const plans = [
    {
      name: "Free",
      tagline: "Try PivotHub",
      price: "$0",
      period: "",
      perCredit: "No credit card required",
      tier: "free",
      isFree: true,
      features: [
        { text: "5 credits per month", strong: "5 credits" },
        { text: "Access to every tool" },
        { text: "Credits reset monthly (no rollover)" },
        { text: "Community access" },
        { text: "Email support" },
      ],
    },
    {
      name: "Starter",
      tagline: "Get started",
      price: "$12",
      period: "/mo",
      perCredit: "About 30¢ per credit",
      tier: "starter",
      isPopular: true,
      features: [
        { text: "40 credits per month", strong: "40 credits" },
        { text: "Access to every tool" },
        { text: "Unused credits roll over (up to 80)" },
        { text: "Can add extra credit packs" },
        { text: "Community access" },
        { text: "Email support" },
      ],
    },
    {
      name: "Pro",
      tagline: "For regular use",
      price: "$24",
      period: "/mo",
      perCredit: "About 24¢ per credit",
      tier: "pro",
      features: [
        { text: "100 credits per month", strong: "100 credits" },
        { text: "Access to every tool" },
        { text: "Unused credits roll over (up to 200)" },
        { text: "Can add extra credit packs" },
        { text: "Community access" },
        { text: "Priority email support" },
        { text: "Early access to new features" },
      ],
    },
    {
      name: "All-Access",
      tagline: "For power users",
      price: "$49",
      period: "/mo",
      perCredit: "About 20¢ per credit",
      tier: "all-access",
      features: [
        { text: "250 credits per month", strong: "250 credits" },
        { text: "Access to every tool" },
        { text: "Unused credits roll over (up to 500)" },
        { text: "Can add extra credit packs" },
        { text: "Community access" },
        { text: "Priority email support" },
        { text: "Early access to new features" },
        { text: "Dedicated account manager" },
      ],
    },
  ];

  const packs = [
    { credits: 25, price: "$5", perCredit: "20¢ per credit" },
    { credits: 70, price: "$10", perCredit: "About 14¢ per credit", isBestValue: true },
    { credits: 150, price: "$20", perCredit: "About 13¢ per credit" },
  ];

  const renderFeature = (feature: { text: string; strong?: string }) => {
    if (!feature.strong) return feature.text;
    const rest = feature.text.slice(feature.strong.length);
    return (<><strong className="text-foreground">{feature.strong}</strong>{rest}</>);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="py-16 md:py-20 bg-gradient-hero relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center px-6 py-3 rounded-3xl bg-white/15 mb-6 backdrop-blur-sm border border-white/20">
              <span className="text-2xl font-bold text-white tracking-wider">PRICING</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight">
              Simple, Credit-Based Pricing
            </h1>
            <p className="text-xl md:text-2xl text-white/90 leading-relaxed">
              Start free. Every plan includes every tool. Choose how many credits you need each month.
            </p>
          </div>
        </div>
      </section>

      {/* Plans, side by side */}
      <section className="py-14 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm md:text-base text-muted-foreground mb-10">
            <span className="font-semibold text-foreground">All plans include:</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />Every PivotHub tool</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />Credits only used when you get results</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" />No contract</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl bg-white p-7 flex flex-col shadow-sm ${plan.isPopular ? 'border-2 border-primary shadow-lg' : 'border border-border'}`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 py-1 tracking-wide">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground mb-5">{plan.tagline}</p>
                <div className="mb-1">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-xl text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.perCredit}</p>
                <Button
                  className="w-full mb-6"
                  size="lg"
                  variant={plan.isPopular ? "default" : "outline"}
                  onClick={() => {
                    if (plan.isFree) {
                      window.location.href = "/auth?tab=signup";
                    } else {
                      openCheckoutModal(plan.name, plan.price, plan.tier);
                    }
                  }}
                >
                  {plan.isFree ? "Start for Free" : `Choose ${plan.name}`}
                </Button>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{renderFeature(feature)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extra credit packs */}
      <section className="py-14 md:py-16 bg-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-3 flex items-center justify-center gap-3">
              <Coins className="h-8 w-8 text-primary" />
              Need More Credits?
            </h2>
            <p className="text-lg text-muted-foreground">
              Add an extra credit pack anytime. Extra credits are added right away and can be used until the end of your current billing month.
            </p>
          </div>

          <Alert className="mb-8 bg-amber-50 border-amber-200 max-w-3xl mx-auto">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">Available on paid plans</AlertTitle>
            <AlertDescription className="text-amber-800">
              Extra credit packs can be added to the Starter, Pro, or All-Access plan. On the Free plan, upgrade first to add credits.
            </AlertDescription>
          </Alert>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {packs.map((pack) => (
              <div
                key={pack.credits}
                className={`relative rounded-3xl bg-white p-7 text-center flex flex-col shadow-sm ${pack.isBestValue ? 'border-2 border-primary shadow-lg' : 'border border-border'}`}
              >
                {pack.isBestValue && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground text-xs font-bold px-4 py-1 tracking-wide">
                    BEST VALUE
                  </span>
                )}
                <h3 className="text-2xl font-bold text-foreground">{pack.credits} Credits</h3>
                <div className="my-3">
                  <span className="text-4xl font-bold text-foreground">{pack.price}</span>
                  <span className="text-muted-foreground"> one time</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{pack.perCredit}</p>
                <Button
                  className="w-full mt-auto"
                  variant={pack.isBestValue ? "default" : "outline"}
                  onClick={() => handlePurchaseCredits(pack.credits)}
                  disabled={purchasingCredits}
                >
                  Add {pack.credits} Credits
                </Button>
              </div>
            ))}
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
                  <h3 className="font-semibold text-foreground mb-2">What is the Free plan?</h3>
                  <p className="text-muted-foreground text-sm">
                    The Free plan gives you <strong>5 credits every month</strong>, renewed on the day of the month you signed up. No credit card required. It is perfect for trying the tools or occasional use.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What are credits?</h3>
                  <p className="text-muted-foreground text-sm">
                    Each tool uses a certain number of credits based on complexity. Chatbots use 1 credit per message, most tools use 2-5 credits, and the large blueprint tools use more (Deploy It 40, Create It 70). You can see every tool's price on the Before You Start page.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">When do my credits reset?</h3>
                  <p className="text-muted-foreground text-sm">
                    <strong>Paid plans:</strong> on your billing date each month. <strong>Free plan:</strong> on the day of the month you signed up.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I change plans?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes. You can upgrade or downgrade your plan at any time.
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