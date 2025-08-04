import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, GraduationCap, User } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export const CareerAdvisorChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI Career Advisor. I'm here to help you navigate your career transition and reskilling journey. What career challenge can I help you with today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const careerAdvice = {
    "career change": "Career changes can be exciting and challenging! Start by identifying your transferable skills and what you're passionate about. Consider informational interviews and shadowing professionals in your target field.",
    "skills": "Focus on both hard and soft skills. Technical skills get you noticed, but soft skills help you succeed. Consider online courses, bootcamps, or formal education depending on your timeline and budget.",
    "resume": "Tailor your resume for each application. Highlight transferable skills and quantify your achievements. Consider creating a skills-based resume if you're changing industries significantly.",
    "interview": "Practice common questions and prepare specific examples using the STAR method (Situation, Task, Action, Result). Research the company thoroughly and prepare thoughtful questions.",
    "networking": "Start with your existing network and expand gradually. LinkedIn is powerful for professional networking. Attend industry events, join professional associations, and consider mentorship opportunities.",
    "salary": "Research salary ranges for your target role using sites like Glassdoor and PayScale. Consider the total compensation package, not just base salary. Don't be afraid to negotiate respectfully.",
    "remote work": "Remote work requires strong communication and self-discipline. Highlight your remote work skills and create a professional home office setup. Many companies now offer hybrid or fully remote positions.",
    "age": "Age discrimination exists, but focus on what you can control. Highlight your experience, adaptability, and fresh perspectives. Consider modern skills training and update your professional image.",
  };

  const getCareerAdvice = (userMessage: string): string => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    for (const [keyword, advice] of Object.entries(careerAdvice)) {
      if (lowercaseMessage.includes(keyword)) {
        return advice;
      }
    }
    
    // Default responses for common patterns
    if (lowercaseMessage.includes("how") || lowercaseMessage.includes("what")) {
      return "That's a great question! Career transitions are unique to each person. The key is to start with self-assessment - understanding your values, interests, and skills. What specific area would you like to explore further?";
    }
    
    if (lowercaseMessage.includes("help") || lowercaseMessage.includes("stuck")) {
      return "Feeling stuck is normal during career transitions. Let's break this down step by step. What's the main challenge you're facing right now - is it finding direction, developing skills, or landing opportunities?";
    }
    
    if (lowercaseMessage.includes("scared") || lowercaseMessage.includes("afraid")) {
      return "It's completely normal to feel nervous about career changes. Remember that small, consistent steps lead to big changes. What's one small action you could take this week to move forward?";
    }
    
    return "That's an interesting point! Career development is a journey, not a destination. The key is continuous learning and adapting. Can you tell me more about your specific situation or goals?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getCareerAdvice(inputMessage),
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const quickQuestions = [
    "How do I change careers successfully?",
    "What skills should I focus on learning?",
    "How do I network effectively?",
    "How can I stand out to employers?",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-strong border-0 bg-card/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-hero text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-6 w-6" />
            <div>
              <h3 className="text-xl font-bold">Career Advisor AI</h3>
              <p className="text-white/80 text-sm">Get personalized guidance for your career transition</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[400px] p-6">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-lg ${
                    message.isBot
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.isBot && <GraduationCap className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    {!message.isBot && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-5 w-5" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center space-x-2 mb-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">Quick questions to get started:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-3 justify-start text-left whitespace-normal hover:bg-primary/10"
                  onClick={() => {
                    setInputMessage(question);
                    handleSendMessage();
                  }}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t">
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your career question..."
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="default" className="px-6">
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};