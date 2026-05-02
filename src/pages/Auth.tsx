import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { z } from 'zod';
import Turnstile from 'react-turnstile';

// Password validation schema
const passwordSchema = z.string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

const Auth = () => {
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, isAdmin, checkAdminStatus } = useAuth();

  const emailsMatch = confirmEmail && email === confirmEmail;

  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(redirectPath === '/' ? '/' : `/${redirectPath}`);
      }
    };
    checkUser();
  }, [navigate, redirectPath]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Turnstile verification
      if (!turnstileToken) {
        toast({
          title: "Verification required",
          description: "Please complete the security check.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (email !== confirmEmail) {
        toast({
          title: "Error",
          description: "Email addresses do not match.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate password complexity
      const passwordValidation = passwordSchema.safeParse(password);
      if (!passwordValidation.success) {
        toast({
          title: "Password requirements not met",
          description: passwordValidation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const redirectUrl = redirectPath === '/' 
        ? `${window.location.origin}/auth/callback`
        : `${window.location.origin}/auth/callback?redirect=${redirectPath}`;
        
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Track signup with IP for fraud detection (non-blocking)
        if (data.user) {
          supabase.functions
            .invoke('track-signup', {
              body: { userId: data.user.id, email: data.user.email },
            })
            .then((result) => {
              if (result.data?.flagged) {
                console.warn(`Signup flagged as suspicious: ${result.data.accountsFromIp} accounts from this IP`);
              }
            })
            .catch((err) => console.error('Failed to track signup:', err));
        }

        toast({
          title: "Success",
          description: "Your account has been created! You can now sign in.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (isSignUp: boolean = false) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
        
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Turnstile verification
      if (!turnstileToken) {
        toast({
          title: "Verification required",
          description: "Please complete the security check.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // Check if account is locked BEFORE attempting login
      const { data: lockoutCheck } = await supabase
        .rpc('check_account_lockout', { p_email: email });
      
      if (lockoutCheck && typeof lockoutCheck === 'object' && 'locked' in lockoutCheck && lockoutCheck.locked) {
        const lockData = lockoutCheck as { locked: boolean; locked_until: string };
        const lockedUntil = new Date(lockData.locked_until);
        const minutesRemaining = Math.ceil(
          (lockedUntil.getTime() - Date.now()) / 60000
        );
        
        toast({
          title: "Account Locked",
          description: `Too many failed attempts. Please try again in ${minutesRemaining} minutes.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed attempt
        await supabase.rpc('record_failed_login', {
          p_email: email,
          p_ip: '0.0.0.0', // Client IP not accessible from browser
          p_user_agent: navigator.userAgent
        });
        
        // Check remaining attempts
        const { data: newCheck } = await supabase
          .rpc('check_account_lockout', { p_email: email });
        
        if (newCheck && typeof newCheck === 'object' && 'locked' in newCheck && newCheck.locked) {
          toast({
            title: "Account Locked",
            description: "Too many failed attempts. Account locked for 30 minutes.",
            variant: "destructive",
          });
        } else if (newCheck && typeof newCheck === 'object' && 'remaining_attempts' in newCheck) {
          const attemptsData = newCheck as { remaining_attempts: number };
          toast({
            title: "Invalid Credentials",
            description: `${attemptsData.remaining_attempts} attempts remaining before lockout.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Success - clear any failed attempts
        await supabase.rpc('clear_account_lockout', { p_email: email });
        
        toast({
          title: "Success",
          description: "Welcome back!",
        });
        navigate(redirectPath === '/' ? '/' : `/${redirectPath}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to PivotHub</CardTitle>
            <CardDescription>
              Sign in to access your career and business development tools
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="mb-4">
                  <Button
                    onClick={() => handleGoogleSignIn(false)}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                    type="button"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>
                </div>
                
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
                
                <div className="flex justify-center">
                  <Turnstile
                    sitekey="1x00000000000000000000AA"
                    onVerify={(token) => setTurnstileToken(token)}
                    onError={() => setTurnstileToken('')}
                    onExpire={() => setTurnstileToken('')}
                    theme="light"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="space-y-4 mb-6">
                <Button
                  onClick={() => handleGoogleSignIn(true)}
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  type="button"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSignUp} className="space-y-4">
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
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => {
                          const checks = {
                            length: password.length >= 10,
                            uppercase: /[A-Z]/.test(password),
                            lowercase: /[a-z]/.test(password),
                            number: /[0-9]/.test(password),
                            special: /[^A-Za-z0-9]/.test(password)
                          };
                          const strength = Object.values(checks).filter(Boolean).length;
                          return (
                            <div 
                              key={i} 
                              className={`h-1 flex-1 rounded transition-colors ${
                                i <= strength ? 'bg-primary' : 'bg-muted'
                              }`} 
                            />
                          );
                        })}
                      </div>
                      <ul className="text-xs space-y-1">
                        <li className={password.length >= 10 ? 'text-primary' : 'text-muted-foreground'}>
                          {password.length >= 10 ? '✓' : '○'} At least 10 characters
                        </li>
                        <li className={/[A-Z]/.test(password) ? 'text-primary' : 'text-muted-foreground'}>
                          {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                        </li>
                        <li className={/[a-z]/.test(password) ? 'text-primary' : 'text-muted-foreground'}>
                          {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                        </li>
                        <li className={/[0-9]/.test(password) ? 'text-primary' : 'text-muted-foreground'}>
                          {/[0-9]/.test(password) ? '✓' : '○'} One number
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(password) ? 'text-primary' : 'text-muted-foreground'}>
                          {/[^A-Za-z0-9]/.test(password) ? '✓' : '○'} One special character
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <Turnstile
                    sitekey="1x00000000000000000000AA"
                    onVerify={(token) => setTurnstileToken(token)}
                    onError={() => setTurnstileToken('')}
                    onExpire={() => setTurnstileToken('')}
                    theme="light"
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading || !emailsMatch}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
          
          <p className="text-xs text-muted-foreground text-center mt-4">
            By signing up, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Use
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;