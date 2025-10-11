import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PathSelection } from "@/components/PathSelection";
import { Footer } from "@/components/Footer";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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
                Your Complete Career Transformation Platform
              </h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <p className="section-description mb-8">
                PivotHub is your all-in-one platform for career transformation. Whether you're looking to 
                relaunch your career, start a business, teach your expertise, launch a creative project, 
                secure funding, or develop new skills—we've got the tools and guidance you need.
              </p>
              
              {/* Quick Overview Cards */}
              <div className="grid md:grid-cols-3 gap-4 mt-8">
                <div className="text-center p-4 bg-background/50 rounded-lg border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-2">6</div>
                  <div className="text-sm text-muted-foreground">Career Paths</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-2">30+</div>
                  <div className="text-sm text-muted-foreground">AI-Powered Tools</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg border border-primary/10">
                  <div className="text-3xl font-bold text-primary mb-2">∞</div>
                  <div className="text-sm text-muted-foreground">Possibilities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Six Paths Overview */}
      <section className="section-spacing-xs bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center mb-8">
              <h2 className="section-header mb-4">
                Choose Your Path Forward
              </h2>
              <p className="section-description max-w-3xl mx-auto">
                Explore our six comprehensive paths, each designed to help you achieve specific career goals 
                with AI-powered tools and expert guidance.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {/* Upskill */}
              <Card className="premium-card hover-scale border-l-4 border-teal-500 bg-gradient-to-br from-teal-500/5 to-emerald-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-teal-500/10 mb-2 border border-teal-500/20 w-fit">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-wide">UPSKILL</span>
                  </div>
                  <CardTitle className="text-lg">Develop New Skills</CardTitle>
                  <CardDescription className="text-sm">
                    Master in-demand digital and tech skills through interactive courses and AI mentorship.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/upskill">
                    <Button size="sm" className="w-full">
                      Start Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Earn It */}
              <Card className="premium-card hover-scale border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500/10 mb-2 border border-blue-500/20 w-fit">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">EARN IT</span>
                  </div>
                  <CardTitle className="text-lg">Freelance & Get Hired</CardTitle>
                  <CardDescription className="text-sm">
                    Showcase your skills, connect with clients, and land freelance opportunities in tech.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/freelancer-marketplace">
                    <Button size="sm" className="w-full">
                      Join Marketplace
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Build It */}
              <Card className="premium-card hover-scale border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-500/5 to-green-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/10 mb-2 border border-emerald-500/20 w-fit">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">BUILD IT</span>
                  </div>
                  <CardTitle className="text-lg">Start Your Business</CardTitle>
                  <CardDescription className="text-sm">
                    Launch your entrepreneurial journey with business planning and comprehensive startup tools.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/buildit">
                    <Button size="sm" className="w-full">
                      Start Building
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Teach It */}
              <Card className="premium-card hover-scale border-l-4 border-green-500 bg-gradient-to-br from-green-500/5 to-lime-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-green-500/10 mb-2 border border-green-500/20 w-fit">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 tracking-wide">TEACH IT</span>
                  </div>
                  <CardTitle className="text-lg">Share Your Expertise</CardTitle>
                  <CardDescription className="text-sm">
                    Create courses, webinars, and teaching materials to share your knowledge.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/teachit">
                    <Button size="sm" className="w-full">
                      Start Teaching
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Launch It */}
              <Card className="premium-card hover-scale border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-500/5 to-blue-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-cyan-500/10 mb-2 border border-cyan-500/20 w-fit">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-wide">LAUNCH IT</span>
                  </div>
                  <CardTitle className="text-lg">Launch Your Project</CardTitle>
                  <CardDescription className="text-sm">
                    Turn creative ideas into reality with comprehensive launch strategies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/launchit">
                    <Button size="sm" className="w-full">
                      Start Launching
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Fund It */}
              <Card className="premium-card hover-scale border-l-4 border-teal-500 bg-gradient-to-br from-teal-500/5 to-cyan-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-teal-500/10 mb-2 border border-teal-500/20 w-fit">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-wide">FUND IT</span>
                  </div>
                  <CardTitle className="text-lg">Secure Funding</CardTitle>
                  <CardDescription className="text-sm">
                    Find grants, write winning proposals, and secure funding for your projects.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/grantwriting">
                    <Button size="sm" className="w-full">
                      Find Funding
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Assessment Tools Section */}
      <section className="section-spacing-xs bg-gradient-section-1 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center">
              <h2 className="section-header mb-4">
                Start with Self-Discovery
              </h2>
            </div>
            <div className="max-w-3xl mx-auto mb-10">
              <p className="section-description">
                Before choosing your path, understand yourself better. Take our comprehensive assessments 
                to discover your strengths, interests, and ideal career direction.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              <Card className="premium-card hover-scale text-center border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500/10 mb-2 border border-blue-500/20 mx-auto">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">SKILLS</span>
                  </div>
                  <CardTitle className="text-lg">Skills Assessment</CardTitle>
                  <CardDescription className="text-sm">
                    Evaluate your current abilities across 8 key areas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/assessments#take-your-assessment-today">
                    <Button size="sm" className="w-full">
                      Take Assessment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card className="premium-card hover-scale text-center border-l-4 border-teal-500 bg-gradient-to-br from-teal-500/5 to-emerald-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-teal-500/10 mb-2 border border-teal-500/20 mx-auto">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-wide">INTERESTS</span>
                  </div>
                  <CardTitle className="text-lg">Interest Assessment</CardTitle>
                  <CardDescription className="text-sm">
                    Discover what truly motivates you and explore career paths.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/assessments#take-your-assessment-today">
                    <Button size="sm" className="w-full">
                      Take Assessment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card className="premium-card hover-scale text-center border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-500/5 to-blue-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-cyan-500/10 mb-2 border border-cyan-500/20 mx-auto">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-wide">PERSONALITY</span>
                  </div>
                  <CardTitle className="text-lg">Personality Assessment</CardTitle>
                  <CardDescription className="text-sm">
                    Understand your work style and ideal work environments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/assessments#take-your-assessment-today">
                    <Button size="sm" className="w-full">
                      Take Assessment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Job Preparation Section */}
      <section className="section-spacing-xs bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center mb-8">
              <h2 className="section-header mb-4">
                Get Job-Ready with Our Career Tools
              </h2>
              <p className="section-description max-w-3xl mx-auto">
                Prepare for your next career opportunity with professional resume building, 
                interview coaching, and career guidance tools.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <Card className="premium-card hover-scale border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-500/10 mb-2 border border-blue-500/20 w-fit">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">JOB PREP</span>
                  </div>
                  <CardTitle className="text-lg">Resume & Interview Coach</CardTitle>
                  <CardDescription className="text-sm">
                    Get AI-powered feedback on your resume, cover letters, and interview responses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/jobprep">
                    <Button size="sm" className="w-full">
                      Start Job Prep
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <Card className="premium-card hover-scale border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-500/5 to-green-600/5">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/10 mb-2 border border-emerald-500/20 w-fit">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">CAREER ADVISOR</span>
                  </div>
                  <CardTitle className="text-lg">AI Career Guidance</CardTitle>
                  <CardDescription className="text-sm">
                    Get personalized career advice, skill recommendations, and strategic guidance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link to="/upskill">
                    <Button size="sm" className="w-full">
                      Get Career Advice
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to Get Started CTA */}
      <section className="section-spacing-xs bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        <div className="page-container relative z-10">
          <div className="content-width text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
              Ready to Transform Your Career?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join PivotHub today and get access to all the tools you need to build your future. 
              Start with a free assessment to discover your best path forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/assessments">
                <Button size="lg" variant="heroWhite" className="w-full sm:w-auto">
                  Take Free Assessment
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary">
                  View Pricing Plans
                </Button>
              </Link>
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
