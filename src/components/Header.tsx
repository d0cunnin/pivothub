import { Button } from "@/components/ui/button";
import { Briefcase, Menu, X } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-card shadow-soft border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              CareerLaunch
            </h1>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#home" className="text-foreground hover:text-primary transition-colors">
              Home
            </a>
            <a href="#choose-path" className="text-foreground hover:text-primary transition-colors">
              Paths
            </a>
            <a href="#career-guidance" className="text-foreground hover:text-primary transition-colors">
              Career Guidance
            </a>
            <a href="#certifications" className="text-foreground hover:text-primary transition-colors">
              Certifications
            </a>
            <a href="#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
          </nav>

          <div className="hidden md:flex space-x-3">
            <Button variant="outline">Sign In</Button>
            <Button variant="hero">Get Started</Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <a href="#home" className="text-foreground hover:text-primary transition-colors">
                Home
              </a>
              <a href="#choose-path" className="text-foreground hover:text-primary transition-colors">
                Paths
              </a>
              <a href="#career-guidance" className="text-foreground hover:text-primary transition-colors">
                Career Guidance
              </a>
              <a href="#certifications" className="text-foreground hover:text-primary transition-colors">
                Certifications
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-colors">
                About
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="outline">Sign In</Button>
                <Button variant="hero">Get Started</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};