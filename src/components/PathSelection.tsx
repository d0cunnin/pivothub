import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
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
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-l-4 border-purple-500 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/5 group-hover:from-purple-500/10 group-hover:to-violet-600/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-purple-500/10 mb-4 border border-purple-500/20 w-fit">
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 tracking-wide">ASSESS</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Assess Your Path</h3>
                <p className="text-muted-foreground">Discover Your Options</p>
              </div>

              <img 
                src="/lovable-uploads/2880abfe-3eeb-45a9-b351-c770b8a889d0.png" 
                alt="Smiling professional man working on career assessment and planning" 
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
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
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
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-l-4 border-blue-500 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-600/5 group-hover:from-blue-500/10 group-hover:to-cyan-600/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-500/10 mb-4 border border-blue-500/20 w-fit">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wide">RESKILL</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Relaunch Your Career</h3>
                <p className="text-muted-foreground">Get Ready for Next Opportunity</p>
              </div>

              <img 
                src={jobprepIcon} 
                alt="Career Relaunch" 
                className="w-64 h-40 object-cover rounded-lg mb-6 mx-auto group-hover:scale-105 transition-transform duration-500"
              />

              <p className="text-foreground mb-6 leading-relaxed">
                Use our comprehensive Learn It tools to develop your skills and get ready for your next opportunity. 
                Master interviews, resumes, and professional positioning.
              </p>

              <div className="space-y-3 mb-8 flex-grow">
                {[
                  "AI-powered interview coaching",
                  "Resume & cover letter review",
                  "Professional biography generator",
                  "Mock interview practice"
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2" />
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
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-l-4 border-teal-500 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-600/5 group-hover:from-teal-500/10 group-hover:to-emerald-600/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-teal-500/10 mb-4 border border-teal-500/20 w-fit">
                  <span className="text-sm font-bold text-teal-600 dark:text-teal-400 tracking-wide">LEARN</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Learn a New Skill</h3>
                <p className="text-muted-foreground">Build Digital Skills</p>
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
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2" />
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

          {/* Build It */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-l-4 border-orange-500 h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-600/5 group-hover:from-orange-500/10 group-hover:to-amber-600/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-orange-500/10 mb-4 border border-orange-500/20 w-fit">
                  <span className="text-sm font-bold text-orange-600 dark:text-orange-400 tracking-wide">BUILD</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Build It</h3>
                <p className="text-muted-foreground">Launch Your Business</p>
              </div>

              <img 
                src={hireyourselfIcon} 
                alt="Build It - Launch your business" 
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
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/buildit" className="mt-auto">
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
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-l-4 border-indigo-500 h-full lg:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5 group-hover:from-indigo-500/10 group-hover:to-purple-600/20 transition-all duration-500"></div>
            
            <div className="relative p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-indigo-500/10 mb-4 border border-indigo-500/20 w-fit">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tracking-wide">FREELANCE</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Tech Freelancer Hub</h3>
                <p className="text-muted-foreground">Connect & Collaborate</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="text-center p-6 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-indigo-500/10 mb-3 border border-indigo-500/20">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wide">FREELANCER</span>
                  </div>
                  <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">I'm a Freelancer</h4>
                  <p className="text-sm text-muted-foreground mb-4">Showcase your tech skills to the world</p>
                  <Button variant="outline" size="sm" className="border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white">
                    Create Profile
                  </Button>
                </div>
                <div className="text-center p-6 bg-purple-500/5 rounded-lg border border-purple-500/10">
                  <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-purple-500/10 mb-3 border border-purple-500/20">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wide">HIRING</span>
                  </div>
                  <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">I'm Hiring</h4>
                  <p className="text-sm text-muted-foreground mb-4">Find the perfect tech expert for your project</p>
                  <Button variant="outline" size="sm" className="border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white">
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