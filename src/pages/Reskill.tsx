import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CareerAssessment } from "@/components/CareerAssessment";
import { SkillsAssessment } from "@/components/SkillsAssessment";
import { PersonalityAssessment } from "@/components/PersonalityAssessment";
import { CareerAdvisorChatbot } from "@/components/CareerAdvisorChatbot";
import { EnhancedInterviewCoach } from "@/components/EnhancedInterviewCoach";
import { EnhancedResumeCoach } from "@/components/EnhancedResumeCoach";
import { EnhancedReskillDashboard } from "@/components/EnhancedReskillDashboard";
import { Award, BookOpen, Users, TrendingUp, Target, Star, CheckCircle, ArrowRight, Brain, Lightbulb, Zap, GraduationCap, FileText, Edit3, Briefcase, MessageSquare } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Reskill = () => {
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
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Reskill with Confidence: From Preparation to Performance
            </h1>
            <div className="text-left max-w-4xl mx-auto">
              <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Transform your career journey with comprehensive assessments, targeted job preparation, and strategic skill-building designed for real-world success
              </p>
            </div>
            <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.4s' }}>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  variant="hero" 
                  className="flex items-center space-x-2"
                  onClick={() => window.location.href = '/assessments'}
                  aria-label="Go to Career Assessments"
                >
                  <Brain className="h-5 w-5" />
                  <span>Assessment</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-primary flex items-center space-x-2 backdrop-blur-sm"
                  onClick={() => window.location.href = '/job-prep'}
                  aria-label="Go to Job Preparation Tools"
                >
                  <Briefcase className="h-5 w-5" />
                  <span>Job Prep</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-primary flex items-center space-x-2 backdrop-blur-sm"
                  onClick={() => window.location.href = '/learn-a-skill'}
                  aria-label="Go to Learn a Skill"
                >
                  <Award className="h-5 w-5" />
                  <span>Learn a Skill</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Assessment Panel */}
      <section className="py-12 bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-10">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Career Assessments
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                Discover your strengths, skills, and perfect career path with our comprehensive assessment tools.
              </p>
              <p className="text-foreground leading-relaxed">
                Discover what's next with our three powerful assessments designed to help you move forward with purpose. Explore your personality, uncover your interests, and identify your skills all to help you find the best career or business path that fits who you are and where you want to go.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Career Assessment</h4>
                    <p className="text-muted-foreground text-sm">Discover your ideal career path based on your interests, values, and goals</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <BookOpen className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Skills Assessment</h4>
                    <p className="text-muted-foreground text-sm">Evaluate your current skill level and identify areas for improvement</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <Brain className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Personality Assessment</h4>
                    <p className="text-muted-foreground text-sm">Understand your personality traits and work style preferences</p>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="default"
                onClick={() => window.location.href = '/assessments'}
                className="mt-6"
                aria-label="Go to Career Assessments page"
              >
                Go to Assessment
              </Button>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png" 
                alt="Professional development and skill building" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Job Prep Panel */}
      <section className="py-12 bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-10">
            <div className="flex justify-center lg:justify-start">
              <img 
                src="/lovable-uploads/06f5d335-a58d-4bad-877d-fa273f7f5dea.png" 
                alt="Job preparation and career coaching" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Job Preparation Tools
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                Master your job search with AI-powered coaching, interview preparation, and professional document optimization.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <Brain className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Career Advisor AI</h4>
                    <p className="text-muted-foreground text-sm">Get personalized guidance for your professional journey</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <MessageSquare className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Interview Questions Coach</h4>
                    <p className="text-muted-foreground text-sm">Practice with customized questions and expert feedback</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <FileText className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Resume & Cover Letter Coach</h4>
                    <p className="text-muted-foreground text-sm">Transform your resume into powerful, results-oriented statements</p>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="default"
                onClick={() => window.location.href = '/job-prep'}
                className="mt-6"
                aria-label="Go to Job Preparation Tools page"
              >
                Go to Job Prep
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Learn a Skill Panel */}
      <section className="py-12 bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-10">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Why Learn a New Skill?
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                In today's rapidly evolving job market, continuous learning isn't just an advantage—it's essential for career growth and personal fulfillment.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Stay Competitive</h4>
                    <p className="text-muted-foreground text-sm">New skills keep you relevant in an ever-changing market</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <TrendingUp className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Increase Your Value</h4>
                    <p className="text-muted-foreground text-sm">Skilled professionals earn significantly more and have better job security</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Personal Growth</h4>
                    <p className="text-muted-foreground text-sm">Learning new skills builds confidence, expands your network</p>
                  </div>
                </div>
              </div>
              <Button 
                size="lg" 
                variant="default"
                onClick={() => window.location.href = '/learn-a-skill'}
                className="mt-6"
                aria-label="Go to Learn a Skill page"
              >
                Go to Learn a Skill
              </Button>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/c092a2c3-3bb8-4c05-8364-539309ef079c.png" 
                alt="Skill development and learning opportunities" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Your Path Forward - Call to Action */}
      <section className="py-12 bg-gradient-hero relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent text-center">
                Your Path Forward
              </h2>
            </div>
            <div className="text-left max-w-4xl mx-auto mb-8">
              <p className="text-lg text-white leading-relaxed mb-8">
                Take the next step—identify your goals, prep for interviews, level up your skills, and launch your next career journey. Your transformation starts with a single assessment, grows through targeted preparation, and succeeds with strategic skill development.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">1. Assess</h4>
                <p className="text-sm text-white/80">Discover your strengths and career opportunities with comprehensive assessments</p>
              </div>
              <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">2. Prepare</h4>
                <p className="text-sm text-white/80">Master interviews and optimize your resume with AI-powered coaching</p>
              </div>
              <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">3. Excel</h4>
                <p className="text-sm text-white/80">Build strategic skills through microlearning and earn professional certifications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  variant="hero"
                  onClick={() => window.location.href = '/assessments'}
                  aria-label="Start with Career Assessment"
                >
                  Start Assessment
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-primary backdrop-blur-sm"
                  onClick={() => window.location.href = '/job-prep'}
                  aria-label="Explore Job Preparation Tools"
                >
                  Explore Job Prep
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-primary backdrop-blur-sm"
                  onClick={() => window.location.href = '/learn-a-skill'}
                  aria-label="Start Learning New Skills"
                >
                  Start Learning
                </Button>
              </div>
              <p className="text-sm text-white/80 italic text-center">
                Join thousands who have transformed their careers with confidence and clarity
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reskill;