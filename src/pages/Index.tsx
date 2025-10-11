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
            <div className="text-center mb-12">
              <h2 className="section-header mb-4">
                Choose Your Path Forward
              </h2>
              <p className="section-description max-w-3xl mx-auto">
                Explore our six comprehensive paths, each designed to help you achieve specific career goals 
                with AI-powered tools and expert guidance.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Upskill */}
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-teal-500 bg-gradient-to-br from-teal-500/5 to-emerald-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-teal-500/10 mb-3 border border-teal-500/20 w-fit">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 tracking-wide">UPSKILL</span>
                  </div>
                  <CardTitle className="text-xl">Develop New Skills</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Master in-demand digital and tech skills through interactive courses, AI mentorship, 
                    and hands-on learning modules.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                      <span>Interactive skill courses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                      <span>AI career advisor</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                      <span>Progress tracking</span>
                    </li>
                  </ul>
                  <Link to="/learn-a-skill">
                    <Button size="lg" className="w-full">
                      Start Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Earn It */}
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-indigo-500 bg-gradient-to-br from-indigo-500/5 to-purple-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-indigo-500/10 mb-3 border border-indigo-500/20 w-fit">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide">EARN IT</span>
                  </div>
                  <CardTitle className="text-xl">Freelance & Get Hired</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Showcase your skills, connect with clients, and land freelance opportunities in tech. 
                    Perfect for building your portfolio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                      <span>Create freelancer profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                      <span>Connect with clients</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                      <span>Build your portfolio</span>
                    </li>
                  </ul>
                  <Link to="/freelancer-marketplace">
                    <Button size="lg" className="w-full">
                      Join Marketplace
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Build It */}
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-orange-500 bg-gradient-to-br from-orange-500/5 to-amber-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-orange-500/10 mb-3 border border-orange-500/20 w-fit">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wide">BUILD IT</span>
                  </div>
                  <CardTitle className="text-xl">Start Your Business</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Launch your entrepreneurial journey with business planning, idea validation, 
                    and comprehensive startup tools.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2" />
                      <span>Business plan generator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2" />
                      <span>Pitch deck builder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2" />
                      <span>Marketing strategy tools</span>
                    </li>
                  </ul>
                  <Link to="/buildit">
                    <Button size="lg" className="w-full">
                      Start Building
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Teach It */}
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-green-500 bg-gradient-to-br from-green-500/5 to-lime-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-green-500/10 mb-3 border border-green-500/20 w-fit">
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 tracking-wide">TEACH IT</span>
                  </div>
                  <CardTitle className="text-xl">Share Your Expertise</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Create courses, webinars, and teaching materials to share your knowledge 
                    and build a teaching income stream.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
                      <span>Course creation tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
                      <span>Teaching materials generator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0 mt-2" />
                      <span>Webinar planning</span>
                    </li>
                  </ul>
                  <Link to="/teachit">
                    <Button size="lg" className="w-full">
                      Start Teaching
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Launch It */}
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-500/10 mb-3 border border-blue-500/20 w-fit">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wide">LAUNCH IT</span>
                  </div>
                  <CardTitle className="text-xl">Launch Your Project</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Turn creative ideas into reality with comprehensive launch strategies, 
                    from concept to market execution.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                      <span>Launch strategy generator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                      <span>Market validation tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                      <span>Go-to-market planning</span>
                    </li>
                  </ul>
                  <Link to="/launchit">
                    <Button size="lg" className="w-full">
                      Start Launching
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Fund It */}
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-purple-500 bg-gradient-to-br from-purple-500/5 to-violet-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-purple-500/10 mb-3 border border-purple-500/20 w-fit">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wide">FUND IT</span>
                  </div>
                  <CardTitle className="text-xl">Secure Funding</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Find grants, write winning proposals, and secure funding for your education, 
                    business, or creative projects.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                      <span>Grant finder & matcher</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                      <span>Proposal generator</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
                      <span>Budget templates</span>
                    </li>
                  </ul>
                  <Link to="/grantwriting">
                    <Button size="lg" className="w-full">
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
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="premium-card card-padding-sm hover-scale text-center border-l-4 border-purple-500 bg-gradient-to-br from-purple-500/5 to-violet-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-purple-500/10 mb-3 border border-purple-500/20 mx-auto">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wide">SKILLS</span>
                  </div>
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
              
              <Card className="premium-card card-padding-sm hover-scale text-center border-l-4 border-pink-500 bg-gradient-to-br from-pink-500/5 to-rose-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-pink-500/10 mb-3 border border-pink-500/20 mx-auto">
                    <span className="text-xs font-bold text-pink-600 dark:text-pink-400 tracking-wide">INTERESTS</span>
                  </div>
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
              
              <Card className="premium-card card-padding-sm hover-scale text-center border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-500/5 to-blue-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-cyan-500/10 mb-3 border border-cyan-500/20 mx-auto">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 tracking-wide">PERSONALITY</span>
                  </div>
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

      {/* Job Preparation Section */}
      <section className="section-spacing-xs bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center mb-12">
              <h2 className="section-header mb-4">
                Get Job-Ready with Our Career Tools
              </h2>
              <p className="section-description max-w-3xl mx-auto">
                Prepare for your next career opportunity with professional resume building, 
                interview coaching, and career guidance tools.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-blue-500 bg-gradient-to-br from-blue-500/5 to-cyan-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-500/10 mb-3 border border-blue-500/20 w-fit">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wide">JOB PREP</span>
                  </div>
                  <CardTitle className="text-xl">Resume & Interview Coach</CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    Get AI-powered feedback on your resume, cover letters, and interview responses. 
                    Practice with mock interviews and improve your professional presence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Link to="/jobprep">
                    <Button size="lg" className="w-full mb-3">
                      Start Job Prep
                    </Button>
                  </Link>
                  <ul className="space-y-2 text-sm text-muted-foreground text-left">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                      <span>AI resume optimization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                      <span>Mock interview practice</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                      <span>Cover letter generator</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding-sm hover-scale border-l-4 border-teal-500 bg-gradient-to-br from-teal-500/5 to-emerald-600/5">
                <CardHeader className="p-0 pb-4">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-teal-500/10 mb-3 border border-teal-500/20 w-fit">
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400 tracking-wide">CAREER ADVISOR</span>
                  </div>
                  <CardTitle className="text-xl">AI Career Guidance</CardTitle>
                  <CardDescription className="text-muted-foreground mb-4">
                    Get personalized career advice, skill recommendations, and strategic guidance 
                    from our AI-powered career advisor chatbot.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Link to="/learn-a-skill">
                    <Button size="lg" className="w-full mb-3">
                      Get Career Advice
                    </Button>
                  </Link>
                  <ul className="space-y-2 text-sm text-muted-foreground text-left">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                      <span>Personalized career paths</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                      <span>Skill gap analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
                      <span>Industry insights</span>
                    </li>
                  </ul>
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
