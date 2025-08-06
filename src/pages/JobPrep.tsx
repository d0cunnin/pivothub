import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Target, BookOpen, Users, TrendingUp, FileText, Edit3, MessageSquare } from "lucide-react";
import { CareerAdvisorChatbot } from "@/components/CareerAdvisorChatbot";
import { InterviewQuestionsCoach } from "@/components/InterviewQuestionsCoach";
import { ResumeCoachLetter } from "@/components/ResumeCoachLetter";
import heroImage from "@/assets/hero-image.jpg";

const JobPrep = () => {
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
              <MessageSquare className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Job Preparation Tools
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Master your job search with AI-powered coaching, interview preparation, and professional document optimization
            </p>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Career Advisor AI */}
      <section className="py-16 bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          {/* Header Section */}
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Get Personalized Career Guidance
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-4">
              Meet your AI Career Advisor - a smart assistant powered by advanced AI to provide personalized guidance for your professional journey. Whether you're planning a career change, seeking new skills, or navigating workplace challenges, get expert advice tailored to your unique situation.
            </p>
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
      <section className="section-spacing-sm bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Interview Questions Coach
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-4">
              Master your interview skills with AI-powered coaching. Practice with customized questions, get expert feedback, and build confidence for your next interview.
            </p>
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
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Resume & Cover Letter Coach
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-4">
              Transform your resume from generic job duties into powerful, results-oriented statements that get noticed by hiring managers.
            </p>
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

export default JobPrep;