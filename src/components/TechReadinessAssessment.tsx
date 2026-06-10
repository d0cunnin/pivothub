import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Monitor, Clock, AlertTriangle, Download } from "lucide-react";
import { AssessmentResultsModal } from "./AssessmentResultsModal";
import { EmailResultsPrompt } from "./EmailResultsPrompt";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface TechAssessmentResults {
  techFitLevel: string;
  overallAssessment: string;
  topTechPathways: Array<{
    title: string;
    fitScore: number;
    reason: string;
    keySkills: string[];
  }>;
  strengthAreas: string[];
  improvementAreas: Array<{
    area: string;
    currentLevel: number;
    recommendation: string;
  }>;
  mathDiagnosticFlag: boolean;
  mathImprovementPlan?: string;
  recommendedCourses: Array<{
    title: string;
    reason: string;
    path: string;
  }>;
  alternateTracks?: string[];
  nextSteps: string[];
}

interface LocalScores {
  cognitive: number;
  behavioral: number;
  interest: number;
  overall: number;
  mathDiagnostic: number;
}

interface Question {
  id: number;
  type: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer?: number;
  isLikert?: boolean;
}

// Question bank with 50 diverse questions
const questionBank: Question[] = [
  // Logical Reasoning (Questions 1-10)
  { id: 1, type: 'logical', category: 'Pattern Recognition', difficulty: 'easy', question: 'What comes next in the sequence: 2, 6, 18, 54, ___?', options: ['108', '162', '216', '270'], correctAnswer: 1 },
  { id: 2, type: 'logical', category: 'Analogies', difficulty: 'easy', question: 'CPU is to Computer as Engine is to ___', options: ['Fuel', 'Car', 'Speed', 'Driver'], correctAnswer: 1 },
  { id: 3, type: 'logical', category: 'Rule Identification', difficulty: 'medium', question: 'If all tech workers use computers, and Sarah is a tech worker, what can we conclude?', options: ['Sarah uses a computer', 'Sarah is a programmer', 'Computers are expensive', 'Sarah likes technology'], correctAnswer: 0 },
  { id: 4, type: 'logical', category: 'Pattern Recognition', difficulty: 'medium', question: 'Which shape completes the pattern? Square, Circle, Triangle, Square, Circle, ___', options: ['Square', 'Circle', 'Triangle', 'Hexagon'], correctAnswer: 2 },
  
  // Math Diagnostic Question 1 (Position 5)
  { id: 5, type: 'quantitative', category: 'Math Diagnostic - Percentages', difficulty: 'medium', question: 'If a server processes 500 requests per hour and you increase capacity by 40%, how many requests per hour can it now handle?', options: ['540', '600', '700', '750'], correctAnswer: 2 },
  
  { id: 6, type: 'logical', category: 'Sequences', difficulty: 'medium', question: 'What is the missing number? 3, 9, 27, 81, ___', options: ['162', '243', '324', '405'], correctAnswer: 1 },
  { id: 7, type: 'logical', category: 'Logical Deduction', difficulty: 'hard', question: 'In binary code, what does 1010 represent in decimal?', options: ['8', '10', '12', '16'], correctAnswer: 1 },
  { id: 8, type: 'logical', category: 'Problem Logic', difficulty: 'hard', question: 'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?', options: ['5 minutes', '10 minutes', '20 minutes', '100 minutes'], correctAnswer: 0 },
  { id: 9, type: 'logical', category: 'Patterns', difficulty: 'medium', question: 'Complete the pattern: A1, B2, C3, D4, ___', options: ['E5', 'F6', 'E4', 'D5'], correctAnswer: 0 },
  { id: 10, type: 'logical', category: 'Reasoning', difficulty: 'easy', question: 'Which of these is NOT a programming language?', options: ['Python', 'Java', 'HTML', 'Excel'], correctAnswer: 3 },

  // Quantitative Reasoning (Questions 11-20)
  { id: 11, type: 'quantitative', category: 'Data Interpretation', difficulty: 'easy', question: 'If 20% of users click a link, how many clicks do you expect from 500 users?', options: ['50', '75', '100', '125'], correctAnswer: 2 },
  { id: 12, type: 'quantitative', category: 'Proportions', difficulty: 'easy', question: 'If 3 servers handle 90 requests per hour, how many requests can 5 servers handle per hour?', options: ['120', '135', '150', '180'], correctAnswer: 2 },
  { id: 13, type: 'quantitative', category: 'Math Logic', difficulty: 'medium', question: 'A project takes 10 people 8 hours. If you have 5 people, how long will it take?', options: ['4 hours', '8 hours', '16 hours', '20 hours'], correctAnswer: 2 },
  { id: 14, type: 'quantitative', category: 'Problem Solving', difficulty: 'medium', question: 'A database has 1,000 records. After deleting 15%, how many records remain?', options: ['850', '900', '950', '750'], correctAnswer: 0 },
  
  // Math Diagnostic Question 2 (Position 15)
  { id: 15, type: 'quantitative', category: 'Math Diagnostic - Algebra', difficulty: 'medium', question: 'If x + 2x + 3x = 120, what is the value of x?', options: ['15', '20', '30', '40'], correctAnswer: 1 },
  
  { id: 16, type: 'quantitative', category: 'Data Analysis', difficulty: 'hard', question: 'A system has 95% uptime. In a 30-day month, how many hours of downtime is that?', options: ['12 hours', '24 hours', '36 hours', '48 hours'], correctAnswer: 2 },
  { id: 17, type: 'quantitative', category: 'Calculations', difficulty: 'medium', question: 'If bandwidth costs $0.10 per GB and you use 250 GB, what is the cost?', options: ['$20', '$25', '$30', '$35'], correctAnswer: 1 },
  { id: 18, type: 'quantitative', category: 'Proportions', difficulty: 'easy', question: 'A website converts 2 out of every 50 visitors. What is the conversion rate?', options: ['2%', '4%', '5%', '10%'], correctAnswer: 1 },
  { id: 19, type: 'quantitative', category: 'Math Logic', difficulty: 'hard', question: 'If doubling server capacity reduces response time by 30%, and response time is currently 200ms, what is the new response time?', options: ['60ms', '100ms', '140ms', '170ms'], correctAnswer: 2 },
  { id: 20, type: 'quantitative', category: 'Data Interpretation', difficulty: 'medium', question: 'A team fixes 15 bugs per sprint. How many sprints to fix 75 bugs?', options: ['3', '4', '5', '6'], correctAnswer: 2 },

  // Problem-Solving Under Pressure (Questions 21-28)
  { id: 21, type: 'problem-solving', category: 'Prioritization', difficulty: 'medium', question: 'Your system is down and you have 3 critical issues: database error, payment gateway failure, and slow page load. Which do you fix first?', options: ['Database error - affects everything', 'Payment gateway - revenue critical', 'Slow page load - user experience', 'Investigate all simultaneously'], correctAnswer: 1 },
  { id: 22, type: 'problem-solving', category: 'Debugging Logic', difficulty: 'medium', question: 'A feature works in testing but fails in production. What is your first step?', options: ['Rewrite the code', 'Check production environment differences', 'Blame the testing team', 'Deploy again'], correctAnswer: 1 },
  { id: 23, type: 'problem-solving', category: 'Resource Allocation', difficulty: 'hard', question: 'You have 2 hours and 3 tasks: high-priority bug fix (1.5 hrs), important meeting (1 hr), urgent client email (30 min). What do you do?', options: ['Skip meeting, do bug fix and email', 'Do all three partially', 'Delegate the email, do bug fix and meeting', 'Cancel meeting, finish everything'], correctAnswer: 2 },
  { id: 24, type: 'problem-solving', category: 'Troubleshooting', difficulty: 'medium', question: 'Users report a slow application. What is the most efficient first diagnostic step?', options: ['Restart all servers', 'Check server resource usage (CPU, memory)', 'Update all software', 'Increase server size'], correctAnswer: 1 },
  
  // Math Diagnostic Question 3 (Position 25)
  { id: 25, type: 'quantitative', category: 'Math Diagnostic - Time/Rate', difficulty: 'hard', question: 'A program processes 500 records per minute. If you need to process 45,000 records, how long will it take?', options: ['1 hour', '1.5 hours', '2 hours', '2.5 hours'], correctAnswer: 1 },
  
  { id: 26, type: 'problem-solving', category: 'Decision Making', difficulty: 'hard', question: 'A security vulnerability is discovered. You can patch it (4 hours) or rebuild the system (2 days). Attackers might exploit it within 24 hours. What do you do?', options: ['Patch immediately', 'Rebuild completely', 'Monitor and wait', 'Shut down system until rebuilt'], correctAnswer: 0 },
  { id: 27, type: 'problem-solving', category: 'Critical Thinking', difficulty: 'medium', question: 'Your team is stuck on a technical problem for 2 days. What is the best approach?', options: ['Keep trying the same solution', 'Ask for help from another team', 'Abandon the project', 'Work overtime until solved'], correctAnswer: 1 },
  { id: 28, type: 'problem-solving', category: 'Analysis', difficulty: 'easy', question: 'When troubleshooting, which method is most effective?', options: ['Change everything at once', 'Change one variable at a time', 'Guess randomly', 'Ask others to fix it'], correctAnswer: 1 },

  // Spatial & Systems Thinking (Questions 29-35)
  { id: 29, type: 'spatial', category: 'Network Logic', difficulty: 'easy', question: 'In a network diagram, if Router A connects to Router B, and Router B connects to Router C, how many hops from A to C?', options: ['1', '2', '3', '4'], correctAnswer: 1 },
  { id: 30, type: 'spatial', category: 'System Flow', difficulty: 'medium', question: 'In a flowchart: START → Input → Process → Decision → Output → END. What happens if Decision = NO?', options: ['Go to END', 'Go back to Process', 'Go to Input', 'Depends on the diagram'], correctAnswer: 3 },
  { id: 31, type: 'spatial', category: 'Component Relationships', difficulty: 'medium', question: 'Which component must come first in a web application: Database, Web Server, User Interface, or Load Balancer?', options: ['Database', 'Web Server', 'User Interface', 'Load Balancer'], correctAnswer: 0 },
  { id: 32, type: 'spatial', category: 'Architecture', difficulty: 'hard', question: 'A system has 3 layers: Presentation, Business Logic, Data. If the Data layer fails, what happens?', options: ['Only data access fails', 'Entire system fails', 'Only Business Logic fails', 'Only Presentation fails'], correctAnswer: 1 },
  { id: 33, type: 'spatial', category: 'Systems Thinking', difficulty: 'medium', question: 'In a client-server model, where does the processing happen?', options: ['Only on client', 'Only on server', 'Can be on either or both', 'Always split 50/50'], correctAnswer: 2 },
  { id: 34, type: 'spatial', category: 'Logic Paths', difficulty: 'easy', question: 'A process has 3 steps: A → B → C. If B is removed, what is the new flow?', options: ['A → C', 'A → B → C', 'Process fails', 'A only'], correctAnswer: 0 },
  
  // Math Diagnostic Question 4 (Position 35)
  { id: 35, type: 'quantitative', category: 'Math Diagnostic - Combinatorics', difficulty: 'hard', question: 'A password must have 4 digits. How many possible combinations are there (digits 0-9, no repeats)?', options: ['5,040', '10,000', '1,024', '9,999'], correctAnswer: 0 },

  // Situational Judgment - Behavioral (Questions 36-43, Likert 1-5)
  { id: 36, type: 'behavioral', category: 'Adaptability', difficulty: 'easy', question: 'When project requirements change suddenly, I:', options: ['Feel frustrated and resist', 'Need time to adjust', 'Adapt relatively quickly', 'Embrace change immediately', 'Thrive on unexpected changes'], isLikert: true },
  { id: 37, type: 'behavioral', category: 'Persistence', difficulty: 'easy', question: 'When stuck on a technical problem for hours, I:', options: ['Give up quickly', 'Try a few times then stop', 'Keep trying different approaches', 'Persist until solved', 'See it as an exciting challenge'], isLikert: true },
  { id: 38, type: 'behavioral', category: 'Frustration Tolerance', difficulty: 'easy', question: 'When technology does not work as expected, I:', options: ['Get very frustrated', 'Feel somewhat annoyed', 'Stay calm and troubleshoot', 'Remain completely patient', 'Find it stimulating'], isLikert: true },
  { id: 39, type: 'behavioral', category: 'Learning from Failure', difficulty: 'easy', question: 'After making a mistake in my work, I:', options: ['Feel defeated', 'Dwell on it briefly', 'Learn from it and move on', 'Analyze it thoroughly', 'See it as valuable feedback'], isLikert: true },
  { id: 40, type: 'behavioral', category: 'Stress Management', difficulty: 'easy', question: 'When facing tight deadlines with multiple tasks, I:', options: ['Feel overwhelmed', 'Struggle to prioritize', 'Manage reasonably well', 'Perform well under pressure', 'Excel in high-pressure situations'], isLikert: true },
  { id: 41, type: 'behavioral', category: 'Detail Orientation', difficulty: 'easy', question: 'When reviewing work for errors, I:', options: ['Often miss details', 'Sometimes catch mistakes', 'Usually find most errors', 'Consistently catch all errors', 'Notice patterns others miss'], isLikert: true },
  { id: 42, type: 'behavioral', category: 'Collaboration', difficulty: 'easy', question: 'When working on team technical projects, I:', options: ['Prefer working alone', 'Collaborate when necessary', 'Enjoy team collaboration', 'Thrive in team settings', 'Lead collaborative efforts'], isLikert: true },
  { id: 43, type: 'behavioral', category: 'Initiative', difficulty: 'easy', question: 'When I see a problem or opportunity, I:', options: ['Wait for instructions', 'Mention it to someone', 'Take some initiative', 'Proactively address it', 'Drive solutions independently'], isLikert: true },

  // Interest Alignment (Questions 44-50, Likert 1-5)
  { id: 44, type: 'interest', category: 'Tech Curiosity', difficulty: 'easy', question: 'I enjoy learning how technology works:', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], isLikert: true },
  
  // Math Diagnostic Question 5 (Position 45)
  { id: 45, type: 'quantitative', category: 'Math Diagnostic - Exponentials', difficulty: 'hard', question: 'A system doubles its data every year. If it starts with 100GB, how much data after 4 years?', options: ['400GB', '800GB', '1,600GB', '2,000GB'], correctAnswer: 2 },
  
  { id: 46, type: 'interest', category: 'Hands-On vs Abstract', difficulty: 'easy', question: 'I prefer building things over just planning them:', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], isLikert: true },
  { id: 47, type: 'interest', category: 'Problem-Solving Interest', difficulty: 'easy', question: 'I like troubleshooting and fixing technical issues:', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], isLikert: true },
  { id: 48, type: 'interest', category: 'Continuous Learning', difficulty: 'easy', question: 'I am excited about learning new software and tools:', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], isLikert: true },
  { id: 49, type: 'interest', category: 'Logical Thinking', difficulty: 'easy', question: 'I enjoy solving puzzles and logical challenges:', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], isLikert: true },
  { id: 50, type: 'interest', category: 'Tech Career Interest', difficulty: 'easy', question: 'I see myself building a career in technology:', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], isLikert: true },
];

export const TechReadinessAssessment = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(6000); // 100 minutes in seconds
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(50).fill(-1));
  const [currentAnswer, setCurrentAnswer] = useState<number>(-1);
  const [showResults, setShowResults] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [results, setResults] = useState<TechAssessmentResults | null>(null);
  const [localScores, setLocalScores] = useState<LocalScores | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [assessmentStartTime, setAssessmentStartTime] = useState<string>("");
  const [sessionId] = useState<string>(() => `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [questionDifficulty, setQuestionDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Timer effect
  useEffect(() => {
    if (isOpen && !showResults && !showEmailPrompt && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOpen, showResults, showEmailPrompt, timeRemaining]);

  // Warning at 5 minutes
  useEffect(() => {
    if (timeRemaining === 300) {
      toast({
        title: "⏰ 5 Minutes Remaining",
        description: "Your assessment will auto-submit in 5 minutes.",
        variant: "destructive",
      });
    }
  }, [timeRemaining]);

  // Start assessment
  const handleStartAssessment = () => {
    setAssessmentStartTime(new Date().toISOString());
    setIsOpen(true);
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (value: string) => {
    setCurrentAnswer(parseInt(value));
  };

  const handleNext = () => {
    if (currentAnswer === -1) {
      toast({
        title: "Answer Required",
        description: "Please select an answer before proceeding.",
        variant: "destructive",
      });
      return;
    }

    const updatedAnswers = [...answers];
    updatedAnswers[currentQuestion] = currentAnswer;
    setAnswers(updatedAnswers);
    setCurrentAnswer(-1);

    // Adaptive difficulty adjustment every 10 questions
    if ((currentQuestion + 1) % 10 === 0 && currentQuestion < 27) {
      adjustDifficulty(updatedAnswers.slice(currentQuestion - 9, currentQuestion + 1));
    }

    if (currentQuestion < 49) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit(updatedAnswers);
    }
  };

  const adjustDifficulty = (last10Answers: number[]) => {
    const correctCount = last10Answers.filter((ans, idx) => {
      const questionId = currentQuestion - 9 + idx;
      const question = questionBank[questionId];
      return !question.isLikert && ans === question.correctAnswer;
    }).length;

    const percentCorrect = (correctCount / 10) * 100;

    if (percentCorrect >= 80) {
      setQuestionDifficulty('hard');
    } else if (percentCorrect < 40) {
      setQuestionDifficulty('easy');
    }
    // else stay at current difficulty
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setCurrentAnswer(answers[currentQuestion - 1]);
    }
  };

  const handleAutoSubmit = () => {
    toast({
      title: "Time Expired",
      description: "Your assessment has been automatically submitted.",
      variant: "default",
    });
    handleSubmit(answers);
  };

  const calculateLocalScores = (finalAnswers: number[]): LocalScores => {
    // Math diagnostic: questions at positions 4, 14, 24, 34, 44 (indices)
    const mathQuestions = [4, 14, 24, 34, 44];
    const mathCorrect = mathQuestions.filter(idx => {
      const question = questionBank[idx];
      return finalAnswers[idx] === question.correctAnswer;
    }).length;

    // Cognitive: Logical (0-9) + Quantitative (10-19) + Problem-Solving (20-27) = 28 questions
    const cognitiveQuestions = questionBank.slice(0, 28).filter(q => !q.isLikert);
    const cognitiveCorrect = cognitiveQuestions.filter((q, idx) => 
      finalAnswers[idx] === q.correctAnswer
    ).length;
    const cognitiveScore = (cognitiveCorrect / 28) * 100;

    // Behavioral: Situational judgment (35-42) - Likert scale 1-5
    const behavioralAnswers = finalAnswers.slice(35, 43).filter(ans => ans > 0);
    const behavioralAvg = behavioralAnswers.length > 0 
      ? behavioralAnswers.reduce((sum, ans) => sum + ans, 0) / behavioralAnswers.length
      : 3;
    const behavioralScore = ((behavioralAvg - 1) / 4) * 100;

    // Interest: Questions 43-49 (indices) - Likert scale 1-5
    const interestAnswers = finalAnswers.slice(43, 50).filter(ans => ans > 0);
    const interestAvg = interestAnswers.length > 0
      ? interestAnswers.reduce((sum, ans) => sum + ans, 0) / interestAnswers.length
      : 3;
    const interestScore = ((interestAvg - 1) / 4) * 100;

    // Overall: 40% Cognitive, 30% Behavioral, 30% Interest
    const overallScore = (cognitiveScore * 0.4) + (behavioralScore * 0.3) + (interestScore * 0.3);

    return {
      cognitive: Math.round(cognitiveScore),
      behavioral: Math.round(behavioralScore),
      interest: Math.round(interestScore),
      overall: Math.round(overallScore),
      mathDiagnostic: mathCorrect
    };
  };

  const handleSubmit = async (finalAnswers: number[]) => {
    const timeElapsed = 6000 - timeRemaining;

    // Calculate local scores immediately
    const scores = calculateLocalScores(finalAnswers);
    setLocalScores(scores);
    setShowEmailPrompt(true);

    // Generate detailed report with GPT-5
    setIsGeneratingReport(true);
    try {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use this tool");
      }

      const { data, error } = await invokeFunction('tech-readiness-assessment', {
        body: {
          localScores: scores,
          answersBreakdown: {
            logicalReasoningCorrect: finalAnswers.slice(0, 10).filter((ans, idx) => ans === questionBank[idx].correctAnswer).length,
            quantitativeCorrect: finalAnswers.slice(10, 20).filter((ans, idx) => ans === questionBank[idx + 10].correctAnswer).length,
            problemSolvingCorrect: finalAnswers.slice(20, 28).filter((ans, idx) => ans === questionBank[idx + 20].correctAnswer).length,
            spatialThinkingCorrect: finalAnswers.slice(28, 35).filter((ans, idx) => ans === questionBank[idx + 28].correctAnswer).length,
            mathDiagnosticCorrect: scores.mathDiagnostic,
            adaptabilityScore: finalAnswers[35] || 3,
            persistenceScore: finalAnswers[36] || 3,
            frustrationToleranceScore: finalAnswers[37] || 3,
            learningFromFailureScore: finalAnswers[38] || 3,
            stressManagementScore: finalAnswers[39] || 3,
            detailOrientationScore: finalAnswers[40] || 3,
            collaborationScore: finalAnswers[41] || 3,
            initiativeScore: finalAnswers[42] || 3,
            techCuriosityScore: finalAnswers[43] || 3,
            handsOnPreference: finalAnswers[45] || 3,
            problemSolvingInterest: finalAnswers[46] || 3,
            continuousLearningScore: finalAnswers[47] || 3,
            logicalThinkingInterest: finalAnswers[48] || 3,
            techCareerInterest: finalAnswers[49] || 3,
          },
          sessionId,
          assessmentStartTime,
          timeElapsed
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw error;
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.analysis) throw new Error('No analysis was returned. Please try again.');

      setResults(data.analysis);
      setIsGeneratingReport(false);
      
      toast({
        title: "Report Generated! ✅",
        description: "Your personalized tech readiness report is ready.",
      });
    } catch (error: any) {
      console.error('Error generating tech readiness report:', error);
      setIsGeneratingReport(false);
      
      toast({
        title: "Report Generation Error",
        description: error.message || "We encountered an issue generating your personalized report. You can still view your scores.",
        variant: "destructive",
      });
    }
  };

  const downloadTechReadinessPDF = () => {
    if (!results || !localScores) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Cover Page
    doc.setFillColor(79, 70, 229); // Primary color
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Tech Readiness Assessment Report', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 45, { align: 'center' });

    // Warning in RED
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠️ This file is not stored. Please download to save a copy.', pageWidth / 2, 80, { align: 'center', maxWidth: 170 });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    // Page 2 - Score Breakdown
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Tech Compatibility Score Breakdown', 20, 20);

    autoTable(doc, {
      startY: 30,
      head: [['Metric', 'Score', 'Assessment']],
      body: [
        ['Overall Tech Compatibility', `${localScores.overall}/100`, results.techFitLevel === 'strong' ? 'Strong Fit' : results.techFitLevel === 'moderate' ? 'Moderate Fit' : 'Needs Preparation'],
        ['Cognitive Readiness', `${localScores.cognitive}/100`, localScores.cognitive >= 75 ? 'Strong' : localScores.cognitive >= 60 ? 'Good' : 'Needs Work'],
        ['Behavioral Readiness', `${localScores.behavioral}/100`, localScores.behavioral >= 75 ? 'Strong' : localScores.behavioral >= 60 ? 'Good' : 'Needs Work'],
        ['Interest Alignment', `${localScores.interest}/100`, localScores.interest >= 75 ? 'High' : localScores.interest >= 60 ? 'Moderate' : 'Low'],
        ['Math for Tech Diagnostic', `${localScores.mathDiagnostic}/5`, localScores.mathDiagnostic >= 3 ? 'Proficient' : 'Needs Practice'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
    });

    // Interpretation Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const interpretationY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Interpretation Summary', 20, interpretationY);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const summaryText = doc.splitTextToSize(results.overallAssessment, 170);
    doc.text(summaryText, 20, interpretationY + 10);

    // Page 3 - Tech Pathways
    doc.addPage();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended Tech Pathways', 20, 20);

    results.topTechPathways.forEach((pathway, idx) => {
      const yPos = 35 + (idx * 45);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${pathway.title} (${pathway.fitScore}% fit)`, 20, yPos);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const reasonText = doc.splitTextToSize(`Reason: ${pathway.reason}`, 170);
      doc.text(reasonText, 20, yPos + 7);
      
      doc.text(`Key Skills: ${pathway.keySkills.join(', ')}`, 20, yPos + 18);
    });

    // Improvement Areas
    const improvementY = 35 + (results.topTechPathways.length * 45) + 10;
    if (improvementY < pageHeight - 40) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Areas for Improvement', 20, improvementY);

      results.improvementAreas.forEach((area, idx) => {
        const yPos = improvementY + 10 + (idx * 20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${area.area} (Current: ${area.currentLevel}/100)`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        const recText = doc.splitTextToSize(area.recommendation, 165);
        doc.text(recText, 25, yPos + 5);
      });
    } else {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Areas for Improvement', 20, 20);

      results.improvementAreas.forEach((area, idx) => {
        const yPos = 30 + (idx * 20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${area.area} (Current: ${area.currentLevel}/100)`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        const recText = doc.splitTextToSize(area.recommendation, 165);
        doc.text(recText, 25, yPos + 5);
      });
    }

    // Math Diagnostic Flag (if applicable)
    if (results.mathDiagnosticFlag && results.mathImprovementPlan) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('⚠️ Math Skills Need Practice', 20, 20);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const mathPlanText = doc.splitTextToSize(results.mathImprovementPlan, 170);
      doc.text(mathPlanText, 20, 35);
    }

    // Recommended Courses
    doc.addPage();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommended PivotHub Courses', 20, 20);

    results.recommendedCourses.forEach((course, idx) => {
      const yPos = 35 + (idx * 25);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`• ${course.title}`, 25, yPos);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const courseText = doc.splitTextToSize(course.reason, 165);
      doc.text(courseText, 25, yPos + 6);
    });

    // Next Steps
    const nextStepsY = 35 + (results.recommendedCourses.length * 25) + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Next Steps', 20, nextStepsY);

    results.nextSteps.forEach((step, idx) => {
      const yPos = nextStepsY + 10 + (idx * 12);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`${idx + 1}. ${step}`, 25, yPos);
    });

    // Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Generated by PivotHub Tech Readiness Assessment', pageWidth / 2, pageHeight - 15, { align: 'center' });
      doc.setTextColor(220, 38, 38);
      doc.text('⚠️ This file is not stored on our servers. Save this copy for your records.', pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`Tech-Readiness-Assessment-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Downloaded",
      description: "Your Tech Readiness Assessment report has been saved.",
    });
  };

  const resetAssessment = () => {
    setIsOpen(false);
    setTimeRemaining(6000);
    setCurrentQuestion(0);
    setAnswers(Array(50).fill(-1));
    setCurrentAnswer(-1);
    setShowResults(false);
    setShowEmailPrompt(false);
    setShowResultsModal(false);
    setResults(null);
    setLocalScores(null);
    setIsGeneratingReport(false);
    setQuestionDifficulty('medium');
  };

  const progress = ((currentQuestion + 1) / 50) * 100;
  const currentQuestionData = questionBank[currentQuestion];
  const timeColor = timeRemaining < 600 ? 'text-destructive' : 'text-foreground';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetAssessment();
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="lg" 
          className="transition-elegant hover:scale-105 px-8 py-3"
          onClick={handleStartAssessment}
        >
          Take Tech Readiness Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Monitor className="h-6 w-6" />
            {showResults ? "Your Tech Readiness Results" : "Tech Readiness Assessment"}
          </DialogTitle>
        </DialogHeader>

        {showEmailPrompt ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Assessment Complete! 🎉</h3>
              {localScores && (
                <div className="bg-gradient-card p-6 rounded-xl mb-4">
                  <p className="text-3xl font-bold text-primary mb-2">
                    Tech Compatibility Score: {localScores.overall}/100
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Cognitive</p>
                      <p className="font-semibold">{localScores.cognitive}/100</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Behavioral</p>
                      <p className="font-semibold">{localScores.behavioral}/100</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Interest</p>
                      <p className="font-semibold">{localScores.interest}/100</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Math Diagnostic</p>
                      <p className="font-semibold">{localScores.mathDiagnostic}/5</p>
                    </div>
                  </div>
                </div>
              )}
              {isGeneratingReport && (
                <p className="text-muted-foreground mb-4 animate-pulse">
                  ⏳ Generating your personalized report with GPT-5...
                </p>
              )}
              {!isGeneratingReport && results && (
                <p className="text-muted-foreground mb-4">
                  Would you like to receive your detailed results by email?
                </p>
              )}
            </div>
            {!isGeneratingReport && results && (
              <>
                <EmailResultsPrompt
                  assessmentType="tech-readiness"
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
                <div className="text-center flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResults(true);
                      setShowEmailPrompt(false);
                    }}
                  >
                    View Results Now
                  </Button>
                  <Button
                    variant="default"
                    onClick={downloadTechReadinessPDF}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF Report
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : showResults && results ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Your Tech Readiness Analysis</h3>
              <div className="prose max-w-none">
                <p className="text-muted-foreground">{results.overallAssessment}</p>
                
                <h4 className="font-semibold mt-4">Top Tech Pathways:</h4>
                <ul>
                  {results.topTechPathways.map((pathway: any, idx: number) => (
                    <li key={idx}><strong>{pathway.title}</strong> ({pathway.fitScore}% fit): {pathway.reason}</li>
                  ))}
                </ul>

                <h4 className="font-semibold mt-4">Next Steps:</h4>
                <ol>
                  {results.nextSteps.map((step: string, idx: number) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={downloadTechReadinessPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF Report
              </Button>
              <Button variant="outline" onClick={resetAssessment}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timer and Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className={`h-5 w-5 ${timeColor}`} />
                  <span className={`text-lg font-semibold ${timeColor}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of 50
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              {timeRemaining < 600 && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Less than 10 minutes remaining!</span>
                </div>
              )}
            </div>

            {/* Question */}
            <Card className="p-6">
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {currentQuestionData.category} • {currentQuestionData.type.charAt(0).toUpperCase() + currentQuestionData.type.slice(1)}
                </p>
                <h3 className="text-lg font-semibold mb-4">
                  {currentQuestionData.question}
                </h3>
              </div>

              <RadioGroup 
                value={currentAnswer.toString()} 
                onValueChange={handleAnswerSelect}
              >
                <div className="space-y-3">
                  {currentQuestionData.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer text-sm"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                variant="default"
                onClick={handleNext}
                disabled={currentAnswer === -1}
              >
                {currentQuestion === 49 ? 'Submit Assessment' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
