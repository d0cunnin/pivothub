import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Eye, EyeOff, AlertTriangle, Check, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { getToolCreditCost, getToolCostTier } from "@/utils/toolCreditWeights";

interface ToolGuardProps {
  children: React.ReactNode;
  onUse?: () => void;
  toolName?: string;
}

export const ToolGuard: React.FC<ToolGuardProps> = ({ 
  children, 
  onUse,
  toolName = "this tool"
}) => {
  const { remainingRequests, accountStatus, checkAndIncrementUsage } = useUsage();
  const { user, subscribed, isAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [formStartTime, setFormStartTime] = useState(Date.now());
  const { toast } = useToast();

  const emailsMatch = confirmEmail && email === confirmEmail;

  useEffect(() => {
    setFormStartTime(Date.now());
  }, [showAuthModal]);

  const handleToolUse = async () => {
    // Admins bypass all restrictions
    if (isAdmin) {
      onUse?.();
      return;
    }

    // Check if account is suspended
    if (accountStatus === 'suspended') {
      toast({
        title: "Account Suspended",
        description: "Your account has been suspended. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // If not logged in, show signup modal
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Get credit cost for this tool
    const creditCost = getToolCreditCost(toolName || 'generic');
    
    // Pre-check: ensure user has enough credits (no deduction yet)
    if (remainingRequests < creditCost) {
      toast({
        title: "Insufficient Credits",
        description: `This tool requires ${creditCost} credit${creditCost > 1 ? 's' : ''}, but you only have ${remainingRequests} remaining.`,
        variant: "destructive",
      });
      return;
    }

    // All checks passed - call the tool's generation function
    // Credits will be deducted by backend after successful AI generation
    onUse?.();
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);

      // Bot protection checks
      if (honeypot) {
        toast({
          title: "Error",
          description: "Invalid form submission detected.",
          variant: "destructive",
        });
        setAuthLoading(false);
        return;
      }

      const formFillTime = Date.now() - formStartTime;
      if (formFillTime < 2000) {
        toast({
          title: "Please slow down",
          description: "Please take a moment to review your information.",
          variant: "destructive",
        });
        setAuthLoading(false);
        return;
      }

      if (email !== confirmEmail) {
        toast({
          title: "Error",
          description: "Email addresses do not match.",
          variant: "destructive",
        });
        setAuthLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Your account has been created! You can now sign in.",
      });
      setShowAuthModal(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Welcome back!",
        description: "You're now signed in.",
      });
      setShowAuthModal(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  // Show usage warning if approaching limit (but not for admins)
  const showUsageWarning = !isAdmin && remainingRequests <= 10 && remainingRequests > 0;
  const showLimitReached = !isAdmin && remainingRequests === 0;
  
  // Get tool cost info
  const toolCreditCost = toolName ? getToolCreditCost(toolName) : 2;
  const toolCostTier = toolName ? getToolCostTier(toolName) : 'medium';

  return (
    <div>
      {/* Tool Cost Badge */}
      {toolName && !isAdmin && (
        <div className="mb-3 flex items-center justify-between">
          <Badge variant={toolCostTier === 'free' ? 'outline' : toolCostTier === 'low' ? 'secondary' : 'default'} className="gap-1">
            <Zap className="h-3 w-3" />
            {toolCreditCost} credit{toolCreditCost !== 1 ? 's' : ''}
            {toolCostTier === 'high' && ' (Premium)'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {remainingRequests} credits remaining
          </span>
        </div>
      )}

      {/* Usage Warning Banner */}
      {showUsageWarning && (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {remainingRequests} credit{remainingRequests !== 1 ? 's' : ''} remaining this month
            </span>
          </div>
        </div>
      )}

      {/* Limit Reached Warning */}
      {showLimitReached && user && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">
              Monthly limit reached - Purchase extra credits or upgrade your plan
            </span>
          </div>
        </div>
      )}

      {/* Wrap the tool component */}
      <div onClick={(e) => {
        // Only trigger if click is on an element with data-toolguard-trigger="true"
        const target = e.target as HTMLElement;
        if (!target.closest('[data-toolguard-trigger="true"]')) {
          return;
        }
        handleToolUse();
      }}>
        {children}
      </div>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Start Your Free Account
            </DialogTitle>
            <DialogDescription className="text-center">
              Create your account to access PivotHub tools with 5 free credits per month
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full"
              disabled={authLoading}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signup">
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  {/* Honeypot field - hidden from users */}
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ position: 'absolute', left: '-9999px' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-email">Confirm Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm-email"
                        type="email"
                        placeholder="Confirm your email"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      {confirmEmail && (
                        <div className="absolute right-3 top-3">
                          {emailsMatch ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>
                    {confirmEmail && !emailsMatch && (
                      <p className="text-xs text-destructive">Emails do not match</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading || !emailsMatch}>
                    {authLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signin">
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={authLoading}>
                    {authLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <p className="text-xs text-muted-foreground text-center">
              By signing up, you agree to our{" "}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};