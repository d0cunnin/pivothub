import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Star, CheckCircle, TrendingUp, Users, Clock } from "lucide-react";
import { LearningDashboard } from "@/components/LearningDashboard";
import heroImage from "@/assets/hero-image.jpg";

const LearnASkill = () => {
  const certificationCategories = [
    {
      title: "AI & Technology for Everyday People",
      description: "Master AI tools and concepts without tech overwhelm - designed specifically for non-technical people",
      certifications: [
        { name: "What Exactly Is AI, and Why Should I Care?", level: "Beginner", duration: "20 min" },
        { name: "How AI Can Make Life Easier", level: "Beginner", duration: "22 min" },
        { name: "Let AI Help You Get More Done", level: "Beginner", duration: "25 min" },
        { name: "Using AI to Boost Your Confidence at Work", level: "Beginner", duration: "28 min" },
        { name: "How AI Can Be Your Personal Helper", level: "Beginner", duration: "24 min" },
        { name: "Let AI Work With You Like a Smart Employee", level: "Beginner", duration: "26 min" },
        { name: "What AI Means for the Future", level: "Beginner", duration: "30 min" },
        { name: "Creating with AI: Writing, Ideas, Videos", level: "Beginner", duration: "32 min" },
        { name: "The Story of AI: Where It Started and Going", level: "Beginner", duration: "18 min" },
        { name: "Staying Relevant in a Tech-Heavy World", level: "Beginner", duration: "28 min" },
        { name: "Future-Proof Skills You Can Learn Now", level: "Beginner", duration: "25 min" }
      ]
    },
    {
      title: "Business Building for Beginners and Solopreneurs",
      description: "Start and grow your business with confidence - no MBA required, just practical steps that work",
      certifications: [
        { name: "Build a Beautiful Brand on a Shoestring Budget", level: "Beginner", duration: "25 min" },
        { name: "Get Noticed: Make Your Business Stand Out", level: "Beginner", duration: "28 min" },
        { name: "Money Matters: Bookkeeping and Budgeting", level: "Beginner", duration: "30 min" },
        { name: "Your Big Idea Deserves a Big Pitch", level: "Beginner", duration: "32 min" },
        { name: "Make a Business Plan That Actually Works", level: "Beginner", duration: "35 min" },
        { name: "Running a Business Solo with AI", level: "Beginner", duration: "28 min" },
        { name: "Smart Tools and AI Hacks to Save Time", level: "Beginner", duration: "26 min" },
        { name: "Start an AI-Powered Business", level: "Beginner", duration: "30 min" }
      ]
    },
    {
      title: "Intro to Web & Software Development",
      description: "Learn the fundamentals of web and software development - perfect for beginners wanting to understand the tech world",
      certifications: [
        { name: "What is Front-End Development?", level: "Beginner", duration: "30 min" },
        { name: "What is Back-End Development?", level: "Beginner", duration: "35 min" },
        { name: "What is Full-Stack Development?", level: "Beginner", duration: "40 min" },
        { name: "Programming Languages 101 — What They Are & What They're For", level: "Beginner", duration: "45 min" }
      ]
    }
  ];

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
          <div className="text-left max-w-5xl mx-auto">
            <div className="w-24 h-24 bg-white/15 rounded-3xl flex items-center justify-center mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale">
              <Award className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Why Learn a New Skill?
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              In today's rapidly evolving job market, continuous learning isn't just an advantage—it's essential for career growth and personal fulfillment
            </p>
            <div className="animate-fade-in space-y-4" style={{ animationDelay: '0.4s' }}>
              <Button size="lg" variant="hero" className="mr-4">
                Start Learning Today
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white hover:bg-white hover:text-primary backdrop-blur-sm">
                Explore Skills Assessment
              </Button>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>

      {/* Benefits Section */}
      <section className="py-8 pb-4 bg-gradient-section-1 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-8 animate-fade-in">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                The Power of Continuous Learning
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Stay Competitive</h3>
              <p className="text-muted-foreground">
                New skills keep you relevant in an ever-changing market. Stand out from the competition by mastering in-demand technologies and methodologies.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Increase Your Value</h3>
              <p className="text-muted-foreground">
                Skilled professionals earn significantly more and have better job security. Invest in yourself and unlock new income potential.
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Personal Growth</h3>
              <p className="text-muted-foreground">
                Learning new skills builds confidence, expands your network, and opens doors to opportunities you never thought possible.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Learning Section */}
      <section className="py-12 bg-background">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Interactive Learning Experience
            </h2>
            <p className="text-lg text-muted-foreground">
              Take courses with hands-on projects, quizzes, and earn certificates as you progress
            </p>
          </div>

          <Tabs defaultValue="courses" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                Interactive Courses
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Skill Categories
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="courses">
              <LearningDashboard />
            </TabsContent>
            
            <TabsContent value="overview">
              <div className="space-y-6">
                {certificationCategories.map((category, index) => (
                  <Card key={index} className="p-8 bg-gradient-card/30 backdrop-blur-sm border border-white/10 hover:shadow-lg transition-all duration-300">
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{category.title}</h3>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.certifications.map((cert, certIndex) => (
                        <div key={certIndex} className="p-4 bg-gradient-card/50 rounded-lg border border-white/5">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground text-sm leading-tight">{cert.name}</h4>
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Star className="h-3 w-3 mr-1" />
                              <span>{cert.level}</span>
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{cert.duration}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gradient-section-3 relative overflow-hidden">
        <div className="page-container">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block p-6 bg-gradient-card rounded-2xl shadow-elegant backdrop-blur-sm mb-6">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Ready to Start Learning?
              </h2>
            </div>
            <p className="text-lg text-foreground leading-relaxed mb-6">
              Begin your learning journey today and take the next step in your professional development.
            </p>
            <div className="space-y-4">
              <Button size="lg" variant="hero" className="mr-4">
                Start Learning Today
              </Button>
              <Button size="lg" variant="outline">
                Talk to an Advisor
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LearnASkill;