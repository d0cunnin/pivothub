import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, GraduationCap, User, AlertCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { sanitizeAIContent } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export const CareerAdvisorChatbot = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi! I'm your AI Career Advisor. I'm here to help you navigate your career transition and upskilling journey. I can provide personalized guidance on career changes, skills development, job searching, and much more. What career challenge can I help you with today?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      console.log('🚀 Sending request to career advisor:', { message: userMessage });
      
      const { data, error } = await supabase.functions.invoke('career-advisor', {
        body: {
          message: userMessage,
          conversationHistory: messages.slice(1) // Exclude the initial greeting
        }
      });

      console.log('📦 Response data:', data);
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data?.error === 'inappropriate_content') {
        throw new Error(data.message || 'Inappropriate content detected');
      }

      // Enhanced response validation
      const rawResponse = data?.response;
      console.log('🔍 Raw response details:', {
        exists: rawResponse !== undefined && rawResponse !== null,
        type: typeof rawResponse,
        length: rawResponse?.length || 0,
        trimmedLength: rawResponse?.trim()?.length || 0,
        value: rawResponse,
        isEmpty: !rawResponse,
        isWhitespace: rawResponse && !rawResponse.trim()
      });

      if (!rawResponse || typeof rawResponse !== 'string' || !rawResponse.trim()) {
        console.error('❌ Invalid response content:', {
          rawResponse,
          type: typeof rawResponse,
          length: rawResponse?.length,
          trimmed: rawResponse?.trim()
        });
        throw new Error('AI returned empty or invalid response');
      }

      const sanitizedResponse = sanitizeAIContent(rawResponse.trim());
      console.log('✅ Valid AI response:', { length: sanitizedResponse.length, content: sanitizedResponse });
      return sanitizedResponse;
    } catch (error) {
      console.error('💥 Error getting AI response:', error);
      throw error;
    }
  };

  const getFallbackResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
      return "I understand you're asking about career guidance. While I'm temporarily having connection issues, I recommend starting with a self-assessment of your skills and interests. What specific career area would you like to explore?";
    }
    
    if (lowerMessage.includes('skill')) {
      return "Skills development is crucial for career growth. Focus on both technical skills relevant to your target field and soft skills like communication and problem-solving. What skills are you most interested in developing?";
    }
    
    return "I apologize for the technical difficulty. In the meantime, consider these key career development areas: skills assessment, industry research, networking, and creating a strong professional profile. What aspect would you like to discuss further?";
  };

  const handleSendMessage = async (messageOverride?: string) => {
    const messageText = messageOverride || inputMessage;
    if (!messageText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setError(null);

    try {
      const aiResponse = await getAIResponse(messageText);
      console.log('🎯 AI Response received:', { 
        response: aiResponse, 
        length: aiResponse?.length,
        type: typeof aiResponse 
      });
      
      // Enhanced bot response validation
      const responseText = aiResponse || "I apologize, but I didn't generate a proper response. Could you please try asking again?";
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        isBot: true,
        timestamp: new Date(),
      };
      
      console.log('💬 Adding bot message to state:', botResponse);
      
      setMessages(prev => {
        const newMessages = [...prev, botResponse];
        console.log('📝 Updated messages array:', {
          totalMessages: newMessages.length,
          lastMessage: newMessages[newMessages.length - 1],
          allMessages: newMessages.map(m => ({ id: m.id, isBot: m.isBot, textLength: m.text.length }))
        });
        return newMessages;
      });
    } catch (error) {
      console.error('Error getting AI response:', error);
      setError("I'm having trouble connecting right now. Here's some general guidance:");
      
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getFallbackResponse(messageText),
        isBot: true,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
      
      toast({
        title: "Connection Issue",
        description: "I'm having trouble accessing my full capabilities. You're receiving basic guidance for now.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const resetConversation = () => {
    setMessages([
      {
        id: "1",
        text: "Hi! I'm your AI Career Advisor. I'm here to help you navigate your career transition and upskilling journey. I can provide personalized guidance on career changes, skills development, job searching, and much more. What career challenge can I help you with today?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
    setError(null);
    setInputMessage("");
  };

  const quickQuestions = [
    "How do I change careers successfully?",
    "What skills should I focus on for my target industry?",
    "How do I network effectively in my field?",
    "What should I include in my resume for a career change?",
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-strong border-0 bg-card/95 backdrop-blur-sm">
        {/* Header */}
        <div className="p-6 border-b bg-gradient-hero text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6" />
              <div>
                <h3 className="text-xl font-bold">Career Advisor AI</h3>
                <p className="text-white/80 text-sm">Get personalized guidance for your career transition</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetConversation}
              className="text-white hover:bg-white/20"
              title="Start new conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="h-[400px] p-6">
          <div className="space-y-4">
            {messages.map((message) => {
              // Debug logging for each rendered message
              console.log('🎨 Rendering message:', {
                id: message.id,
                isBot: message.isBot,
                textLength: message.text.length,
                text: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')
              });
              
              return (
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
                      <p className="text-sm leading-relaxed">
                        {message.text || "[Empty message - please report this bug]"}
                        {/* Temporary debug indicator */}
                        {message.isBot && (
                          <span className="ml-2 text-xs opacity-50">
                            [Bot:{message.text.length}chars]
                          </span>
                        )}
                      </p>
                      {!message.isBot && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}
                    </div>
                  </div>
                </div>
              );
            })}
            
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
                  onClick={() => handleSendMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="px-6 py-3 border-t bg-destructive/10">
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t">
          <div className="flex space-x-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask your career question... (e.g., 'How do I transition from marketing to tech?')"
                  onKeyPress={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
                  className="flex-1"
                  disabled={isTyping}
                  minLength={10}
                />
            <Button 
              onClick={() => handleSendMessage()} 
              size="default" 
              className="px-6"
              disabled={isTyping || !inputMessage.trim() || inputMessage.trim().length < 10}
            >
              <Send className="h-4 w-4 mr-2" />
              {isTyping ? "Thinking..." : "Send"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};