import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Check, Star, Zap, Crown } from "lucide-react";
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
    priceId: string;
    isEbook?: boolean;
  }>({
    open: false,
    planName: '',
    price: '',
    priceId: '',
    isEbook: false
  });

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const openCheckoutModal = (planName: string, price: string, priceId: string, isEbook = false) => {
    setCheckoutModal({
      open: true,
      planName,
      price,
      priceId,
      isEbook
    });
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "Limited tool access",
        "Basic assessments",
        "Community support",
        "Save progress"
      ],
      popular: false,
      current: !subscribed,
      ctaText: "Get Started Free",
      ctaAction: () => window.location.href = "/auth"
    },
    {
      name: "Basic",
      price: "$7.99",
      period: "month",
      description: "Everything you need to succeed",
      features: [
        "Full access to all tools",
        "Advanced assessments",
        "Priority support",
        "Export capabilities",
        "Advanced AI features",
        "Progress tracking"
      ],
      popular: true,
      current: subscriptionTier === "Basic",
      ctaText: subscriptionTier === "Basic" ? "Current Plan" : "Upgrade to Basic",
      ctaAction: () => openCheckoutModal("Basic Plan", "$7.99", "basic-monthly")
    },
    {
      name: "Pro",
      price: "$14.99",
      period: "month",
      description: "For power users and teams",
      features: [
        "Everything in Basic",
        "Team collaboration",
        "Custom branding",
        "API access",
        "Advanced analytics",
        "Priority processing",
        "Custom integrations"
      ],
      popular: false,
      current: subscriptionTier === "Pro",
      ctaText: subscriptionTier === "Pro" ? "Current Plan" : "Upgrade to Pro",
      ctaAction: () => openCheckoutModal("Pro Plan", "$14.99", "pro-monthly")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 bg-gradient-hero relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <Crown className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Choose Your Plan
            </h1>
            <div className="text-left max-w-4xl mx-auto">
              <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Unlock your potential with the right plan for your journey. Start free and upgrade as you grow.
              </p>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      <section className="section-spacing-sm">
        <div className="page-container">
          <div className="content-width">
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={plan.name} 
                  className={`relative premium-card card-padding-lg ${
                    plan.popular ? 'border-primary shadow-glow' : ''
                  } ${plan.current ? 'ring-2 ring-primary' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  {plan.current && (
                    <Badge className="absolute -top-3 right-4 bg-green-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  )}
                  
                  <CardHeader className="text-left">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-primary">{plan.price}</span>
                      {plan.period !== "forever" && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    <CardDescription className="mt-2 text-left">{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm text-left">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-4">
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        size="lg"
                        onClick={plan.ctaAction}
                        disabled={plan.current}
                      >
                        {plan.current && <Crown className="h-4 w-4 mr-2" />}
                        {plan.ctaText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutModal.open}
        onOpenChange={(open) => setCheckoutModal(prev => ({ ...prev, open }))}
        onConfirm={() => handleSubscribe(checkoutModal.priceId)}
        planName={checkoutModal.planName}
        price={checkoutModal.price}
        isEbook={checkoutModal.isEbook}
      />

      {/* FAQ Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width max-w-4xl mx-auto">
            <h2 className="section-header text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I change plans anytime?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground text-sm">
                    We accept all major credit cards, PayPal, and bank transfers through our secure payment processor.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Is there a free trial?</h3>
                  <p className="text-muted-foreground text-sm">
                    Our free plan gives you access to basic features forever. Premium features require a paid subscription.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I cancel anytime?</h3>
                  <p className="text-muted-foreground text-sm">
                    Absolutely! Cancel your subscription anytime. You'll continue to have access until the end of your billing period.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Do you offer refunds?</h3>
                  <p className="text-muted-foreground text-sm">
                    Due to the nature of our digital services and instant access to tools, we do not offer refunds. All sales are final.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Need help choosing?</h3>
                  <p className="text-muted-foreground text-sm">
                    Contact our support team and we'll help you find the perfect plan for your needs.
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