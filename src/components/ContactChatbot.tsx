import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Loader2, Settings, CreditCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_ACTIONS = [
  { label: "View Subscription", icon: CreditCard, action: "/settings" },
  { label: "View Pricing", icon: DollarSign, action: "/pricing" },
  { label: "Account Settings", icon: Settings, action: "/settings" },
];

// Static FAQ responses - no AI, no API calls, no credits
const FAQ_RESPONSES: Record<string, string> = {
  "How do I reset my password?": 
    "To reset your password:\n1. Click your profile icon in the top right\n2. Go to Settings\n3. Navigate to Account Settings\n4. Select 'Change Password'\n\nIf you're locked out, use the 'Forgot Password' link on the login page.",
  
  "How do I update billing or cancel?": 
    "To manage your subscription:\n1. Go to Settings (top right)\n2. Click 'Subscription' tab\n3. You can upgrade, downgrade, or cancel here\n\nCancellations take effect at the end of your billing period. Need help? Contact support@pivothub.io or call 269.998.4203",
  
  "Where can I view pricing and plans?": 
    "View our pricing at /pricing or:\n\n• Explore Mode: Free - 5 credits/month\n• Assess+Prep+Learn: $18/mo - 75 credits\n• Build+Teach+Launch: $18/mo - 75 credits\n• Fund It: $15/mo - 60 credits\n• All Access Pass: $29/mo - 125 credits (most popular)\n\nAll paid plans include credit rollover up to 2× monthly limit!",
  
  "How do I contact support?": 
    "Reach our support team:\n\n📧 Email: support@pivothub.io\n📞 Phone: 269.998.4203\n📍 Address: PO Box 2025, Kalamazoo, MI 49003\n🕒 Hours: Mon-Fri, 9 AM - 6 PM EST\n\nWe typically respond within 24 hours on business days.",
  
  "What is Explore Mode?": 
    "Explore Mode is our free tier:\n\n✅ 5 credits per month\n✅ Access to all platform tools\n✅ Resets on your signup anniversary\n\n⚠️ No credit rollover (free tier only)\n⚠️ Cannot purchase extra credits\n\nUpgrade to a paid plan for more credits, rollover, and extra credit purchases!",

  // Additional common questions
  "how do credits work": 
    "Credits are used for AI-powered tools:\n\n• Each tool costs 1-5 credits\n• Paid plans include monthly credits\n• Unused credits roll over (up to 2× limit)\n• Extra credits: $5 for 20, $10 for 40, $15 for 60\n\nExplore Mode: 5 free credits/month, no rollover",

  "what tools are available": 
    "PivotHub offers 9 tool categories:\n\n📊 Assess It - Career/skills assessments\n📝 Prep It - Resume/interview coaching\n📚 Learn It - Skills courses (free!)\n🏢 Build It - Business planning tools\n👨‍🏫 Teach It - Teaching materials\n🚀 Launch It - Startup resources\n💰 Fund It - Grant finding\n💵 Earn It - Side income blueprint\n📅 Schedule It & Host It - Event tools\n\nVisit /pricing for full details!",

  "cancel subscription":
    "To cancel your subscription:\n1. Go to Settings → Subscription\n2. Click 'Cancel Subscription'\n3. Confirm cancellation\n\nYou'll retain access until your billing period ends. Credits don't refund but stay active until expiration.",

  "refund policy":
    "Refund requests are handled case-by-case. Please contact:\n\n📧 support@pivothub.io\n📞 269.998.4203\n\nInclude your account email and reason for refund. We typically respond within 1-2 business days.",

  "upgrade plan":
    "To upgrade your plan:\n1. Go to /pricing\n2. Select your desired plan\n3. Click 'Choose Plan'\n4. Complete checkout\n\nYour new credits take effect immediately, and we prorate any existing subscription!",

  "what is rollover":
    "Credit Rollover (paid plans only):\n\n✅ Unused credits carry to next month\n✅ Can accumulate up to 2× your monthly limit\n✅ Example: 75 credit plan can hold max 150 credits\n\n⚠️ Explore Mode (free) has NO rollover",
};

const FAQS: string[] = [
  "How do I reset my password?",
  "How do I update billing or cancel?",
  "Where can I view pricing and plans?",
  "How do I contact support?",
  "What is Explore Mode?",
];

export const ContactChatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm PivotHub's support assistant. I can help you with:\n\n• Account & subscription questions\n• Platform navigation\n• Pricing & billing\n• Tool explanations\n• Contact information\n\nClick a quick action, select an FAQ, or type your question!\n\n💡 Want personalized follow-up? Share your email anytime by typing 'my email is [your@email.com]'",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickAction = (action: string) => {
    navigate(action);
    setIsOpen(false);
  };

  const handleFaqClick = (question: string) => {
    console.log("FAQ clicked:", question);
    // Clear any existing input and send the FAQ question
    setInput("");
    handleSend(question);
  };

  const handleSend = async (prompt?: string) => {
    const finalInput = (prompt ?? input).trim();
    if (!finalInput || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: finalInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Check if user is providing their email
    const emailMatch = finalInput.match(/(?:my email is |email:|contact me at )?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    
    if (emailMatch) {
      const email = emailMatch[1];
      setUserEmail(email);
      
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: `Thanks! I've saved ${email} for follow-up. Our support team can reach you there if needed.\n\nHow else can I help you today?`,
            timestamp: new Date() 
          },
        ]);
        setIsLoading(false);
      }, 300);
      return;
    }

    // Simulate brief typing delay for better UX
    setTimeout(() => {
      const response = getStaticResponse(finalInput);
      
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, timestamp: new Date() },
      ]);
      
      setIsLoading(false);
    }, 300);
  };

  // Static response matcher - no AI, no API, no credits
  const getStaticResponse = (userInput: string): string => {
    const input = userInput.toLowerCase().trim();
    console.log("Looking for response to:", input);

    // Direct FAQ match
    for (const [question, answer] of Object.entries(FAQ_RESPONSES)) {
      if (input === question.toLowerCase()) {
        console.log("Found exact match:", question);
        return answer;
      }
    }

    // Keyword-based matching
    if (input.includes("password") || input.includes("reset")) {
      return FAQ_RESPONSES["How do I reset my password?"];
    }
    
    if (input.includes("cancel") || input.includes("unsubscribe")) {
      return FAQ_RESPONSES["cancel subscription"];
    }
    
    if (input.includes("billing") || input.includes("payment") || input.includes("subscription")) {
      return FAQ_RESPONSES["How do I update billing or cancel?"];
    }
    
    if (input.includes("pricing") || input.includes("plan") || input.includes("cost")) {
      return FAQ_RESPONSES["Where can I view pricing and plans?"];
    }
    
    if (input.includes("support") || input.includes("contact") || input.includes("help") || input.includes("phone") || input.includes("email")) {
      return FAQ_RESPONSES["How do I contact support?"];
    }
    
    if (input.includes("explore mode") || input.includes("free tier") || input.includes("free trial")) {
      return FAQ_RESPONSES["What is Explore Mode?"];
    }
    
    if (input.includes("credit") && (input.includes("work") || input.includes("how"))) {
      return FAQ_RESPONSES["how do credits work"];
    }
    
    if (input.includes("tool") || input.includes("feature") || input.includes("what can")) {
      return FAQ_RESPONSES["what tools are available"];
    }
    
    if (input.includes("refund")) {
      return FAQ_RESPONSES["refund policy"];
    }
    
    if (input.includes("upgrade")) {
      return FAQ_RESPONSES["upgrade plan"];
    }
    
    if (input.includes("rollover")) {
      return FAQ_RESPONSES["what is rollover"];
    }

    // Default response with helpful links
    return `I'm a support assistant with pre-programmed responses for common questions. I couldn't find a match for your question.

Here's how I can help:
• Account & subscription questions
• Pricing & billing info
• Platform navigation
• Tool explanations
• Contact information

For personalized support, please contact:
📧 support@pivothub.io
📞 269.998.4203
🕒 Mon-Fri, 9 AM - 6 PM EST

Try clicking an FAQ button or asking about: pricing, credits, tools, cancellation, support, or password reset.

💡 Want us to follow up? Share your email by typing "my email is [your@email.com]"`;
  };

  return (
    <>
      {/* Floating Chat Button with Pulse Animation */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
        <Button
          onClick={() => setIsOpen(true)}
          className="relative h-16 w-16 rounded-full shadow-2xl hover:scale-110 transition-transform bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-8 w-8" />
        </Button>
        <div className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce">
          ?
        </div>
      </div>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                PivotHub Assistant
              </SheetTitle>
            </div>
          </SheetHeader>

          <ScrollArea ref={scrollRef} className="flex-1 p-6">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="px-6 py-3 border-t border-b bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    onClick={() => handleQuickAction(action.action)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* FAQs */}
          <div className="px-6 py-3 border-b bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">FAQs</p>
            <div className="flex flex-wrap gap-2">
              {FAQS.map((q) => (
                <Button
                  key={q}
                  onClick={() => handleFaqClick(q)}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-6 pt-4 border-t">
            {userEmail && (
              <div className="mb-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                📧 Follow-up email: {userEmail}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              No account needed • Free support • No credits used
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
