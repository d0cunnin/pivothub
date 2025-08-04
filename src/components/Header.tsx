import { Button } from "@/components/ui/button";
import { Briefcase, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="bg-card shadow-soft border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              ReLaunch
            </h1>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link 
              to="/" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary font-medium' : ''}`}
            >
              Home
            </Link>
            <Link 
              to="/reskill" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/reskill' ? 'text-primary font-medium' : ''}`}
            >
              ReSkill
            </Link>
            <Link 
              to="/hireyourself" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/hireyourself' ? 'text-primary font-medium' : ''}`}
            >
              HireYourself
            </Link>
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
              <Link 
                to="/" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/reskill" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/reskill' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                ReSkill
              </Link>
              <Link 
                to="/hireyourself" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/hireyourself' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                HireYourself
              </Link>
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