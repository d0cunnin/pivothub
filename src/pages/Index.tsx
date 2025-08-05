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
      <section className="section-spacing bg-gradient-section-1 relative">
        <div className="page-container">
          <div className="content-width">
            {/* Header with Image */}
            <div className="grid lg:grid-cols-2 gap-8 items-center mb-8">
              <div className="animate-fade-in space-y-4">
                <h2 className="section-header">
                  Career Guidance & Support
                </h2>
                <p className="section-description">
                  Navigate your career transformation with expert guidance and personalized support every step of the way
                </p>
              </div>
              
              <div className="animate-fade-in lg:ml-4 self-center">
                <img 
                  src="/lovable-uploads/f9137c05-8e7a-4c37-9120-0f7468d79afa.png" 
                  alt="Professional woman working on career development" 
                  className="w-full h-auto max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border border-white/10"
                />
              </div>
            </div>
            
            {/* Career Features Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="premium-card card-padding hover-scale">
                <CardHeader className="p-0 pb-4">
                  <Users className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-xl">AI Career Coach</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Get personalized career guidance 24/7 with our intelligent chatbot that understands your goals and challenges
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="premium-card card-padding hover-scale">
                <CardHeader className="p-0 pb-4">
                  <Target className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-xl">Career Assessment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Discover your strengths and identify the best path forward with our comprehensive assessment tools
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="premium-card card-padding hover-scale">
                <CardHeader className="p-0 pb-4">
                  <TrendingUp className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-xl">Progress Tracking</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Monitor your skill development and career advancement with detailed analytics and milestones
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="section-spacing bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            {/* Header with Image */}
            <div className="grid lg:grid-cols-2 gap-8 items-center mb-8">
              <div className="animate-fade-in space-y-4">
                <h2 className="section-header">Certifications</h2>
                <p className="section-description">
                  Gain credentials in high-demand tech and entrepreneurship skills to accelerate your career growth
                </p>
              </div>
              
              <div className="animate-fade-in lg:ml-4 self-center">
                <img 
                  src="/lovable-uploads/01e0edd3-5dc1-45ef-986a-d0f9404e0159.png" 
                  alt="Professional certifications and skill development" 
                  className="w-full h-auto max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border border-white/10"
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 animate-fade-in mb-8">
              <Card className="premium-card card-padding hover-scale">
                <CardHeader className="p-0 pb-4">
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="flex items-center gap-2 text-lg">
                    Tech Certifications
                    <Badge variant="default">Popular</Badge>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-left">
                    Master in-demand technical skills with certifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-1 text-sm text-muted-foreground text-left">
                    <li>• Cloud Computing (AWS, Azure, GCP)</li>
                    <li>• Data Science & Analytics</li>
                    <li>• Cybersecurity</li>
                    <li>• Web Development</li>
                    <li>• AI & Machine Learning</li>
                  </ul>
                </CardContent>
              </Card>
            
            <Card className="premium-card card-padding hover-scale">
              <CardHeader className="p-0 pb-4">
                <Lightbulb className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="flex items-center gap-2 text-lg">
                  Entrepreneurship
                  <Badge variant="default">Trending</Badge>
                </CardTitle>
                <CardDescription className="text-muted-foreground text-left">
                  Build essential business skills for launching and scaling your venture
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-1 text-sm text-muted-foreground text-left">
                  <li>• Business Strategy & Planning</li>
                  <li>• Digital Marketing</li>
                  <li>• Financial Management</li>
                  <li>• Leadership & Team Building</li>
                  <li>• Product Development</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="premium-card card-padding hover-scale">
              <CardHeader className="p-0 pb-4">
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Micro-Credentials</CardTitle>
                <CardDescription className="text-muted-foreground text-left">
                  Quick, focused learning paths for specific skills and competencies
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-1 text-sm text-muted-foreground text-left">
                  <li>• Project Management</li>
                  <li>• UX/UI Design</li>
                  <li>• Social Media Strategy</li>
                  <li>• Sales & Communication</li>
                  <li>• Remote Work Skills</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 items-center mt-12">
            <div className="space-y-4 lg:mr-4">
              <h3 className="section-header">Collaborative Learning</h3>
              <p className="section-description">
                Join a community of learners and professionals working together to achieve their career goals 
                through collaborative learning and peer support.
              </p>
            </div>
            <div className="lg:ml-4 self-center">
              <img 
                src="/lovable-uploads/93826e68-3e48-4081-ab4a-ba232392d1a6.png" 
                alt="Professionals collaborating and learning together" 
                className="w-full h-auto max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
          
          <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button size="lg" className="bg-gradient-hero hover:opacity-90 shadow-glow transition-all duration-300 hover-scale">
              Explore All Certifications
            </Button>
          </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
