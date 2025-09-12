import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Rocket, Briefcase, ArrowRight, CheckCircle, Target, Users } from "lucide-react";
import { Link } from "react-router-dom";
import reskillIcon from "@/assets/reskill-person.jpg";
import hireyourselfIcon from "@/assets/hireyourself-person.jpg";
import jobprepIcon from "@/assets/jobprep-person.jpg";

export const PathSelection = () => {
  return (
    <section id="choose-path" className="pt-20 pb-12 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Choose Your Path to Pivot Forward
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Discover your best options, relaunch your career, learn new skills, start your business, 
            or connect with tech talent — all in one place. PivotHub gives you the tools, training, 
            and talent connections to pivot forward — no matter where you're starting from.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Assess Your Path */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-0 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mr-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Assess Your Path</h3>
                  <p className="text-muted-foreground">Discover Your Options</p>
                </div>
              </div>

              <img 
                src={reskillIcon} 
                alt="Assessment" 
                className="w-64 h-40 object-cover rounded-lg mb-6 mx-auto group-hover:scale-105 transition-transform duration-500"
              />

              <p className="text-foreground mb-6 leading-relaxed">
                Discover your best options with our digital readiness assessment. 
                Get personalized insights and recommendations for your next move.
              </p>

              <div className="space-y-3 mb-8 flex-grow">
                {[
                  "Digital readiness assessment",
                  "Skills & personality analysis", 
                  "Career path recommendations",
                  "Personalized action plans"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/assessments" className="mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full group-hover:shadow-glow transition-all duration-300"
                >
                  Discover Your Options
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Relaunch Your Career */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-0 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10 group-hover:from-secondary/10 group-hover:to-secondary/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mr-4">
                  <Briefcase className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Relaunch Your Career</h3>
                  <p className="text-muted-foreground">Get Ready for Next Opportunity</p>
                </div>
              </div>

              <img 
                src={jobprepIcon} 
                alt="Career Relaunch" 
                className="w-64 h-40 object-cover rounded-lg mb-6 mx-auto group-hover:scale-105 transition-transform duration-500"
              />

              <p className="text-foreground mb-6 leading-relaxed">
                Use our job prep tools to get ready for your next opportunity. 
                Master interviews, resumes, and professional positioning.
              </p>

              <div className="space-y-3 mb-8 flex-grow">
                {[
                  "AI-powered interview coaching",
                  "Resume & cover letter review",
                  "Professional biography generator",
                  "Mock interview practice"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/jobprep" className="mt-auto">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full group-hover:shadow-glow transition-all duration-300"
                >
                  Prepare to Relaunch
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Learn a New Skill */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-0 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 group-hover:from-accent/10 group-hover:to-accent/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mr-4">
                  <Target className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Learn a New Skill</h3>
                  <p className="text-muted-foreground">Build Digital Skills</p>
                </div>
              </div>

              <img 
                src={reskillIcon} 
                alt="Skill Learning" 
                className="w-64 h-40 object-cover rounded-lg mb-6 mx-auto group-hover:scale-105 transition-transform duration-500"
              />

              <p className="text-foreground mb-6 leading-relaxed">
                Complete mini-courses that build practical tech and digital skills. 
                Stay competitive with hands-on learning modules.
              </p>

              <div className="space-y-3 mb-8 flex-grow">
                {[
                  "Interactive learning modules",
                  "Tech & digital skills focus",
                  "Practical applications",
                  "Industry-relevant content"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/learn-a-skill" className="mt-auto">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full group-hover:shadow-glow transition-all duration-300"
                >
                  Start Learning
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Hire Yourself */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-0 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mr-4">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Hire Yourself</h3>
                  <p className="text-muted-foreground">Launch Your Business</p>
                </div>
              </div>

              <img 
                src={hireyourselfIcon} 
                alt="HireYourself" 
                className="w-64 h-40 object-cover rounded-lg mb-6 mx-auto group-hover:scale-105 transition-transform duration-500"
              />

              <p className="text-foreground mb-6 leading-relaxed">
                Launch your own business with our startup and entrepreneurship tools. 
                From idea validation to funding opportunities.
              </p>

              <div className="space-y-3 mb-8 flex-grow">
                {[
                  "Business plan generation",
                  "Legal document templates",
                  "Marketing strategy tools",
                  "Grant search & writing"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/hireyourself" className="mt-auto">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full group-hover:shadow-glow transition-all duration-300"
                >
                  Start Your Business
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tech Freelancer Hub - spans 2 columns on lg screens */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-0 h-full lg:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10 group-hover:from-secondary/10 group-hover:to-secondary/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mr-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Tech Freelancer Hub</h3>
                  <p className="text-muted-foreground">Connect & Collaborate</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-6 bg-secondary/5 rounded-lg border border-secondary/10">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-secondary mb-2">I'm a Freelancer</h4>
                  <p className="text-sm text-muted-foreground mb-4">Showcase your tech skills to the world</p>
                  <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary hover:text-white">
                    Create Profile
                  </Button>
                </div>
                <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-primary mb-2">I'm Hiring</h4>
                  <p className="text-sm text-muted-foreground mb-4">Find the perfect tech expert for your project</p>
                  <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Post Project
                  </Button>
                </div>
              </div>

              <p className="text-foreground mb-6 leading-relaxed text-center">
                Showcase your services as a freelancer or find the expert you need to move your project forward.
              </p>

              <Link to="/freelancer-marketplace" className="mt-auto">
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full group-hover:shadow-glow transition-all duration-300"
                >
                  Enter Marketplace
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};