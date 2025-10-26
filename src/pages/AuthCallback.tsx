import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/auth');
        return;
      }
      
      if (session?.user) {
        // Check if this is a new user (created within last 2 minutes)
        const userCreatedAt = new Date(session.user.created_at);
        const now = new Date();
        const isNewUser = (now.getTime() - userCreatedAt.getTime()) < 120000; // 2 minutes
        
        if (isNewUser) {
          toast.success('Welcome! Your account has been created.');
        } else {
          toast.success('Signed in successfully!');
        }
        
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    };
    
    handleAuthCallback();
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">Completing sign in...</h2>
        <p className="text-muted-foreground">Please wait while we verify your account</p>
      </div>
    </div>
  );
};

export default AuthCallback;
