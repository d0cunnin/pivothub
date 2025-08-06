import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, Target, TrendingUp, Users } from "lucide-react";

interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "current-role",
    question: "What best describes your current situation?",
    options: [
      "Currently employed, looking to advance",
      "Between jobs, seeking new opportunities",
      "Returning to workforce after a break",
      "Starting my career/recent graduate",
      "Entrepreneur/freelancer"
    ]
  },
  {
    id: "career-goal",
    question: "What's your primary career goal?",
    options: [
      "Get promoted in my current field",
      "Switch to a completely new career",
      "Start my own business",
      "Increase my earning potential",
      "Gain more job security"
    ]
  },
  {
    id: "skill-level",
    question: "How would you rate your current digital skills?",
    options: [
      "Beginner - I'm just getting started",
      "Basic - I know the fundamentals",
      "Intermediate - I'm comfortable with most tools",
      "Advanced - I'm proficient and confident",
      "Expert - I could teach others"
    ]
  },
  {
    id: "learning-preference",
    question: "What's your preferred learning style?",
    options: [
      "Hands-on projects and practice",
      "Video tutorials and demonstrations",
      "Reading and written materials",
      "Interactive workshops and discussions",
      "Self-paced online courses"
    ]
  },
  {
    id: "time-commitment",
    question: "How much time can you dedicate to learning weekly?",
    options: [
      "1-3 hours per week",
      "4-6 hours per week",
      "7-10 hours per week",
      "11-15 hours per week",
      "More than 15 hours per week"
    ]
  }
];

const skillRecommendations = {
  "technology": {
    title: "Technology & Programming",
    description: "Perfect for logical thinkers who want to build, automate, and innovate.",
    skills: ["Python Programming", "Web Development", "Data Analysis", "Cloud Computing"],
    salaryIncrease: "25-40%",
    icon: <Target className="h-6 w-6" />
  },
  "marketing": {
    title: "Digital Marketing",
    description: "Ideal for creative communicators who want to drive business growth.",
    skills: ["SEO & Analytics", "Social Media Marketing", "Content Strategy", "Email Marketing"],
    salaryIncrease: "20-35%",
    icon: <TrendingUp className="h-6 w-6" />
  },
  "business": {
    title: "Business & Management",
    description: "Great for natural leaders who want to advance into management roles.",
    skills: ["Project Management", "Leadership Skills", "Business Strategy", "Team Management"],
    salaryIncrease: "30-50%",
    icon: <Users className="h-6 w-6" />
  }
};

export const SkillsAssessment = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNext = () => {
    setAnswers(prev => ({
      ...prev,
      [assessmentQuestions[currentQuestion].id]: selectedAnswer
    }));
    setSelectedAnswer("");

    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setSelectedAnswer("");
    setIsOpen(false);
  };

  const getRecommendation = () => {
    // Simple logic to determine recommendation based on answers
    const goalAnswer = answers["career-goal"];
    
    if (goalAnswer?.includes("business") || goalAnswer?.includes("promoted")) {
      return skillRecommendations.business;
    } else if (goalAnswer?.includes("earning") || answers["current-role"]?.includes("entrepreneur")) {
      return skillRecommendations.marketing;
    } else {
      return skillRecommendations.technology;
    }
  };

  const recommendation = showResults ? getRecommendation() : null;
  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="transition-elegant hover:scale-105 px-8 py-3">
          Take Free Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {showResults ? "Your Personalized Learning Path" : "Skills Assessment"}
          </DialogTitle>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Question {currentQuestion + 1} of {assessmentQuestions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {assessmentQuestions[currentQuestion].question}
              </h3>
              
              <RadioGroup value={selectedAnswer} onValueChange={handleAnswerSelect}>
                {assessmentQuestions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                    <RadioGroupItem value={option} id={`option-${index}`} />
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
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!selectedAnswer}
                className="px-8"
              >
                {currentQuestion === assessmentQuestions.length - 1 ? "Get Results" : "Next"}
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
                Based on your responses, here's your personalized learning recommendation:
              </p>
            </div>

            <Card className="p-6 bg-gradient-card border border-white/10">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                  {recommendation?.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-2">{recommendation?.title}</h4>
                  <p className="text-muted-foreground mb-4">{recommendation?.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-semibold text-sm mb-2">Recommended Skills:</h5>
                      <div className="flex flex-wrap gap-2">
                        {recommendation?.skills.map((skill, index) => (
                          <span key={index} className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800">
                        <strong>Potential Salary Increase:</strong> {recommendation?.salaryIncrease}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={resetAssessment}>
                Retake Assessment
              </Button>
              <Button onClick={() => setIsOpen(false)} className="px-8">
                Start Learning Path
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};