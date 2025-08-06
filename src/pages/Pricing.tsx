import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Check, Star, Zap, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Pricing = () => {
  const { user, subscribed, subscriptionTier } = useAuth();
  const { toast } = useToast();
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubscribe = async (priceId: string) => {
    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "Please acknowledge the terms and conditions before proceeding.",
        variant: "destructive",
      });
      return;
    }
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
      ctaAction: () => handleSubscribe("basic-monthly")
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
      ctaAction: () => handleSubscribe("pro-monthly")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="section-spacing-sm bg-gradient-hero">
        <div className="page-container">
          <div className="content-width text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Unlock your potential with the right plan for your journey. Start free and upgrade as you grow.
            </p>
          </div>
        </div>
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
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-primary">{plan.price}</span>
                      {plan.period !== "forever" && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Terms and Conditions Checkbox */}
      <section className="py-8">
        <div className="page-container">
          <div className="content-width max-w-2xl mx-auto">
            <div className="flex items-start space-x-3 p-6 bg-card rounded-lg border">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I acknowledge that I have read and agree to the{" "}
                <a href="/terms-and-conditions" className="text-primary hover:underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                . I understand that due to the nature of digital services, no refunds are offered and all sales are final.
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* PDF E-books Section */}
      <section className="py-8">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center mb-12">
              <h2 className="section-header">PDF E-book Downloads</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get comprehensive guides and resources in downloadable PDF format.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="premium-card card-padding-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Career Transformation Guide</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$2.99</span>
                  </div>
                  <CardDescription className="mt-2">Complete roadmap to career success</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={() => handleSubscribe("ebook-career")}
                  >
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Business Startup Handbook</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$2.99</span>
                  </div>
                  <CardDescription className="mt-2">Essential guide for entrepreneurs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={() => handleSubscribe("ebook-business")}
                  >
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Skills Development Mastery</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-primary">$2.99</span>
                  </div>
                  <CardDescription className="mt-2">Master new skills efficiently</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                    size="lg"
                    onClick={() => handleSubscribe("ebook-skills")}
                  >
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

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