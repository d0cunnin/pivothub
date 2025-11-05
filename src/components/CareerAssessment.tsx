import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, Target, TrendingUp, Users, Heart, Wrench, Calculator, Shield, MessageCircle, GraduationCap, Lightbulb, HandHeart, Home, Download } from "lucide-react";
import { AssessmentResultsModal } from "./AssessmentResultsModal";
import { EmailResultsPrompt } from "./EmailResultsPrompt";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeAIContent } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface CareerArea {
  id: string;
  title: string;
  statements: string[];
  icon: React.ReactNode;
}

const careerAreas: CareerArea[] = [
  {
    id: "healthcare",
    title: "Health Care Careers",
    icon: <Heart className="h-6 w-6" />,
    statements: [
      "I am interested in helping others improve their physical health.",
      "I want to work in a role supporting mental health and wellbeing.",
      "I enjoy learning about medical technologies and equipment.",
      "I would like to assist patients with daily healthcare needs.",
      "I am curious about careers in health administration or medical records.",
      "I am motivated to educate others about healthy lifestyles.",
      "I want to explore roles like pharmacy technician or medical lab assistant.",
      "I enjoy environments where quick thinking and problem-solving are needed.",
      "I am comfortable working with people from diverse backgrounds.",
      "I want a career that makes a positive impact on community health."
    ]
  },
  {
    id: "trades",
    title: "Skilled Trades and Construction",
    icon: <Wrench className="h-6 w-6" />,
    statements: [
      "I enjoy using tools to build or repair things.",
      "I am interested in learning how electrical systems work.",
      "I want to understand plumbing and water systems.",
      "I like working on projects that involve hands-on skills.",
      "I am curious about operating heavy machinery or construction equipment.",
      "I enjoy solving practical problems on job sites.",
      "I am open to training and apprenticeships in a trade field.",
      "I prefer work environments that involve physical activity.",
      "I like learning how buildings and structures are designed and built.",
      "I want a career that offers a mix of indoor and outdoor work."
    ]
  },
  {
    id: "stem",
    title: "STEM Careers",
    icon: <Calculator className="h-6 w-6" />,
    statements: [
      "I enjoy analyzing data to find patterns or solutions.",
      "I am interested in designing or building new technologies.",
      "I want to learn programming and computer coding skills.",
      "I like solving math problems and logical puzzles.",
      "I am curious about how scientific discoveries affect everyday life.",
      "I enjoy experimenting and conducting research.",
      "I want to work on projects that require attention to detail.",
      "I am motivated by careers that advance technology or science.",
      "I enjoy learning about engineering principles and their applications.",
      "I want to contribute to innovations that improve the world."
    ]
  },
  {
    id: "social-services",
    title: "Social Services",
    icon: <HandHeart className="h-6 w-6" />,
    statements: [
      "I want to support individuals facing personal or social challenges.",
      "I am interested in counseling or therapy professions.",
      "I enjoy helping families access community resources.",
      "I want to work with children, youth, or vulnerable populations.",
      "I am motivated to advocate for social justice and equity.",
      "I like listening to others and providing emotional support.",
      "I want to learn how social programs improve lives.",
      "I enjoy organizing community outreach or support groups.",
      "I am comfortable working with people from diverse backgrounds.",
      "I want a career that fosters positive social change."
    ]
  },
  {
    id: "finance",
    title: "Finance",
    icon: <TrendingUp className="h-6 w-6" />,
    statements: [
      "I am interested in managing budgets and financial plans.",
      "I want to learn about investments and wealth building.",
      "I enjoy working with numbers and financial data.",
      "I am curious about tax laws and regulations.",
      "I want to help individuals or businesses make smart financial decisions.",
      "I am motivated by careers in banking or accounting.",
      "I like analyzing financial reports and statements.",
      "I want to understand how to reduce financial risks.",
      "I enjoy learning about economic trends and markets.",
      "I want a career with clear performance metrics and goals."
    ]
  },
  {
    id: "law-safety",
    title: "Law and Public Safety",
    icon: <Shield className="h-6 w-6" />,
    statements: [
      "I am interested in learning about laws and legal systems.",
      "I want to work in law enforcement or community safety.",
      "I enjoy helping people navigate legal challenges.",
      "I am motivated by fairness and justice.",
      "I want to learn about roles like paralegal or legal assistant.",
      "I like resolving conflicts and solving problems.",
      "I want to work in environments where rules and policies matter.",
      "I enjoy teamwork in high-stakes situations.",
      "I am interested in protecting the rights of others.",
      "I want a career that serves and protects the community."
    ]
  },
  {
    id: "customer-service",
    title: "Customer Service",
    icon: <MessageCircle className="h-6 w-6" />,
    statements: [
      "I enjoy helping customers solve problems or answer questions.",
      "I like working in fast-paced environments with lots of people.",
      "I am interested in careers in retail, hospitality, or restaurants.",
      "I want to learn how to provide excellent service experiences.",
      "I enjoy teamwork and communication in customer-focused roles.",
      "I am motivated by roles that involve meeting customer needs.",
      "I like handling complaints and finding solutions.",
      "I want to develop skills in sales and client relations.",
      "I enjoy interacting with diverse customers and clients.",
      "I want a career that builds strong relationships with people."
    ]
  },
  {
    id: "education",
    title: "Education",
    icon: <GraduationCap className="h-6 w-6" />,
    statements: [
      "I want to teach or mentor students of any age.",
      "I am interested in developing educational programs or curricula.",
      "I enjoy helping others learn new skills or knowledge.",
      "I want to work in schools, colleges, or training centers.",
      "I am motivated by supporting student success and growth.",
      "I like organizing classroom activities and lessons.",
      "I want to contribute to education administration or policy.",
      "I enjoy working with diverse learners and needs.",
      "I want a career focused on lifelong learning and development.",
      "I am interested in educational technology and innovation."
    ]
  },
  {
    id: "entrepreneurship",
    title: "Entrepreneurship",
    icon: <Lightbulb className="h-6 w-6" />,
    statements: [
      "I am excited about starting and growing my own business.",
      "I want to learn how to market products or services.",
      "I enjoy solving problems creatively and independently.",
      "I am motivated by setting and achieving business goals.",
      "I want to manage finances and operations for a company.",
      "I like taking risks to pursue new opportunities.",
      "I want to develop leadership and team-building skills.",
      "I enjoy networking and building professional relationships.",
      "I want to create value for customers and communities.",
      "I am interested in innovation and adapting to market changes."
    ]
  },
  {
    id: "nonprofit",
    title: "Nonprofit and Community Work",
    icon: <Users className="h-6 w-6" />,
    statements: [
      "I want to support causes that improve social or environmental issues.",
      "I am interested in fundraising and event planning.",
      "I enjoy organizing volunteers and community programs.",
      "I want to advocate for underserved populations.",
      "I am motivated by work that creates positive community impact.",
      "I like building partnerships with local organizations.",
      "I want to develop communication and outreach skills.",
      "I enjoy working with diverse groups and cultures.",
      "I want a career focused on service and social change.",
      "I am interested in managing nonprofit operations and resources."
    ]
  },
  {
    id: "real-estate",
    title: "Real Estate",
    icon: <Home className="h-6 w-6" />,
    statements: [
      "I am interested in buying, selling, or renting properties.",
      "I want to learn about real estate markets and trends.",
      "I enjoy working with clients to find homes or commercial spaces.",
      "I am motivated by careers in property management or appraisal.",
      "I want to develop skills in negotiation and sales.",
      "I like understanding contracts and legal documents.",
      "I want to help people make important financial decisions.",
      "I enjoy working independently and managing my schedule.",
      "I want a career with flexible opportunities and income potential.",
      "I am curious about investment properties and real estate development."
    ]
  },
  {
    id: "marketing-sales",
    title: "Marketing and Sales",
    icon: <Target className="h-6 w-6" />,
    statements: [
      "I enjoy creating campaigns to promote products or services.",
      "I want to learn about digital marketing tools and platforms.",
      "I like understanding customer needs and behaviors.",
      "I am motivated by meeting sales targets and goals.",
      "I want to develop skills in branding and communications.",
      "I enjoy working in creative and fast-paced environments.",
      "I want to use data to improve marketing strategies.",
      "I like collaborating with teams to launch products.",
      "I want a career that combines creativity and analytics.",
      "I am interested in customer engagement and relationship building."
    ]
  },
  {
    id: "human-resources",
    title: "Human Resources",
    icon: <Users className="h-6 w-6" />,
    statements: [
      "I want to help recruit and hire the right people for jobs.",
      "I am interested in employee training and development.",
      "I enjoy resolving workplace conflicts and issues.",
      "I want to work on creating positive company cultures.",
      "I am motivated by supporting employee wellbeing.",
      "I like organizing HR policies and procedures.",
      "I want to learn about benefits administration and payroll.",
      "I enjoy communicating and working with diverse teams.",
      "I want a career focused on people management and leadership.",
      "I am interested in legal compliance and workplace regulations."
    ]
  }
];

interface AssessmentResults {
  [key: string]: {
    score: number;
    percentage: number;
    level: string;
  };
}

export const CareerAssessment = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentArea, setCurrentArea] = useState(0);
  const [currentStatement, setCurrentStatement] = useState(0);
  const [responses, setResponses] = useState<Record<string, number[]>>({});
  const [currentResponse, setCurrentResponse] = useState<number>(0);
  const [results, setResults] = useState<AssessmentResults>({});
  const [showResults, setShowResults] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);

  const totalQuestions = careerAreas.length * 10;
  const currentQuestionNumber = currentArea * 10 + currentStatement + 1;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  const handleResponseSelect = (value: string) => {
    setCurrentResponse(parseInt(value));
  };

  const handleNext = async () => {
    const areaId = careerAreas[currentArea].id;
    const updatedResponses = { ...responses };
    
    if (!updatedResponses[areaId]) {
      updatedResponses[areaId] = [];
    }
    updatedResponses[areaId][currentStatement] = currentResponse;
    setResponses(updatedResponses);
    setCurrentResponse(0);

    if (currentStatement < 9) {
      setCurrentStatement(prev => prev + 1);
    } else if (currentArea < careerAreas.length - 1) {
      setCurrentArea(prev => prev + 1);
      setCurrentStatement(0);
    } else {
      // Calculate results when assessment is complete
      const calculatedResults = await calculateResults();
      setResults(calculatedResults);
      setShowEmailPrompt(true);
    }
  };

  const handlePrevious = () => {
    if (currentStatement > 0) {
      setCurrentStatement(prev => prev - 1);
    } else if (currentArea > 0) {
      setCurrentArea(prev => prev - 1);
      setCurrentStatement(9);
    }
    setCurrentResponse(0);
  };

  const calculateResults = async (): Promise<AssessmentResults> => {
    try {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use this tool");
      }

      // Call the AI assessment API
      const { data, error } = await supabase.functions.invoke('career-assessment', {
        body: {
          responses: responses
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Career assessment error:', error);
        // Show toast notification to user
        import('@/hooks/use-toast').then(({ toast }) => {
          toast({
            title: "Assessment Analysis Incomplete",
            description: "We encountered an issue analyzing your results. You'll receive basic recommendations instead of the full AI analysis.",
            variant: "destructive",
          });
        });
        throw error;
      }
      
      if (data && data.analysis) {
        // Transform AI response to match existing interface
        const results: AssessmentResults = {};
        
        data.analysis.recommendations.forEach((rec: any, index: number) => {
          const areaId = `area_${index}`;
          results[areaId] = {
            score: rec.fitScore || 50,
            percentage: rec.fitScore || 50,
            level: rec.fitScore >= 80 ? "Strong interest" : rec.fitScore >= 60 ? "Moderate interest" : "Low interest"
          };
        });

        return results;
      }
    } catch (error) {
      console.error('Error getting AI career assessment:', error);
    }

    // Fallback to original calculation
    const results: AssessmentResults = {};
    
    careerAreas.forEach(area => {
      const areaResponses = responses[area.id] || [];
      const totalScore = areaResponses.reduce((sum, score) => sum + score, 0);
      const percentage = ((totalScore - 10) / 40) * 100;
      
      let level = "Low interest";
      if (percentage >= 80) level = "Strong interest";
      else if (percentage >= 60) level = "Moderate interest";
      
      results[area.id] = {
        score: totalScore,
        percentage: Math.max(0, percentage),
        level
      };
    });
    
    return results;
  };

  const resetAssessment = () => {
    setCurrentArea(0);
    setCurrentStatement(0);
    setResponses({});
    setCurrentResponse(0);
    setShowResults(false);
    setShowEmailPrompt(false);
    setIsOpen(false);
  };

  const downloadCareerAssessmentPDF = () => {
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
      addText('CAREER INTEREST ASSESSMENT RESULTS', 18, true);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 10;

      // Top Career Areas
      addText('YOUR TOP CAREER AREAS', 14, true);
      topThree.forEach(([areaId, result], index) => {
        const area = careerAreas.find(a => a.id === areaId);
        addText(`#${index + 1} ${area?.title} - ${Math.round(result.percentage)}%`, 12, true);
        addText(`Interest Level: ${result.level}`, 11);
        yPosition += 3;
      });
      yPosition += 10;

      // All Results
      addText('COMPLETE CAREER INTEREST PROFILE', 14, true);
      Object.entries(results).forEach(([areaId, result]) => {
        const area = careerAreas.find(a => a.id === areaId);
        addText(`${area?.title}: ${Math.round(result.percentage)}% (${result.level})`, 11);
      });
      yPosition += 10;

      // Next Steps
      addText('RECOMMENDED NEXT STEPS', 14, true);
      addText('1. Explore learning paths and career opportunities in your top-rated areas', 11);
      addText('2. Take the Skills Assessment to identify your current skill levels', 11);
      addText('3. Complete the Personality Assessment for a comprehensive career profile', 11);
      addText('4. Research specific job roles within your high-interest career areas', 11);

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

      doc.save(`career-assessment-results-${Date.now()}.pdf`);
      toast.success('Career assessment results exported to PDF!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const sortedResults = Object.entries(results).sort(([,a], [,b]) => b.percentage - a.percentage);
  const topThree = sortedResults.slice(0, 3);

  const currentAreaData = careerAreas[currentArea];
  const responseOptions = [
    { value: "5", label: "Strongly Agree" },
    { value: "4", label: "Agree" },
    { value: "3", label: "Neutral" },
    { value: "2", label: "Disagree" },
    { value: "1", label: "Strongly Disagree" }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="transition-elegant hover:scale-105 px-8 py-3">
          Take Free Career Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {showResults ? "Your Career Interest Results" : "Career Interest & Curiosity Assessment"}
          </DialogTitle>
        </DialogHeader>

        {showEmailPrompt ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Assessment Complete! 🎉</h3>
              <p className="text-muted-foreground mb-6">
                Would you like to receive your detailed results by email?
              </p>
            </div>
            <EmailResultsPrompt
              assessmentType="career"
              results={results}
              onEmailSent={() => {
                setShowResults(true);
                setShowEmailPrompt(false);
              }}
              onSkip={() => {
                setShowResults(true);
                setShowEmailPrompt(false);
              }}
            />
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResults(true);
                  setShowEmailPrompt(false);
                }}
              >
                View Results Now
              </Button>
            </div>
          </div>
        ) : !showResults ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestionNumber} of {totalQuestions}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                  {currentAreaData.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{currentAreaData.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Statement {currentStatement + 1} of 10
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-lg mb-4">
                  {currentAreaData.statements[currentStatement]}
                </p>
              </div>
              
              <RadioGroup value={currentResponse.toString()} onValueChange={handleResponseSelect}>
                {responseOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                    <RadioGroupItem value={option.value} id={`option-${option.value}`} />
                    <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer font-medium">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentArea === 0 && currentStatement === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={handleNext}
                disabled={currentResponse === 0}
                className="px-8"
              >
                {currentArea === careerAreas.length - 1 && currentStatement === 9 ? "Get Results" : "Next"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Assessment Complete!</h3>
              <p className="text-muted-foreground">
                Here are your personalized career interest results based on your responses:
              </p>
            </div>

            <div className="flex justify-end mb-4">
              <Button onClick={downloadCareerAssessmentPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Your Top Career Areas</h4>
              {topThree.map(([areaId, result], index) => {
                const area = careerAreas.find(a => a.id === areaId);
                return (
                  <Card key={areaId} className="p-4 bg-gradient-card border border-white/10">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                        {area?.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-semibold text-lg">{area?.title}</h5>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{Math.round(result.percentage)}%</div>
                            <div className="text-sm text-muted-foreground">{result.level}</div>
                          </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-4 bg-blue-50 border border-blue-200">
              <h5 className="font-semibold text-blue-900 mb-2">Next Steps</h5>
              <p className="text-blue-800 text-sm">
                Consider exploring learning paths and career opportunities in your top-rated areas. 
                These results suggest where your interests align most strongly with different career paths.
              </p>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={resetAssessment}>
                Retake Assessment
              </Button>
              <Button onClick={() => setIsOpen(false)} className="px-8">
                Explore Learning Paths
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      
      <AssessmentResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        assessmentType="career"
        results={results}
      />
    </Dialog>
  );
};