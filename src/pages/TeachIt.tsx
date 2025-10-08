import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Video, FileText, Users, BookOpen, Target } from "lucide-react";
import TeachingMaterialsGenerator from "@/components/TeachingMaterialsGenerator";
import heroImage from "@/assets/hero-image.jpg";

const TeachIt = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
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
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Teach It
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Transform your expertise into engaging webinars and online courses. Turn your knowledge into income by teaching others what you know best.
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                variant="hero" 
                size="lg" 
                className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                onClick={() => document.getElementById('getting-started')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Started Now
              </Button>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started" className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                How to Get Started
              </h2>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                title: "Identify Your Topic",
                description: "Choose a subject you're passionate about and have expertise in"
              },
              {
                step: "2",
                title: "Structure Your Content",
                description: "Use our tools to create outlines and organize your knowledge"
              },
              {
                step: "3",
                title: "Create Materials",
                description: "Generate handouts, scripts, and supporting resources"
              },
              {
                step: "4",
                title: "Launch & Teach",
                description: "Host your webinar or publish your course and start teaching"
              }
            ].map((item, index) => (
              <Card key={index} className="premium-card p-6 text-center group cursor-pointer transition-elegant hover:scale-105">
                <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg shadow-glow group-hover:shadow-strong transition-elegant">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Teach Section */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Why Teach Online?
              </h2>
            </div>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
              Share your knowledge, build your brand, and create an additional income stream
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Share Your Expertise",
                description: "Turn years of experience into valuable lessons that help others succeed"
              },
              {
                icon: Users,
                title: "Build Your Audience",
                description: "Establish yourself as a thought leader and grow your professional network"
              },
              {
                icon: BookOpen,
                title: "Generate Income",
                description: "Create passive income by selling courses and hosting paid webinars"
              }
            ].map((benefit, index) => (
              <Card key={index} className="premium-card p-8 text-center group animate-fade-in-scale" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow group-hover:shadow-strong transition-elegant">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{benefit.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Generate Teaching Materials Section */}
      <section id="course-tools" className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-4">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Generate Your Teaching Materials
              </h2>
            </div>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
              Provide your skills, experience, and expertise below. We'll generate webinar concepts, course outlines, handouts, and scripts that you can use to teach your subject anywhere.
            </p>
          </div>
          
          <div className="animate-fade-in-scale">
            <TeachingMaterialsGenerator />
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      <Footer />
    </div>
  );
};

export default TeachIt;
