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
      
      <section className="section-spacing-sm bg-gradient-hero">
        <div className="page-container">
          <div className="content-width text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Digital Downloads
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              Comprehensive PDF guides and resources to accelerate your professional growth. 
              Download instantly and access forever.
            </p>
          </div>
        </div>
      </section>

      <section className="section-spacing-sm">
        <div className="page-container">
          <div className="content-width">
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {downloads.map((download, index) => (
                <Card key={download.title} className="premium-card card-padding-lg">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                      {download.icon}
                    </div>
                    <CardTitle className="text-xl">{download.title}</CardTitle>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-primary">{download.price}</span>
                    </div>
                    <CardDescription className="mt-2">{download.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {download.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <Download className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      className="w-full"
                      variant="outline"
                      size="lg"
                      onClick={() => openCheckoutModal(download.title, download.price, download.priceId)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
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