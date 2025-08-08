import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { Download, FileText, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-image.jpg";

const Downloads = () => {
  const { user } = useAuth();
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

  const handlePurchase = async (priceId: string) => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase digital downloads.",
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

  const openCheckoutModal = (planName: string, price: string, priceId: string) => {
    setCheckoutModal({
      open: true,
      planName,
      price,
      priceId,
      isEbook: true
    });
  };

  const downloads = [
    {
      title: "Career Transformation Guide",
      price: "$2.99",
      description: "Complete roadmap to career success with actionable strategies, interview tips, and networking guidance.",
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      features: [
        "50+ pages of career guidance",
        "Interview preparation checklist",
        "Networking strategies",
        "Salary negotiation tips",
        "Personal branding guide"
      ],
      priceId: "ebook-career"
    },
    {
      title: "Business Startup Handbook",
      price: "$2.99", 
      description: "Essential guide for entrepreneurs covering business planning, funding, and growth strategies.",
      icon: <FileText className="h-8 w-8 text-primary" />,
      features: [
        "Business plan templates",
        "Funding strategies",
        "Legal considerations",
        "Marketing fundamentals",
        "Financial planning worksheets"
      ],
      priceId: "ebook-business"
    },
    {
      title: "Skills Development Mastery",
      price: "$2.99",
      description: "Master new skills efficiently with proven learning techniques and development frameworks.",
      icon: <Download className="h-8 w-8 text-primary" />,
      features: [
        "Learning acceleration techniques",
        "Skill assessment tools",
        "Development roadmaps",
        "Practice exercises",
        "Progress tracking methods"
      ],
      priceId: "ebook-skills"
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
              <Download className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Digital Downloads
            </h1>
            <div className="text-left max-w-4xl mx-auto">
              <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Comprehensive PDF guides and resources to accelerate your professional growth. 
                Download instantly and access forever.
              </p>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      <section className="section-spacing-sm">
        <div className="page-container">
          <div className="content-width">
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {downloads.map((download, index) => (
                <Card key={download.title} className="premium-card card-padding-lg">
                  <CardHeader className="text-left">
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      {download.icon}
                    </div>
                    <CardTitle className="text-xl">{download.title}</CardTitle>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-primary">{download.price}</span>
                    </div>
                    <CardDescription className="mt-2 text-left">{download.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {download.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Download className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm text-left">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="pt-4">
                      <Button
                        className="w-full"
                        variant="outline"
                        size="lg"
                        onClick={() => openCheckoutModal(download.title, download.price, download.priceId)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-spacing-sm bg-gradient-section-1">
        <div className="page-container">
          <div className="content-width max-w-4xl mx-auto">
            <h2 className="section-header text-center mb-12">Download FAQ</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">What format are the downloads?</h3>
                  <p className="text-muted-foreground text-sm">
                    All downloads are provided as high-quality PDF files that can be viewed on any device.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">How do I access my purchase?</h3>
                  <p className="text-muted-foreground text-sm">
                    After purchase, you'll receive an email with download links. Files are also available in your account dashboard.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Can I print the PDFs?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! All PDFs are print-friendly and optimized for both digital viewing and printing.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Are there refunds for digital downloads?</h3>
                  <p className="text-muted-foreground text-sm">
                    Due to the nature of digital products, all sales are final. No refunds are offered once the download is accessed.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">How long do I have access?</h3>
                  <p className="text-muted-foreground text-sm">
                    Forever! Once purchased, you have unlimited access to download your files anytime.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Need help with your download?</h3>
                  <p className="text-muted-foreground text-sm">
                    Contact our support team and we'll help you access your purchased materials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutModal.open}
        onOpenChange={(open) => setCheckoutModal(prev => ({ ...prev, open }))}
        onConfirm={() => handlePurchase(checkoutModal.priceId)}
        planName={checkoutModal.planName}
        price={checkoutModal.price}
        isEbook={checkoutModal.isEbook}
      />

      <Footer />
    </div>
  );
};

export default Downloads;