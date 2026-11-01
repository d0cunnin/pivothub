import { ToolIntro, ToolAbout } from "@/components/tool-layout/ToolIntro";
import { Bot as IntroBot, ListChecks as IntroListChecks, MessageSquare as IntroMessageSquare } from "lucide-react";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Bot, Download, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateDeployItPDF } from '@/lib/pdf-reports/deploy-it';
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { getToolCreditCost } from "@/utils/toolCreditWeights";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.jpg";
import { ToolGuard } from "@/components/ToolGuard";
import { ToolPurposeComparison } from "@/components/tool-layout/ToolPurposeComparison";

const DeployIt = () => {
  const { user, isAdmin } = useAuth();
  const { remainingRequests } = useUsage();
  const [formData, setFormData] = useState({
    agentName: "",
    purpose: "",
    whoItHelps: "",
    tone: "",
    tools: [] as string[],
    safetyRules: "",
    platform: "not-sure"
  });
  const [guide, setGuide] = useState<{ guide: string; platform: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toneOptions = [
    "Professional",
    "Friendly",
    "Casual",
    "Formal",
    "Empathetic",
    "Humorous",
    "Encouraging"
  ];

  const platformOptions = [
    { value: "not-sure", label: "Not sure: recommend one for me" },
    { value: "chatgpt", label: "ChatGPT (custom GPT)" },
    { value: "gemini", label: "Google Gemini (Gem)" },
    { value: "claude", label: "Claude (Project)" },
    { value: "copilot", label: "Microsoft Copilot (agent)" },
    { value: "automation", label: "Zapier or Make (automation)" },
  ];

  const toolOptions = [
    "Gmail",
    "Google Drive",
    "Google Calendar",
    "Slack",
    "Microsoft Teams",
    "Notion",
    "Trello",
    "GitHub"
  ];

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please sign in to use Deploy It");
      return;
    }

    if (!formData.agentName || !formData.purpose || !formData.whoItHelps) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setGuide(null);

    try {
      // Check balance only; credits are deducted by the backend after a successful result
      if (!isAdmin && remainingRequests < getToolCreditCost('deploy-it')) {
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

      const { data, error } = await invokeFunction('deploy-it', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'We could not create your guide. Please try again.');
      }

      if (!data?.guide) {
        throw new Error('We could not create your guide. Please try again. You were not charged.');
      }

      setGuide(data);
      toast.success("Your setup guide is ready!");
    } catch (error: any) {
      console.error('Error generating guide:', error);
      toast.error(error.message || "We could not create your guide. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBlueprintPDF = () => {
    if (!guide) return;
    
    try {
      const doc = generateDeployItPDF({ ...formData, platform: guide.platform }, guide.guide);
      doc.save(`${formData.agentName.replace(/[^a-z0-9]/gi, '_')}_AI_Agent_Setup_Guide.pdf`);
      toast.success('Setup guide downloaded as PDF!');
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
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-4 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">DEPLOY IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
              Deploy It — AI Assistant Setup Guide
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '0.2s' }}>
              Get instructions and a PDF guide to set up your own AI assistant—not website hosting or a finished chatbot.
            </p>
          </div>
        </div>
      </section>
      <ToolIntro about="Describe the assistant you want—for example, a helper that drafts customer replies or explains lessons. Pick ChatGPT, Gemini, Claude, or another supported platform (or ask for a recommendation). Get ready-to-paste instructions and a downloadable PDF setup guide. You create the assistant yourself using your own account on that platform; some features may require a separate paid plan." forWho='Business owners, educators, and creators who want a task-focused AI assistant without starting from scratch.' steps={['Describe what your assistant should do and who it helps.', 'Get personalized instructions and download your setup guide.', 'Follow the guide in your own account on the recommended platform.']} items={[{ icon: IntroBot, name: 'Assistant design', description: 'Its purpose, audience, tone, and safety rules.' }, { icon: IntroListChecks, name: 'PDF setup guide', description: 'Steps to follow on your chosen platform—not automatic deployment.' }, { icon: IntroMessageSquare, name: 'Ready-to-paste instructions', description: 'Instructions that tell your assistant how to respond.' }]} />
      <ToolPurposeComparison />

      <main id="deploy-content" className="flex-grow container mx-auto px-4 py-12">
        <ToolGuard toolName="deploy-it">
          <Alert className="mb-8 border-primary/30 bg-primary/5">
            <AlertDescription>
              <p className="font-semibold mb-1">How this works</p>
              <p>PivotHub writes your plan, the instructions to paste in, and the setup steps. You then create the assistant yourself on the platform you choose, using your own account there. Some platforms and features need a paid plan, and the guide tells you when.</p>
            </AlertDescription>
          </Alert>

          {/* Understanding AI Agents Section */}
          <Card className="mb-12 bg-gradient-card/30 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle>Understanding AI Agents</CardTitle>
              <CardDescription>Learn the fundamentals of AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="what-is-agent">
                  <AccordionTrigger>What is an AI Agent?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">
                      An AI assistant follows instructions to help with a specific task, such as drafting replies, explaining lessons, or summarizing information. Some platforms also support actions like scheduling or organizing files, but those require separate connections and permissions. Deploy It provides the instructions and setup guide; it does not connect your accounts or perform those actions for you.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="how-work">
                  <AccordionTrigger>How Your Setup Guide Becomes an Assistant</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
                      <li><strong className="text-foreground">Choose a goal:</strong> For example, help draft replies to customer questions.</li>
                      <li><strong className="text-foreground">Get your guide:</strong> PivotHub writes setup steps and assistant instructions.</li>
                      <li><strong className="text-foreground">Open your platform:</strong> Sign in to your own ChatGPT, Gemini, Claude, or other chosen account.</li>
                      <li><strong className="text-foreground">Set it up:</strong> Follow the guide and paste in the instructions. Configure any optional connections yourself.</li>
                      <li><strong className="text-foreground">Test and review:</strong> Try sample questions and check the answers before relying on the assistant.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="use-cases">
                  <AccordionTrigger>Example Use Cases</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <p className="font-semibold text-foreground">Education:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          <li>Tutor Agent: Answers student questions and creates practice quizzes</li>
                          <li>Research Assistant: Finds and summarizes academic papers</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Business:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          <li>Customer Service Agent: Handles support tickets automatically</li>
                          <li>Sales Assistant: Schedules meetings and follows up with leads</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Content Creation:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                          <li>Social Media Manager: Posts content on schedule and responds to comments</li>
                          <li>Writing Assistant: Drafts blog posts based on your outline</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="safety">
                  <AccordionTrigger>Safety, Privacy, and Ethics Checklist</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 text-muted-foreground">
                      <p className="font-semibold text-foreground">Before deploying your agent, check:</p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-foreground">Data Privacy:</strong> What information does your agent access? Is it sensitive?</li>
                        <li><strong className="text-foreground">Permissions:</strong> Only give your agent access to what it needs</li>
                        <li><strong className="text-foreground">Transparency:</strong> Make sure users know they're talking to an AI</li>
                        <li><strong className="text-foreground">Monitoring:</strong> Regularly check what your agent is doing</li>
                        <li><strong className="text-foreground">Limits:</strong> Set boundaries on what actions it can take without asking you first</li>
                        <li><strong className="text-foreground">Backup:</strong> Have a way to stop or override the agent if needed</li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="troubleshooting">
                  <AccordionTrigger>Troubleshooting & Improvement Tips</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <p className="font-semibold text-foreground">Agent not understanding instructions?</p>
                        <p>→ Make your instructions more specific and add examples</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Agent making mistakes?</p>
                        <p>→ Review its actions and adjust the safety rules or permissions</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Agent too slow?</p>
                        <p>→ Simplify the task or break it into smaller steps</p>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Want to improve results?</p>
                        <p>→ Give the agent clear examples of good vs. bad outputs</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Input Form */}
          <Card className="mb-8 bg-gradient-card/30 backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-accent" />
                Describe Your AI Assistant
              </CardTitle>
              <CardDescription>
                Tell us what you want it to do. You'll get a step-by-step setup guide you can also download as a PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name / Purpose *</Label>
                <Input
                  id="agentName"
                  placeholder="e.g., Email Organizer"
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">What it should do *</Label>
                <Textarea
                  id="purpose"
                  placeholder="e.g., Sort my emails into folders and summarize them every morning"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whoItHelps">Who it helps *</Label>
                <Input
                  id="whoItHelps"
                  placeholder="e.g., Busy professionals, students, small business owners"
                  value={formData.whoItHelps}
                  onChange={(e) => setFormData({ ...formData, whoItHelps: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone / Personality</Label>
                <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map(tone => (
                      <SelectItem key={tone} value={tone.toLowerCase()}>{tone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Where do you want to build it?</Label>
                <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value })}>
                  <SelectTrigger id="platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platformOptions.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tools to connect (optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {toolOptions.map(tool => (
                    <Button
                      key={tool}
                      variant={formData.tools.includes(tool) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newTools = formData.tools.includes(tool)
                          ? formData.tools.filter(t => t !== tool)
                          : [...formData.tools, tool];
                        setFormData({ ...formData, tools: newTools });
                      }}
                    >
                      {tool}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="safetyRules">Safety rules or limits</Label>
                <Textarea
                  id="safetyRules"
                  placeholder="e.g., Never delete emails without asking, only access work emails"
                  value={formData.safetyRules}
                  onChange={(e) => setFormData({ ...formData, safetyRules: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-between mb-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-center gap-3">
                <Badge variant="default" className="text-base px-4 py-2">
                  <Zap className="h-4 w-4 mr-2" />
                  3 Credits
                </Badge>
                  <span className="text-sm text-muted-foreground">
                    Only charged when your guide is ready. Downloads as PDF.
                  </span>
                </div>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isLoading || !formData.agentName || !formData.purpose || !formData.whoItHelps}
                size="lg"
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Writing Your Guide (about a minute)...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Create My Setup Guide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* AI Output Section */}
          {guide && (
            <Card className="mb-8 bg-gradient-card/30 backdrop-blur-sm border border-accent/20">
              <CardHeader>
                <CardTitle className="text-accent">Your AI Assistant Setup Guide</CardTitle>
                <CardDescription>Platform: {guide.platform}. Menus change often; if a step looks different, check the platform's help page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert bg-background/50 p-6 rounded-lg border border-accent/20 prose-pre:whitespace-pre-wrap prose-pre:bg-muted prose-pre:text-foreground">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto not-prose my-4">
                          <table className="w-full text-sm border-collapse [&_th]:border [&_td]:border [&_th]:p-2 [&_td]:p-2 [&_th]:bg-muted [&_th]:text-left" {...props} />
                        </div>
                      ),
                    }}
                  >
                    {guide.guide}
                  </ReactMarkdown>
                </div>

                <div className="pt-6 border-t border-accent/20">
                  <Button onClick={downloadBlueprintPDF} size="lg" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Download Setup Guide as PDF
                  </Button>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    PivotHub does not store your guide, so keep your copy.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

        </ToolGuard>
      </main>

      <Footer />
    </div>
  );
};

export default DeployIt;
