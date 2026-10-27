import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, User, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { TrialBanner } from '@/components/TrialBanner';

const mobileSections: { title: string; links: [string, string][] }[] = [
  { title: "Start", links: [["Start Here", "/before-you-start"], ["Our Story", "/about"], ["Pricing", "/pricing"]] },
  { title: "Upskill", links: [["Assess It", "/assessit"], ["Prep It", "/prepit"]] },
  { title: "Learn It", links: [["Prompt It", "/promptit"], ["Code It", "/codeit"], ["Deploy It", "/deployit"], ["Create It", "/createit"], ["Study It", "/studyit"]] },
  { title: "Make Money", links: [["Earn It", "/earnit"], ["Build It", "/buildit"], ["Teach It", "/teachit"]] },
  { title: "Plan It", links: [["Launch It", "/launchit"], ["Schedule It", "/scheduleit"], ["Host It", "/hostit"], ["Speak It", "/speakit"], ["Garden It", "/gardenit"], ["Act It", "/actit"]] },
  { title: "Grow It", links: [["Fund It", "/fundit"], ["Contract It", "/contractit"], ["Develop It", "/developit"]] },
];

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
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
          
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-2 md:mx-8">
            <div className="flex items-center space-x-2 md:space-x-4 text-xs md:text-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-1">
                    <span 
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer ${['/about', '/before-you-start'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                    >
                      About
                    </span>
                    <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/about" className="flex w-full cursor-pointer">
                      Our Story
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/before-you-start" className="flex w-full cursor-pointer">
                      Before You Start
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer ${['/createit', '/promptit', '/codeit', '/deployit', '/studyit'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
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
                    <Link to="/studyit" className="flex w-full cursor-pointer">
                      Study It
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
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer ${['/launchit', '/scheduleit', '/hostit', '/speakit', '/gardenit', '/actit'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
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
                  <DropdownMenuItem asChild>
                    <Link to="/gardenit" className="flex w-full cursor-pointer">
                      Garden It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/actit" className="flex w-full cursor-pointer">
                      Act It
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-1">
                    <span 
                      className={`text-foreground hover:text-primary transition-colors whitespace-nowrap cursor-pointer ${['/fundit', '/contractit', '/developit'].includes(location.pathname) ? 'text-primary font-medium' : ''}`}
                    >
                      Grow It
                    </span>
                    <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-card border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/fundit" className="flex w-full cursor-pointer">
                      Fund It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contractit" className="flex w-full cursor-pointer">
                      Contract It
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/developit" className="flex w-full cursor-pointer">
                      Develop It
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          <div className="flex space-x-1 md:space-x-2 flex-shrink-0 ml-2 md:ml-4">
            <Link to="/before-you-start" className="hidden sm:block">
              <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
                Start Here
              </Button>
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:block">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                      Admin
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2" aria-label="Account">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Account</span>
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
                        <span className="font-medium">Free plan</span>
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
                <Link to="/auth" className="hidden sm:block">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/auth?tab=signup">
                  <Button variant="hero">Sign Up</Button>
                </Link>
              </>
            )}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 overflow-y-auto">
                <SheetTitle className="text-left mb-4">Menu</SheetTitle>
                <nav className="flex flex-col gap-5 pb-8">
                  {mobileSections.map((section) => (
                    <div key={section.title}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{section.title}</p>
                      <div className="flex flex-col">
                        {section.links.map(([label, to]) => (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setMobileOpen(false)}
                            className={`py-2 text-base hover:text-primary ${location.pathname === to ? 'text-primary font-medium' : 'text-foreground'}`}
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!user && (
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};