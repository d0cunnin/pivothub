import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Lightbulb } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export const BusinessMentorChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI Business Mentor. I'm here to help you navigate your entrepreneurial journey. What business challenge can I help you with today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const businessAdvice = {
    "business idea": "Great question! Start by identifying a problem you're passionate about solving. Look at your skills, experiences, and what frustrates you daily. The best businesses solve real problems for real people.",
    "funding": "There are several funding options: bootstrapping, angel investors, venture capital, crowdfunding, and small business loans. Start with your own savings and revenue when possible to maintain control.",
    "marketing": "Focus on understanding your target audience first. Use social media, content marketing, networking, and word-of-mouth. Start with one channel and master it before expanding.",
    "competition": "Competition validates your market! Study your competitors to understand what works and what doesn't. Find your unique value proposition and focus on serving your customers better.",
    "legal": "Consider your business structure (LLC, Corporation, etc.), protect your intellectual property, get necessary licenses, and have proper contracts. Consult with a business attorney for specific advice.",
    "team": "Hire slowly and fire quickly. Look for people who share your vision and complement your skills. Start with contractors or part-time help before committing to full-time employees.",
    "pricing": "Research your competition, understand your costs, and consider the value you provide. Don't undervalue yourself, but be competitive. You can always adjust pricing as you learn more.",
    "scaling": "Focus on systems and processes. Document everything, automate what you can, and build a strong team. Don't scale too fast without proper foundation.",
  };

  const getBusinessAdvice = (userMessage: string): string => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    for (const [keyword, advice] of Object.entries(businessAdvice)) {
      if (lowercaseMessage.includes(keyword)) {
        return advice;
      }
    }
    
    // Default responses for common patterns
    if (lowercaseMessage.includes("how") || lowercaseMessage.includes("what")) {
      return "That's a great question! The key is to start small and validate your assumptions. Focus on solving one specific problem really well before expanding. What specific aspect would you like to dive deeper into?";
    }
    
    if (lowercaseMessage.includes("help") || lowercaseMessage.includes("stuck")) {
      return "I understand feeling stuck is part of the entrepreneurial journey. Let's break down your challenge step by step. What's the specific obstacle you're facing right now?";
    }
    
    return "That's an interesting point! In my experience, successful entrepreneurs focus on solving real problems for real people. Can you tell me more about what you're trying to achieve?";
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
        text: getBusinessAdvice(inputMessage),
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const quickQuestions = [
    "How do I validate my business idea?",
    "What's the best way to find customers?",
    "How much funding do I need?",
    "When should I quit my day job?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full shadow-glow hover-scale bg-gradient-hero"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </Button>
      ) : (
        <Card className="w-96 h-[500px] shadow-strong border-0 bg-card/95 backdrop-blur-sm">
          {/* Header */}
          <div className="p-4 border-b bg-gradient-hero text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5" />
                <h3 className="font-semibold">Business Mentor AI</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                ×
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 h-[320px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.isBot && <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                      <p className="text-sm">{message.text}</p>
                      {!message.isBot && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
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
            <div className="p-3 border-t">
              <div className="flex items-center space-x-1 mb-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground font-medium">Quick questions:</span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-auto p-2 justify-start text-left whitespace-normal"
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
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask your business question..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="text-sm"
              />
              <Button onClick={handleSendMessage} size="sm" className="px-3">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};