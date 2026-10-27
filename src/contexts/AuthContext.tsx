import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getStripeEnvironment } from '@/lib/payments/stripe';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscribed: boolean;
  subscriptionTier: string | null;
  subscriptionPackage: string | null;
  subscriptionEnd: string | null;
  isAdmin: boolean;
  cancelAtPeriodEnd: boolean;
  pendingPriceId: string | null;
  pendingEffectiveAt: string | null;
  paymentStatus: string | null;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  checkAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [subscriptionPackage, setSubscriptionPackage] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cancelAtPeriodEnd,setCancelAtPeriodEnd]=useState(false);
  const [pendingPriceId,setPendingPriceId]=useState<string|null>(null);
  const [pendingEffectiveAt,setPendingEffectiveAt]=useState<string|null>(null);
  const [paymentStatus,setPaymentStatus]=useState<string|null>(null);
  const userRef=useRef<string|undefined>();
  const { toast } = useToast();

  const refreshSubscription = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: { environment: getStripeEnvironment() },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data && currentSession.user.id===userRef.current) {
        setCancelAtPeriodEnd(data.cancel_at_period_end??false);setPendingPriceId(data.pending_price_id??null);setPendingEffectiveAt(data.pending_effective_at??null);setPaymentStatus(data.payment_status??null);
        setSubscribed(data.subscribed || false);
        setSubscriptionTier(data.subscription_tier || null);
        setSubscriptionPackage(data.subscription_package || null);
        setSubscriptionEnd(data.subscription_end || null);
      }
    } catch (error) {
      console.error('Error refreshing subscription:', error);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: displayName
        }
      }
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const checkAdminStatus=async()=>{
    const {data:{session:current}}=await supabase.auth.getSession();if(!current){setIsAdmin(false);return;}
    const {data,error}=await supabase.from('user_roles').select('role').eq('user_id',current.user.id).eq('role','admin').maybeSingle();
    if(userRef.current===current.user.id)setIsAdmin(!error&&!!data);
  };
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if(userRef.current!==session?.user.id){setSubscribed(false);setSubscriptionTier(null);setSubscriptionPackage(null);setSubscriptionEnd(null);setIsAdmin(false);setCancelAtPeriodEnd(false);setPendingPriceId(null);setPendingEffectiveAt(null);setPaymentStatus(null);}
        userRef.current=session?.user.id;
        userRef.current=session?.user.id;
      setSession(session);
        setUser(session?.user ?? null);
        
        // Refresh subscription when user signs in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            refreshSubscription();
            checkAdminStatus();
          }, 0);
        }
        
        // Clear subscription data when user signs out
        if (event === 'SIGNED_OUT') {
          setSubscribed(false);
          setSubscriptionPackage(null);setCancelAtPeriodEnd(false);
          setSubscriptionTier(null);
          setSubscriptionEnd(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      userRef.current=session?.user.id;
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          refreshSubscription();
          checkAdminStatus();
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(()=>{if(!user)return;const refresh=()=>{refreshSubscription();};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[user?.id]);

  const value = {
    user,
    session,
    loading,
    subscribed,
    subscriptionTier,
    subscriptionPackage,
    subscriptionEnd,
    isAdmin,cancelAtPeriodEnd,pendingPriceId,pendingEffectiveAt,paymentStatus,
    refreshSubscription,
    signOut,
    signIn,
    signUp,
    checkAdminStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};