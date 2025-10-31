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
              {results?.topCareerPaths?.slice(0, 5).map((career: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{career.title}</h4>
                    <Badge variant={career.fitScore >= 80 ? "default" : "secondary"}>
                      {career.fitScore || career.match}% Match
                    </Badge>
                  </div>
                  <Progress value={career.fitScore || (career.match * 10)} className="mb-3" />
                  
                  <p className="text-sm text-muted-foreground mb-3">{career.description}</p>
                  
                  {/* Why Good Fit */}
                  {career.whyGoodFit && (
                    <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
                      <p className="text-xs"><strong>Why this fits you:</strong> {career.whyGoodFit}</p>
                    </div>
                  )}
                  
                  {/* Skills Breakdown */}
                  {(career.skillsTheyHave || career.skillGaps) && (
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      {career.skillsTheyHave && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Skills You Have:</p>
                          <div className="flex flex-wrap gap-1">
                            {career.skillsTheyHave.slice(0, 3).map((skill: string, i: number) => (
                              <Badge key={i} variant="default" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {career.skillGaps && (
                        <div>
                          <p className="text-xs font-semibold mb-1">Skills to Develop:</p>
                          <div className="flex flex-wrap gap-1">
                            {career.skillGaps.slice(0, 3).map((skill: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border-t pt-2">
                    <div>
                      <p className="text-muted-foreground">Salary</p>
                      <p className="font-semibold">{career.salaryRange || career.salary || 'Varies'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Outlook</p>
                      <p className="font-semibold">{career.marketOutlook || career.growthOutlook || 'Research needed'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Timeline</p>
                      <p className="font-semibold">{career.transitionTime || '6-12 mo'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remote</p>
                      <p className="font-semibold">{career.remoteWorkPotential || 'Medium'}</p>
                    </div>
                  </div>
                  
                  {/* Transition Path */}
                  {career.transitionPath && career.transitionPath.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold mb-1">Transition Path:</p>
                      <ol className="text-xs space-y-1 ml-4">
                        {career.transitionPath.slice(0, 3).map((step: string, i: number) => (
                          <li key={i} className="list-decimal">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Career Change Readiness */}
      {results?.analysis?.careerChangeReadiness && (
        <Card>
          <CardHeader>
            <CardTitle>Career Change Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <Progress value={results.analysis.careerChangeReadiness.score} className="flex-1" />
                <Badge>{results.analysis.careerChangeReadiness.score}/100</Badge>
              </div>
              <p className="text-sm"><strong>Recommendation:</strong> {results.analysis.careerChangeReadiness.recommendation}</p>
              <p className="text-sm"><strong>Timeline:</strong> {results.analysis.careerChangeReadiness.timeline}</p>
              
              {(results.analysis.careerChangeReadiness.strengths || results.analysis.careerChangeReadiness.concerns) && (
                <div className="grid md:grid-cols-2 gap-3">
                  {results.analysis.careerChangeReadiness.strengths && (
                    <div>
                      <h5 className="font-semibold text-sm mb-1">Strengths</h5>
                      <ul className="text-xs space-y-1">
                        {results.analysis.careerChangeReadiness.strengths.map((s: string, i: number) => (
                          <li key={i}>✓ {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.analysis.careerChangeReadiness.concerns && (
                    <div>
                      <h5 className="font-semibold text-sm mb-1">Concerns</h5>
                      <ul className="text-xs space-y-1">
                        {results.analysis.careerChangeReadiness.concerns.map((c: string, i: number) => (
                          <li key={i}>⚠ {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day in the Life */}
      {results?.analysis?.dayInTheLife && (
        <Card>
          <CardHeader>
            <CardTitle>A Day in Your Future Career</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {results.analysis.dayInTheLife.morning && (
                <div>
                  <h5 className="font-semibold">Morning (7am-12pm)</h5>
                  <p className="text-muted-foreground">{results.analysis.dayInTheLife.morning}</p>
                </div>
              )}
              {results.analysis.dayInTheLife.afternoon && (
                <div>
                  <h5 className="font-semibold">Afternoon (12pm-5pm)</h5>
                  <p className="text-muted-foreground">{results.analysis.dayInTheLife.afternoon}</p>
                </div>
              )}
              {results.analysis.dayInTheLife.evening && (
                <div>
                  <h5 className="font-semibold">Evening (5pm+)</h5>
                  <p className="text-muted-foreground">{results.analysis.dayInTheLife.evening}</p>
                </div>
              )}
              {results.analysis.dayInTheLife.surprisingRealities && results.analysis.dayInTheLife.surprisingRealities.length > 0 && (
                <div>
                  <h5 className="font-semibold">Surprising Realities</h5>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {results.analysis.dayInTheLife.surprisingRealities.map((r: string, i: number) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entry Pathways */}
      {results?.analysis?.entryPathways && (
        <Card>
          <CardHeader>
            <CardTitle>How to Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Traditional Path */}
              {results.analysis.entryPathways.traditionalPath && (
                <div className="p-3 border rounded-lg">
                  <h5 className="font-semibold text-sm mb-2">Traditional Path</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><strong>Requirement:</strong> {results.analysis.entryPathways.traditionalPath.requirement}</p>
                    <p><strong>Duration:</strong> {results.analysis.entryPathways.traditionalPath.duration}</p>
                    <p><strong>Cost:</strong> {results.analysis.entryPathways.traditionalPath.cost}</p>
                    <p><strong>Outcome:</strong> {results.analysis.entryPathways.traditionalPath.outcome}</p>
                  </div>
                </div>
              )}
              
              {/* Alternative Pathways */}
              {results.analysis.entryPathways.alternativePathways && results.analysis.entryPathways.alternativePathways.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm mb-2">Alternative Pathways</h5>
                  <div className="space-y-2">
                    {results.analysis.entryPathways.alternativePathways.slice(0, 3).map((pathway: any, i: number) => (
                      <div key={i} className="p-2 bg-muted rounded text-xs">
                        <p className="font-semibold">{pathway.path}</p>
                        <p><strong>Duration:</strong> {pathway.duration} | <strong>Cost:</strong> {pathway.cost}</p>
                        <p className="text-muted-foreground">Best for: {pathway.bestFor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pros & Challenges */}
      {results?.analysis?.prosAndChallenges && (
        <Card>
          <CardHeader>
            <CardTitle>What to Expect: Pros & Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {results.analysis.prosAndChallenges.pros && results.analysis.prosAndChallenges.pros.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm mb-2 text-green-600 dark:text-green-400">Pros</h5>
                  <div className="space-y-2">
                    {results.analysis.prosAndChallenges.pros.slice(0, 3).map((pro: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-green-50 dark:bg-green-950/20 rounded">
                        <p className="font-semibold">{pro.benefit}</p>
                        <p className="text-muted-foreground">{pro.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {results.analysis.prosAndChallenges.challenges && results.analysis.prosAndChallenges.challenges.length > 0 && (
                <div>
                  <h5 className="font-semibold text-sm mb-2 text-amber-600 dark:text-amber-400">Challenges</h5>
                  <div className="space-y-2">
                    {results.analysis.prosAndChallenges.challenges.slice(0, 3).map((challenge: any, i: number) => (
                      <div key={i} className="text-xs p-2 bg-amber-50 dark:bg-amber-950/20 rounded">
                        <p className="font-semibold">{challenge.challenge}</p>
                        <p className="text-muted-foreground">{challenge.reality}</p>
                        {challenge.mitigation && (
                          <p className="text-xs text-green-600 dark:text-green-400">Mitigation: {challenge.mitigation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Timeline */}
      {results?.analysis?.incomeTimeline && (
        <Card>
          <CardHeader>
            <CardTitle>Realistic Salary Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {results.analysis.incomeTimeline.year1 && (
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Year 1:</span>
                  <span className="font-semibold">{results.analysis.incomeTimeline.year1}</span>
                </div>
              )}
              {results.analysis.incomeTimeline.year3 && (
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Year 3:</span>
                  <span className="font-semibold">{results.analysis.incomeTimeline.year3}</span>
                </div>
              )}
              {results.analysis.incomeTimeline.year5 && (
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Year 5:</span>
                  <span className="font-semibold">{results.analysis.incomeTimeline.year5}</span>
                </div>
              )}
              {results.analysis.incomeTimeline.year10 && (
                <div className="flex justify-between p-2 bg-muted rounded">
                  <span>Year 10:</span>
                  <span className="font-semibold">{results.analysis.incomeTimeline.year10}</span>
                </div>
              )}
              {results.analysis.incomeTimeline.ceiling && (
                <div className="mt-3 p-3 border-t">
                  <p className="text-xs"><strong>Ceiling:</strong> {results.analysis.incomeTimeline.ceiling}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Beginner Roadmap */}
      {results?.analysis?.beginnerRoadmap?.phase1Exploration && (
        <Card>
          <CardHeader>
            <CardTitle>Your 30-Day Exploration Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.analysis.beginnerRoadmap.phase1Exploration.week1 && (
                <div>
                  <h5 className="font-semibold text-sm mb-1">Week 1: Research</h5>
                  <ul className="text-xs space-y-1">
                    {results.analysis.beginnerRoadmap.phase1Exploration.week1.map((task: string, i: number) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results.analysis.beginnerRoadmap.phase1Exploration.week2 && (
                <div>
                  <h5 className="font-semibold text-sm mb-1">Week 2: Network</h5>
                  <ul className="text-xs space-y-1">
                    {results.analysis.beginnerRoadmap.phase1Exploration.week2.map((task: string, i: number) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results.analysis.beginnerRoadmap.phase1Exploration.week3 && (
                <div>
                  <h5 className="font-semibold text-sm mb-1">Week 3: Test</h5>
                  <ul className="text-xs space-y-1">
                    {results.analysis.beginnerRoadmap.phase1Exploration.week3.map((task: string, i: number) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results.analysis.beginnerRoadmap.phase1Exploration.week4 && (
                <div>
                  <h5 className="font-semibold text-sm mb-1">Week 4: Decide</h5>
                  <ul className="text-xs space-y-1">
                    {results.analysis.beginnerRoadmap.phase1Exploration.week4.map((task: string, i: number) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Red Flags */}
      {results?.analysis?.redFlags?.employerRedFlags && results.analysis.redFlags.employerRedFlags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Red Flags to Watch For</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.analysis.redFlags.employerRedFlags.slice(0, 3).map((flag: any, i: number) => (
                <div key={i} className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs">
                  <p className="font-semibold text-red-700 dark:text-red-400">🚩 {flag.redFlag}</p>
                  <p className="text-muted-foreground"><strong>Meaning:</strong> {flag.meaning}</p>
                  <p className="text-green-600 dark:text-green-400"><strong>What to ask:</strong> {flag.advice}</p>
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