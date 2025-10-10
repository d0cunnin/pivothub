import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TrialBanner } from '@/components/TrialBanner';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();

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
    <>
      <TrialBanner />
      <header className="bg-card shadow-soft border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center flex-shrink-0">
            <img 
              src="/lovable-uploads/a80d6385-d42b-4185-932b-427aec2b395d.png" 
              alt="PivotHub Logo" 
              className="h-10 w-auto object-contain"
            />
          </Link>
          
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center space-x-6 xl:space-x-8">
              <Link
                to="/about" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/about' ? 'text-primary font-medium' : ''}`}
              >
                About
              </Link>
              <Link 
                to="/side-income-blueprint" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/side-income-blueprint' ? 'text-primary font-medium' : ''}`}
              >
                Side Income Blueprint
              </Link>
              <Link 
                to="/pricing" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/pricing' ? 'text-primary font-medium' : ''}`}
              >
                Pricing
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-1">
                    <Link 
                      to="/reskill"
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${['/reskill', '/assessments', '/jobprep', '/learn-a-skill'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                    >
                      ReSkill
                    </Link>
                    <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
                      <ChevronDown className="h-4 w-4" />
                    </button>
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
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/hireyourself' ? 'text-primary font-medium' : ''}`}
              >
                HireYourself
              </Link>
              <Link 
                to="/teachit" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/teachit' ? 'text-primary font-medium' : ''}`}
              >
                Teach It
              </Link>
              <Link 
                to="/launchit" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/launchit' ? 'text-primary font-medium' : ''}`}
              >
                Launch It
              </Link>
              <Link
                to="/grantwriting" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/grantwriting' ? 'text-primary font-medium' : ''}`}
              >
                Grant Writing
              </Link>
            </div>
          </nav>

          <div className="hidden lg:flex space-x-3 flex-shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="flex w-full cursor-pointer">
                      Manage Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex w-full cursor-pointer">
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact" className="flex w-full cursor-pointer">
                      Contact
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex w-full cursor-pointer font-medium text-primary">
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
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
                <Button variant="hero" onClick={handleGetStarted}>Sign Up</Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="lg:hidden border-2 border-primary/20 hover:border-primary hover:bg-primary/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden mt-4 py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/about" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/about' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                to="/side-income-blueprint" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/side-income-blueprint' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Side Income Blueprint
              </Link>
              <Link 
                to="/pricing" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/pricing' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <div className="space-y-2">
                <Link 
                  to="/reskill"
                  className={`font-medium hover:text-primary transition-colors ${['/reskill', '/assessments', '/jobprep', '/learn-a-skill'].includes(location.pathname) ? 'text-primary' : 'text-foreground'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  ReSkill
                </Link>
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
                to="/teachit" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/teachit' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Teach It
              </Link>
               <Link 
                to="/launchit" 
                className={`text-foreground hover:text-primary transition-colors ${location.pathname === '/launchit' ? 'text-primary font-medium' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Launch It
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
                      <Button variant="ghost" className="w-full justify-start">Manage Subscription</Button>
                    </Link>
                    <Link to="/settings">
                      <Button variant="ghost" className="w-full justify-start">Account Settings</Button>
                    </Link>
                    <Link to="/contact">
                      <Button variant="ghost" className="w-full justify-start">Contact</Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin">
                        <Button variant="ghost" className="w-full justify-start font-medium text-primary">Admin Dashboard</Button>
                      </Link>
                    )}
                    <Button variant="outline" onClick={signOut} className="w-full">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" className="w-full">Sign In</Button>
                    </Link>
                    <Button variant="hero" onClick={handleGetStarted} className="w-full">Sign Up</Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
    </>
  );
};