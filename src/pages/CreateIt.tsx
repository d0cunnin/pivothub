import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Rocket, AlertCircle, Code, Zap, Info, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export default function CreateIt() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Create It - Build Your AI Platform | PivotHub</title>
        <meta name="description" content="Design and build your own AI-powered app or platform with comprehensive blueprints and step-by-step guidance." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/10">
        <Header />
        
        <main className="flex-grow container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Rocket className="h-12 w-12 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold gradient-text">
                Create It
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Build Your AI-Powered App or Platform
            </p>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                70 Credits
              </Badge>
              <Badge variant="outline" className="text-lg px-4 py-2 bg-amber-50 border-amber-200 text-amber-800">
                🚧 Coming Soon
              </Badge>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <Alert className="mb-8 bg-blue-50 border-blue-200 max-w-4xl mx-auto">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 text-lg">Feature In Development</AlertTitle>
            <AlertDescription className="text-blue-800">
              Create It is currently being built and will launch soon! This powerful feature will help you design and build your own AI-powered platform with comprehensive blueprints, tech stack recommendations, and step-by-step implementation guides.
              <div className="mt-3 font-medium">
                📋 What you'll get:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Complete platform concept analysis and validation</li>
                  <li>Recommended tech stack (frontend, backend, AI, payments)</li>
                  <li>Step-by-step build guide tailored to your skill level</li>
                  <li>Integration setup instructions (Stripe, Supabase, OpenAI, etc.)</li>
                  <li>Monetization strategy and launch timeline</li>
                  <li>Downloadable blueprint PDF with prompt-ready instructions</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Disclaimers Section */}
          <Card className="mb-8 max-w-4xl mx-auto border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-5 w-5" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="disclaimers">
                  <AccordionTrigger className="text-amber-900 hover:text-amber-700">
                    Read Before You Start (Click to Expand)
                  </AccordionTrigger>
                  <AccordionContent className="text-amber-800 space-y-3">
                    <ul className="list-disc list-inside space-y-2">
                      <li><strong>Significant Time Investment:</strong> Building a platform can take weeks or months depending on complexity and your skill level.</li>
                      <li><strong>Technical Comfort Required:</strong> You should be comfortable using AI tools, following technical instructions, and learning new platforms.</li>
                      <li><strong>Guidance, Not Hosting:</strong> PivotHub provides blueprints and strategies, not direct code deployment or hosting services.</li>
                      <li><strong>Third-Party Tools:</strong> Your app will be built using no-code or low-code tools of your choice (e.g., Lovable, Supabase, Webflow).</li>
                      <li><strong>Self-Paced Implementation:</strong> You'll receive a detailed plan, but execution is entirely up to you.</li>
                      <li><strong>Costs May Apply:</strong> While we recommend affordable tools, some platforms may require paid subscriptions.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Preview: What You'll Build Section */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-center mb-8">What You Can Build</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <Code className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">SaaS Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Build subscription-based software with user management, payments, and AI features.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <Sparkles className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">AI-Powered Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create intelligent applications using OpenAI, Gemini, or other AI APIs.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-primary/20 hover:border-primary/40 transition-colors">
                <CardHeader>
                  <Rocket className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Web Apps</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Design productivity, education, health, or community platforms.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-4">Ready to Build Your Platform?</h3>
                <p className="text-muted-foreground mb-6">
                  Sign up for a PivotHub account and get notified when Create It launches.
                </p>
                {!user ? (
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto"
                    onClick={() => navigate("/auth")}
                  >
                    Sign Up to Get Started
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full md:w-auto"
                    disabled
                  >
                    🚧 Launching Soon - Stay Tuned!
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

        </main>
        
        <Footer />
      </div>
    </>
  );
}
