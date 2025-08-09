import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/47d992b0-15a0-4556-9c60-d76fd98c6d81.png" 
              alt="ReLaunch Logo" 
              className="h-12 w-auto"
            />
          </Link>
          
          <nav className="hidden md:flex space-x-8 ml-12">
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
                <div 
                  className={`text-foreground hover:text-primary transition-colors flex items-center space-x-1 cursor-pointer ${['/reskill', '/assessments', '/jobprep', '/learn-a-skill'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                >
                  <span>ReSkill</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-card border border-border shadow-lg z-50">
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
                  <Link to="/learn-a-skill" className="flex w-full cursor-pointer">
                    Learn a Skill
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
              to="/contact" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/contact' ? 'text-primary font-medium' : ''}`}
            >
              Contact
            </Link>
            <Link 
              to="/pricing" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/pricing' ? 'text-primary font-medium' : ''}`}
            >
              Pricing
            </Link>
            <Link 
              to="/downloads" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/downloads' ? 'text-primary font-medium' : ''}`}
            >
              Downloads
            </Link>
            <Link 
              to="/grantwriting" 
              className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/grantwriting' ? 'text-primary font-medium' : ''}`}
            >
              Grant Writing
            </Link>
          </nav>

          <div className="hidden md:flex space-x-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.email?.split('@')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="flex w-full cursor-pointer">
                      Manage Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Button variant="hero" onClick={handleGetStarted}>Get Started</Button>
              </>
            )}
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
                <div className={`font-medium ${['/reskill', '/assessments', '/jobprep', '/learn-a-skill'].includes(location.pathname) ? 'text-primary' : 'text-foreground'}`}>
                  ReSkill
                </div>
                <div className="pl-4 space-y-2">
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
                    to="/learn-a-skill" 
                    className={`block text-foreground hover:text-primary transition-colors ${location.pathname === '/learn-a-skill' ? 'text-primary font-medium' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Learn a Skill
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
                to="/contact" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/contact' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <Link 
                to="/pricing" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/pricing' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
               <Link 
                to="/downloads" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/downloads' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Downloads
              </Link>
              <Link 
                to="/grantwriting" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/grantwriting' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Grant Writing
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                {user ? (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Signed in as {user.email?.split('@')[0]}
                    </div>
                    <Link to="/pricing">
                      <Button variant="ghost" className="w-full">Manage Subscription</Button>
                    </Link>
                    <Button variant="outline" onClick={signOut} className="w-full">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" className="w-full">Sign In</Button>
                    </Link>
                    <Button variant="hero" onClick={handleGetStarted} className="w-full">Get Started</Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};