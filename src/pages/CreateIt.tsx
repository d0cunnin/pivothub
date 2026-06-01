import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Zap, ChevronRight, ChevronLeft, Download, RefreshCw, Save,
  Sparkles, Rocket, FileText, Trash2, Copy, Check, ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import heroImage from "@/assets/hero-image.jpg";
import {
  BLUEPRINT_SECTIONS, CreateItBlueprint, CreateItFormData, EMPTY_FORM,
} from "@/types/createit";
import { downloadCreateItBlueprintPDF } from "@/lib/CreateItBlueprintPDF";

const TOOL_NAME = "create-it-blueprint";
const CREDIT_COST = 70;
const TOTAL_STEPS = 7;

const TARGET_AUDIENCE_EXAMPLES = [
  "Small Businesses", "Students", "Nonprofits", "Churches",
  "Entrepreneurs", "Healthcare Professionals", "Creators", "Government Agencies",
];

const PRIMARY_PURPOSES = [
  "Productivity", "Business", "Education", "Healthcare", "AI & Automation",
  "Community", "Marketplace", "Creative", "Government", "Nonprofit", "Custom",
];

const CORE_FEATURES = [
  "Authentication", "Dashboard", "User Profiles", "AI Chatbots", "Knowledge Base",
  "File Storage", "Notifications", "Messaging", "Community Forum", "Analytics",
  "Calendar", "Payments", "Subscriptions", "Marketplace", "Booking System",
  "Courses", "Video Content", "CRM", "Reports", "Admin Panel",
];

const PLATFORM_TYPES = ["Web Application", "Mobile Application", "Both"];
const TARGET_PLATFORMS = ["iOS", "Android", "Desktop", "Progressive Web App"];

const MONETIZATION_TYPES = [
  "Free", "Subscription", "One-Time Purchase", "Membership", "Freemium",
  "Advertising", "Commission", "Marketplace Fees", "Custom",
];

const INTEGRATIONS = [
  "Stripe", "Supabase", "Clerk", "Firebase", "OpenAI", "Anthropic", "Gemini",
  "Resend", "Twilio", "Zapier", "Make", "Airtable", "Notion", "Webflow",
  "Lovable", "GitHub", "Claude Code",
];

const SKILL_LEVELS = [
  { value: "Beginner", description: "New to building — plain explanations and no-code/low-code paths." },
  { value: "Intermediate", description: "Comfortable with tools and basic technical concepts." },
  { value: "Advanced", description: "Experienced developer wanting architectural depth." },
  { value: "Agency", description: "Building for clients — team workflow and delivery focus." },
  { value: "Enterprise", description: "Scale, security, compliance, and observability." },
];

interface SavedBlueprint {
  id: string;
  platform_name: string;
  platform_description: string | null;
  industry: string | null;
  platform_type: string | null;
  blueprint_json: CreateItBlueprint;
  created_at: string;
}

const STEP_TITLES = [
  "Platform Overview", "Core Features", "Platform Type", "Monetization",
  "User Journey", "Integrations", "Builder Skill Level",
];

export default function CreateIt() {
  const { user } = useAuth();
  const { checkAndIncrementUsage, refreshUsage, remainingRequests } = useUsage();
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateItFormData>(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<CreateItBlueprint | null>(null);
  const [view, setView] = useState<"wizard" | "result">("wizard");
  const [history, setHistory] = useState<SavedBlueprint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const update = <K extends keyof CreateItFormData>(key: K, value: CreateItFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleInArray = (key: "features" | "targetPlatforms" | "monetizationTypes" | "integrations", value: string) =>
    setForm((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });

  const loadHistory = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("create_it_blueprints")
        .select("id, platform_name, platform_description, industry, platform_type, blueprint_json, created_at")
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      setHistory((data || []) as unknown as SavedBlueprint[]);
    } catch (err) {
      console.error("Failed to load blueprint history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const validateStep = (s: number): string | null => {
    switch (s) {
      case 1:
        if (!form.appName.trim()) return "Please enter an app name.";
        if (!form.platformDescription.trim()) return "Please describe your platform.";
        if (!form.targetAudience.trim()) return "Please enter a target audience.";
        if (!form.primaryPurpose) return "Please choose a primary purpose.";
        return null;
      case 2:
        if (form.features.length === 0 && !form.customFeature.trim())
          return "Select at least one core feature.";
        return null;
      case 3:
        if (!form.platformType) return "Please choose a platform type.";
        return null;
      case 7:
        if (!form.skillLevel) return "Please choose your builder skill level.";
        return null;
      default:
        return null;
    }
  };

  const next = () => {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleGenerate = async () => {
    if (!user) {
      toast.error("Please sign in to use Create It");
      return;
    }
    // Validate every step before generating.
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const error = validateStep(s);
      if (error) {
        setStep(s);
        toast.error(error);
        return;
      }
    }

    setGenerating(true);
    try {
      // Verify credits >= 70 and deduct atomically (also writes the usage log).
      const { canUse, reason } = await checkAndIncrementUsage(TOOL_NAME);
      if (!canUse) {
        toast.error(
          reason === "not_logged_in"
            ? "Please sign in to use this tool."
            : `Insufficient credits. Create It costs ${CREDIT_COST} credits.`,
        );
        setGenerating(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Your session expired. Please sign in again.");
        setGenerating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-create-it-blueprint", {
        body: form,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || "Failed to generate blueprint");
      }
      if (!data?.blueprint) {
        throw new Error("The blueprint came back empty. Please try again.");
      }

      setBlueprint(data.blueprint as CreateItBlueprint);
      setView("result");
      await refreshUsage();
      await loadHistory();
      toast.success("Your AI platform blueprint is ready!");
    } catch (err) {
      console.error("Error generating blueprint:", err);
      toast.error(err instanceof Error ? err.message : "Failed to generate blueprint");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!blueprint) return;
    try {
      downloadCreateItBlueprintPDF({
        form,
        blueprint,
        userName: (user?.user_metadata?.display_name as string) || user?.email || undefined,
      });
      toast.success("Blueprint downloaded as PDF!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Could not generate the PDF. Please try again.");
    }
  };

  const handleSave = async () => {
    if (!blueprint || !user) return;
    try {
      const { error } = await supabase.from("create_it_blueprints").insert({
        user_id: user.id,
        platform_name: form.appName,
        platform_description: form.platformDescription,
        industry: form.primaryPurpose || null,
        platform_type: form.platformType || null,
        blueprint_json: blueprint as unknown as Record<string, unknown>,
      });
      if (error) throw error;
      await loadHistory();
      toast.success("Saved to your blueprint history!");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Could not save the blueprint.");
    }
  };

  const handleRegenerate = () => {
    setBlueprint(null);
    setView("wizard");
    handleGenerate();
  };

  const handleCreateAnother = () => {
    setForm(EMPTY_FORM);
    setBlueprint(null);
    setStep(1);
    setView("wizard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const viewSaved = (saved: SavedBlueprint) => {
    setForm({
      ...EMPTY_FORM,
      appName: saved.platform_name,
      platformDescription: saved.platform_description || "",
      primaryPurpose: saved.industry || "",
      platformType: saved.platform_type || "",
    });
    setBlueprint(saved.blueprint_json);
    setView("result");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSaved = async (id: string) => {
    try {
      const { error } = await supabase.from("create_it_blueprints").delete().eq("id", id);
      if (error) throw error;
      setHistory((prev) => prev.filter((b) => b.id !== id));
      toast.success("Blueprint deleted.");
    } catch (err) {
      toast.error("Could not delete the blueprint.");
    }
  };

  const copyBuildPrompt = async () => {
    if (!blueprint?.aiBuildPrompt) return;
    await navigator.clipboard.writeText(blueprint.aiBuildPrompt);
    setCopied(true);
    toast.success("AI build prompt copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  // ----------------------- Render helpers -----------------------

  const renderCheckboxGrid = (
    options: string[],
    selected: string[],
    key: "features" | "targetPlatforms" | "monetizationTypes" | "integrations",
  ) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {options.map((option) => (
        <div
          key={option}
          onClick={() => toggleInArray(key, option)}
          className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
            selected.includes(option)
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
        >
          <Checkbox checked={selected.includes(option)} onCheckedChange={() => toggleInArray(key, option)} />
          <span className="text-sm">{option}</span>
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <Label>App Name *</Label>
              <Input
                value={form.appName}
                onChange={(e) => update("appName", e.target.value)}
                placeholder="e.g. SkillBridge"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Platform Description *</Label>
              <Textarea
                value={form.platformDescription}
                onChange={(e) => update("platformDescription", e.target.value)}
                placeholder="Describe what your platform does and the value it delivers."
                className="mt-1 min-h-[110px]"
              />
            </div>
            <div>
              <Label>Target Audience *</Label>
              <Input
                value={form.targetAudience}
                onChange={(e) => update("targetAudience", e.target.value)}
                placeholder="Who is this for?"
                className="mt-1"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {TARGET_AUDIENCE_EXAMPLES.map((ex) => (
                  <Badge
                    key={ex}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => update("targetAudience", ex)}
                  >
                    {ex}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Primary Purpose *</Label>
              <Select value={form.primaryPurpose} onValueChange={(v) => update("primaryPurpose", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {PRIMARY_PURPOSES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">Select the core features your platform needs.</p>
            {renderCheckboxGrid(CORE_FEATURES, form.features, "features")}
            <div>
              <Label>Custom Feature</Label>
              <Input
                value={form.customFeature}
                onChange={(e) => update("customFeature", e.target.value)}
                placeholder="Describe any additional feature unique to your platform"
                className="mt-1"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Platform Type *</Label>
              <RadioGroup value={form.platformType} onValueChange={(v) => update("platformType", v)} className="grid sm:grid-cols-3 gap-3">
                {PLATFORM_TYPES.map((t) => (
                  <div
                    key={t}
                    onClick={() => update("platformType", t)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      form.platformType === t ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={t} id={`pt-${t}`} />
                    <Label htmlFor={`pt-${t}`} className="cursor-pointer">{t}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="mb-2 block">Target Platforms</Label>
              {renderCheckboxGrid(TARGET_PLATFORMS, form.targetPlatforms, "targetPlatforms")}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Monetization Type</Label>
              {renderCheckboxGrid(MONETIZATION_TYPES, form.monetizationTypes, "monetizationTypes")}
            </div>
            <div>
              <Label>Pricing Information</Label>
              <Textarea
                value={form.pricingInfo}
                onChange={(e) => update("pricingInfo", e.target.value)}
                placeholder="e.g. $9/month, $29/month, Enterprise Pricing, Custom Quote"
                className="mt-1"
              />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <Label>Describe the User Journey</Label>
            <p className="text-sm text-muted-foreground">
              How do users move through your platform from start to value?
            </p>
            <Textarea
              value={form.userJourney}
              onChange={(e) => update("userJourney", e.target.value)}
              placeholder={"User signs up\n→ Creates profile\n→ Uploads resume\n→ AI analyzes skills\n→ Receives recommendations\n→ Downloads report"}
              className="mt-1 min-h-[180px]"
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Integrations</Label>
              <p className="text-sm text-muted-foreground mb-3">Select the services you want to connect.</p>
              {renderCheckboxGrid(INTEGRATIONS, form.integrations, "integrations")}
            </div>
            <div>
              <Label>Custom Integration</Label>
              <Input
                value={form.customIntegration}
                onChange={(e) => update("customIntegration", e.target.value)}
                placeholder="Any other API or service you plan to integrate"
                className="mt-1"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-3">
            <Label className="mb-2 block">Builder Skill Level *</Label>
            <p className="text-sm text-muted-foreground mb-2">This sets the technical depth of your blueprint.</p>
            <RadioGroup value={form.skillLevel} onValueChange={(v) => update("skillLevel", v)} className="space-y-3">
              {SKILL_LEVELS.map((level) => (
                <div
                  key={level.value}
                  onClick={() => update("skillLevel", level.value)}
                  className={`flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    form.skillLevel === level.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={level.value} id={`skill-${level.value}`} className="mt-1" />
                  <div>
                    <Label htmlFor={`skill-${level.value}`} className="cursor-pointer font-medium">{level.value}</Label>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      default:
        return null;
    }
  };

  // ----------------------- Sign-in gate -----------------------
  if (!user) {
    return (
      <>
        <Helmet>
          <title>Create It - AI Platform Blueprint Generator | PivotHub</title>
        </Helmet>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-20 flex items-center justify-center">
            <Card className="max-w-lg w-full text-center">
              <CardHeader>
                <Sparkles className="h-12 w-12 mx-auto text-primary mb-3" />
                <CardTitle className="text-2xl">Create It — AI Startup Architect</CardTitle>
                <CardDescription>
                  Sign in to design a complete, build-ready blueprint for your AI-powered platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button size="lg" className="w-full" onClick={() => navigate("/auth")}>
                  Sign In to Get Started <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create It - AI Platform Blueprint Generator | PivotHub</title>
        <meta name="description" content="Design a complete, build-ready blueprint for your AI-powered platform. Tech stack, architecture, roadmap, monetization, and a ready-to-paste AI build prompt." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero */}
        <section className="relative h-[320px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroImage} alt="Create It" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80" />
          </div>
          <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
            <Badge className="mb-4 bg-white/15 text-white border-white/30">CREATE IT · AI STARTUP ARCHITECT</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Build Your AI Platform Blueprint</h1>
            <p className="text-lg text-white/90 mb-4">
              A complete, build-ready plan you can hand to a developer, agency, or AI builder.
            </p>
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Zap className="h-4 w-4 mr-2" /> {CREDIT_COST} Credits
            </Badge>
          </div>
        </section>

        <main className="flex-grow container mx-auto px-4 py-10 max-w-5xl">
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="history">My Blueprints {history.length > 0 && `(${history.length})`}</TabsTrigger>
            </TabsList>

            {/* ---------------- Create tab ---------------- */}
            <TabsContent value="create">
              {view === "wizard" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {step}
                        </span>
                        {STEP_TITLES[step - 1]}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">Step {step} of {TOTAL_STEPS}</span>
                    </div>
                    <Progress value={(step / TOTAL_STEPS) * 100} />
                  </CardHeader>
                  <CardContent>
                    {renderStep()}

                    <div className="flex items-center justify-between mt-8">
                      <Button variant="outline" onClick={back} disabled={step === 1 || generating}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Back
                      </Button>

                      {step < TOTAL_STEPS ? (
                        <Button onClick={next} disabled={generating}>
                          Next <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button onClick={handleGenerate} disabled={generating}>
                          {generating ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Blueprint...</>
                          ) : (
                            <><Sparkles className="mr-2 h-4 w-4" /> Generate Blueprint ({CREDIT_COST} credits)</>
                          )}
                        </Button>
                      )}
                    </div>

                    {step === TOTAL_STEPS && (
                      <p className="text-xs text-muted-foreground mt-3 text-right">
                        You have {remainingRequests} credits available.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {view === "result" && blueprint && (
                <div className="space-y-6">
                  {/* Success header */}
                  <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3 mb-4">
                        <Rocket className="h-8 w-8 text-primary mt-1" />
                        <div>
                          <h2 className="text-2xl font-bold">{form.appName || "Your Platform"}</h2>
                          <p className="text-muted-foreground">Your AI platform blueprint is ready.</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button onClick={handleDownload}>
                          <Download className="mr-2 h-4 w-4" /> Download PDF
                        </Button>
                        <Button variant="outline" onClick={handleRegenerate} disabled={generating}>
                          {generating
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Regenerating...</>
                            : <><RefreshCw className="mr-2 h-4 w-4" /> Regenerate</>}
                        </Button>
                        <Button variant="outline" onClick={handleSave}>
                          <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                        <Button variant="ghost" onClick={handleCreateAnother}>
                          <Sparkles className="mr-2 h-4 w-4" /> Create Another
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        Regenerate uses another {CREDIT_COST} credits.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Blueprint viewer */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Blueprint
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="multiple" defaultValue={["executiveSummary"]} className="w-full">
                        {BLUEPRINT_SECTIONS.map(({ key, title }) => {
                          const content = blueprint[key];
                          if (!content) return null;
                          const isBuildPrompt = key === "aiBuildPrompt";
                          return (
                            <AccordionItem key={key} value={key}>
                              <AccordionTrigger className="text-left font-semibold">{title}</AccordionTrigger>
                              <AccordionContent>
                                {isBuildPrompt && (
                                  <Button size="sm" variant="outline" className="mb-3" onClick={copyBuildPrompt}>
                                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    {copied ? "Copied!" : "Copy build prompt"}
                                  </Button>
                                )}
                                <div className={`prose prose-sm max-w-none dark:prose-invert ${isBuildPrompt ? "bg-muted/50 p-4 rounded-lg" : ""}`}>
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* ---------------- History tab ---------------- */}
            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Blueprints</CardTitle>
                  <CardDescription>View, re-download, or remove your previous blueprints.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted animate-pulse rounded" />)}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No saved blueprints yet.</p>
                      <p className="text-sm">Generate your first blueprint to see it here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((b) => (
                        <div key={b.id} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{b.platform_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {b.industry ? `${b.industry} · ` : ""}
                              {new Date(b.created_at).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => viewSaved(b)}>
                              View <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteSaved(b.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {view === "result" && (
            <Alert className="mt-6">
              <AlertDescription className="text-sm text-muted-foreground">
                This blueprint is a guide. Building your platform still requires effort and the ability to follow technical instructions.
                Some recommended services may require paid subscriptions.
              </AlertDescription>
            </Alert>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
