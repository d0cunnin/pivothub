import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, ArrowLeft, ArrowRight, CheckCircle, TrendingUp, Download } from "lucide-react";
import { AssessmentResultsModal } from "./AssessmentResultsModal";
import { EmailResultsPrompt } from "./EmailResultsPrompt";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeAIContent } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from 'jspdf';

const personalityQuestions = [
  // Introversion/Extroversion (1-10)
  "I feel energized after spending time with others.",
  "I prefer quiet environments when working.",
  "I enjoy meeting new people.",
  "I like to spend time alone to think and relax.",
  "I find social events tiring.",
  "I often start conversations with strangers.",
  "I enjoy large group activities.",
  "I prefer one-on-one conversations over groups.",
  "I am comfortable speaking up in meetings.",
  "I recharge better with solitude than social interaction.",
  
  // Empathy & People Skills (11-20)
  "I easily notice when someone is upset.",
  "I enjoy helping others solve their problems.",
  "I find it hard to understand others' feelings.",
  "I feel good when making others happy.",
  "I listen carefully when people talk about their feelings.",
  "I prefer to avoid conflicts with others.",
  "I often think about how my actions affect others.",
  "I find it difficult to put myself in someone else's shoes.",
  "I like to support friends during tough times.",
  "I tend to judge people quickly.",
  
  // Leadership & Ambition (21-30)
  "I often take charge when working in a group.",
  "I set clear goals for myself.",
  "I avoid making decisions that affect others.",
  "I enjoy motivating others to do their best.",
  "I prefer to follow instructions rather than lead.",
  "I am driven to succeed in my work.",
  "I like taking responsibility for projects.",
  "I find it difficult to assert myself.",
  "I seek out opportunities for advancement.",
  "I sometimes feel uncomfortable in leadership roles.",
  
  // Creativity & Innovation (31-40)
  "I enjoy thinking about new ways to do things.",
  "I like solving problems in creative ways.",
  "I prefer routine tasks over creative ones.",
  "I often come up with original ideas.",
  "I like to experiment with new approaches at work.",
  "I feel bored when work is repetitive.",
  "I enjoy artistic activities like drawing or writing.",
  "I avoid tasks that require thinking outside the box.",
  "I like brainstorming sessions with others.",
  "I find it hard to think creatively under pressure.",
  
  // Routine & Structure Preference (41-50)
  "I prefer having a set schedule each day.",
  "I get frustrated when plans change suddenly.",
  "I like working in environments with clear rules.",
  "I enjoy variety and unpredictable tasks.",
  "I feel comfortable following step-by-step instructions.",
  "I dislike when I have to figure things out on my own.",
  "I prefer jobs where tasks stay the same.",
  "I easily adapt to changes in my work.",
  "I feel anxious when routines are disrupted.",
  "I enjoy multitasking and shifting between different activities.",
  
  // Stress Management & Temperament (51-60)
  "I remain calm when things get stressful.",
  "I get easily frustrated when things go wrong.",
  "I tend to worry about problems more than others.",
  "I handle criticism well.",
  "I sometimes feel overwhelmed by my responsibilities.",
  "I am quick to get angry.",
  "I can relax even when facing deadlines.",
  "I avoid stressful situations whenever possible.",
  "I am patient when solving difficult problems.",
  "I get discouraged easily after setbacks.",
  
  // Motivation & Drive (61-70)
  "I set personal goals and work hard to reach them.",
  "I struggle to stay motivated without external encouragement.",
  "I enjoy competition and challenging myself.",
  "I often feel unmotivated to start new tasks.",
  "I am proud when I accomplish difficult goals.",
  "I give up easily when things get hard.",
  "I find motivation in helping others succeed.",
  "I like to be recognized for my efforts.",
  "I prefer working on tasks that interest me most.",
  "I feel energized by accomplishing multiple tasks.",
  
  // Independence & Teamwork (71-80)
  "I like working alone more than in groups.",
  "I enjoy collaborating with others on projects.",
  "I prefer having control over how I do my work.",
  "I ask for help when I need it.",
  "I feel frustrated when others don't contribute equally.",
  "I like sharing ideas in team settings.",
  "I work best when given freedom to manage my tasks.",
  "I avoid group discussions when possible.",
  "I value feedback from coworkers.",
  "I prefer clear roles when working in teams.",
  
  // Optimism & Resilience (81-90)
  "I look for the positive side in difficult situations.",
  "I bounce back quickly after failures.",
  "I tend to expect the worst outcomes.",
  "I believe I can improve through effort.",
  "I get discouraged when things don't go my way.",
  "I stay hopeful about future opportunities.",
  "I find setbacks motivate me to try harder.",
  "I often feel pessimistic about change.",
  "I try to learn lessons from my mistakes.",
  "I avoid taking risks to prevent failure.",
  
  // Communication & Social Confidence (91-100)
  "I find it easy to start conversations with strangers.",
  "I enjoy public speaking.",
  "I sometimes struggle to express my ideas clearly.",
  "I am comfortable giving feedback to others.",
  "I avoid speaking up in meetings.",
  "I listen carefully to understand others' views.",
  "I feel nervous in social situations.",
  "I enjoy networking events.",
  "I prefer written communication over speaking.",
  "I often encourage others to share their opinions."
];

const traitNames = [
  "Introversion/Extroversion",
  "Empathy & People Skills", 
  "Leadership & Ambition",
  "Creativity & Innovation",
  "Routine & Structure Preference",
  "Stress Management & Temperament",
  "Motivation & Drive",
  "Independence & Teamwork",
  "Optimism & Resilience",
  "Communication & Social Confidence"
];

// Questions that should be reverse scored (disagree = higher score)
const reverseScoreQuestions = [1, 3, 4, 7, 12, 17, 19, 22, 24, 27, 29, 32, 35, 37, 39, 43, 47, 48, 49, 51, 52, 54, 57, 61, 63, 65, 70, 74, 77, 82, 84, 87, 92, 94, 96, 99];

export const PersonalityAssessment = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnswer = (value: string) => {
    const score = parseInt(value);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = score;
    setAnswers(newAnswers);
  };

  const goNext = async () => {
    if (currentQuestion < personalityQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await calculateResults();
      setShowEmailPrompt(true);
    }
  };

  const goPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = async () => {
    try {
      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      const response = await supabase.functions.invoke('enhanced-assessment-analyzer', {
        body: {
          assessmentType: 'personality',
          responses: answers,
          userProfile: {}
        },
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (response.data && !response.error) {
        // Sanitize AI content in results
        const sanitizedResults = {
          ...response.data,
          interpretation: response.data.interpretation ? sanitizeAIContent(response.data.interpretation) : response.data.interpretation,
          actionPlan: response.data.actionPlan ? sanitizeAIContent(response.data.actionPlan) : response.data.actionPlan,
          traitScores: response.data.traitScores?.map((trait: any) => ({
            ...trait,
            interpretation: trait.interpretation ? sanitizeAIContent(trait.interpretation) : trait.interpretation
          })),
          topStrengths: response.data.topStrengths?.map((strength: any) => ({
            ...strength,
            interpretation: strength.interpretation ? sanitizeAIContent(strength.interpretation) : strength.interpretation
          }))
        };
        setResults(sanitizedResults);
        return sanitizedResults;
      }
    } catch (error) {
      console.error('Error getting AI personality assessment:', error);
    }

    // Fallback to original calculation
    const traitScores = Array(10).fill(0);
    
    for (let i = 0; i < answers.length; i++) {
      const traitIndex = Math.floor(i / 10);
      const questionNumber = i + 1;
      
      let score = answers[i];
      if (reverseScoreQuestions.includes(questionNumber)) {
        score = 6 - score; // Reverse score
      }
      
      traitScores[traitIndex] += score;
    }

    const averageScores = traitScores.map(score => score / 10);
    
    const interpretedResults = averageScores.map((score, index) => ({
      trait: traitNames[index],
      score: score,
      level: score >= 4.0 ? "Strong" : score >= 3.0 ? "Moderate" : "Developing",
      interpretation: getInterpretation(index, score)
    }));

    const calculatedResults = {
      traitScores: interpretedResults,
      topStrengths: interpretedResults
        .filter(r => r.level === "Strong")
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    };
    setResults(calculatedResults);
    return calculatedResults;
    setShowResultsModal(true);
  };

  const getInterpretation = (traitIndex: number, score: number) => {
    const interpretations = [
      // Introversion/Extroversion
      {
        high: "You thrive in social, collaborative environments such as sales, customer service, or leadership roles.",
        low: "You prefer independent, focused roles like research, writing, or technical work."
      },
      // Empathy & People Skills
      {
        high: "Careers involving helping or counseling others might be a good fit, such as healthcare, education, or social work.",
        low: "Roles focusing on tasks or data might suit you better than people-focused roles."
      },
      // Leadership & Ambition
      {
        high: "You might enjoy roles with leadership or management responsibilities and career advancement opportunities.",
        low: "Supportive or specialist roles where you can excel without leading might be better suited for you."
      },
      // Creativity & Innovation
      {
        high: "Consider careers in design, marketing, or problem-solving fields that value creative thinking.",
        low: "Structured, routine jobs with clear procedures might fit you better."
      },
      // Routine & Structure Preference
      {
        high: "You might do well in jobs with predictable schedules and clear rules, such as administration or operations.",
        low: "Dynamic and flexible work environments could be more satisfying for you."
      },
      // Stress Management & Temperament
      {
        high: "You handle pressure well and can thrive in fast-paced settings like emergency services or deadline-driven roles.",
        low: "Consider lower-stress environments and roles with clear expectations and support."
      },
      // Motivation & Drive
      {
        high: "You're likely self-motivated and goal-oriented, which suits entrepreneurial or ambitious career paths.",
        low: "Roles with built-in support systems and steady routines might be better."
      },
      // Independence & Teamwork
      {
        high: "You might prefer working independently or having control over your tasks and methods.",
        low: "Collaborative and team-oriented roles could suit you better."
      },
      // Optimism & Resilience
      {
        high: "You likely bounce back from setbacks and stay positive, which helps in challenging or variable careers.",
        low: "Careers with clear procedures and support systems might suit you better."
      },
      // Communication & Social Confidence
      {
        high: "You may excel in roles requiring public speaking, networking, or persuasion such as sales or training.",
        low: "Consider roles with less social pressure or focus on written communication."
      }
    ];

    return score >= 3.0 ? interpretations[traitIndex].high : interpretations[traitIndex].low;
  };

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setShowResultsModal(false);
    setShowEmailPrompt(false);
    setResults(null);
  };

  const downloadPersonalityAssessmentPDF = () => {
    if (!results) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 72;
      const maxLineWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, maxLineWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        
        yPosition += 5;
      };

      // Title
      addText('PERSONALITY ASSESSMENT RESULTS', 18, true);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 10;

      // Top Strengths
      if (results.topStrengths && results.topStrengths.length > 0) {
        addText('YOUR TOP PERSONALITY STRENGTHS', 14, true);
        results.topStrengths.forEach((strength: any, index: number) => {
          addText(`${index + 1}. ${strength.trait} - ${strength.level} (${strength.score.toFixed(1)}/5.0)`, 12, true);
          addText(strength.interpretation, 11);
          yPosition += 3;
        });
        yPosition += 10;
      }

      // Complete Profile
      addText('COMPLETE PERSONALITY PROFILE', 14, true);
      results.traitScores?.forEach((trait: any) => {
        addText(`${trait.trait}: ${trait.score.toFixed(1)}/5.0 (${trait.level})`, 11, true);
        addText(trait.interpretation, 10);
        yPosition += 3;
      });
      yPosition += 10;

      // Next Steps
      addText('NEXT STEPS', 14, true);
      addText('1. Complete the Career Interest Assessment for a full career profile', 11);
      addText('2. Explore learning paths that match your personality and work style', 11);
      addText('3. Consider roles that align with your top personality strengths', 11);
      addText('4. Focus on developing areas marked as "Developing" for growth opportunities', 11);

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated by HireYourself Platform | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`personality-assessment-results-${Date.now()}.pdf`);
      toast.success('Personality assessment exported to PDF!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const progress = ((currentQuestion + 1) / personalityQuestions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full md:w-auto transition-elegant hover:scale-105 px-8 py-4 text-base">
          <Brain className="mr-2 h-5 w-5" />
          Take Personality Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {showEmailPrompt ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Assessment Complete! 🎉</h3>
              <p className="text-muted-foreground mb-6">
                Would you like to receive your detailed results by email?
              </p>
            </div>
            <EmailResultsPrompt
              assessmentType="personality"
              results={results}
              onEmailSent={() => {
                setShowResultsModal(true);
                setShowEmailPrompt(false);
              }}
              onSkip={() => {
                setShowResultsModal(true);
                setShowEmailPrompt(false);
              }}
            />
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResultsModal(true);
                  setShowEmailPrompt(false);
                }}
              >
                View Results Now
              </Button>
            </div>
          </div>
        ) : !showResults ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Personality Assessment</DialogTitle>
              <DialogDescription className="text-center text-lg">
                Question {currentQuestion + 1} of {personalityQuestions.length}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              <Progress value={progress} className="w-full" />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {personalityQuestions[currentQuestion]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={answers[currentQuestion]?.toString() || ""} 
                    onValueChange={handleAnswer}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id="strongly-agree" />
                      <Label htmlFor="strongly-agree">Strongly Agree</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id="agree" />
                      <Label htmlFor="agree">Agree</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id="neutral" />
                      <Label htmlFor="neutral">Neutral</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="disagree" />
                      <Label htmlFor="disagree">Disagree</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="strongly-disagree" />
                      <Label htmlFor="strongly-disagree">Strongly Disagree</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={goPrevious}
                  disabled={currentQuestion === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button 
                  onClick={goNext}
                  disabled={!answers[currentQuestion]}
                >
                  {currentQuestion === personalityQuestions.length - 1 ? "Complete Assessment" : "Next"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center">
                <CheckCircle className="mr-2 h-6 w-6 text-green-600" />
                Your Personality Profile
              </DialogTitle>
              <DialogDescription className="text-center text-lg">
                Based on your responses, here's your personality profile and career insights
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-6">
              <div className="flex justify-end mb-4">
                <Button onClick={downloadPersonalityAssessmentPDF} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>

              {results?.topStrengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Your Top Personality Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {results.topStrengths.map((strength: any, index: number) => (
                        <div key={index} className="border-l-4 border-primary pl-4">
                          <h4 className="font-semibold">{strength.trait}</h4>
                          <p className="text-sm text-muted-foreground">{strength.interpretation}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Complete Personality Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {results?.traitScores.map((trait: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{trait.trait}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            trait.level === "Strong" ? "bg-green-100 text-green-800" :
                            trait.level === "Moderate" ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {trait.level} ({trait.score.toFixed(1)}/5.0)
                          </span>
                        </div>
                        <Progress value={(trait.score / 5) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground">{trait.interpretation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p>🎯 <strong>Complete your profile:</strong> Take the Interest & Curiosity Assessment for a full career profile</p>
                    <p>📚 <strong>Explore learning paths:</strong> Use your personality insights to choose training programs that match your work style</p>
                    <p>💼 <strong>Career planning:</strong> Consider roles that align with your top personality strengths</p>
                    <p>🤝 <strong>Professional development:</strong> Focus on areas marked as "Developing" for growth opportunities</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center space-x-4">
                <Button onClick={resetAssessment} variant="outline">
                  Retake Assessment
                </Button>
                <Button onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
      
      <AssessmentResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        assessmentType="personality"
        results={results}
      />
    </Dialog>
  );
};