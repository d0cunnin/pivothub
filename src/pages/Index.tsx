import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PathSelection } from "@/components/PathSelection";
import { Footer } from "@/components/Footer";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, BookOpen, Award, TrendingUp, Lightbulb, Brain, Heart, FileText, Briefcase, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleToolAccess = (requiresAuth: boolean, action: () => void) => {
    if (requiresAuth && !user) {
      setShowAuthModal(true);
      return;
    }
    action();
  };

  return (
    <div id="home" className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <PathSelection />
      
      {/* Platform Explanation */}
      <section className="section-spacing-xs bg-gradient-section-1 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center">
              <h2 className="section-header mb-4">
              Rediscover Your Strengths, Build Your Future
            </h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <p className="section-description">
                Our platform is designed to help you rediscover your strengths, explore new career paths, 
                and access powerful tools to build your future. Start with our comprehensive assessments 
                to gain clarity on your direction, then leverage our business and funding tools to 
                take action toward your goals.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Assessment Tools Section */}
      <section className="section-spacing-xs bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center">
              <h2 className="section-header mb-4">
                Start Your Journey with Self-Discovery
              </h2>
            </div>
            <div className="max-w-3xl mx-auto mb-10">
              <p className="section-description">
                Take our comprehensive assessments to understand your skills, interests, and personality. 
                These insights will guide your career decisions and help you choose the right path forward.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="premium-card card-padding-sm hover-scale text-center">
                <CardHeader className="p-0 pb-4">
                  <Brain className="h-10 w-10 text-primary mb-3 mx-auto" />
                  <CardTitle className="text-xl">Skills Assessment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Evaluate your current abilities across 8 key areas including math, communication, technology, and more.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Link to="/assessments#take-your-assessment-today">
                    <Button size="lg" className="w-full">
                      Take Skills Assessment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding-sm hover-scale text-center">
                <CardHeader className="p-0 pb-4">
                  <Heart className="h-10 w-10 text-primary mb-3 mx-auto" />
                  <CardTitle className="text-xl">Interest Assessment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Discover what truly motivates you and explore career paths that align with your passions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Link to="/assessments#take-your-assessment-today">
                    <Button size="lg" className="w-full">
                      Explore Your Interests
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding-sm hover-scale text-center">
                <CardHeader className="p-0 pb-4">
                  <Users className="h-10 w-10 text-primary mb-3 mx-auto" />
                  <CardTitle className="text-xl">Personality Assessment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Understand your work style, communication preferences, and ideal work environments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Link to="/assessments#take-your-assessment-today">
                    <Button size="lg" className="w-full">
                      Assess Your Personality
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Resources Section */}
      <section className="section-spacing-xs bg-gradient-section-1 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center">
              <h2 className="section-header mb-4">
                Tools to Build Your Future
              </h2>
            </div>
            <div className="max-w-3xl mx-auto mb-10">
              <p className="section-description">
                Access powerful tools designed to help you secure funding, develop business ideas, 
                and turn your career goals into actionable plans.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="premium-card card-padding-sm hover-scale">
                <CardHeader className="p-0 pb-4">
                  <FileText className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-2xl">Funding Generator</CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    Professional funding assistance to help you secure grants for education, 
                    training, or business ventures. Generate compelling proposals with AI-powered guidance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Link to="/hireyourself">
                    <Button size="lg" className="w-full mb-3">
                      Start Funding
                    </Button>
                  </Link>
                  <ul className="space-y-2 text-sm text-muted-foreground text-left">
                    <li>• Education & training grants</li>
                    <li>• Small business funding</li>
                    <li>• Research & development grants</li>
                    <li>• Professional templates</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding-sm hover-scale">
                <CardHeader className="p-0 pb-4">
                  <Briefcase className="h-10 w-10 text-primary mb-3" />
                  <CardTitle className="text-2xl">Business & Entrepreneurship Tools</CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    Complete suite of business development tools including idea generation, 
                    business plans, pitch decks, and marketing strategies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Link to="/hireyourself">
                    <Button size="lg" className="w-full mb-3">
                      Explore Business Tools
                    </Button>
                  </Link>
                  <ul className="space-y-2 text-sm text-muted-foreground text-left">
                    <li>• Business idea generator</li>
                    <li>• Business plan creator</li>
                    <li>• Pitch deck builder</li>
                    <li>• Marketing strategy planner</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Reskill Section */}
      <section className="section-spacing-xs bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center">
              <h2 className="section-header mb-4">
                Get ReSkilled for Success
              </h2>
            </div>
            <div className="max-w-4xl mx-auto mb-10">
              <p className="section-description">
                Transform your career with industry-recognized certifications, personalized learning paths, 
                and cutting-edge skills training. Our comprehensive reskilling platform includes AI-powered 
                career guidance, interview coaching, and resume optimization.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6 lg:mr-4">
                <p className="text-muted-foreground">
                  Access our complete suite of career development tools and training programs designed 
                  to help you stay competitive in today's evolving job market.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="premium-card card-padding-sm hover-scale">
                    <CardHeader className="p-0 pb-4">
                      <Brain className="h-8 w-8 text-primary mb-3" />
                      <CardTitle className="text-lg">Assessments</CardTitle>
                      <CardDescription className="text-sm">
                        Discover your skills, interests, and personality to guide your career path.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 pt-3">
                      <Link to="/assessments">
                        <Button size="sm" className="w-full">
                          Take Assessments
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  
                  <Card className="premium-card card-padding-sm hover-scale">
                    <CardHeader className="p-0 pb-4">
                      <Briefcase className="h-8 w-8 text-primary mb-3" />
                      <CardTitle className="text-lg">Job Prep</CardTitle>
                      <CardDescription className="text-sm">
                        Get ready for your dream job with interview coaching and resume optimization.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 pt-3">
                      <Link to="/jobprep">
                        <Button size="sm" className="w-full">
                          Prepare for Jobs
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                  
                  <Card className="premium-card card-padding-sm hover-scale">
                    <CardHeader className="p-0 pb-4">
                      <BookOpen className="h-8 w-8 text-primary mb-3" />
                      <CardTitle className="text-lg">Learn a Skill</CardTitle>
                      <CardDescription className="text-sm">
                        Develop new competencies with industry-recognized courses and certifications.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 pt-3">
                      <Link to="/learn-a-skill">
                        <Button size="sm" className="w-full">
                          Start Learning
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="pt-4">
                  <Link to="/reskill">
                    <Button size="lg" className="w-full md:w-auto">
                      Start Your Reskilling Journey
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="lg:ml-4 self-center">
                <img 
                  src="/lovable-uploads/a2d8ed6b-e7a3-4bba-b5d7-9c2dd209ea3d.png"
                  alt="Professional woman with locs working at computer with diverse team collaborating in modern office environment"
                  className="w-full h-auto max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border border-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      {/* Success Modal */}
      {user && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg animate-fade-in">
            <h3 className="font-semibold">You're In!</h3>
            <p className="text-sm">Welcome! You now have full access to explore and use all available tools.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
