import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Check, Star } from "lucide-react";
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
      description: "Try 1 AI tool per month with limited access",
      features: [
        "1 AI tool use per month",
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
      description: "Master your career journey with assessment, prep, and learning tools",
      features: [
        "50 AI requests per month",
        "Career, Skills & Personality Assessments",
        "Interview Coach & Questions Generator",
        "Resume & Cover Letter Coach",
        "Course access and learning tools",
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
      description: "Build, teach, and launch your ventures and creative ideas",
      features: [
        "50 AI requests per month",
        "Business Idea Generator & Planning",
        "Logo, Name & Branding Tools",
        "Teaching Materials Generator",
        "Launch Strategy Generator",
        "Social Media & Marketing Tools",
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
      description: "Secure funding with grant writing and resource tools",
      features: [
        "50 AI requests per month",
        "Grant Narrative Generator",
        "Grant Finder & Search",
        "Local Resource Finder",
        "Application guidance",
        "Budget templates",
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
      description: "Get access to every tool with generous usage limits",
      features: [
        "50 AI requests per month",
        "Everything from all packages",
        "All assessment & career tools",
        "All business & creative tools",
        "All funding & grant tools",
        "Priority feature access",
        "Save unlimited results",
        "Early access to new tools",
        "Priority email support"
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
                Start with a free trial, then choose the path that fits your journey—or get everything with our All Access Pass.
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
              <strong>Explore Mode</strong> gives you 1 free AI tool use per month. 
              <strong> Package plans</strong> ($15-$18/month) unlock 50 AI requests per month across specialized toolkits. 
              The <strong>All Access Pass</strong> ($29/month) includes everything from all packages with 50 requests/month, priority support, and early feature access.
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
                    {selectedPlan.isFree ? "Start Free Trial" : `Get Started with ${selectedPlan.name}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
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

      {/* FAQ Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width max-w-4xl mx-auto">
            <h2 className="section-header text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I switch between paths?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! You can upgrade, downgrade, or switch to a different path anytime. Changes take effect immediately.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What are AI requests?</h3>
                  <p className="text-muted-foreground text-sm">
                    Each time you use an AI-powered tool (like generating a resume, business plan, or assessment), it counts as 1 AI request. All paid plans include 50 requests per month.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What happens if I run out of requests?</h3>
                  <p className="text-muted-foreground text-sm">
                    You can purchase extra credit packs (10, 25, or 50 requests) to continue using tools within your current billing month, or wait until your monthly requests reset.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What happens after the free trial?</h3>
                  <p className="text-muted-foreground text-sm">
                    After your trial, you'll be on the free Explore Mode with 1 tool use per month. Upgrade anytime to unlock 50 monthly AI requests.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h3>
                  <p className="text-muted-foreground text-sm">
                    Absolutely! Cancel your subscription anytime. You'll continue to have access until the end of your billing period.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground text-sm">
                    We accept all major credit cards through our secure payment processor, Stripe.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Do you offer refunds?</h3>
                  <p className="text-muted-foreground text-sm">
                    Due to the nature of our digital services and instant access to tools, we do not offer refunds. All sales are final. Try our free trial first!
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Which path is right for me?</h3>
                  <p className="text-muted-foreground text-sm">
                    If you're job hunting, choose Job Prep. Starting a business? Pick Hire Yourself. Not sure? Get the All Access Pass for everything.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;