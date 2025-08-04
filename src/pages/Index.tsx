import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PathSelection } from "@/components/PathSelection";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, BookOpen, Award, TrendingUp, Lightbulb } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <PathSelection />
      
      {/* Career Guidance Section */}
      <section id="career-guidance" className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Career Guidance & Support</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Navigate your career transformation with expert guidance and personalized support every step of the way
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>1-on-1 Mentorship</CardTitle>
                <CardDescription>
                  Connect with industry experts who provide personalized guidance for your career journey
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <Target className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Career Assessment</CardTitle>
                <CardDescription>
                  Discover your strengths and identify the best path forward with our comprehensive assessment tools
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Monitor your skill development and career advancement with detailed analytics and milestones
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 bg-background">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="text-lg text-muted-foreground space-y-6 leading-relaxed">
              <p>
                CareerLaunch was born out of necessity during a critical period in our economy. Between January and July 2025, 
                hundreds of thousands of people found themselves unemployed or underemployed, facing an unprecedented challenge 
                in securing meaningful work.
              </p>
              <p>
                As we witnessed this crisis unfold, it became clear that traditional approaches to career development were 
                no longer sufficient. The accelerated pace of technological advancement was reshaping entire industries, 
                creating both challenges and opportunities for the workforce.
              </p>
              <p>
                We realized that people needed more than just job search assistance – they needed comprehensive tools to either 
                upskill for the evolving job market or forge their own path through entrepreneurship. CareerLaunch was created 
                to provide exactly that: a platform where individuals can either reskill to become more marketable for employment 
                or launch their own businesses with the tools and guidance they need to succeed.
              </p>
              <p>
                Today, we're proud to be part of the solution, helping thousands of people transform their careers and 
                build sustainable futures in our rapidly changing economy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Professional Certifications</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Gain industry-recognized credentials in high-demand tech and entrepreneurship skills to accelerate your career growth
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="flex items-center gap-2">
                  Tech Certifications
                  <Badge variant="secondary">Popular</Badge>
                </CardTitle>
                <CardDescription>
                  Master in-demand technical skills with industry-standard certifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Cloud Computing (AWS, Azure, GCP)</li>
                  <li>• Data Science & Analytics</li>
                  <li>• Cybersecurity</li>
                  <li>• Web Development</li>
                  <li>• AI & Machine Learning</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Lightbulb className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="flex items-center gap-2">
                  Entrepreneurship
                  <Badge variant="secondary">Trending</Badge>
                </CardTitle>
                <CardDescription>
                  Build essential business skills for launching and scaling your venture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Business Strategy & Planning</li>
                  <li>• Digital Marketing</li>
                  <li>• Financial Management</li>
                  <li>• Leadership & Team Building</li>
                  <li>• Product Development</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-soft hover:shadow-strong transition-all duration-300">
              <CardHeader>
                <Award className="h-10 w-10 text-primary mb-3" />
                <CardTitle>Micro-Credentials</CardTitle>
                <CardDescription>
                  Quick, focused learning paths for specific skills and competencies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Project Management</li>
                  <li>• UX/UI Design</li>
                  <li>• Social Media Strategy</li>
                  <li>• Sales & Communication</li>
                  <li>• Remote Work Skills</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" className="bg-gradient-hero hover:opacity-90">
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
