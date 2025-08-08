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
import { Award, BookOpen, Users, TrendingUp, Target, Star, CheckCircle, ArrowRight, Brain, Lightbulb, Zap, GraduationCap, FileText, Edit3 } from "lucide-react";
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Reskill with Confidence: From Preparation to Performance
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Transform your career journey with comprehensive assessments, targeted job preparation, and strategic skill-building designed for real-world success
            </p>
            <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.4s' }}>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <CareerAssessment />
                <SkillsAssessment />
                <PersonalityAssessment />
              </div>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Skills Assessment */}
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-10">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Discover Career Clarity
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                Start with an in-depth assessment to understand your strengths and opportunities for growth—know where you are and where you're headed. Our comprehensive diagnostic tools provide personalized feedback and actionable insights for your career journey.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Interactive Assessments</h4>
                    <p className="text-muted-foreground text-sm">Comprehensive evaluations of your interests, skills, and personality traits</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Personalized Insights</h4>
                    <p className="text-muted-foreground text-sm">Get detailed feedback and next-step recommendations tailored to your goals</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Career Path Mapping</h4>
                    <p className="text-muted-foreground text-sm">Visualize potential career routes and skill development opportunities</p>
                  </div>
                </div>
              </div>
              <CareerAssessment />
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

      {/* Career Advisor AI */}
      <section className="py-16 bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          {/* Header Section */}
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Prepare for Opportunity
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-4">
              Build momentum with tailored job-prep tools—mock interviews, resume refreshers, and career coaching designed for success. Master your job search with AI-powered coaching and real-world simulations.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Career Coaching</h4>
                <p className="text-sm text-muted-foreground">Get personalized guidance for your professional journey and career decisions</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Interview Practice</h4>
                <p className="text-sm text-muted-foreground">Master interview skills with customized questions and STAR method coaching</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Resume Optimization</h4>
                <p className="text-sm text-muted-foreground">Transform your resume into results-oriented statements that get noticed</p>
              </div>
            </div>
          </div>
          
          <CareerAdvisorChatbot />
        </div>
      </section>

      {/* Learning Categories */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          {/* Header with Learning Image */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="section-header">
                  Skill Up Strategically
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed mb-6">
                Learn exactly what matters—structured micro-courses, real-world projects, and flexible pacing to help you build new competencies seamlessly. Master in-demand skills through hands-on practice and pathways to certification.
              </p>
              
              {/* ReSkilled Benefits List */}
              <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <h4 className="font-semibold text-foreground mb-4">Strategic Learning Benefits:</h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-foreground">Structured microlearning modules that fit your schedule</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-foreground">Hands-on practice opportunities with real-world applications</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-foreground">Flexible pacing to build competencies at your own speed</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-foreground">Clear pathways to mastery and professional certification</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-foreground">Interactive learning with immediate feedback and progress tracking</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-card/50 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <h4 className="font-semibold text-foreground mb-3">What Makes Our Learning Approach Effective:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Microlearning modules designed for busy professionals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Interactive exercises with immediate practical application</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Flexible scheduling with lifetime access to materials</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Progress tracking and competency-based advancement</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/06f5d335-a58d-4bad-877d-fa273f7f5dea.png" 
                alt="Diverse professionals from healthcare, construction, and other careers showcasing reskilling opportunities" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
          
          <EnhancedReskillDashboard />
        </div>
      </section>

      {/* Your Path Forward - Call to Action */}
      <section className="py-16 bg-gradient-hero relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Your Path Forward
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-8">
              Take the next step—identify your goals, prep for interviews, level up your skills, and launch your next career journey. Your transformation starts with a single assessment, grows through targeted preparation, and succeeds with strategic skill development.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">1. Assess</h4>
                <p className="text-sm text-muted-foreground">Discover your strengths and career opportunities with comprehensive assessments</p>
              </div>
              <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">2. Prepare</h4>
                <p className="text-sm text-muted-foreground">Master interviews and optimize your resume with AI-powered coaching</p>
              </div>
              <div className="bg-gradient-card/30 p-6 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-2">3. Excel</h4>
                <p className="text-sm text-muted-foreground">Build strategic skills through microlearning and earn professional certifications</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <CareerAssessment />
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-primary backdrop-blur-sm"
                >
                  Explore All Tools
                </Button>
              </div>
              <p className="text-sm text-white/80 italic">
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