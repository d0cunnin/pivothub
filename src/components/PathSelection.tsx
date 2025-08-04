import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Rocket, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import reskillIcon from "@/assets/reskill-icon.jpg";
import hireyourselfIcon from "@/assets/hireyourself-icon.jpg";

export const PathSelection = () => {
  return (
    <section id="choose-path" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Choose Your Path to Success
          </h2>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            In today's rapidly evolving economy, career success requires adaptability and strategic thinking. 
            Whether you're seeking to enhance your marketability through cutting-edge skills or ready to forge 
            your own entrepreneurial path, our comprehensive platform provides the tools, resources, and expert 
            guidance you need to thrive. Choose your journey and unlock opportunities that align with your goals, 
            strengths, and vision for the future.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Reskill Path */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-500"></div>
            
            <div className="relative p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mr-4">
                  <GraduationCap className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Reskill</h3>
                  <p className="text-muted-foreground">Enhance Your Marketability</p>
                </div>
              </div>

              <img 
                src={reskillIcon} 
                alt="Reskill" 
                className="w-full h-48 object-cover rounded-lg mb-6 group-hover:scale-105 transition-transform duration-500"
              />

              <p className="text-foreground mb-6 leading-relaxed">
                Learn in-demand skills through online certifications and training programs. 
                Build a portfolio that makes you irresistible to employers.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Industry-recognized certifications",
                  "Personalized learning paths", 
                  "Skills assessment tools",
                  "Career guidance support"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/reskill">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full group-hover:shadow-glow transition-all duration-300"
                >
                  Start Reskilling
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* HireYourself Path */}
          <Card className="group relative overflow-hidden shadow-soft hover:shadow-strong transition-all duration-500 border-0">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10 group-hover:from-secondary/10 group-hover:to-secondary/20 transition-all duration-500"></div>
            
            <div className="relative p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mr-4">
                  <Rocket className="h-8 w-8 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">HireYourself</h3>
                  <p className="text-muted-foreground">Launch Your Business</p>
                </div>
              </div>

              <img 
                src={hireyourselfIcon} 
                alt="HireYourself" 
                className="w-full h-48 object-cover rounded-lg mb-6 group-hover:scale-105 transition-transform duration-500"
              />

              <p className="text-foreground mb-6 leading-relaxed">
                Get everything you need to start and grow your business. From idea validation 
                to funding opportunities, we've got you covered.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Business plan generation",
                  "Market research tools",
                  "Grant search & writing",
                  "Pitch deck creation"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/hireyourself">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full group-hover:shadow-glow transition-all duration-300"
                >
                  Start Your Business
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