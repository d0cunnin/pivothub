import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Check, Star, Coins, Zap } from "lucide-react";
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
  
  const [selectedPathIndex, setSelectedPathIndex] = useState(4); // Default to All Access Pass
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
      const { data, error } = await supabase.functions.invoke('purchase-extra-credits', {
        body: { credits },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { tier },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
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
      name: "Explore Mode",
      price: "Free",
      period: "forever",
      description: "Get 5 credits every month to explore our tools",
      features: [
        "5 credits per month (resets on signup anniversary)",
        "Credits reset monthly (no rollover)",
        "Use any tool (costs vary by complexity)",
        "Access to all tool categories",
        "Community access",
        "Email support"
      ],
      tier: "free",
      package: null,
      gradient: "from-gray-500/10 to-gray-600/10",
      isFree: true
    },
    {
      name: "Assess It + Prep It + Learn It Package",
      price: "$18",
      period: "month",
      description: "Master your career journey with 75 monthly credits",
      features: [
        "75 credits per month",
        "Unused credits roll over each month",
        "Career, Skills & Personality Assessment Tools (1 credit each)",
        "Interview Coach & Questions (1 credit each)",
        "Resume Analysis (2 credits)",
        "Course access (free - no credits)",
        "Save unlimited results",
        "Priority email support"
      ],
      tier: "assess-prep-learn",
      package: "assess_prep_learn",
      gradient: "from-blue-500/10 to-cyan-600/10",
      accent: "border-l-4 border-blue-500"
    },
    {
      name: "Build It + Teach It + Launch It Package",
      price: "$18",
      period: "month",
      description: "Build, teach, and launch with 75 monthly credits",
      features: [
        "75 credits per month",
        "Unused credits roll over each month",
        "Business Ideas & Planning (2-4 credits)",
        "Launch Strategy Generator (3 credits)",
        "Teaching Materials (5 credits)",
        "Logo & Branding (1 credit)",
        "Marketing & Social Media (2-3 credits)",
        "Schedule It & Host It tools (2-4 credits)",
        "Save unlimited results",
        "Priority email support"
      ],
      tier: "build-teach-launch",
      package: "build_teach_launch",
      gradient: "from-emerald-500/10 to-green-600/10",
      accent: "border-l-4 border-emerald-500"
    },
    {
      name: "Fund It Package",
      price: "$15",
      period: "month",
      description: "Secure funding with 60 monthly credits",
      features: [
        "60 credits per month",
        "Unused credits roll over each month",
        "Grant Content Generator (4 credits)",
        "Grant Finder (2 credits)",
        "Resource Finder (1 credit)",
        "Save unlimited results",
        "Priority email support"
      ],
      tier: "fund-it",
      package: "fund_it",
      gradient: "from-teal-500/10 to-cyan-600/10",
      accent: "border-l-4 border-teal-500"
    },
    {
      name: "All Access Pass",
      price: "$29",
      period: "month",
      description: "Everything with 150 monthly credits",
      features: [
        "150 credits per month",
        "Unused credits roll over each month",
        "Access to all tools across all packages",
        "High-cost tools: Teaching Materials (5), Business Plans (4)",
        "Medium-cost tools: Resume Analysis (2), Marketing (3)",
        "Low-cost tools: Chatbots (1), Assessment Tools (1)",
        "Priority support & early access",
        "Save unlimited results"
      ],
      tier: "all-access",
      package: "all_access",
      gradient: "from-blue-500/10 to-cyan-600/10",
      accent: "border-l-4 border-blue-500",
      isAllAccess: true,
      savings: "Save $22/month compared to individual packages"
    }
  ];
  
  const selectedPlan = allPlans[selectedPathIndex];

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
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
              Choose the plan that matches your goals. Start free or unlock full access with our premium packages.
            </p>
            <p className="text-base text-muted-foreground max-w-4xl mx-auto">
              <strong>Explore Mode</strong> gives you 5 free credits per month that reset on your signup anniversary (no rollover). 
              <strong> Package plans</strong> ($15-$18/month) include specialized toolkits with monthly credits that roll over (capped at 2× your monthly limit).
              The <strong>All Access Pass</strong> ($29/month) includes everything from all packages, priority support, and early feature access.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Plan Selector Dropdown */}
            <div className="w-full">
              <label className="text-lg font-semibold text-foreground mb-3 block">
                Select Your Plan
              </label>
              <Select
                value={selectedPathIndex.toString()}
                onValueChange={(value) => setSelectedPathIndex(parseInt(value))}
              >
                <SelectTrigger className="w-full h-14 text-lg bg-white border-2">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{selectedPlan.name}</span>
                      {selectedPlan.isAllAccess && (
                        <Badge className="ml-2 bg-primary text-primary-foreground">
                          <Star className="h-3 w-3 mr-1" />
                          Most Popular
                        </Badge>
                      )}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border-2 max-h-[400px] z-50">
                  {allPlans.map((plan, index) => (
                    <SelectItem 
                      key={plan.name} 
                      value={index.toString()}
                      className="cursor-pointer py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{plan.name}</span>
                        {plan.isFree && (
                          <Badge className="ml-2 bg-green-500 text-white text-xs">Free</Badge>
                        )}
                        {plan.isAllAccess && (
                          <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                            Most Popular
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Plan Details Card */}
            <Card className={`premium-card card-padding-lg shadow-lg ${selectedPlan.accent || ''} bg-gradient-to-br ${selectedPlan.gradient || 'from-background to-background'} ${
              selectedPlan.isAllAccess ? 'border-2 border-primary shadow-glow' : 
              selectedPlan.isFree ? 'border-2 border-green-500/30' : 
              'border-2 border-primary/20'
            }`}>
              <CardHeader className="text-center relative">
                {selectedPlan.isAllAccess && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                {selectedPlan.isFree && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Free Forever
                  </Badge>
                )}
                <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary/10 mb-4 mt-2 border border-primary/20">
                  <span className="text-xl font-bold text-primary tracking-wide">{selectedPlan.name.toUpperCase()}</span>
                </div>
                <CardTitle className="text-2xl font-bold mb-4">
                  {selectedPlan.description}
                </CardTitle>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-primary">
                    {selectedPlan.price}
                  </span>
                  <span className="text-xl text-muted-foreground">
                    /{selectedPlan.period}
                  </span>
                </div>
                <CardDescription className="text-lg">
                  {selectedPlan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg text-foreground mb-4">
                    What's Included:
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {selectedPlan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedPlan.isAllAccess && selectedPlan.savings && (
                  <div className="bg-primary/5 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan.savings}
                    </p>
                  </div>
                )}
                
                <div className="pt-6">
                  <Button
                    className="w-full"
                    size="lg"
                    variant={selectedPlan.isAllAccess ? "default" : selectedPlan.isFree ? "outline" : "default"}
                    onClick={() => {
                      if (selectedPlan.isFree) {
                        window.location.href = "/auth";
                      } else {
                        openCheckoutModal(
                          selectedPlan.name,
                          selectedPlan.price,
                          selectedPlan.tier
                        );
                      }
                    }}
                  >
                    {selectedPlan.isFree ? "Get Started Free" : `Get Started with ${selectedPlan.name}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                    Great for trying premium tools
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

            {/* Power Pack - Highlighted */}
            <Card className="premium-card border-2 border-primary shadow-lg hover:shadow-glow transition-all bg-gradient-to-br from-primary/10 to-secondary/10 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                <Star className="h-3 w-3 mr-1" />
                Best Value
              </Badge>
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl mb-2">Power Pack</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-primary">$10</span>
                </div>
                <CardDescription className="text-base font-medium text-foreground">
                  75 Extra Credits
                </CardDescription>
                <p className="text-xs text-primary font-semibold mt-2">
                  Save 33% - Best Value
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Best value for regular users
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
                  onClick={() => handlePurchaseCredits(75)}
                  disabled={purchasingCredits}
                >
                  {purchasingCredits ? "Processing..." : "Purchase 75 Credits"}
                </Button>
              </CardContent>
            </Card>

            {/* Pro Pack */}
            <Card className="premium-card border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg bg-gradient-to-br from-emerald-500/5 to-green-600/5">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mx-auto mb-4">
                  <Zap className="h-8 w-8 text-emerald-500" />
                </div>
                <CardTitle className="text-2xl mb-2">Pro Pack</CardTitle>
                <div className="mb-3">
                  <span className="text-4xl font-bold text-primary">$18</span>
                </div>
                <CardDescription className="text-base font-medium text-foreground">
                  150 Extra Credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    Power user pack - Save 40%
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
            <p className="text-sm text-muted-foreground">
              💡 <strong>Note:</strong> Extra credits expire at the end of your billing month. {!user && "Sign in to purchase credits."}
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
                    Each tool uses a certain number of credits based on complexity: High-cost tools use 5 credits, medium-cost tools use 2 credits, and low-cost tools use 1 credit.
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