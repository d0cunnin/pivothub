import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailResultsPromptProps {
  assessmentType: 'career' | 'skills' | 'personality' | 'tech-readiness';
  results: any;
  onEmailSent?: () => void;
  onSkip?: () => void;
}

export const EmailResultsPrompt = ({ 
  assessmentType, 
  results, 
  onEmailSent, 
  onSkip 
}: EmailResultsPromptProps) => {
  const [emailAddress, setEmailAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const sendResults = async () => {
    if (!emailAddress || !userName) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and email address to receive your results.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-assessment-results', {
        body: {
          email: emailAddress,
          name: userName,
          assessmentType,
          results: results,
          analysis: results
        }
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Results Sent! 📧",
        description: "Your detailed assessment results have been sent to your email.",
      });
      onEmailSent?.();
    } catch (error) {
      console.error('Error sending results email:', error);
      toast({
        title: "Email Failed",
        description: "Unable to send email. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getAssessmentTitle = () => {
    switch (assessmentType) {
      case 'career': return 'Career Assessment';
      case 'skills': return 'Skills Assessment';
      case 'personality': return 'Personality Assessment';
      case 'tech-readiness': return 'Tech Readiness Assessment';
      default: return 'Assessment';
    }
  };

  if (emailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold">Results Sent!</h3>
            <p className="text-muted-foreground">
              Check your email for your detailed {assessmentType} assessment results.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="h-5 w-5" />
          Get Your Results by Email
        </CardTitle>
        <CardDescription>
          Receive a detailed summary of your {getAssessmentTitle()} results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button 
            onClick={sendResults} 
            disabled={isSending || !emailAddress || !userName}
            className="flex-1"
          >
            {isSending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Results
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onSkip}
            className="flex-1"
          >
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};