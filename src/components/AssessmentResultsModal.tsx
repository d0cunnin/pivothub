import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  TrendingUp, 
  Mail, 
  Download, 
  Target, 
  BookOpen, 
  Users, 
  Lightbulb,
  ArrowRight,
  Star
} from "lucide-react";

interface AssessmentResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentType: 'career' | 'skills' | 'personality';
  results: any;
}

export const AssessmentResultsModal = ({ isOpen, onClose, assessmentType, results }: AssessmentResultsModalProps) => {
  const [emailAddress, setEmailAddress] = useState("");
  const [userName, setUserName] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const sendResultsEmail = async () => {
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

  const getAssessmentIcon = () => {
    switch (assessmentType) {
      case 'career': return <Target className="h-5 w-5" />;
      case 'skills': return <BookOpen className="h-5 w-5" />;
      case 'personality': return <Users className="h-5 w-5" />;
      default: return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getAssessmentTitle = () => {
    switch (assessmentType) {
      case 'career': return "Career Assessment Results";
      case 'skills': return "Skills Assessment Results";
      case 'personality': return "Personality Assessment Results";
      default: return "Assessment Results";
    }
  };

  const renderCareerResults = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Overall Career Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Progress value={(results.overallScore || 7) * 10} className="flex-1" />
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {results.overallScore || 7}/10
            </Badge>
          </div>
        </CardContent>
      </Card>

      {results.topCareerPaths && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Your Top Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.topCareerPaths.slice(0, 3).map((career: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{career.title}</h4>
                    <Badge>{career.match}/10 Match</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{career.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Growth Outlook:</strong> {career.growthOutlook}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  const renderSkillsResults = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Overall Skills Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Progress value={(results.overallScore || 7) * 10} className="flex-1" />
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {results.overallScore || 7}/10
            </Badge>
          </div>
        </CardContent>
      </Card>

      {results.skillCategories && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Your Skill Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.skillCategories.slice(0, 4).map((category: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{category.category}</h4>
                    <Badge variant={category.level === 'Advanced' ? 'default' : 'secondary'}>
                      {category.level}
                    </Badge>
                  </div>
                  <Progress value={category.score * 10} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    <strong>Strengths:</strong> {category.strengths?.join(', ') || 'Developing'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  const renderPersonalityResults = () => (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Your Personality Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="default" className="text-lg px-4 py-2 mb-4">
            {results.personalityType || 'Unique Individual'}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {results.summary || 'Your personality profile reflects your unique strengths and working style.'}
          </p>
        </CardContent>
      </Card>

      {results.keyTraits && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="mr-2 h-5 w-5" />
              Your Key Traits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.keyTraits.slice(0, 3).map((trait: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{trait.trait}</h4>
                    <Badge>{trait.score}/5</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{trait.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  const renderActionPlan = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" />
          Your Action Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.actionPlan?.immediate && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                🔥 Start This Week
              </h4>
              <ul className="space-y-1">
                {results.actionPlan.immediate.slice(0, 2).map((action: string, index: number) => (
                  <li key={index} className="text-sm flex items-start">
                    <ArrowRight className="h-3 w-3 mr-2 mt-0.5 text-primary flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.actionPlan?.shortTerm && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                📅 Next 1-3 Months
              </h4>
              <ul className="space-y-1">
                {results.actionPlan.shortTerm.slice(0, 2).map((action: string, index: number) => (
                  <li key={index} className="text-sm flex items-start">
                    <ArrowRight className="h-3 w-3 mr-2 mt-0.5 text-primary flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center">
            {getAssessmentIcon()}
            <span className="ml-2">{getAssessmentTitle()}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {assessmentType === 'career' && renderCareerResults()}
          {assessmentType === 'skills' && renderSkillsResults()}
          {assessmentType === 'personality' && renderPersonalityResults()}
          
          {renderActionPlan()}

          {/* Email Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Get Your Detailed Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!emailSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Receive a comprehensive report with detailed analysis, personalized recommendations, 
                    and your complete action plan via email.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="userName">Your Name</Label>
                      <Input
                        id="userName"
                        type="text"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailAddress">Email Address</Label>
                      <Input
                        id="emailAddress"
                        type="email"
                        placeholder="Enter your email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={sendResultsEmail}
                    disabled={isSending}
                    className="w-full"
                  >
                    {isSending ? (
                      "Sending Results..."
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Detailed Results to Email
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Results Sent Successfully!</h3>
                  <p className="text-sm text-muted-foreground">
                    Check your email for your comprehensive assessment report with detailed insights and action plans.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};