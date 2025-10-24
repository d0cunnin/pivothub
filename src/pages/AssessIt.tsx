import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, BookOpen, Users, TrendingUp, Brain } from "lucide-react";
import { CareerAssessment } from "@/components/CareerAssessment";
import { SkillsAssessment } from "@/components/SkillsAssessment";
import { PersonalityAssessment } from "@/components/PersonalityAssessment";
import heroImage from "@/assets/hero-image.jpg";

const AssessIt = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 bg-primary relative overflow-hidden">
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
              <span className="text-3xl font-bold text-white tracking-wider">ASSESS IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Take one of our assessments
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Discover your strengths, skills, and perfect career path with our comprehensive assessment tools
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CareerAssessment />
              <SkillsAssessment />
              <PersonalityAssessment />
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Tools - Featured Section */}
      <section id="take-your-assessment-today" className="py-12 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
              Take Your Assessment Today
            </h2>
            <p className="text-lg text-foreground leading-relaxed mb-8">
              Discover what's next with our three powerful assessment tools designed to help you move forward with purpose. Explore your personality, uncover your interests, and identify your skills—all to help you find the best career or business path that fits who you are and where you want to go.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-8 bg-gradient-card/40 backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Career Assessment</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Discover your ideal career path based on your interests, values, and goals. Get personalized recommendations for roles that align with your aspirations.
              </p>
              <div className="mt-auto">
                <CareerAssessment />
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card/40 backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Skills Assessment</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Evaluate your current skill level and identify areas for improvement. Get a detailed roadmap for skill development and certification.
              </p>
              <div className="mt-auto">
                <SkillsAssessment />
              </div>
            </Card>

            <Card className="p-8 bg-gradient-card/40 backdrop-blur-sm border border-white/20 hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
              <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">Personality Assessment</h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Understand your personality traits and work style preferences. Learn how to leverage your natural strengths in your career.
              </p>
              <div className="mt-auto">
                <PersonalityAssessment />
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-gradient-section-2 relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in space-y-6">
              <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm">
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  Find Your Perfect Learning Path
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed mb-6">
                These assessment tools are here to help you discover a career path that truly fits you and your future.
                You'll get clear insight into:
              </p>
              <div className="space-y-3 mb-6">
                <p className="text-foreground flex items-start">
                  <span className="w-2 h-2 bg-gradient-hero rounded-full mt-3 mr-3 flex-shrink-0"></span>
                  <span><span className="font-semibold">Your interests</span>, so you can focus on careers that keep you excited and inspired</span>
                </p>
                <p className="text-foreground flex items-start">
                  <span className="w-2 h-2 bg-gradient-hero rounded-full mt-3 mr-3 flex-shrink-0"></span>
                  <span><span className="font-semibold">Your personality</span>, to find the types of jobs and work environments where you can shine</span>
                </p>
                <p className="text-foreground flex items-start">
                  <span className="w-2 h-2 bg-gradient-hero rounded-full mt-3 mr-3 flex-shrink-0"></span>
                  <span><span className="font-semibold">Your strengths and skills</span>, to see how well your abilities match the roles you're aiming for</span>
                </p>
              </div>
              <p className="text-foreground italic text-lg">
                Each assessment is a step toward greater confidence, clarity, and success in your journey. You were made for more—and this is the beginning of discovering what that "more" looks like.
              </p>
              
              <div className="space-y-4 mt-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <TrendingUp className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Skill Gap Analysis</h4>
                    <p className="text-muted-foreground text-sm">Identify exactly which skills you need to advance in your field</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <Target className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Personalized Recommendations</h4>
                    <p className="text-muted-foreground text-sm">Get course suggestions tailored to your learning style and schedule</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Career Impact Forecast</h4>
                    <p className="text-muted-foreground text-sm">See potential salary increases and job opportunities</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center lg:justify-end">
              <img 
                src="/lovable-uploads/8d5741f6-0644-4cca-9d98-60d55c2bf66d.png" 
                alt="Professional woman working with data analytics and development tools" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AssessIt;
