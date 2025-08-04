import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PathSelection } from "@/components/PathSelection";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, BookOpen, Award, TrendingUp, Lightbulb } from "lucide-react";

const Index = () => {
  return (
    <div id="home" className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <PathSelection />
      
      {/* Career Guidance Section */}
      <section id="career-guidance" className="py-24 px-4 bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-hero"></div>
        <div className="container mx-auto animate-fade-in">
          <div className="text-center mb-16">
            <div className="inline-block p-6 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl mb-4 shadow-soft">
              <h2 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Career Guidance & Support
              </h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto text-left">
              Navigate your career transformation with expert guidance and personalized support every step of the way
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="grid md:grid-cols-1 gap-8">
              <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>AI Career Coach</CardTitle>
                  <CardDescription className="text-foreground text-left">
                    Get personalized career guidance 24/7 with our intelligent chatbot that understands your goals and challenges
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <Target className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Career Assessment</CardTitle>
                  <CardDescription className="text-foreground text-left">
                    Discover your strengths and identify the best path forward with our comprehensive assessment tools
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/80 backdrop-blur-sm">
                <CardHeader>
                  <TrendingUp className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription className="text-foreground text-left">
                    Monitor your skill development and career advancement with detailed analytics and milestones
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <div className="animate-fade-in">
              <div className="premium-card overflow-hidden">
                <img 
                  src="/lovable-uploads/6dbaa8ab-9c93-4c2a-b08e-63196b35ecab.png" 
                  alt="Professional celebrating success with keys" 
                  className="w-full h-96 object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="py-24 px-4 bg-gradient-to-br from-muted/20 to-muted/50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-card"></div>
        <div className="container mx-auto animate-fade-in">
          <div className="text-center mb-16">
            <div className="inline-block p-6 bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl mb-4 shadow-soft">
              <h2 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">Certifications</h2>
            </div>
            <p className="text-lg text-foreground max-w-3xl mx-auto text-left">
              Gain credentials in high-demand tech and entrepreneurship skills to accelerate your career growth
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="flex items-center gap-2">
                  Tech Certifications
                  <Badge variant="default">Popular</Badge>
                </CardTitle>
                <CardDescription className="text-foreground text-left">
                  Master in-demand technical skills with certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground text-left">
                  <li>• Cloud Computing (AWS, Azure, GCP)</li>
                  <li>• Data Science & Analytics</li>
                  <li>• Cybersecurity</li>
                  <li>• Web Development</li>
                  <li>• AI & Machine Learning</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <Lightbulb className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="flex items-center gap-2">
                  Entrepreneurship
                  <Badge variant="default">Trending</Badge>
                </CardTitle>
                <CardDescription className="text-foreground text-left">
                  Build essential business skills for launching and scaling your venture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground text-left">
                  <li>• Business Strategy & Planning</li>
                  <li>• Digital Marketing</li>
                  <li>• Financial Management</li>
                  <li>• Leadership & Team Building</li>
                  <li>• Product Development</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-500 hover-scale bg-card/90 backdrop-blur-sm">
              <CardHeader>
                <Award className="h-10 w-10 text-primary mb-3" />
                <CardTitle>Micro-Credentials</CardTitle>
                <CardDescription className="text-foreground text-left">
                  Quick, focused learning paths for specific skills and competencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-foreground text-left">
                  <li>• Project Management</li>
                  <li>• UX/UI Design</li>
                  <li>• Social Media Strategy</li>
                  <li>• Sales & Communication</li>
                  <li>• Remote Work Skills</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-16">
            <div className="premium-card overflow-hidden">
              <img 
                src="/lovable-uploads/93826e68-3e48-4081-ab4a-ba232392d1a6.png" 
                alt="Professional team collaboration meeting" 
                className="w-full h-64 object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-foreground">Collaborative Learning</h3>
              <p className="text-lg text-muted-foreground">
                Join a community of learners and professionals working together to achieve their career goals 
                through collaborative learning and peer support.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="bg-gradient-hero hover:opacity-90 shadow-glow transition-all duration-300 hover-scale">
              Explore All Certifications
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
