import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export const BusinessMentorChatbot = () => {
  const { toast } = useToast();
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

  const getAIResponse = async (message: string, history: Message[]): Promise<string> => {
    try {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use this tool");
      }

      const { data, error } = await supabase.functions.invoke('business-mentor', {
        body: {
          message,
          conversationHistory: history.slice(-10) // Include last 10 messages for context
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error === 'credits_exhausted') {
        throw new Error('AI service is currently unavailable. Please add credits in Settings.');
      }
      
      if (data?.error === 'timeout') {
        throw new Error('AI request timed out. Please try again.');
      }
      
      if (data?.error === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      if (data?.error === 'inappropriate_content') {
        throw new Error(data.message || 'Inappropriate content detected');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Check for inappropriate content error
      if (error instanceof Error && error.message.includes('inappropriate content')) {
        throw error;
      }
      
      // Enhanced fallback responses based on message content
      const lowercaseMessage = message.toLowerCase();
      
      if (lowercaseMessage.includes("idea") || lowercaseMessage.includes("start")) {
        return "Great question! Start by identifying a problem you're passionate about solving. Look at your skills, experiences, and what frustrates you daily. The best businesses solve real problems for real people. What specific area or industry interests you most?";
      }
      
      if (lowercaseMessage.includes("funding") || lowercaseMessage.includes("money") || lowercaseMessage.includes("capital")) {
        return "There are several funding options: bootstrapping (using your own money), angel investors, venture capital, crowdfunding, and small business loans. Start with your own savings and revenue when possible to maintain control. What stage is your business at currently?";
      }
      
      if (lowercaseMessage.includes("marketing") || lowercaseMessage.includes("customer")) {
        return "Focus on understanding your target audience first. Use social media, content marketing, networking, and word-of-mouth. Start with one channel and master it before expanding. Who is your ideal customer, and where do they spend their time?";
      }
      
      return "That's an interesting point! In my experience, successful entrepreneurs focus on solving real problems for real people. I'd love to help you think through this - can you tell me more about your specific situation or challenge?";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || inputMessage.length < 5) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
    };

    const currentInput = inputMessage;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const aiResponse = await getAIResponse(currentInput, messages);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Error handling message:', error);
      
      // Check for inappropriate content
      if (error instanceof Error && error.message.includes('inappropriate content')) {
        toast({
          title: "Inappropriate Content",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble right now. Please try rephrasing your question or ask again in a moment.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    "How do I validate my business idea?",
    "What's the best way to find customers?",
    "How much funding do I need?",
    "When should I quit my day job?",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-strong border-0 bg-card/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-hero text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Bot className="h-6 w-6" />
            <div>
              <h3 className="text-xl font-bold">Business Mentor AI</h3>
              <p className="text-white/80 text-sm">Get instant advice from our AI business mentor. Ask questions about strategy, operations, marketing, and get expert guidance 24/7.</p>
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
                    {message.isBot && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
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
                    <Bot className="h-5 w-5" />
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
              <Lightbulb className="h-5 w-5 text-primary" />
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
            <div className="flex-1 space-y-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask a specific business question... (minimum 5 characters for better responses)"
                onKeyPress={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
                className={inputMessage.length > 0 && inputMessage.length < 5 ? "border-orange-300" : ""}
              />
              {inputMessage.length > 0 && inputMessage.length < 5 && (
                <p className="text-xs text-orange-600">Add more detail for a better response</p>
              )}
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={inputMessage.length < 5 || isTyping}
              size="default" 
              className="px-6"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};