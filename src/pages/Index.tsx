import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PathSelection } from "@/components/PathSelection";
import { Footer } from "@/components/Footer";
import collaborativeLearningImage from "@/assets/collaborative-learning.jpg";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, BookOpen, Award, TrendingUp, Lightbulb, Brain, Heart, FileText, Briefcase } from "lucide-react";

const Index = () => {
  return (
    <div id="home" className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <PathSelection />
      
      {/* Platform Explanation */}
      <section className="section-spacing bg-gradient-section-1 relative">
        <div className="page-container">
          <div className="content-width text-center space-y-6">
            <h2 className="section-header">
              Rediscover Your Strengths, Build Your Future
            </h2>
            <p className="section-description max-w-3xl mx-auto">
              Our platform is designed to help you rediscover your strengths, explore new career paths, 
              and access powerful tools to build your future. Start with our comprehensive assessments 
              to gain clarity on your direction, then leverage our business and grant writing tools to 
              take action toward your goals.
            </p>
          </div>
        </div>
      </section>
      
      {/* Assessment Tools Section */}
      <section className="section-spacing bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center space-y-6 mb-12">
              <h2 className="section-header">
                Start Your Journey with Self-Discovery
              </h2>
              <p className="section-description max-w-2xl mx-auto">
                Take our comprehensive assessments to understand your skills, interests, and personality. 
                These insights will guide your career decisions and help you choose the right path forward.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="premium-card card-padding hover-scale text-center">
                <CardHeader className="p-0 pb-6">
                  <Brain className="h-12 w-12 text-primary mb-4 mx-auto" />
                  <CardTitle className="text-xl">Skills Assessment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Evaluate your current abilities across 8 key areas including math, communication, technology, and more.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Button size="lg" className="w-full">
                    Take Skills Assessment
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding hover-scale text-center">
                <CardHeader className="p-0 pb-6">
                  <Heart className="h-12 w-12 text-primary mb-4 mx-auto" />
                  <CardTitle className="text-xl">Interest Assessment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Discover what truly motivates you and explore career paths that align with your passions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Button size="lg" className="w-full">
                    Explore Your Interests
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding hover-scale text-center">
                <CardHeader className="p-0 pb-6">
                  <Users className="h-12 w-12 text-primary mb-4 mx-auto" />
                  <CardTitle className="text-xl">Personality Assessment</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Understand your work style, communication preferences, and ideal work environments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Button size="lg" className="w-full">
                    Assess Your Personality
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tools & Resources Section */}
      <section className="section-spacing bg-gradient-section-1 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center space-y-6 mb-12">
              <h2 className="section-header">
                Tools to Build Your Future
              </h2>
              <p className="section-description max-w-2xl mx-auto">
                Access powerful tools designed to help you secure funding, develop business ideas, 
                and turn your career goals into actionable plans.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="premium-card card-padding hover-scale">
                <CardHeader className="p-0 pb-6">
                  <FileText className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">Grant Writing Generator</CardTitle>
                  <CardDescription className="text-muted-foreground mb-6">
                    Professional grant writing assistance to help you secure funding for education, 
                    training, or business ventures. Generate compelling proposals with AI-powered guidance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Button size="lg" className="w-full mb-4">
                    Start Grant Writing
                  </Button>
                  <ul className="space-y-2 text-sm text-muted-foreground text-left">
                    <li>• Education & training grants</li>
                    <li>• Small business funding</li>
                    <li>• Research & development grants</li>
                    <li>• Professional templates</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="premium-card card-padding hover-scale">
                <CardHeader className="p-0 pb-6">
                  <Briefcase className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-2xl">Business & Entrepreneurship Tools</CardTitle>
                  <CardDescription className="text-muted-foreground mb-6">
                    Complete suite of business development tools including idea generation, 
                    business plans, pitch decks, and marketing strategies.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Button size="lg" className="w-full mb-4">
                    Explore Business Tools
                  </Button>
                  <ul className="space-y-2 text-sm text-muted-foreground text-left">
                    <li>• Business idea generator</li>
                    <li>• Business plan creator</li>
                    <li>• Pitch deck builder</li>
                    <li>• Marketing strategy planner</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Future Development Section */}
      <section className="section-spacing bg-gradient-section-2 relative">
        <div className="page-container">
          <div className="content-width">
            <div className="text-center space-y-6">
              <h2 className="section-header">
                Get ReSkilled - Coming Soon
              </h2>
              <p className="section-description max-w-3xl mx-auto">
                We're developing comprehensive certification programs and collaborative learning experiences. 
                Stay tuned for exciting updates as we prepare to launch our full education platform.
              </p>
              <div className="grid lg:grid-cols-2 gap-8 items-center mt-12">
                <div className="space-y-4 lg:mr-4">
                  <h3 className="text-2xl font-semibold text-foreground">Under Development</h3>
                  <p className="text-muted-foreground">
                    Join our community of learners and professionals working together to achieve their career goals 
                    through collaborative learning and peer support.
                  </p>
                  <ul className="space-y-2 text-muted-foreground text-left">
                    <li>• Tech certification programs</li>
                    <li>• Entrepreneurship courses</li>
                    <li>• Micro-credentials</li>
                    <li>• Collaborative learning platform</li>
                  </ul>
                </div>
                <div className="lg:ml-4 self-center">
                  <img 
                    src={collaborativeLearningImage}
                    alt="Professionals collaborating and learning together"
                    className="w-full h-auto max-w-md aspect-video object-cover rounded-xl shadow-md hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border border-white/10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
