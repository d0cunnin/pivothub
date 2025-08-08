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

      {/* Assessment Section */}
      <section className="py-8 bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm border border-white/20">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Career Assessments
              </h2>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in space-y-4">
              <p className="text-lg text-foreground leading-relaxed">
                Discover your strengths, skills, and perfect career path with our comprehensive assessment tools. Explore your personality, uncover your interests, and identify your skills to help you find the best career path that fits who you are.
              </p>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Career Assessment - discover your ideal career path</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Skills Assessment - evaluate your current abilities</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Personality Assessment - understand your work style</span>
                </li>
              </ul>
              <div className="flex justify-center lg:justify-start">
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/assessments'}
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  aria-label="Learn more about Career Assessments"
                >
                  Learn More
                </Button>
              </div>
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

      {/* Job Prep Section */}
      <section className="py-8 bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm border border-white/20">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Job Preparation Tools
              </h2>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in space-y-4">
              <p className="text-lg text-foreground leading-relaxed">
                Master your job search with AI-powered coaching, interview preparation, and professional document optimization. Get personalized guidance and practice with customized questions and expert feedback.
              </p>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Career Advisor AI - get personalized guidance</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Interview Questions Coach - practice with expert feedback</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Resume & Cover Letter Coach - optimize your documents</span>
                </li>
              </ul>
              <div className="flex justify-center lg:justify-start">
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/job-prep'}
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  aria-label="Learn more about Job Preparation Tools"
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/06f5d335-a58d-4bad-877d-fa273f7f5dea.png" 
                alt="Job preparation and career coaching" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Learn a Skill Section */}
      <section className="py-8 bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm border border-white/20">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Learn a New Skill
              </h2>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in space-y-4">
              <p className="text-lg text-foreground leading-relaxed">
                In today's rapidly evolving job market, continuous learning isn't just an advantage—it's essential for career growth and personal fulfillment. Stay competitive and increase your value with strategic skill development.
              </p>
              <ul className="space-y-2 text-foreground">
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Stay competitive in an ever-changing market</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Increase your value and earning potential</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Personal growth and expanded network</span>
                </li>
              </ul>
              <div className="flex justify-center lg:justify-start">
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/learn-a-skill'}
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                  aria-label="Learn more about Learning New Skills"
                >
                  Learn More
                </Button>
              </div>
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

      {/* Final CTA Section */}
      <section className="py-12 bg-gradient-hero relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready to Start Your Reskill Journey?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Transform your career with confidence and take the first step today.
            </p>
            <Button 
              size="lg" 
              variant="hero"
              onClick={() => window.location.href = '/assessments'}
              aria-label="Start Your Reskill Journey"
              className="w-full md:w-auto"
            >
              Start Assessment
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reskill;