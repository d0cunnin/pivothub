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
import { lovable } from "@/integrations/lovable";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Eye, EyeOff, AlertTriangle, Check, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { getToolCreditCost, getToolCostTier } from "@/utils/toolCreditWeights";
import { signupAttributionMetadata, trackSignUp } from "@/lib/analytics";

interface ToolGuardProps {
  children: React.ReactNode;
  onUse?: () => void;
  toolName?: string;
  showCreditInfo?: boolean;
}

interface CreditBadgeProps {
  toolName: string;
  isAdmin?: boolean;
}

export const CreditBadge: React.FC<CreditBadgeProps> = ({ toolName, isAdmin = false }) => {
  if (isAdmin) return null;
  
  const toolCost = getToolCreditCost(toolName);
  const toolCostTier = getToolCostTier(toolName);
  
  return (
    <Badge variant={toolCostTier === 'free' ? 'outline' : toolCostTier === 'low' ? 'secondary' : 'default'} className="gap-1 shrink-0">
      <Zap className="h-3 w-3" />
      {toolCost} {toolCost === 1 ? 'credit' : 'credits'}
    </Badge>
  );
};

export const ToolGuard: React.FC<ToolGuardProps> = ({ 
  children, 
  onUse,
  toolName = "this tool",
  showCreditInfo = true
}) => {
  const { remainingRequests, accountStatus } = useUsage();
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

    // ✅ CRITICAL FIX: Verify and refresh the session before allowing tool usage
    console.log('[ToolGuard] Verifying session before tool use...');
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();

    if (!session || sessionError) {
      console.error('[ToolGuard] Session invalid, forcing re-login:', sessionError);
      toast({
        title: "Session Expired",
        description: "Please sign in again to continue using tools.",
        variant: "destructive",
      });
      setShowAuthModal(true);
      return;
    }

    // Check if session is about to expire (< 5 minutes remaining)
    const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
    const timeUntilExpiry = expiresAt - Date.now();

    console.log('[ToolGuard] Session check:', {
      expiresAt: new Date(expiresAt).toISOString(),
      timeUntilExpiry: Math.floor(timeUntilExpiry / 1000) + 's',
      needsRefresh: timeUntilExpiry < 5 * 60 * 1000
    });

    if (timeUntilExpiry < 5 * 60 * 1000) {
      console.log('[ToolGuard] Session expiring soon, refreshing...');
      const { data: { session: newSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !newSession) {
        console.error('[ToolGuard] Session refresh failed:', refreshError);
        toast({
          title: "Session Refresh Failed",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        setShowAuthModal(true);
        return;
      }
      
      console.log('[ToolGuard] Session refreshed successfully');
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
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });

      if (result.error) {
        throw result.error instanceof Error
          ? result.error
          : new Error((result.error as any)?.message || "Failed to sign in with Google");
      }

      if (result.redirected) return;

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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: signupAttributionMetadata()
        }
      });
      
      if (error) throw error;
      // An empty identities list means the email was already registered.
      if (data.user && data.user.identities?.length) trackSignUp('email', data.user.id);
      
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
      {showCreditInfo && toolName && !isAdmin && (
        <div className="mb-6 flex justify-center">
          <div className="rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
            <div className="flex items-center gap-4">
              <Badge 
                variant={toolCostTier === 'free' ? 'outline' : toolCostTier === 'low' ? 'secondary' : 'default'} 
                className="gap-2 text-sm px-4 py-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary border-0"
              >
                <Zap className="h-4 w-4" />
                <span className="font-semibold">{toolCreditCost} credit{toolCreditCost !== 1 ? 's' : ''} required</span>
              </Badge>
              <div className="h-6 w-px bg-border"></div>
              <span className="text-sm font-medium text-muted-foreground">
                {remainingRequests} credits remaining
              </span>
            </div>
          </div>
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
      <div onPointerDownCapture={(e) => {
        // Signed-out visitors can't use any tool: block every control and ask them to sign in
        if (user || isAdmin) return;
        const target = e.target as HTMLElement;
        if (target.closest('[role="tab"], a')) return;
        if (target.closest('button, input, textarea, select, label, [role="button"], [role="radio"], [role="checkbox"], [role="combobox"], [role="slider"]')) {
          e.preventDefault();
          e.stopPropagation();
          setShowAuthModal(true);
        }
      }} onClickCapture={(e) => {
        // Signed-out visitors can't use any tool: block every control and ask them to sign in
        if (user || isAdmin) return;
        const target = e.target as HTMLElement;
        if (target.closest('[role="tab"], a')) return;
        if (target.closest('button, input, textarea, select, label, [role="button"], [role="radio"], [role="checkbox"], [role="combobox"], [role="slider"]')) {
          e.preventDefault();
          e.stopPropagation();
          setShowAuthModal(true);
        }
      }} onFocusCapture={(e) => {
        if (user || isAdmin) return;
        const target = e.target as HTMLElement;
        if (target.matches('input, textarea, select')) {
          target.blur();
          setShowAuthModal(true);
        }
      }} onClick={(e) => {
        // Only trigger if click is on an element with data-toolguard-trigger="true"
        const target = e.target as HTMLElement;
        if (!target.closest('[data-toolguard-trigger="true"]')) {
          return;
        }
        handleToolUse();
      }}>
        {children}
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Sign In to PivotHub</DialogTitle><DialogDescription>Use your account to access tools and Tool Credits.</DialogDescription></DialogHeader><Button asChild><Link to={`/auth?redirect=${encodeURIComponent(window.location.pathname)}`}>Sign In or Create Account</Link></Button></DialogContent>
      </Dialog>
    </div>
  );
};