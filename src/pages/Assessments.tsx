import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Target, BookOpen, Users, TrendingUp, Brain } from "lucide-react";
import { CareerAssessment } from "@/components/CareerAssessment";
import { SkillsAssessment } from "@/components/SkillsAssessment";
import { PersonalityAssessment } from "@/components/PersonalityAssessment";
import heroImage from "@/assets/hero-image.jpg";

const Assessments = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AuthGuard>
      
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
              <Brain className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Career Assessments
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Discover your strengths, skills, and perfect career path with our comprehensive assessment tools
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
                  Find Your Perfect Learning Path
                </h2>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                Our comprehensive skills assessment analyzes your current expertise, career goals, and industry trends to create a personalized learning roadmap. Get matched with the exact courses, certifications, and training programs that will maximize your career growth potential.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Skill Gap Analysis</h4>
                    <p className="text-muted-foreground text-sm">Identify exactly which skills you need to advance in your field</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Personalized Recommendations</h4>
                    <p className="text-muted-foreground text-sm">Get course suggestions tailored to your learning style and schedule</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-hero rounded-lg flex items-center justify-center mt-1">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
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
                src="/lovable-uploads/a848a1b8-cd18-4243-a70f-0ba5af49802a.png" 
                alt="Professional development and skill building" 
                className="w-full h-auto max-w-lg aspect-video object-cover rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Types */}
      <section className="section-spacing-sm bg-gradient-section-2 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Comprehensive Assessment Suite
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-8">
              Take advantage of our multi-faceted assessment approach to get a complete picture of your professional profile and potential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Career Assessment</h3>
              <p className="text-muted-foreground mb-4">
                Discover your ideal career path based on your interests, values, and goals. Get personalized recommendations for roles that align with your aspirations.
              </p>
              <CareerAssessment />
            </Card>

            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Skills Assessment</h3>
              <p className="text-muted-foreground mb-4">
                Evaluate your current skill level and identify areas for improvement. Get a detailed roadmap for skill development and certification.
              </p>
              <SkillsAssessment />
            </Card>

            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Personality Assessment</h3>
              <p className="text-muted-foreground mb-4">
                Understand your personality traits and work style preferences. Learn how to leverage your natural strengths in your career.
              </p>
              <PersonalityAssessment />
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      </AuthGuard>
    </div>
  );
};

export default Assessments;