import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Briefcase, Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/');
    setTimeout(() => {
      const pathSelection = document.getElementById('choose-path');
      if (pathSelection) {
        pathSelection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

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
              to="/about" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/about' ? 'text-primary font-medium' : ''}`}
            >
              About
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`text-foreground hover:text-primary transition-colors flex items-center space-x-1 px-4 py-2 h-auto ${['/reskill', '/assessments', '/jobprep', '/certifications'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                >
                  <span>ReSkill</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border border-border shadow-lg z-50">
                <DropdownMenuItem asChild>
                  <Link to="/reskill" className="flex w-full cursor-pointer">
                    Overview
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/assessments" className="flex w-full cursor-pointer">
                    Assessments
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/jobprep" className="flex w-full cursor-pointer">
                    Job Prep Tools
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/certifications" className="flex w-full cursor-pointer">
                    Certifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link 
              to="/hireyourself" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/hireyourself' ? 'text-primary font-medium' : ''}`}
            >
              HireYourself
            </Link>
            <Link 
              to="/grantwriting" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/grantwriting' ? 'text-primary font-medium' : ''}`}
            >
              Grant Writing
            </Link>
          </nav>

          <div className="hidden md:flex space-x-3">
            <Button variant="ghost">Sign In</Button>
            <Button variant="hero" onClick={handleGetStarted}>Get Started</Button>
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
                to="/about" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/about' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="space-y-2">
                <div className={`font-medium ${['/reskill', '/assessments', '/jobprep', '/certifications'].includes(location.pathname) ? 'text-primary' : 'text-foreground'}`}>
                  ReSkill
                </div>
                <div className="pl-4 space-y-2">
                  <Link 
                    to="/reskill" 
                    className={`block text-foreground hover:text-primary transition-colors ${location.pathname === '/reskill' ? 'text-primary font-medium' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Overview
                  </Link>
                  <Link 
                    to="/assessments" 
                    className={`block text-foreground hover:text-primary transition-colors ${location.pathname === '/assessments' ? 'text-primary font-medium' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Assessments
                  </Link>
                  <Link 
                    to="/jobprep" 
                    className={`block text-foreground hover:text-primary transition-colors ${location.pathname === '/jobprep' ? 'text-primary font-medium' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Job Prep Tools
                  </Link>
                  <Link 
                    to="/certifications" 
                    className={`block text-foreground hover:text-primary transition-colors ${location.pathname === '/certifications' ? 'text-primary font-medium' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Certifications
                  </Link>
                </div>
              </div>
              <Link 
                to="/hireyourself" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/hireyourself' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                HireYourself
              </Link>
              <Link 
                to="/grantwriting" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/grantwriting' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Grant Writing
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost">Sign In</Button>
                <Button variant="hero" onClick={handleGetStarted}>Get Started</Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};