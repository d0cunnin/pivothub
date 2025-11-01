import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Zap, Info, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import heroImage from "@/assets/hero-image.jpg";

export default function CreateIt() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Create It - Build Your AI Platform | PivotHub</title>
        <meta name="description" content="Design and build your own AI-powered app or platform with comprehensive blueprints and step-by-step guidance." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        {/* Hero Section */}
        <section className="relative h-[500px] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img 
              src={heroImage} 
              alt="Create It Hero" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80" />
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
          <div className="absolute top-20 left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          
          {/* Content */}
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/15 text-white border-white/30 hover:bg-white/20">
              CREATE IT
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Build Your AI-Powered Platform
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Get a comprehensive blueprint to design and launch your own app or platform
            </p>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                70 Credits
              </Badge>
              <Badge className="text-lg px-4 py-2 bg-amber-500/90 text-white border-0 hover:bg-amber-600/90">
                🚧 Coming Soon
              </Badge>
            </div>
          </div>
        </section>
        
        <main className="flex-grow container mx-auto px-4 py-12">
          {/* Integration Setup Section */}
          <Card className="mb-8 max-w-4xl mx-auto border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                🔌 Complete Integration Setup Included
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create It provides step-by-step instructions for setting up all necessary integrations for your specific app type. We handle the technical decisions so you can focus on building.
              </p>
            </CardContent>
          </Card>

          {/* Coming Soon Notice */}
          <Alert className="mb-8 bg-blue-50 border-blue-200 max-w-4xl mx-auto">
            <Info className="h-5 w-5 text-blue-600" />
            <AlertTitle className="text-blue-900 text-lg">Feature In Development</AlertTitle>
            <AlertDescription className="text-blue-800">
              Create It is currently being built and will launch soon! This powerful feature will help you design and build your own AI-powered platform with comprehensive blueprints and step-by-step implementation guides.
              <div className="mt-3 font-medium">
                📋 What you'll get:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Complete platform concept analysis and validation</li>
                  <li>Prescribed tech stack based on your app type</li>
                  <li>Step-by-step build guide tailored to your skill level</li>
                  <li>Integration setup instructions</li>
                  <li>Monetization strategy and launch timeline</li>
                  <li>Downloadable blueprint PDF with detailed guidance</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Technical Requirements Disclaimer */}
          <Alert className="mb-8 bg-amber-50 border-amber-200 max-w-4xl mx-auto">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="text-amber-900 text-lg">Technical Requirements</AlertTitle>
            <AlertDescription className="text-amber-800">
              <p className="mb-3">
                <strong>Create It is designed for tech-comfortable users</strong> who can handle technical implementation and troubleshooting. 
                You will need to be able to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Understand basic technical terminology (APIs, integrations, databases, hosting)</li>
                <li>Follow detailed technical documentation and implementation guides</li>
                <li>Set up and configure development tools and platforms</li>
                <li>Troubleshoot technical issues independently using resources and documentation</li>
                <li>Navigate developer platforms and configure technical settings</li>
                <li>Commit to a sustained building effort over weeks or months</li>
              </ul>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                <p className="font-semibold mb-2">
                  🚫 This is NOT for beginners:
                </p>
                <p className="mb-2">
                  If you feel lost when dealing with technology or prefer guided, step-by-step support, 
                  this tool may be too advanced for you.
                </p>
                <p>
                  <strong>Recommended alternative:</strong> Start with <strong>Prompt It</strong> and <strong>Code It</strong>{" "}
                  to build foundational skills first before attempting Create It.
                </p>
              </div>
              <p className="mt-4 text-sm">
                <strong>Note:</strong> You will receive a comprehensive blueprint, but <strong>building your platform requires 
                technical knowledge, sustained effort, and the ability to learn and troubleshoot independently.</strong>
              </p>
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
                      <li><strong>Implementation:</strong> You'll receive detailed instructions for building your platform.</li>
                      <li><strong>Self-Paced Implementation:</strong> You'll receive a detailed plan, but execution is entirely up to you.</li>
                      <li><strong>Costs May Apply:</strong> Some recommended platforms may require paid subscriptions.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center max-w-2xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="text-2xl font-bold mb-4">Ready to Turn Your App Idea Into Reality?</h3>
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
