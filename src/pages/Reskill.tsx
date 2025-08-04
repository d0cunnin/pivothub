import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, BookOpen, Award, Target, Users, TrendingUp } from "lucide-react";

const Reskill = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero relative">
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Reskill for Success
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Transform your career with industry-recognized certifications and cutting-edge skills training
            </p>
            <Button size="lg" className="shadow-glow hover-scale">
              Start Learning Today
            </Button>
          </div>
        </div>
      </section>

      {/* Skills Assessment */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-hero"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl mb-4 shadow-soft">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Find Your Perfect Learning Path
              </h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto">
              Take our skills assessment to get personalized course recommendations
            </p>
          </div>
          
          <Card className="max-w-2xl mx-auto p-8 shadow-soft border-0 bg-card/80 backdrop-blur-sm animate-fade-in">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Skills Assessment</h3>
              <p className="text-muted-foreground mb-6">
                Answer a few questions about your background and goals to receive a customized learning roadmap
              </p>
              <Button variant="default" size="lg" className="hover-scale">
                Take Assessment
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Learning Categories */}
      <section className="py-24 bg-gradient-to-br from-muted/30 to-muted/60 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-card"></div>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block p-6 bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl mb-4 shadow-soft">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Popular Learning Categories
              </h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto">
              Discover the skills that are in highest demand across industries
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <BookOpen className="h-8 w-8" />,
                title: "Technology & Programming",
                description: "Learn coding, web development, data science, and more",
                courses: "150+ courses"
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Digital Marketing",
                description: "Master social media, SEO, content marketing, and analytics",
                courses: "80+ courses"
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Business & Management",
                description: "Develop leadership, project management, and communication skills",
                courses: "120+ courses"
              }
            ].map((category, index) => (
              <Card key={index} className="group p-6 border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mb-4 text-primary group-hover:bg-gradient-to-r group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-foreground">{category.title}</h3>
                <p className="text-muted-foreground mb-4">{category.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-accent font-medium">{category.courses}</span>
                  <Button variant="ghost" size="sm" className="hover-scale">
                    Explore →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certification Preview */}
      <section className="py-24 bg-gradient-to-br from-background to-muted/20 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="animate-fade-in">
              <div className="inline-block p-6 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-2xl mb-6 shadow-soft">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Industry-Recognized Certifications
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-8">
                Earn certificates that employers actually value. Our partnerships with leading companies 
                ensure your credentials open doors to new opportunities.
              </p>
              <div className="space-y-4">
                {[
                  "Google Career Certificates",
                  "Microsoft Azure Fundamentals",
                  "Amazon AWS Cloud Practitioner",
                  "HubSpot Marketing Certification"
                ].map((cert, index) => (
                  <div key={index} className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                      <Award className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-foreground font-medium">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8 shadow-soft border-0 bg-card/80 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">Sample Certificate</h3>
                <p className="text-muted-foreground mb-6">
                  See what your completed certification will look like
                </p>
                <Button variant="default" className="hover-scale">
                  View Sample
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reskill;