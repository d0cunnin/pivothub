import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import reskillIcon from "@/assets/reskill-icon.jpg";
import jobprepIcon from "@/assets/jobprep-icon.jpg";
import hireyourselfIcon from "@/assets/hireyourself-icon.jpg";
import heroVideo from "@/assets/hero-video.mp4";

const Index = () => {
  const features = [
    {
      icon: reskillIcon,
      title: "Teach It",
      description: "Monetize your expertise by teaching others what you know best.",
      link: "/teachit"
    },
    {
      icon: reskillIcon,
      title: "Build It",
      description: "Turn your ideas into reality step by step.",
      link: "/buildit"
    },
    {
      icon: reskillIcon,
      title: "Launch It",
      description: "Get everything ready to go live with ease.",
      link: "/launchit"
    },
    {
      icon: reskillIcon,
      title: "Fund It",
      description: "Explore funding options and strategies.",
      link: "/grantwriting"
    },
    {
      icon: hireyourselfIcon,
      title: "Earn It",
      description: "Discover the right income opportunities for your lifestyle.",
      link: "/earnit"
    },
    {
      icon: jobprepIcon,
      title: "Prep It",
      description: "Prepare for career success.",
      link: "/prepit"
    },
    {
      icon: reskillIcon,
      title: "Assess It",
      description: "Assess, improve, and grow with confidence.",
      link: "/assessit"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Choose your path",
      description: "Select the toolkit that fits your goals."
    },
    {
      number: "02",
      title: "Get your blueprint",
      description: "Follow AI-guided steps to stay on track."
    },
    {
      number: "03",
      title: "Grow your results",
      description: "Launch, earn, and keep building forward."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Entrepreneur",
      quote: "PivotHub gave me the clarity and tools I needed to launch my business. The AI-guided steps made everything feel achievable."
    },
    {
      name: "David K.",
      role: "Creator",
      quote: "I went from idea to launch in 90 days. The blueprint approach kept me focused and motivated through every step."
    },
    {
      name: "Jessica R.",
      role: "Career Changer",
      quote: "The assessment tools helped me understand my strengths and find the right path forward. Truly transformative."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section - White background with video, dark text */}
      <section className="relative bg-background py-24 md:py-32 overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        
        {/* Semi-transparent gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-secondary/80"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight">
              Your Hub for Ideas, Growth, and AI-Powered Launch Tools
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Discover tools that help you build, launch, and grow smarter — all in one place.
            </p>
            <Link to="/pricing">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-10 py-6 shadow-2xl hover:scale-105 transition-elegant group"
              >
                Get Started
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-primary/10"></path>
          </svg>
        </div>
      </section>

      {/* Features Section - Dark background, light text */}
      <section className="relative bg-gradient-to-br from-primary to-primary/90 text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Explore What You Can Do With PivotHub
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              From learning new skills to launching your first idea, PivotHub gives you the AI-driven tools to make it happen.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link key={feature.title} to={feature.link}>
                <Card 
                  className="bg-accent/90 backdrop-blur-sm border-accent hover:bg-accent transition-all duration-300 hover:scale-105 hover:shadow-2xl group animate-fade-in h-full"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-white/90 text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Diagonal Separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M1200 120L0 16.48V0h1200z" className="fill-muted"></path>
          </svg>
        </div>
      </section>

      {/* How It Works Section - White background */}
      <section className="relative bg-white py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              How It Works
            </h2>
            <p className="text-xl text-foreground/80 max-w-3xl mx-auto">
              PivotHub makes it easy to go from idea to impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <Card className="h-full bg-background border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:scale-105 group">
                  <CardHeader>
                    <div className="text-7xl font-bold text-primary mb-4 group-hover:text-accent transition-colors">
                      {step.number}
                    </div>
                    <CardTitle className="text-2xl mb-3">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-lg">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
                
                {/* Arrow connector between cards */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <ChevronRight className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z" className="fill-primary"></path>
          </svg>
        </div>
      </section>

      {/* Testimonials Section - Dark background */}
      <section className="relative bg-gradient-to-br from-primary to-primary/90 text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Real People. Real Results.
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              See how creators, entrepreneurs, and learners are transforming ideas into reality with PivotHub.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name}
                className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center text-white font-bold text-xl">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{testimonial.name}</CardTitle>
                      <CardDescription className="text-white/70">{testimonial.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-white/90 text-base leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Diagonal Separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
          <svg className="relative block w-full h-24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M1200 120L0 16.48V0h1200z" className="fill-accent"></path>
          </svg>
        </div>
      </section>

      {/* CTA Section - Aqua/gradient background */}
      <section className="relative bg-gradient-to-br from-accent to-secondary py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.1] bg-[size:20px_20px]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Start Building Today
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
              Your next chapter begins here. Get access to AI-powered tools that help you grow smarter and faster.
            </p>
            <Link to="/pricing">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 text-lg px-12 py-6 shadow-2xl hover:scale-105 transition-elegant group"
              >
                Join PivotHub
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Start free</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
