import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, User, LogOut } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TrialBanner } from '@/components/TrialBanner';

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin, subscribed, subscriptionTier, subscriptionEnd, checkAdminStatus } = useAuth();

  useEffect(() => {
    console.log('[Header] Auth state changed:', { 
      hasUser: !!user, 
      userEmail: user?.email,
      isAdmin, 
      subscribed, 
      subscriptionTier 
    });
  }, [user, isAdmin, subscribed, subscriptionTier]);

  useEffect(() => {
    if (user) {
      setTimeout(() => checkAdminStatus(), 0);
    }
  }, [user, checkAdminStatus]);

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
          
          <nav className="flex items-center justify-center flex-1 mx-2 md:mx-8 overflow-x-auto">
            <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm">
              <Link
                to="/about" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/about' ? 'text-primary font-medium' : ''}`}
              >
                About
              </Link>
              <Link
                to="/before-you-start" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/before-you-start' ? 'text-primary font-medium' : ''}`}
              >
                Before You Start
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
                    <span 
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer ${['/assessit', '/prepit'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                    >
                      Upskill
                    </span>
                    <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/assessit" className="flex w-full cursor-pointer">
                      Assess It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/prepit" className="flex w-full cursor-pointer">
                      Prep It
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-1">
                    <span 
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer ${['/courses', '/createit', '/promptit', '/codeit', '/deployit'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                    >
                      Learn It
                    </span>
                    <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/promptit" className="flex w-full cursor-pointer">
                      Prompt It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/codeit" className="flex w-full cursor-pointer">
                      Code It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/deployit" className="flex w-full cursor-pointer">
                      Deploy It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/createit" className="flex w-full cursor-pointer">
                      Create It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/courses" className="flex w-full cursor-pointer">
                      Courses
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link 
                to="/earnit" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/earnit' ? 'text-primary font-medium' : ''}`}
              >
                Earn It
              </Link>
              <Link 
                to="/buildit" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/buildit' ? 'text-primary font-medium' : ''}`}
              >
                Build It
              </Link>
              <Link 
                to="/teachit" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/teachit' ? 'text-primary font-medium' : ''}`}
              >
                Teach It
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-1">
                    <span 
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer ${['/launchit', '/scheduleit', '/hostit', '/speakit'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                    >
                      Plan It
                    </span>
                    <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/launchit" className="flex w-full cursor-pointer">
                      Launch It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/scheduleit" className="flex w-full cursor-pointer">
                      Schedule It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/hostit" className="flex w-full cursor-pointer">
                      Host It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/speakit" className="flex w-full cursor-pointer">
                      Speak It
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link 
                to="/fundit" 
                className={`text-foreground hover:text-primary transition-colors whitespace-nowrap ${location.pathname === '/fundit' ? 'text-primary font-medium' : ''}`}
              >
                Fund It
              </Link>
            </div>
          </nav>

          <div className="flex space-x-1 md:space-x-2 flex-shrink-0 ml-2 md:ml-4">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      Admin
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border border-border shadow-lg z-50">
                  <div className="px-2 py-2 text-sm border-b mb-1">
                    <div className="font-medium text-foreground flex items-center justify-between">
                      <span>Subscription</span>
                      {isAdmin && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Admin</span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {subscribed ? (
                        <>
                          <span className="capitalize font-medium">{subscriptionTier || 'Pro'}</span>
                          {subscriptionEnd && (
                            <span className="block mt-0.5">
                              Until {new Date(subscriptionEnd).toLocaleDateString()}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-medium">Explore Mode</span>
                      )}
                    </div>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="flex w-full cursor-pointer">
                      Manage Subscription
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex w-full cursor-pointer">
                      Dashboard
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
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
};