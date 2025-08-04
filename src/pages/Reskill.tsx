import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, BookOpen, Award, Target, Users, TrendingUp } from "lucide-react";
import { CareerAdvisorChatbot } from "@/components/CareerAdvisorChatbot";

const Reskill = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-hero hero-glow overflow-hidden">
        {/* Sophisticated floating orbs */}
        <div className="floating-orb top-16 right-16 w-40 h-40 bg-primary/8 animate-float"></div>
        <div className="floating-orb bottom-24 left-16 w-32 h-32 bg-secondary/10 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb top-1/3 right-1/3 w-24 h-24 bg-accent/12 animate-float" style={{ animationDelay: '4s' }}></div>
        <div className="floating-orb bottom-1/3 left-1/4 w-20 h-20 bg-primary/15 animate-float" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 text-white leading-tight animate-slide-up">
              Reskill for Success
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-12 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Transform your career with industry-recognized certifications and cutting-edge skills training
            </p>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button size="lg" className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg">
                Start Learning Today
              </Button>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Skills Assessment */}
      <section className="section-transition py-32 bg-gradient-section-1 relative overflow-hidden">
        {/* Sophisticated ambient lighting */}
        <div className="floating-orb top-24 left-24 w-64 h-64 bg-accent/3 animate-float"></div>
        <div className="floating-orb bottom-24 right-24 w-80 h-80 bg-primary/4 animate-float" style={{ animationDelay: '3s' }}></div>
        <div className="floating-orb top-1/2 right-1/3 w-48 h-48 bg-secondary/3 animate-float" style={{ animationDelay: '1.5s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="premium-card overflow-hidden">
              <img 
                src="/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png" 
                alt="Professional development and skill building" 
                className="w-full h-80 object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="inline-block p-8 bg-gradient-card rounded-3xl mb-6 shadow-elegant backdrop-blur-sm animate-fade-in-scale">
                <h2 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                  Find Your Perfect Learning Path
                </h2>
              </div>
              <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed animate-fade-in mb-8" style={{ animationDelay: '0.2s' }}>
                Take our skills assessment to get personalized course recommendations
              </p>
              <Button variant="default" size="lg" className="transition-elegant hover:scale-105 px-12 py-6 text-lg">
                Take Assessment
              </Button>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Learning Categories */}
      <section className="section-transition py-32 bg-gradient-section-2 relative overflow-hidden">
        {/* Ambient background elements */}
        <div className="floating-orb top-1/4 left-0 w-96 h-96 bg-primary/2 animate-float"></div>
        <div className="floating-orb bottom-1/4 right-0 w-72 h-72 bg-secondary/4 animate-float" style={{ animationDelay: '2.5s' }}></div>
        <div className="floating-orb top-1/2 left-1/3 w-56 h-56 bg-accent/3 animate-float" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block p-8 bg-gradient-card rounded-3xl mb-6 shadow-elegant backdrop-blur-sm animate-fade-in-scale">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Popular Learning Categories
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Discover the skills that are in highest demand across industries
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10 max-w-7xl mx-auto">
            {[
              {
                icon: <BookOpen className="h-10 w-10" />,
                title: "Technology & Programming",
                description: "Learn coding, web development, data science, and more",
                courses: "150+ courses"
              },
              {
                icon: <TrendingUp className="h-10 w-10" />,
                title: "Digital Marketing",
                description: "Master social media, SEO, content marketing, and analytics",
                courses: "80+ courses"
              },
              {
                icon: <Users className="h-10 w-10" />,
                title: "Business & Management",
                description: "Develop leadership, project management, and communication skills",
                courses: "120+ courses"
              }
            ].map((category, index) => (
              <Card key={index} className="premium-card p-8 group cursor-pointer transition-elegant hover:scale-105 animate-fade-in-scale" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:shadow-glow transition-elegant">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{category.title}</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">{category.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-accent font-semibold bg-accent/10 px-3 py-1 rounded-full">{category.courses}</span>
                  <Button variant="ghost" size="sm" className="transition-elegant hover:scale-105 text-primary hover:text-primary">
                    Explore →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Certification Preview */}
      <section className="section-transition py-32 bg-gradient-section-3 relative overflow-hidden">
        {/* Elegant ambient elements */}
        <div className="floating-orb top-20 right-20 w-56 h-56 bg-accent/4 animate-float"></div>
        <div className="floating-orb bottom-20 left-20 w-64 h-64 bg-secondary/3 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb top-1/3 left-1/3 w-40 h-40 bg-primary/5 animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
            <div className="animate-fade-in-scale">
              <div className="inline-block p-8 bg-gradient-card rounded-3xl mb-8 shadow-elegant backdrop-blur-sm">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                  Industry-Recognized Certifications
                </h2>
              </div>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Earn certificates that employers actually value. Our partnerships with leading companies 
                ensure your credentials open doors to new opportunities.
              </p>
              <div className="space-y-6">
                {[
                  "Google Career Certificates",
                  "Microsoft Azure Fundamentals",
                  "Amazon AWS Cloud Practitioner",
                  "HubSpot Marketing Certification"
                ].map((cert, index) => (
                  <div key={index} className="flex items-center space-x-4 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center shadow-glow">
                      <Award className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-foreground font-semibold text-lg">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="premium-card p-12 group cursor-pointer transition-elegant hover:scale-105 animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:shadow-glow transition-elegant">
                  <Award className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-3xl font-bold mb-6 text-foreground group-hover:text-primary transition-colors">Sample Certificate</h3>
                <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
                  See what your completed certification will look like
                </p>
                <Button variant="default" className="transition-elegant hover:scale-105 px-12 py-6 text-lg">
                  View Sample
                </Button>
              </div>
            </Card>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Career Advisor AI Section */}
      <section className="section-transition py-32 bg-gradient-section-1 relative">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block p-8 bg-gradient-card rounded-3xl mb-6 shadow-elegant backdrop-blur-sm animate-fade-in-scale">
              <h2 className="text-5xl md:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent leading-tight">
                Get Personalized Career Guidance
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-foreground/80 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Chat with our AI Career Advisor for expert guidance on your career transition and reskilling journey
            </p>
          </div>
          
          <div className="animate-fade-in-scale" style={{ animationDelay: '0.4s' }}>
            <CareerAdvisorChatbot />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reskill;