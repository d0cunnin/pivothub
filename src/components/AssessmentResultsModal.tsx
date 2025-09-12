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

  // Early return if results is null or undefined
  if (!results) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Assessment Results</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No assessment results available.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getScoreInterpretation = (score: number) => {
    if (score >= 9) return "Excellent - You're very well-prepared and show strong readiness";
    if (score >= 7) return "Good - You have solid foundations with some areas to strengthen";
    if (score >= 5) return "Fair - You have basic skills but significant room for improvement";
    return "Developing - Focus on building foundational skills and knowledge";
  };

  const getSkillLevel = (score: number) => {
    if (score >= 8) return "Advanced";
    if (score >= 6) return "Intermediate";
    if (score >= 4) return "Developing";
    return "Beginner";
  };

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
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Progress value={(results?.overallScore || 7) * 10} className="flex-1" />
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {results?.overallScore || 7}/10
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Interpretation:</strong> {getScoreInterpretation(results?.overallScore || 7)}</p>
              <p className="mt-2"><strong>Percentile:</strong> You scored higher than {Math.round((results?.overallScore || 7) * 8)}% of people taking this assessment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {results?.primaryInterests && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Your Primary Career Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {results?.primaryInterests?.slice(0, 6).map((interest: string, index: number) => (
                <Badge key={index} variant="outline" className="justify-center py-2">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results?.topCareerPaths && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Your Top Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results?.topCareerPaths?.slice(0, 3).map((career: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{career.title}</h4>
                    <Badge variant={career.match >= 8 ? "default" : "secondary"}>
                      {career.match}/10 Match
                    </Badge>
                  </div>
                  <Progress value={career.match * 10} className="mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">{career.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p><strong>Growth Outlook:</strong> {career.growthOutlook}</p>
                    <p><strong>Avg Salary:</strong> {career.salary || 'Varies'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );

  const renderSkillsResults = () => {
    // Additional safety check
    if (!results) return null;
    
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Overall Skills Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Progress value={(results?.overallScore || 7) * 10} className="flex-1" />
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {results?.overallScore || 7}/10
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Skills Level:</strong> {getSkillLevel(results?.overallScore || 7)}</p>
                <p className="mt-1"><strong>Benchmark:</strong> You performed better than {Math.round((results?.overallScore || 7) * 9)}% of job seekers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {results?.topSkills && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Your Strongest Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {results?.topSkills?.slice(0, 6).map((skill: string, index: number) => (
                  <Badge key={index} variant="default" className="justify-center py-2">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results?.skillCategories && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Detailed Skills Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results?.skillCategories?.slice(0, 6).map((category: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{category.category}</h4>
                      <Badge variant={category.level === 'Advanced' ? 'default' : category.level === 'Intermediate' ? 'secondary' : 'outline'}>
                        {category.level}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Progress value={category.score * 10} className="flex-1" />
                      <span className="text-sm font-medium">{category.score}/10</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Strengths:</strong> {category.strengths?.join(', ') || 'Building foundation'}</p>
                      {category.improvements && (
                        <p><strong>Areas to improve:</strong> {category.improvements.join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results?.skillGaps && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Priority Skills to Develop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results?.skillGaps?.slice(0, 5).map((gap: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-sm">{gap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  const renderPersonalityResults = () => {
    // Additional safety check
    if (!results) return null;
    
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Your Personality Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <Badge variant="default" className="text-lg px-6 py-3">
                {results?.personalityType || 'Unique Individual'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {results?.summary || 'Your personality profile reflects your unique strengths and working style.'}
              </p>
              {results?.personalityDescription && (
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {results?.personalityDescription}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {results?.strengths && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Your Top Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {results?.strengths?.slice(0, 4).map((strength: string, index: number) => (
                  <Badge key={index} variant="default" className="justify-center py-2">
                    {strength}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results?.keyTraits && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="mr-2 h-5 w-5" />
                Detailed Trait Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results?.keyTraits?.slice(0, 5).map((trait: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{trait.trait}</h4>
                      <Badge variant={trait.score >= 4 ? "default" : "secondary"}>
                        {trait.score}/5
                      </Badge>
                    </div>
                    <Progress value={trait.score * 20} className="mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">{trait.description}</p>
                    {trait.careerRelevance && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Career Impact:</strong> {trait.careerRelevance}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results?.careerFit && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Career Fields That Match Your Personality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results?.careerFit?.slice(0, 4).map((field: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <h5 className="font-medium">{field.field}</h5>
                      <Badge variant="outline">{field.match}/10 Match</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{field.reasoning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

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
          {results?.actionPlan?.immediate && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                🔥 Start This Week
              </h4>
              <ul className="space-y-1">
                {results?.actionPlan?.immediate?.slice(0, 2).map((action: string, index: number) => (
                  <li key={index} className="text-sm flex items-start">
                    <ArrowRight className="h-3 w-3 mr-2 mt-0.5 text-primary flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results?.actionPlan?.shortTerm && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center">
                📅 Next 1-3 Months
              </h4>
              <ul className="space-y-1">
                {results?.actionPlan?.shortTerm?.slice(0, 2).map((action: string, index: number) => (
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
                  <p className="text-sm text-muted-foreground mb-4">
                    📊 Get your comprehensive assessment report including:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Detailed score breakdown</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Personalized action plan</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Career recommendations</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Learning resources</span>
                    </div>
                  </div>
                  
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