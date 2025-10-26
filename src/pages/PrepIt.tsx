import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, BookOpen, Users, TrendingUp, FileText, Edit3, MessageSquare, Brain, Briefcase } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { StructuredData, generateServiceSchema } from "@/components/StructuredData";
import { CareerAdvisorChatbot } from "@/components/CareerAdvisorChatbot";
import { InterviewQuestionsCoach } from "@/components/InterviewQuestionsCoach";
import { ResumeCoachLetter } from "@/components/ResumeCoachLetter";
import heroImage from "@/assets/hero-image.jpg";

const PrepIt = () => {
  const serviceSchema = generateServiceSchema(
    "Job Preparation Services",
    "Career Coaching",
    "https://pivothub.lovable.app/prepit"
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Job Preparation Services: Resume & Interview Coaching | PivotHub</title>
        <meta name="description" content="Prepare for your next employment opportunity with AI-powered resume optimization, interview coaching, and career advisor support. Get expert guidance for career success." />
        <meta property="og:title" content="Job Preparation Services | PivotHub" />
        <meta property="og:description" content="Get expert career coaching with AI-powered resume optimization and interview preparation." />
        <link rel="canonical" href="https://pivothub.lovable.app/prepit" />
      </Helmet>
      
      <StructuredData data={serviceSchema} />
      
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-primary relative overflow-hidden">
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
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">PREP IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Prepare for Your Next Employment Opportunity
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Polish your resume, master interviews, and get personalized career guidance with our AI-powered coaching tools
            </p>
            <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.4s' }}>
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  variant="hero" 
                  className="flex items-center space-x-2"
                  onClick={() => document.getElementById('career-advisor')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Brain className="h-5 w-5" />
                  <span>Career Advisor</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-primary flex items-center space-x-2 backdrop-blur-sm"
                  onClick={() => document.getElementById('interview-coach')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Interview Coach</span>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 text-white border-white hover:bg-white hover:text-primary flex items-center space-x-2 backdrop-blur-sm"
                  onClick={() => document.getElementById('resume-coach')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <Briefcase className="h-5 w-5" />
                  <span>Resume Coach</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Career Advisor AI */}
      <section id="career-advisor" className="py-16 bg-white relative overflow-hidden">
        <div className="page-container">
          {/* Visual Banner */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 items-center max-w-6xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <img 
                src="/lovable-uploads/a2d8ed6b-e7a3-4bba-b5d7-9c2dd209ea3d.png" 
                alt="Professional woman collaborating with team in office"
                className="w-full h-80 object-cover"
              />
            </div>
            <div className="relative overflow-hidden rounded-2xl shadow-xl">
              <img 
                src="/lovable-uploads/0dc8e049-6853-488a-ba7e-2c5087721c46.png" 
                alt="Professional woman with digital technology" 
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
          
          {/* Header Section */}
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Get Personalized Career Guidance
              </h2>
            </div>
            <div className="text-left max-w-4xl mx-auto mb-6">
              <p className="text-lg text-foreground leading-relaxed mb-4">
                Meet your AI Career Advisor - a smart assistant powered by advanced AI to provide personalized guidance for your professional journey. Whether you're planning a career change, seeking new skills, or navigating workplace challenges, get expert advice tailored to your unique situation.
              </p>
              
              <div className="bg-gradient-card/30 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-6">
                <h4 className="font-semibold text-foreground mb-3 text-sm">Available Tools:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Career Advisor AI Chatbot</div>
                  <div>• Interview Questions Coach</div>
                  <div>• Resume & Cover Letter Coach</div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Tailored Advice</h4>
                <p className="text-sm text-muted-foreground">Get responses specific to your industry, experience level, and career goals</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Expert Knowledge</h4>
                <p className="text-sm text-muted-foreground">Access insights from career professionals across all industries and roles</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">24/7 Available</h4>
                <p className="text-sm text-muted-foreground">Get immediate support whenever you need career guidance or advice</p>
              </div>
            </div>
          </div>
          
          <CareerAdvisorChatbot />
        </div>
      </section>

      {/* Interview Questions Coach */}
      <section id="interview-coach" className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Interview Questions Coach
              </h2>
            </div>
            <div className="text-left max-w-4xl mx-auto mb-6">
              <p className="text-lg text-foreground leading-relaxed mb-4">
                Master your interview skills with AI-powered coaching. Practice with customized questions, get expert feedback, and build confidence for your next interview.
              </p>
              
              <div className="bg-gradient-card/30 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-6">
                <h4 className="font-semibold text-foreground mb-3 text-sm">Available Tools:</h4>
                <div className="text-sm text-muted-foreground">
                  <span>• Interview Questions Coach</span>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Personalized Questions</h4>
                <p className="text-sm text-muted-foreground">Get questions tailored to your role, industry, and experience level</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">STAR Method Coaching</h4>
                <p className="text-sm text-muted-foreground">Learn to structure answers using Situation, Task, Action, Result</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Mock Interviews</h4>
                <p className="text-sm text-muted-foreground">Practice timed interviews with comprehensive performance reports</p>
              </div>
            </div>
          </div>
          
          <InterviewQuestionsCoach />
        </div>
      </section>

      {/* Resume & Cover Letter Coach */}
      <section id="resume-coach" className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Resume & Cover Letter Coach
              </h2>
            </div>
            <div className="text-left max-w-4xl mx-auto mb-6">
              <p className="text-lg text-foreground leading-relaxed mb-4">
                Transform your resume from generic job duties into powerful, results-oriented statements that get noticed by hiring managers.
              </p>
              
              <div className="bg-gradient-card/30 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-6">
                <h4 className="font-semibold text-foreground mb-3 text-sm">Available Tools:</h4>
                <div className="text-sm text-muted-foreground">
                  <span>• Resume & Cover Letter Coach</span>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Results-Oriented</h4>
                <p className="text-sm text-muted-foreground">Transform duties into quantifiable achievements with metrics</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Professional Analysis</h4>
                <p className="text-sm text-muted-foreground">Get detailed feedback on language, formatting, and content</p>
              </div>
              <div className="bg-gradient-card/30 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Edit3 className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Custom Cover Letters</h4>
                <p className="text-sm text-muted-foreground">Generate tailored cover letters for specific job applications</p>
              </div>
            </div>
          </div>
          
          <ResumeCoachLetter />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrepIt;
