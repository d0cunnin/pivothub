import { ToolIntro, ToolAbout } from "@/components/tool-layout/ToolIntro";
import { GraduationCap as IntroGraduationCap, Search as IntroSearch, Wand2 as IntroWand2 } from "lucide-react";
import { ToolHero } from "@/components/tool-layout/ToolHero";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import { PromptBasicsLessons, PromptChecklist } from "@/components/prompt-it/PromptBasicsLessons";
import { Loader2, Sparkles, AlertCircle, Zap, Download } from "lucide-react";
import { generatePromptItPDF } from '@/lib/pdf-reports/prompt-it';
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { getToolCreditCost } from "@/utils/toolCreditWeights";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.jpg";
import { ToolGuard } from "@/components/ToolGuard";

const PromptIt = () => {
  const { user, isAdmin } = useAuth();
  const { remainingRequests } = useUsage();
  const [userPrompt, setUserPrompt] = useState("");
  const [feedback, setFeedback] = useState<{ analysis: string; improvedPrompt: string; explanation: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!user) {
      toast.error("Please sign in to use Prompt It");
      return;
    }

    if (!userPrompt.trim()) {
      toast.error("Please enter a prompt to analyze");
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      // Check balance only; credits are deducted by the backend after a successful result
      if (!isAdmin && remainingRequests < getToolCreditCost('prompt-it')) {
        toast.error('Insufficient credits. Please upgrade or purchase credits.');
        setIsLoading(false);
        return;
      }

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use this tool");
        setIsLoading(false);
        return;
      }

      const { data, error } = await invokeFunction('prompt-it', {
        body: { prompt: userPrompt },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || data?.error) {
        console.error('Edge function error:', error);
        
        const errorMsg = error?.message || data?.error || 'Failed to analyze prompt';
        if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
          toast.error('Rate limit exceeded. Please try again later.');
        } else if (errorMsg.includes('402') || errorMsg.includes('credits')) {
          toast.error('Insufficient credits. Please upgrade or purchase credits.');
        } else {
          toast.error(errorMsg);
        }
        setIsLoading(false);
        return;
      }

      if (!data?.analysis || !data?.improvedPrompt || !data?.explanation) {
        toast.error('Incomplete response. Please try again.');
        setIsLoading(false);
        return;
      }

      const totalContent = `${data.analysis} ${data.improvedPrompt} ${data.explanation}`;
      if (totalContent.length < 200) {
        toast.error('Response too short. Please try again.');
        setIsLoading(false);
        return;
      }

      setFeedback(data);
      toast.success("Prompt analyzed successfully!");
    } catch (error: any) {
      console.error('Error analyzing prompt:', error);
      toast.error(error.message || "Failed to analyze prompt");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPromptAnalysisPDF = () => {
    if (!feedback) return;

    try {
      const doc = generatePromptItPDF(userPrompt, feedback);
      doc.save(`prompt-analysis-${Date.now()}.pdf`);
      toast.success('Prompt analysis exported to PDF!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <ToolHero
        badge="PROMPT IT · AI PROMPTING"
        title="The Art of Talking to AI"
        subtitle="Learn how professionals communicate with AI. Master the language of prompting so every response is smart, relevant, and specific"
        credits={"1 Credit"}
      />
      <ToolIntro about='Learn how to talk to AI tools like a professional. Read the lessons, then paste in your own prompt and get it analyzed and improved.' forWho='Anyone who uses ChatGPT, Gemini, or other AI tools and wants better answers.' items={[{ icon: IntroGraduationCap, name: 'Prompt lessons', description: 'Free lessons with examples, common mistakes, and a checklist.' }, { icon: IntroSearch, name: 'Prompt analysis', description: 'A review of your prompt showing what is strong and what is missing.' }, { icon: IntroWand2, name: 'Improved prompt', description: 'A rewritten prompt you can copy and use right away.' }]} />

      <main id="prompt-content" className="flex-grow container mx-auto px-4 py-12">
        <ToolGuard toolName="prompt-it">
          {/* Collapsible Lesson: Prompt Engineering Basics */}
          <Card className="mb-8 bg-gradient-card/30 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Prompt Engineering Basics</CardTitle>
              <CardDescription>Learn the fundamentals of effective AI prompting</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <PromptBasicsLessons />
              </Accordion>
              <PromptChecklist />
            </CardContent>
          </Card>

          {/* Credit Information */}
          <Card className="mb-8 bg-gradient-card/30 backdrop-blur-sm border border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Your Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-muted-foreground mb-1">
                    Each analysis costs <span className="font-bold text-foreground">1 credit</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    (5 credits for 5 uses)
                  </p>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">Total Credits Available</p>
                  <p className="text-3xl font-bold text-accent">{remainingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credit Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="text-lg px-6 py-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              1 Credit per Analysis
            </Badge>
          </div>

          {/* Two-Pane Practice Interface */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left Pane: User Input */}
            <Card className="bg-gradient-card/30 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle>Your Prompt</CardTitle>
                <CardDescription>Write your prompt below to get expert feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Write your prompt here... Example: 'Write about teamwork.'"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="min-h-[300px] bg-background/50"
                />
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isLoading || !userPrompt.trim() || (!isAdmin && remainingRequests <= 0)}
                  className="w-full mt-4"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Prompt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Right Pane: Expert Feedback */}
            <Card className="bg-gradient-card/30 backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle>Expert Feedback</CardTitle>
                <CardDescription>AI-powered analysis from a world-class prompt engineer</CardDescription>
              </CardHeader>
              <CardContent>
                {feedback ? (
                  <div className="space-y-6">
                    <div className="flex justify-end mb-4">
                      <Button onClick={downloadPromptAnalysisPDF} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-accent">Analysis</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{feedback.analysis}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-accent">Improved Prompt</h3>
                      <div className="bg-background/50 p-4 rounded-lg border border-accent/20">
                        <p className="whitespace-pre-wrap">{feedback.improvedPrompt}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 text-accent">Explanation</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{feedback.explanation}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Enter a prompt on the left and click "Analyze Prompt" to see professional feedback here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </ToolGuard>
      </main>

      <Footer />
    </div>
  );
};

export default PromptIt;
