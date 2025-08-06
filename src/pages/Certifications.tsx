import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Award, Star, CheckCircle, TrendingUp, Users, Clock } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Certifications = () => {
  const certificationCategories = [
    {
      title: "Technology & IT",
      description: "Stay ahead in the digital transformation with cutting-edge tech certifications",
      certifications: [
        { name: "Cloud Computing (AWS, Azure, Google Cloud)", level: "Beginner to Expert", duration: "3-6 months" },
        { name: "Cybersecurity Fundamentals", level: "Intermediate", duration: "4 months" },
        { name: "Data Science & Analytics", level: "Beginner to Advanced", duration: "6 months" },
        { name: "Web Development (Full Stack)", level: "Beginner", duration: "8 months" },
        { name: "AI & Machine Learning", level: "Intermediate", duration: "6 months" }
      ]
    },
    {
      title: "Business & Management",
      description: "Develop leadership skills and business acumen for career advancement",
      certifications: [
        { name: "Project Management (PMP)", level: "Intermediate", duration: "4 months" },
        { name: "Digital Marketing", level: "Beginner to Advanced", duration: "3 months" },
        { name: "Business Analysis", level: "Intermediate", duration: "5 months" },
        { name: "Leadership & Team Management", level: "All Levels", duration: "3 months" },
        { name: "Financial Planning & Analysis", level: "Intermediate", duration: "4 months" }
      ]
    },
    {
      title: "Healthcare & Life Sciences",
      description: "Advance your healthcare career with specialized certifications",
      certifications: [
        { name: "Healthcare Administration", level: "Intermediate", duration: "6 months" },
        { name: "Medical Coding & Billing", level: "Beginner", duration: "4 months" },
        { name: "Public Health Fundamentals", level: "Beginner", duration: "3 months" },
        { name: "Mental Health First Aid", level: "All Levels", duration: "2 months" },
        { name: "Healthcare Data Analytics", level: "Intermediate", duration: "5 months" }
      ]
    },
    {
      title: "Trade & Technical Skills",
      description: "Master hands-on skills for growing industries",
      certifications: [
        { name: "Electrical Systems", level: "Beginner to Advanced", duration: "6 months" },
        { name: "HVAC Technology", level: "Beginner", duration: "5 months" },
        { name: "Automotive Technology", level: "Intermediate", duration: "8 months" },
        { name: "Renewable Energy Systems", level: "Intermediate", duration: "4 months" },
        { name: "Advanced Manufacturing", level: "Intermediate", duration: "6 months" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
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
              <Award className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Professional Certifications
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Earn industry-recognized certifications that open doors to better career opportunities and higher salaries
            </p>
            <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.4s' }}>
              <Button size="lg" variant="hero" className="mr-4">
                Browse All Certifications
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary">
                Take Skills Assessment
              </Button>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Certification Benefits */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Why Choose Our Certifications?
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Industry Recognition</h3>
              <p className="text-muted-foreground">
                Our certifications are recognized by leading employers and industry associations, ensuring your credentials carry real weight in the job market.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Career Advancement</h3>
              <p className="text-muted-foreground">
                Studies show certified professionals earn 15-25% more than their non-certified peers and have better promotion opportunities.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Expert Support</h3>
              <p className="text-muted-foreground">
                Get guidance from industry experts and mentors throughout your certification journey, with personalized learning paths.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Certification Categories */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Certification Programs
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed">
              Choose from our comprehensive range of certification programs designed to meet industry demands and your career goals.
            </p>
          </div>

          <div className="space-y-8">
            {certificationCategories.map((category, index) => (
              <Card key={index} className="p-8 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{category.title}</h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.certifications.map((cert, certIndex) => (
                    <div key={certIndex} className="p-4 bg-gradient-card/50 rounded-lg border border-white/5">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground text-sm leading-tight">{cert.name}</h4>
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Star className="h-3 w-3 mr-1" />
                          <span>{cert.level}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{cert.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section-spacing-sm bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Ready to Get Certified?
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-8">
              Start your certification journey today and take the next step in your professional development.
            </p>
            <div className="space-y-4">
              <Button size="lg" variant="hero" className="mr-4">
                Start Learning Today
              </Button>
              <Button size="lg" variant="outline">
                Talk to an Advisor
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Certifications;