import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Sparkles, AlertCircle, Zap, Download } from "lucide-react";
import jsPDF from 'jspdf';
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.jpg";
import { ToolGuard } from "@/components/ToolGuard";

const PromptIt = () => {
  const { user } = useAuth();
  const { checkAndIncrementUsage, remainingRequests } = useUsage();
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
      // Check credits and usage
      const canUse = await checkAndIncrementUsage('prompt-it');
      if (!canUse) {
        toast.error("Insufficient credits. Please upgrade or purchase credits.");
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

      const { data, error } = await supabase.functions.invoke('prompt-it', {
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
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 72;
      const maxLineWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, maxLineWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        
        yPosition += 5;
      };

      // Title
      addText('PROMPT ENGINEERING ANALYSIS', 18, true);
      addText(`Generated: ${new Date().toLocaleDateString()}`, 10);
      yPosition += 10;

      // Original Prompt
      addText('YOUR ORIGINAL PROMPT:', 14, true);
      addText(userPrompt, 11);
      yPosition += 10;

      // Analysis
      addText('EXPERT ANALYSIS:', 14, true);
      addText(feedback.analysis, 11);
      yPosition += 10;

      // Improved Prompt
      addText('IMPROVED PROMPT:', 14, true);
      addText(feedback.improvedPrompt, 11);
      yPosition += 10;

      // Explanation
      addText('WHY IT WORKS:', 14, true);
      addText(feedback.explanation, 11);

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated by HireYourself Platform | Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

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
      <section className="py-20 bg-primary relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
        <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">PROMPT IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              The Art of Talking to AI
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-4 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Learn how professionals communicate with AI
            </p>
            <p className="text-lg md:text-xl text-white/80 mb-10 animate-fade-in max-w-3xl mx-auto" style={{ animationDelay: '0.3s' }}>
              Master the language of prompting so every response is smart, relevant, and specific
            </p>
          </div>
        </div>
      </section>

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
                <AccordionItem value="what-is-prompt">
                  <AccordionTrigger>What is a Prompt?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      A prompt is an instruction you give to AI. Think of it like asking a question to a very knowledgeable assistant. 
                      The clearer and more specific your question, the better the answer you'll receive. A good prompt includes context, 
                      desired format, tone, and any specific requirements.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="structure">
                  <AccordionTrigger>Role + Task + Context + Tone Structure</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-muted-foreground">
                      <p><strong className="text-foreground">Role:</strong> Who should the AI be? (e.g., "You are a professional marketing consultant")</p>
                      <p><strong className="text-foreground">Task:</strong> What do you want? (e.g., "Write a LinkedIn post")</p>
                      <p><strong className="text-foreground">Context:</strong> What's the situation? (e.g., "for small business owners about teamwork")</p>
                      <p><strong className="text-foreground">Tone:</strong> How should it sound? (e.g., "motivational and encouraging")</p>
                      <p className="mt-4"><strong className="text-foreground">Example:</strong> "You are a professional marketing consultant. Write a motivational LinkedIn post for small business owners about how teamwork drives growth. Use an encouraging and actionable tone."</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="when-to-use">
                  <AccordionTrigger>When to Use Examples, Formatting, or Constraints</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-muted-foreground">
                      <p><strong className="text-foreground">Examples:</strong> Show the AI what you want. "Write it like this: [example]"</p>
                      <p><strong className="text-foreground">Formatting:</strong> Specify structure. "Use 3 bullet points" or "Keep it under 100 words"</p>
                      <p><strong className="text-foreground">Constraints:</strong> Set boundaries. "Don't use jargon" or "Avoid technical terms"</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mistakes">
                  <AccordionTrigger>Common Prompt Mistakes</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                      <li><strong className="text-foreground">Too vague:</strong> "Write something about business" → Be specific!</li>
                      <li><strong className="text-foreground">No context:</strong> AI doesn't know your audience or purpose</li>
                      <li><strong className="text-foreground">Missing tone:</strong> Results may not match your brand voice</li>
                      <li><strong className="text-foreground">No format specified:</strong> You might get a wall of text instead of bullets</li>
                      <li><strong className="text-foreground">Assuming AI knows everything:</strong> Provide background information</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="samples">
                  <AccordionTrigger>Prompt Samples by Use Case</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <p className="font-semibold text-foreground">LinkedIn Post:</p>
                        <p className="bg-background/50 p-3 rounded mt-2">"Write a 150-word LinkedIn post for entrepreneurs about overcoming failure. Use an inspirational tone with 3 key takeaways."</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Email Copy:</p>
                        <p className="bg-background/50 p-3 rounded mt-2">"Write a professional follow-up email to a client who requested a proposal last week. Tone should be polite, brief, and action-oriented."</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Technical Documentation:</p>
                        <p className="bg-background/50 p-3 rounded mt-2">"Explain how APIs work to a non-technical audience. Use simple analogies, avoid jargon, and keep it under 200 words."</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Research Summary:</p>
                        <p className="bg-background/50 p-3 rounded mt-2">"Summarize the key findings of this article: [paste article]. Use bullet points and highlight 3 main takeaways."</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="what-is-use">
                  <AccordionTrigger>What is a "Use"?</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-muted-foreground">
                      <p className="font-semibold text-foreground text-lg">1 Use = 1 Complete Analysis</p>
                      <p>Each time you:</p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Type a prompt</li>
                        <li>Click "Analyze Prompt"</li>
                        <li>Receive AI feedback (analysis, improved prompt, and explanation)</li>
                      </ul>
                      <p className="mt-4">...that counts as <strong className="text-foreground">1 use</strong> and costs <strong className="text-foreground">1 credit</strong>.</p>
                      <p className="mt-2 font-semibold text-accent">5 credits = 5 complete prompt analyses</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
                  disabled={isLoading || !userPrompt.trim()}
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
