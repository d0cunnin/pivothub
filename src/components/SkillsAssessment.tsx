import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, Calculator, BookOpen, Monitor, ClipboardList, Search, Users, Wrench } from "lucide-react";

interface SkillQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface SkillCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  questions: SkillQuestion[];
}

const skillCategories: SkillCategory[] = [
  {
    id: "basic-math",
    name: "Basic Math",
    icon: <Calculator className="h-5 w-5" />,
    questions: [
      {
        id: "math-1",
        question: "What is 25% of 80?",
        options: ["A. 10", "B. 20", "C. 25", "D. 30"],
        correctAnswer: "B"
      },
      {
        id: "math-2",
        question: "Which number is a multiple of both 3 and 5?",
        options: ["A. 10", "B. 12", "C. 15", "D. 18"],
        correctAnswer: "C"
      },
      {
        id: "math-3",
        question: "Solve: 9 + 6 ÷ 3",
        options: ["A. 5", "B. 11", "C. 15", "D. 3"],
        correctAnswer: "B"
      },
      {
        id: "math-4",
        question: "What is the next number in the sequence: 2, 4, 8, 16, ___?",
        options: ["A. 20", "B. 22", "C. 18", "D. 32"],
        correctAnswer: "D"
      },
      {
        id: "math-5",
        question: "Which is the smallest?",
        options: ["A. 0.25", "B. 1/2", "C. 33%", "D. 3/4"],
        correctAnswer: "A"
      },
      {
        id: "math-6",
        question: "If a pen costs $1.50, how much do 4 pens cost?",
        options: ["A. $4.50", "B. $5.00", "C. $6.00", "D. $6.50"],
        correctAnswer: "C"
      },
      {
        id: "math-7",
        question: "Which shape has 4 equal sides and 4 right angles?",
        options: ["A. Square", "B. Rectangle", "C. Triangle", "D. Trapezoid"],
        correctAnswer: "A"
      },
      {
        id: "math-8",
        question: "How many inches are in 3 feet?",
        options: ["A. 24", "B. 36", "C. 48", "D. 60"],
        correctAnswer: "B"
      },
      {
        id: "math-9",
        question: "If your shift starts at 8:15 AM and ends at 4:45 PM, how long did you work?",
        options: ["A. 8 hours", "B. 8.5 hours", "C. 8 hours 30 minutes", "D. 9 hours"],
        correctAnswer: "C"
      },
      {
        id: "math-10",
        question: "A car travels 180 miles in 3 hours. What is its average speed?",
        options: ["A. 60 mph", "B. 90 mph", "C. 30 mph", "D. 60 mph"],
        correctAnswer: "A"
      }
    ]
  },
  {
    id: "reading-comprehension",
    name: "Reading Comprehension",
    icon: <BookOpen className="h-5 w-5" />,
    questions: [
      {
        id: "reading-1",
        question: "What is the main idea of a paragraph?",
        options: ["A. The central point", "B. The first sentence", "C. A detail", "D. An opinion"],
        correctAnswer: "A"
      },
      {
        id: "reading-2",
        question: "Which word means the same as \"cautious\"?",
        options: ["A. Reckless", "B. Fast", "C. Loud", "D. Careful"],
        correctAnswer: "D"
      },
      {
        id: "reading-3",
        question: "If a recipe calls for 1 cup of sugar and you double it, how much do you need?",
        options: ["A. 1.5 cups", "B. 2 cups", "C. 3 cups", "D. 4 cups"],
        correctAnswer: "B"
      },
      {
        id: "reading-4",
        question: "In a contract, what does \"non-refundable\" most likely mean?",
        options: ["A. You can't get your money back", "B. You must pay again", "C. It's on sale", "D. You can return it"],
        correctAnswer: "A"
      },
      {
        id: "reading-5",
        question: "Which sentence is a fact?",
        options: ["A. Dogs are the best pets", "B. Pizza tastes better with cheese", "C. Water freezes at 0°C", "D. Reading is fun"],
        correctAnswer: "C"
      },
      {
        id: "reading-6",
        question: "Which detail supports the main idea \"Exercise is important\"?",
        options: ["A. It improves heart health", "B. It takes time", "C. Some dislike it", "D. It's expensive"],
        correctAnswer: "A"
      },
      {
        id: "reading-7",
        question: "A synonym for \"job\" is?",
        options: ["A. Jump", "B. Jog", "C. Occupation", "D. Join"],
        correctAnswer: "C"
      },
      {
        id: "reading-8",
        question: "Which word best replaces \"happy\" in this sentence: She was happy about the news?",
        options: ["A. Bored", "B. Excited", "C. Nervous", "D. Surprised"],
        correctAnswer: "B"
      },
      {
        id: "reading-9",
        question: "What does \"deadline\" mean?",
        options: ["A. A new line", "B. A project", "C. Due date", "D. A mistake"],
        correctAnswer: "C"
      },
      {
        id: "reading-10",
        question: "Which sentence shows cause and effect?",
        options: ["A. I walked the dog", "B. I opened the door", "C. I like music", "D. I studied, so I passed"],
        correctAnswer: "D"
      }
    ]
  },
  {
    id: "writing-communication",
    name: "Writing & Communication",
    icon: <BookOpen className="h-5 w-5" />,
    questions: [
      {
        id: "writing-1",
        question: "Which sentence is written correctly?",
        options: ["A. She and I are going to the store.", "B. Her and me is going to the store.", "C. Me and her are going to the store.", "D. She and me is going to the store."],
        correctAnswer: "A"
      },
      {
        id: "writing-2",
        question: "Which word completes the sentence: \"I ___ to the store yesterday.\"",
        options: ["A. go", "B. goes", "C. went", "D. going"],
        correctAnswer: "C"
      },
      {
        id: "writing-3",
        question: "What is the plural of \"child\"?",
        options: ["A. childs", "B. children", "C. childrens", "D. childes"],
        correctAnswer: "B"
      },
      {
        id: "writing-4",
        question: "Which sentence uses punctuation correctly?",
        options: ["A. I like pizza; and burgers.", "B. I like pizza and burgers.", "C. I like pizza and, burgers.", "D. I like pizza, and burgers."],
        correctAnswer: "B"
      },
      {
        id: "writing-5",
        question: "What does \"concise\" mean?",
        options: ["A. Short and clear", "B. Very detailed", "C. Hard to understand", "D. Informal"],
        correctAnswer: "A"
      },
      {
        id: "writing-6",
        question: "Choose the best closing for a professional email.",
        options: ["A. Peace out", "B. Sincerely", "C. Later", "D. Cheers"],
        correctAnswer: "B"
      },
      {
        id: "writing-7",
        question: "Which is a complete sentence?",
        options: ["A. While I was walking", "B. In the morning", "C. She made breakfast", "D. Without thinking"],
        correctAnswer: "C"
      },
      {
        id: "writing-8",
        question: "What's the best revision for: \"He don't like coffee.\"",
        options: ["A. He doesn't like coffee.", "B. He don't likes coffee.", "C. He no like coffee.", "D. He isn't like coffee."],
        correctAnswer: "A"
      },
      {
        id: "writing-9",
        question: "Which of these is an example of formal writing?",
        options: ["A. Gonna go now", "B. LOL that's funny", "C. I'm out", "D. I will attend the meeting tomorrow."],
        correctAnswer: "D"
      },
      {
        id: "writing-10",
        question: "What's the subject in: \"The manager reviewed the report.\"",
        options: ["A. reviewed", "B. the report", "C. the manager", "D. manager reviewed"],
        correctAnswer: "C"
      }
    ]
  },
  {
    id: "technology-skills",
    name: "Technology Skills",
    icon: <Monitor className="h-5 w-5" />,
    questions: [
      {
        id: "tech-1",
        question: "Which device is best for typing a long document?",
        options: ["A. Smartphone", "B. Tablet", "C. Computer", "D. Smartwatch"],
        correctAnswer: "C"
      },
      {
        id: "tech-2",
        question: "What is an internet browser?",
        options: ["A. A website", "B. A program to view websites", "C. An email tool", "D. A video player"],
        correctAnswer: "B"
      },
      {
        id: "tech-3",
        question: "Which of these is a spreadsheet software?",
        options: ["A. Microsoft Excel", "B. Adobe Photoshop", "C. Google Chrome", "D. Microsoft Word"],
        correctAnswer: "A"
      },
      {
        id: "tech-4",
        question: "What does \"Ctrl + C\" do?",
        options: ["A. Close the window", "B. Save the file", "C. Copy", "D. Cut"],
        correctAnswer: "C"
      },
      {
        id: "tech-5",
        question: "Which password is strongest?",
        options: ["A. john123", "B. myname", "C. password1", "D. L@rg3H0u$e#1"],
        correctAnswer: "D"
      },
      {
        id: "tech-6",
        question: "What is cloud storage?",
        options: ["A. A local hard drive", "B. Online file saving", "C. A software update", "D. A USB drive"],
        correctAnswer: "B"
      },
      {
        id: "tech-7",
        question: "Which of these is an email address?",
        options: ["A. alex@domain.com", "B. www.email.com", "C. http://alex", "D. alex at domain"],
        correctAnswer: "A"
      },
      {
        id: "tech-8",
        question: "What is a common video conferencing tool?",
        options: ["A. Excel", "B. Instagram", "C. Zoom", "D. Canva"],
        correctAnswer: "C"
      },
      {
        id: "tech-9",
        question: "Which of these is used to present slides?",
        options: ["A. Outlook", "B. Excel", "C. Docs", "D. PowerPoint"],
        correctAnswer: "D"
      },
      {
        id: "tech-10",
        question: "What does 'refresh' do in a browser?",
        options: ["A. Close the tab", "B. Reload the page", "C. Open a new page", "D. Save the page"],
        correctAnswer: "B"
      }
    ]
  },
  {
    id: "administration",
    name: "Administrative Skills",
    icon: <ClipboardList className="h-5 w-5" />,
    questions: [
      {
        id: "admin-1",
        question: "What tool is used to schedule meetings?",
        options: ["A. File Manager", "B. Word Processor", "C. Photo Editor", "D. Calendar App"],
        correctAnswer: "D"
      },
      {
        id: "admin-2",
        question: "Which document summarizes tasks and due dates?",
        options: ["A. To-do list", "B. Brochure", "C. Budget report", "D. Press release"],
        correctAnswer: "A"
      },
      {
        id: "admin-3",
        question: "If a meeting is postponed, what should you do?",
        options: ["A. Cancel it permanently", "B. Reschedule it and notify attendees", "C. Delete it from records", "D. Do nothing"],
        correctAnswer: "B"
      },
      {
        id: "admin-4",
        question: "Which of these is a filing system?",
        options: ["A. Printing papers", "B. Sending emails", "C. Alphabetical folders", "D. Cutting documents"],
        correctAnswer: "C"
      },
      {
        id: "admin-5",
        question: "Which is a common office tool?",
        options: ["A. Oven", "B. Wrench", "C. Rake", "D. Stapler"],
        correctAnswer: "D"
      },
      {
        id: "admin-6",
        question: "What does a receptionist usually do?",
        options: ["A. Answer phones and greet visitors", "B. Repair machines", "C. Cook meals", "D. Deliver packages"],
        correctAnswer: "A"
      },
      {
        id: "admin-7",
        question: "What does an agenda include?",
        options: ["A. Invoices", "B. Job titles", "C. Meeting topics", "D. Employee shifts"],
        correctAnswer: "C"
      },
      {
        id: "admin-8",
        question: "A coworker is missing a document. What should you do?",
        options: ["A. Ignore it", "B. Help them find or resend it", "C. Complain to a manager", "D. Send it to everyone"],
        correctAnswer: "B"
      },
      {
        id: "admin-9",
        question: "What is a memo?",
        options: ["A. A contract", "B. An invoice", "C. A spreadsheet", "D. A short business message"],
        correctAnswer: "D"
      },
      {
        id: "admin-10",
        question: "Which file format is best for sharing a resume?",
        options: ["A. PDF", "B. PSD", "C. MOV", "D. TXT"],
        correctAnswer: "A"
      }
    ]
  },
  {
    id: "quality-control",
    name: "Quality Control & Attention to Detail",
    icon: <Search className="h-5 w-5" />,
    questions: [
      {
        id: "quality-1",
        question: "What is SPC (Statistical Process Control) used for?",
        options: ["A. Hiring workers", "B. Monitoring variation in a process", "C. Marketing", "D. Scheduling shifts"],
        correctAnswer: "B"
      },
      {
        id: "quality-2",
        question: "Which number breaks the pattern: 2, 4, 6, 8, 11?",
        options: ["A. 4", "B. 6", "C. 11", "D. 8"],
        correctAnswer: "C"
      },
      {
        id: "quality-3",
        question: "You inspect every 5th item. What items do you check?",
        options: ["A. 1,2,3,4,5", "B. 5,10,15,20", "C. 2,4,6,8", "D. 1,6,11,16"],
        correctAnswer: "B"
      },
      {
        id: "quality-4",
        question: "Which number is the outlier: 98, 102, 99, 85, 101?",
        options: ["A. 98", "B. 102", "C. 101", "D. 85"],
        correctAnswer: "D"
      },
      {
        id: "quality-5",
        question: "Which tool is used to measure in millimeters?",
        options: ["A. Thermometer", "B. Stopwatch", "C. Caliper", "D. Calculator"],
        correctAnswer: "C"
      },
      {
        id: "quality-6",
        question: "What's the tolerance if a part must be 2.50 ± 0.05 inches?",
        options: ["A. 2.45–2.55", "B. 2.40–2.60", "C. 2.50–2.60", "D. 2.55–2.65"],
        correctAnswer: "A"
      },
      {
        id: "quality-7",
        question: "What does a control chart monitor?",
        options: ["A. Profit", "B. Quality variation", "C. Attendance", "D. Temperature"],
        correctAnswer: "B"
      },
      {
        id: "quality-8",
        question: "A part measures 2.56 inches, spec is 2.50 ± 0.05. What now?",
        options: ["A. Accept it", "B. Round it", "C. Flag it as outside tolerance", "D. Use it anyway"],
        correctAnswer: "C"
      },
      {
        id: "quality-9",
        question: "What does a spike in defects on Friday suggest?",
        options: ["A. Investigate Friday processes", "B. Fire workers", "C. Skip inspections", "D. No issue"],
        correctAnswer: "A"
      },
      {
        id: "quality-10",
        question: "What is data analysis used for?",
        options: ["A. Printing reports", "B. Packaging items", "C. Tracking breaks", "D. Making quality decisions"],
        correctAnswer: "D"
      }
    ]
  },
  {
    id: "customer-service",
    name: "Customer Service & Interpersonal Skills",
    icon: <Users className="h-5 w-5" />,
    questions: [
      {
        id: "customer-1",
        question: "A customer is upset. What's your first step?",
        options: ["A. Listen actively", "B. Walk away", "C. Argue back", "D. Ignore it"],
        correctAnswer: "A"
      },
      {
        id: "customer-2",
        question: "What does \"empathy\" mean?",
        options: ["A. Judging others", "B. Explaining rules", "C. Understanding feelings", "D. Fixing things"],
        correctAnswer: "C"
      },
      {
        id: "customer-3",
        question: "What should you say when you don't know the answer?",
        options: ["A. Make something up", "B. Say you'll find out", "C. Avoid the question", "D. Say \"that's not my job\""],
        correctAnswer: "B"
      },
      {
        id: "customer-4",
        question: "How should you greet a customer?",
        options: ["A. \"What do you want?\"", "B. Ignore them", "C. \"Hello! How can I help you?\"", "D. \"Hold on\""],
        correctAnswer: "C"
      },
      {
        id: "customer-5",
        question: "A customer wants a refund. What should you do?",
        options: ["A. Refuse immediately", "B. Complain", "C. Call police", "D. Follow refund policy"],
        correctAnswer: "D"
      },
      {
        id: "customer-6",
        question: "Which is good body language?",
        options: ["A. Eye contact", "B. Crossing arms", "C. Looking away", "D. Tapping foot"],
        correctAnswer: "A"
      },
      {
        id: "customer-7",
        question: "A customer is confused. You should:",
        options: ["A. Walk away", "B. Say \"read the sign\"", "C. Explain clearly", "D. Get angry"],
        correctAnswer: "C"
      },
      {
        id: "customer-8",
        question: "What's most important in customer service?",
        options: ["A. Being fast", "B. Being helpful and respectful", "C. Selling a lot", "D. Knowing everything"],
        correctAnswer: "B"
      },
      {
        id: "customer-9",
        question: "If you make a mistake, you should:",
        options: ["A. Hide it", "B. Blame others", "C. Quit", "D. Admit and fix it"],
        correctAnswer: "D"
      },
      {
        id: "customer-10",
        question: "Which phrase is polite?",
        options: ["A. \"Let me help you with that.\"", "B. \"Hurry up.\"", "C. \"Whatever.\"", "D. \"You're wrong.\""],
        correctAnswer: "A"
      }
    ]
  },
  {
    id: "skilled-trades",
    name: "Skilled Trades Basics",
    icon: <Wrench className="h-5 w-5" />,
    questions: [
      {
        id: "trades-1",
        question: "What does an electrician work on?",
        options: ["A. Plumbing", "B. Carpentry", "C. Wiring and circuits", "D. Welding"],
        correctAnswer: "C"
      },
      {
        id: "trades-2",
        question: "What is used to cut wood?",
        options: ["A. Trowel", "B. Saw", "C. Wrench", "D. Hammer"],
        correctAnswer: "B"
      },
      {
        id: "trades-3",
        question: "Which trade installs pipes and water systems?",
        options: ["A. Plumber", "B. Electrician", "C. Roofer", "D. HVAC tech"],
        correctAnswer: "A"
      },
      {
        id: "trades-4",
        question: "Welding joins materials using what?",
        options: ["A. Screws", "B. Water", "C. Nails", "D. Heat"],
        correctAnswer: "D"
      },
      {
        id: "trades-5",
        question: "Which trade fixes heating and cooling systems?",
        options: ["A. Plumber", "B. Roofer", "C. HVAC technician", "D. Welder"],
        correctAnswer: "C"
      },
      {
        id: "trades-6",
        question: "Carpenters mainly work with what?",
        options: ["A. Metal", "B. Wood", "C. Plastic", "D. Wire"],
        correctAnswer: "B"
      },
      {
        id: "trades-7",
        question: "What is PPE?",
        options: ["A. Pipe fitting tool", "B. Job title", "C. Personal protective equipment", "D. Building code"],
        correctAnswer: "C"
      },
      {
        id: "trades-8",
        question: "Which trade might operate heavy machinery?",
        options: ["A. Equipment operator", "B. Teacher", "C. Nurse", "D. Server"],
        correctAnswer: "A"
      },
      {
        id: "trades-9",
        question: "An apprenticeship is:",
        options: ["A. A classroom course only", "B. On-the-job training", "C. A resume", "D. A part-time job"],
        correctAnswer: "B"
      },
      {
        id: "trades-10",
        question: "A mason usually works with:",
        options: ["A. Glass", "B. Carpet", "C. Electric panels", "D. Bricks and concrete"],
        correctAnswer: "D"
      }
    ]
  }
];

interface SkillResults {
  [categoryId: string]: {
    score: number;
    level: "Strong" | "Moderate" | "Needs improvement";
  };
}

export const SkillsAssessment = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<SkillResults>({});
  const [aiAssessment, setAiAssessment] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const totalQuestions = skillCategories.reduce((sum, category) => sum + category.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const currentCategory = skillCategories[currentCategoryIndex];
  const currentQuestion = currentCategory.questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = async () => {
    const questionId = currentQuestion.id;
    const updatedAnswers = { ...answers, [questionId]: selectedAnswer };
    setAnswers(updatedAnswers);
    setSelectedAnswer("");

    if (currentQuestionIndex < currentCategory.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentCategoryIndex < skillCategories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Calculate results when assessment is complete
      const finalResults = await calculateResults();
      setResults(finalResults);
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    } else if (currentCategoryIndex > 0) {
      setCurrentCategoryIndex(prev => prev - 1);
      setCurrentQuestionIndex(skillCategories[currentCategoryIndex - 1].questions.length - 1);
    }
  };

  const resetAssessment = () => {
    setCurrentCategoryIndex(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setResults({});
    setAiAssessment(null);
    setShowResults(false);
    setSelectedAnswer("");
    setIsOpen(false);
  };

  const calculateResults = async (): Promise<SkillResults> => {
    try {
      // Call the AI skills assessment API
      const response = await fetch('/functions/v1/skills-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          responses: answers,
          targetField: 'General' // Could be enhanced with user's target field
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.assessment) {
        // Store AI assessment for detailed insights
        setAiAssessment(data.assessment);
        
        // Transform AI response to match existing interface
        const results: SkillResults = {};
        
        skillCategories.forEach(category => {
          let correctAnswers = 0;
          category.questions.forEach(question => {
            const userAnswer = answers[question.id];
            if (userAnswer === question.correctAnswer) {
              correctAnswers++;
            }
          });
          
          let level: "Strong" | "Moderate" | "Needs improvement";
          if (correctAnswers >= 8) {
            level = "Strong";
          } else if (correctAnswers >= 5) {
            level = "Moderate";
          } else {
            level = "Needs improvement";
          }
          
          results[category.id] = {
            score: correctAnswers,
            level
          };
        });
        
        return results;
      }
    } catch (error) {
      console.error('Error getting AI skills assessment:', error);
    }

    // Fallback to original calculation
    const results: SkillResults = {};
    
    skillCategories.forEach(category => {
      let correctAnswers = 0;
      category.questions.forEach(question => {
        const userAnswer = answers[question.id];
        if (userAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      });
      
      let level: "Strong" | "Moderate" | "Needs improvement";
      if (correctAnswers >= 8) {
        level = "Strong";
      } else if (correctAnswers >= 5) {
        level = "Moderate";
      } else {
        level = "Needs improvement";
      }
      
      results[category.id] = {
        score: correctAnswers,
        level
      };
    });
    
    return results;
  };

  const topSkills = Object.entries(results)
    .sort(([,a], [,b]) => b.score - a.score)
    .slice(0, 3);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="transition-elegant hover:scale-105 px-8 py-3">
          Take a Free Skills Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {showResults ? "Your Skills Assessment Results" : "Skills Assessment"}
          </DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  {currentCategory.icon}
                  {currentCategory.name}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-xs text-muted-foreground text-center">
                Question {currentQuestionIndex + 1} of {currentCategory.questions.length} in this category
              </div>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {currentQuestion.question}
              </h3>
              
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                    <RadioGroupItem value={option.charAt(0)} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentCategoryIndex === 0 && currentQuestionIndex === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="px-8"
              >
                {currentCategoryIndex === skillCategories.length - 1 && 
                 currentQuestionIndex === currentCategory.questions.length - 1 ? "Get Results" : "Next"}
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
                Here's your complete skills profile across all categories:
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Your Top 3 Skill Areas:</h4>
              {topSkills.map(([categoryId, result], index) => {
                const category = skillCategories.find(c => c.id === categoryId);
                return (
                  <Card key={categoryId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-primary">#{index + 1}</div>
                        <div className="flex items-center gap-2">
                          {category?.icon}
                          <span className="font-semibold">{category?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{result.score}/10</div>
                        <div className={`text-sm font-medium ${
                          result.level === "Strong" ? "text-green-600" :
                          result.level === "Moderate" ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {result.level} Skill
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6 bg-gradient-card border border-white/10">
              <h4 className="text-lg font-bold mb-3">AI-Powered Career Insights:</h4>
              {aiAssessment ? (
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-primary mb-2">Your Skill Strengths:</h5>
                    <div className="flex flex-wrap gap-2">
                      {aiAssessment.strengths.map((strength: string, index: number) => (
                        <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-orange-600 mb-2">Areas to Develop:</h5>
                    <div className="flex flex-wrap gap-2">
                      {aiAssessment.gaps.map((gap: string, index: number) => (
                        <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          {gap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="font-semibold text-blue-600 mb-2">Learning Priorities:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {aiAssessment.priorities.map((priority: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{priority}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold text-purple-600 mb-2">Career Readiness Score:</h5>
                    <div className="flex items-center gap-3">
                      <Progress value={aiAssessment.readinessScore} className="flex-1" />
                      <span className="font-bold text-lg">{aiAssessment.readinessScore}%</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-900 mb-2">Recommended Next Steps:</h5>
                    <p className="text-blue-800 text-sm mb-3">{aiAssessment.summary}</p>
                    <div className="text-sm text-blue-700">
                      <strong>Timeline:</strong> {aiAssessment.timeline}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-muted-foreground">Analyzing your skills for career insights...</p>
                </div>
              )}
            </Card>

            <Card className="p-6 bg-gradient-card border border-white/10">
              <h4 className="text-lg font-bold mb-3">All Skills Overview:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {skillCategories.map(category => {
                  const result = results[category.id];
                  if (!result) return null;
                  return (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {category.icon}
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{result.score}/10</div>
                        <div className={`text-xs ${
                          result.level === "Strong" ? "text-green-600" :
                          result.level === "Moderate" ? "text-yellow-600" : "text-red-600"
                        }`}>
                          {result.level}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {aiAssessment?.resources && (
              <Card className="p-6 bg-green-50 border border-green-200">
                <h4 className="text-lg font-bold mb-3 text-green-900">Recommended Learning Resources:</h4>
                <div className="space-y-3">
                  {aiAssessment.resources.slice(0, 3).map((resource: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-green-100">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-semibold text-green-800">{resource.skill}</h5>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          {resource.type}
                        </span>
                      </div>
                      <p className="text-green-700 text-sm mb-2">{resource.resource}</p>
                      <p className="text-green-600 text-xs">⏱️ {resource.timeline}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-6 bg-blue-50 border border-blue-200">
              <h4 className="text-lg font-bold mb-2 text-blue-900">Career Development Path:</h4>
              <p className="text-sm text-blue-800 mb-3">
                Based on your skill profile, focus on developing your strongest areas while addressing key gaps. 
                {aiAssessment ? aiAssessment.summary : "Consider taking our Career and Personality Assessments for a complete career roadmap."}
              </p>
              <div className="text-xs text-blue-700">
                <strong>Pro Tip:</strong> Employers value both technical skills and soft skills. Your assessment shows areas where targeted learning can significantly boost your career prospects.
              </div>
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
    </Dialog>
  );
};