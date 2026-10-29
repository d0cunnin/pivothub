import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { useToast } from "@/hooks/use-toast";

const GENERIC_FAILURE_MESSAGE = "Something went wrong. Please try again.";

// User-facing failure text. On failure no results are shown, and credits are
// only charged server-side when real AI results are delivered.
const describeFailure = (error: unknown): string => {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof (error as { message?: unknown } | null)?.message === "string"
          ? (error as { message: string }).message
          : "";
  const message = raw.trim() || GENERIC_FAILURE_MESSAGE;
  if (/not (been )?charged/i.test(message)) return message;
  return `${/[.!?]$/.test(message) ? message : `${message}.`} You were not charged.`;
};

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

      const { data, error } = await invokeFunction('business-mentor', {
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
      
      throw error;
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
      
      toast({
        title: "Couldn't get a response",
        description: describeFailure(error),
        variant: "destructive",
      });

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't respond just now. Please try again. You were not charged.",
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