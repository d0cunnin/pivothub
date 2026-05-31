import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building2, FileText, Users, Target, MessageCircle, 
  Loader2, Download, CheckCircle2, Send, ArrowLeft, ArrowRight,
  Lightbulb, ClipboardList, MapPin, Handshake
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";

// Types
interface ProgramBuilderForm {
  programName: string;
  organizationName: string;
  cityRegion: string;
  problem: string;
  whoAffected: string;
  whyImportant: string;
  ageGroups: string[];
  demographics: string;
  specificGroups: string;
  longTermVision: string;
  outcomes: string;
  mainActivities: string;
  frequency: string;
  deliveryMode: string;
  existingStaff: string;
  facilities: string;
  keyPartners: string;
  startDate: string;
  programLength: string;
  budgetCategories: string;
  fundingSources: string;
}

interface GrantReadinessForm {
  organizationName: string;
  legalStatus: string;
  yearsInOperation: string;
  missionStatement: string;
  visionStatement: string;
  projectName: string;
  projectDescription: string;
  whoItServes: string;
  geographicArea: string;
  staffCapacity: string;
  pastPrograms: string;
  systemsInPlace: string[];
  desiredOutcomes: string;
  measurementPlan: string;
  estimatedCost: string;
  existingFunding: string;
  inKindResources: string;
  supportingData: string;
}

interface CommunityAssessmentForm {
  communityName: string;
  communityType: string;
  focusPopulations: string;
  demographicInfo: string;
  challenges: string[];
  challengesDetails: string;
  existingOrganizations: string;
  traditionsAndCulture: string;
  physicalAssets: string;
  currentPrograms: string;
  whatWorking: string;
  remainingGaps: string;
  howHeard: string[];
  keyThemes: string;
}

interface StakeholderForm {
  projectName: string;
  stakeholderTypes: string[];
  stakeholderDetails: { [key: string]: StakeholderDetail };
  engagementGoals: string;
  timeframe: string;
}

interface StakeholderDetail {
  whyMatter: string;
  influenceLevel: string;
  impactLevel: string;
  engagementLevel: string;
  channels: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AGE_GROUPS = [
  "Children (0-12)",
  "Teens (13-17)",
  "Young Adults (18-25)",
  "Adults (26-54)",
  "Seniors (55+)"
];

const COMMUNITY_CHALLENGES = [
  "Violence/Safety",
  "Unemployment",
  "Food Insecurity",
  "Lack of Youth Programs",
  "Housing Instability",
  "Education Gaps",
  "Healthcare Access",
  "Transportation",
  "Mental Health",
  "Substance Abuse"
];

const STAKEHOLDER_TYPES = [
  "Residents",
  "Youth",
  "Parents/Families",
  "Churches/Faith-Based",
  "Schools",
  "Nonprofits",
  "Local Businesses",
  "City Officials",
  "Funders/Foundations",
  "Healthcare Providers"
];

const SYSTEMS_IN_PLACE = [
  "Accounting/Bookkeeping",
  "Data Tracking",
  "Outcome Reporting",
  "HR/Personnel",
  "Volunteer Management",
  "CRM/Donor Management"
];

const COMMUNITY_VOICE_METHODS = [
  "Surveys",
  "Town Halls",
  "Listening Sessions",
  "Focus Groups",
  "One-on-One Interviews",
  "Informal Conversations",
  "Social Media Feedback"
];

const COMMUNICATION_CHANNELS = [
  "Text/SMS",
  "Email",
  "Social Media",
  "Town Halls",
  "One-on-One Meetings",
  "Flyers/Print",
  "Phone Calls",
  "Community Events"
];

const DevelopIt = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("program-builder");

  // Program Builder State
  const [programStep, setProgramStep] = useState(1);
  const [programLoading, setProgramLoading] = useState(false);
  const [programResult, setProgramResult] = useState<any>(null);
  const [programForm, setProgramForm] = useState<ProgramBuilderForm>({
    programName: "",
    organizationName: "",
    cityRegion: "",
    problem: "",
    whoAffected: "",
    whyImportant: "",
    ageGroups: [],
    demographics: "",
    specificGroups: "",
    longTermVision: "",
    outcomes: "",
    mainActivities: "",
    frequency: "",
    deliveryMode: "",
    existingStaff: "",
    facilities: "",
    keyPartners: "",
    startDate: "",
    programLength: "",
    budgetCategories: "",
    fundingSources: ""
  });

  // Grant Readiness State
  const [grantStep, setGrantStep] = useState(1);
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantResult, setGrantResult] = useState<any>(null);
  const [grantForm, setGrantForm] = useState<GrantReadinessForm>({
    organizationName: "",
    legalStatus: "",
    yearsInOperation: "",
    missionStatement: "",
    visionStatement: "",
    projectName: "",
    projectDescription: "",
    whoItServes: "",
    geographicArea: "",
    staffCapacity: "",
    pastPrograms: "",
    systemsInPlace: [],
    desiredOutcomes: "",
    measurementPlan: "",
    estimatedCost: "",
    existingFunding: "",
    inKindResources: "",
    supportingData: ""
  });

  // Community Assessment State
  const [assessmentStep, setAssessmentStep] = useState(1);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const [assessmentForm, setAssessmentForm] = useState<CommunityAssessmentForm>({
    communityName: "",
    communityType: "",
    focusPopulations: "",
    demographicInfo: "",
    challenges: [],
    challengesDetails: "",
    existingOrganizations: "",
    traditionsAndCulture: "",
    physicalAssets: "",
    currentPrograms: "",
    whatWorking: "",
    remainingGaps: "",
    howHeard: [],
    keyThemes: ""
  });

  // Stakeholder Planner State
  const [stakeholderStep, setStakeholderStep] = useState(1);
  const [stakeholderLoading, setStakeholderLoading] = useState(false);
  const [stakeholderResult, setStakeholderResult] = useState<any>(null);
  const [stakeholderForm, setStakeholderForm] = useState<StakeholderForm>({
    projectName: "",
    stakeholderTypes: [],
    stakeholderDetails: {},
    engagementGoals: "",
    timeframe: ""
  });

  // Coach Chatbot State
  const [coachMessages, setCoachMessages] = useState<ChatMessage[]>([]);
  const [coachInput, setCoachInput] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [coachMessages]);

  // Form update helpers
  const updateProgramForm = (field: keyof ProgramBuilderForm, value: any) => {
    setProgramForm(prev => ({ ...prev, [field]: value }));
  };

  const updateGrantForm = (field: keyof GrantReadinessForm, value: any) => {
    setGrantForm(prev => ({ ...prev, [field]: value }));
  };

  const updateAssessmentForm = (field: keyof CommunityAssessmentForm, value: any) => {
    setAssessmentForm(prev => ({ ...prev, [field]: value }));
  };

  const updateStakeholderForm = (field: keyof StakeholderForm, value: any) => {
    setStakeholderForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (formType: string, field: string, value: string) => {
    if (formType === "program") {
      const current = (programForm as any)[field] as string[];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      updateProgramForm(field as keyof ProgramBuilderForm, updated);
    } else if (formType === "grant") {
      const current = (grantForm as any)[field] as string[];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      updateGrantForm(field as keyof GrantReadinessForm, updated);
    } else if (formType === "assessment") {
      const current = (assessmentForm as any)[field] as string[];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      updateAssessmentForm(field as keyof CommunityAssessmentForm, updated);
    } else if (formType === "stakeholder") {
      const current = (stakeholderForm as any)[field] as string[];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      updateStakeholderForm(field as keyof StakeholderForm, updated);
    }
  };

  const updateStakeholderDetail = (stakeholder: string, field: keyof StakeholderDetail, value: any) => {
    setStakeholderForm(prev => ({
      ...prev,
      stakeholderDetails: {
        ...prev.stakeholderDetails,
        [stakeholder]: {
          ...prev.stakeholderDetails[stakeholder],
          [field]: value
        }
      }
    }));
  };

  const toggleStakeholderChannel = (stakeholder: string, channel: string) => {
    const current = stakeholderForm.stakeholderDetails[stakeholder]?.channels || [];
    const updated = current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel];
    updateStakeholderDetail(stakeholder, "channels", updated);
  };

  // API Handlers
  const handleProgramSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to use Program Builder");
      return;
    }
    setProgramLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-program-design", {
        body: { formData: programForm }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data) throw new Error('No result returned. Please try again.');
      setProgramResult(data);
      toast.success("Program Design generated successfully!");
    } catch (error: any) {
      console.error("Error generating program design:", error);
      toast.error(error.message || "Failed to generate program design");
    } finally {
      setProgramLoading(false);
    }
  };

  const handleGrantSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to use Grant Readiness Tool");
      return;
    }
    setGrantLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-grant-readiness", {
        body: { formData: grantForm }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data) throw new Error('No result returned. Please try again.');
      setGrantResult(data);
      toast.success("Grant Readiness assessment complete!");
    } catch (error: any) {
      console.error("Error assessing grant readiness:", error);
      toast.error(error.message || "Failed to complete assessment");
    } finally {
      setGrantLoading(false);
    }
  };

  const handleAssessmentSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to use Community Assessment Tool");
      return;
    }
    setAssessmentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-community-assessment", {
        body: { formData: assessmentForm }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data) throw new Error('No result returned. Please try again.');
      setAssessmentResult(data);
      toast.success("Community Assessment generated!");
    } catch (error: any) {
      console.error("Error generating assessment:", error);
      toast.error(error.message || "Failed to generate assessment");
    } finally {
      setAssessmentLoading(false);
    }
  };

  const handleStakeholderSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to use Stakeholder Planner");
      return;
    }
    setStakeholderLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-stakeholder-plan", {
        body: { formData: stakeholderForm }
      });
      if (error) throw error;
      setStakeholderResult(data);
      toast.success("Stakeholder Engagement Plan generated!");
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast.error(error.message || "Failed to generate plan");
    } finally {
      setStakeholderLoading(false);
    }
  };

  const handleCoachSend = async () => {
    if (!coachInput.trim() || !user) {
      if (!user) toast.error("Please sign in to use the Coach");
      return;
    }
    const userMessage = coachInput.trim();
    setCoachInput("");
    setCoachMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setCoachLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("community-dev-coach", {
        body: { 
          message: userMessage,
          history: coachMessages
        }
      });
      if (error) throw error;
      setCoachMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error: any) {
      console.error("Error with coach:", error);
      toast.error(error.message || "Failed to get response");
      setCoachMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setCoachLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // Program Builder Steps
  const renderProgramStep = () => {
    switch (programStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programName">Program Name *</Label>
                <Input
                  id="programName"
                  value={programForm.programName}
                  onChange={(e) => updateProgramForm("programName", e.target.value)}
                  placeholder="e.g., Youth Leadership Academy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input
                  id="organizationName"
                  value={programForm.organizationName}
                  onChange={(e) => updateProgramForm("organizationName", e.target.value)}
                  placeholder="Your organization or group"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cityRegion">City/Region or Community Focus *</Label>
                <Input
                  id="cityRegion"
                  value={programForm.cityRegion}
                  onChange={(e) => updateProgramForm("cityRegion", e.target.value)}
                  placeholder="e.g., East Oakland, CA or Rural Appalachia"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Problem & Need</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="problem">What problem are you trying to address? *</Label>
                <Textarea
                  id="problem"
                  value={programForm.problem}
                  onChange={(e) => updateProgramForm("problem", e.target.value)}
                  placeholder="Describe the core issue your program will tackle..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whoAffected">Who is most affected? *</Label>
                <Textarea
                  id="whoAffected"
                  value={programForm.whoAffected}
                  onChange={(e) => updateProgramForm("whoAffected", e.target.value)}
                  placeholder="Describe the people or groups most impacted..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whyImportant">Why is this important right now?</Label>
                <Textarea
                  id="whyImportant"
                  value={programForm.whyImportant}
                  onChange={(e) => updateProgramForm("whyImportant", e.target.value)}
                  placeholder="What makes addressing this urgent or timely?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Target Population</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Age Group(s)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AGE_GROUPS.map((age) => (
                    <div key={age} className="flex items-center space-x-2">
                      <Checkbox
                        id={`age-${age}`}
                        checked={programForm.ageGroups.includes(age)}
                        onCheckedChange={() => toggleArrayValue("program", "ageGroups", age)}
                      />
                      <Label htmlFor={`age-${age}`} className="text-sm cursor-pointer">{age}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="demographics">Demographics (if relevant)</Label>
                <Input
                  id="demographics"
                  value={programForm.demographics}
                  onChange={(e) => updateProgramForm("demographics", e.target.value)}
                  placeholder="e.g., Low-income families, immigrant communities"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specificGroups">Any specific groups?</Label>
                <Textarea
                  id="specificGroups"
                  value={programForm.specificGroups}
                  onChange={(e) => updateProgramForm("specificGroups", e.target.value)}
                  placeholder="e.g., Single moms, teens aging out of foster care, returning citizens"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Program Vision & Outcomes</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="longTermVision">Long-term change you want to see *</Label>
                <Textarea
                  id="longTermVision"
                  value={programForm.longTermVision}
                  onChange={(e) => updateProgramForm("longTermVision", e.target.value)}
                  placeholder="Describe your ultimate vision of success..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcomes">3-5 Measurable Outcomes *</Label>
                <Textarea
                  id="outcomes"
                  value={programForm.outcomes}
                  onChange={(e) => updateProgramForm("outcomes", e.target.value)}
                  placeholder="e.g., 50 youth trained in job skills, 80% improvement in school attendance, 20 new small businesses launched..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">List each outcome on a new line</p>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Activities & Services</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mainActivities">Main activities/services you will provide *</Label>
                <Textarea
                  id="mainActivities"
                  value={programForm.mainActivities}
                  onChange={(e) => updateProgramForm("mainActivities", e.target.value)}
                  placeholder="Describe the core activities: workshops, mentoring, classes, events, etc."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">How often?</Label>
                  <Select value={programForm.frequency} onValueChange={(v) => updateProgramForm("frequency", v)}>
                    <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="one-time">One-time event</SelectItem>
                      <SelectItem value="ongoing">Ongoing/Continuous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliveryMode">Delivery Mode</Label>
                  <Select value={programForm.deliveryMode} onValueChange={(v) => updateProgramForm("deliveryMode", v)}>
                    <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">In-person</SelectItem>
                      <SelectItem value="virtual">Virtual/Online</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Resources & Capacity</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="existingStaff">Existing staff/volunteers</Label>
                <Textarea
                  id="existingStaff"
                  value={programForm.existingStaff}
                  onChange={(e) => updateProgramForm("existingStaff", e.target.value)}
                  placeholder="Describe your current team capacity..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilities">Facilities/space available</Label>
                <Textarea
                  id="facilities"
                  value={programForm.facilities}
                  onChange={(e) => updateProgramForm("facilities", e.target.value)}
                  placeholder="Describe spaces you have access to..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyPartners">Key partners (if any)</Label>
                <Textarea
                  id="keyPartners"
                  value={programForm.keyPartners}
                  onChange={(e) => updateProgramForm("keyPartners", e.target.value)}
                  placeholder="Organizations, churches, schools, businesses you're working with..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Program start date (or estimate)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={programForm.startDate}
                  onChange={(e) => updateProgramForm("startDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="programLength">Program length</Label>
                <Select value={programForm.programLength} onValueChange={(v) => updateProgramForm("programLength", v)}>
                  <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3-months">3 months (pilot)</SelectItem>
                    <SelectItem value="6-months">6 months (pilot)</SelectItem>
                    <SelectItem value="1-year">1 year</SelectItem>
                    <SelectItem value="2-years">2 years</SelectItem>
                    <SelectItem value="ongoing">Ongoing/Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Budget (Optional)</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budgetCategories">Rough cost categories</Label>
                <Textarea
                  id="budgetCategories"
                  value={programForm.budgetCategories}
                  onChange={(e) => updateProgramForm("budgetCategories", e.target.value)}
                  placeholder="e.g., Staff salaries, Space rental, Materials/supplies, Marketing, Transportation..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fundingSources">Current or anticipated funding sources</Label>
                <Textarea
                  id="fundingSources"
                  value={programForm.fundingSources}
                  onChange={(e) => updateProgramForm("fundingSources", e.target.value)}
                  placeholder="e.g., Foundation grants, government funding, donations, earned revenue..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Grant Readiness Steps
  const renderGrantStep = () => {
    switch (grantStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Organization Basics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grantOrgName">Organization Name *</Label>
                <Input
                  id="grantOrgName"
                  value={grantForm.organizationName}
                  onChange={(e) => updateGrantForm("organizationName", e.target.value)}
                  placeholder="Your organization name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalStatus">Legal Status *</Label>
                <Select value={grantForm.legalStatus} onValueChange={(v) => updateGrantForm("legalStatus", v)}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="501c3">501(c)(3) Nonprofit</SelectItem>
                    <SelectItem value="fiscally-sponsored">Fiscally Sponsored</SelectItem>
                    <SelectItem value="church-based">Church/Faith-Based</SelectItem>
                    <SelectItem value="grassroots">Grassroots/Unincorporated</SelectItem>
                    <SelectItem value="llc">LLC</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsInOperation">Years in Operation</Label>
                <Select value={grantForm.yearsInOperation} onValueChange={(v) => updateGrantForm("yearsInOperation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select years" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New/Startup</SelectItem>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Mission & Vision</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="missionStatement">Mission Statement *</Label>
                <Textarea
                  id="missionStatement"
                  value={grantForm.missionStatement}
                  onChange={(e) => updateGrantForm("missionStatement", e.target.value)}
                  placeholder="What is your organization's mission? If you don't have one, describe your purpose..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visionStatement">Vision for Impact (3-5 years)</Label>
                <Textarea
                  id="visionStatement"
                  value={grantForm.visionStatement}
                  onChange={(e) => updateGrantForm("visionStatement", e.target.value)}
                  placeholder="Where do you see your organization and impact in 3-5 years?"
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Program/Project Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Name of Project You Want to Fund *</Label>
                <Input
                  id="projectName"
                  value={grantForm.projectName}
                  onChange={(e) => updateGrantForm("projectName", e.target.value)}
                  placeholder="e.g., Community Youth Mentorship Program"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectDescription">Brief Description *</Label>
                <Textarea
                  id="projectDescription"
                  value={grantForm.projectDescription}
                  onChange={(e) => updateGrantForm("projectDescription", e.target.value)}
                  placeholder="What will this project do? What activities are involved?"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whoItServes">Who does it serve?</Label>
                  <Input
                    id="whoItServes"
                    value={grantForm.whoItServes}
                    onChange={(e) => updateGrantForm("whoItServes", e.target.value)}
                    placeholder="e.g., At-risk youth ages 14-18"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="geographicArea">Geographic Area</Label>
                  <Input
                    id="geographicArea"
                    value={grantForm.geographicArea}
                    onChange={(e) => updateGrantForm("geographicArea", e.target.value)}
                    placeholder="e.g., South Chicago neighborhoods"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Capacity & Track Record</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staffCapacity">Staff/Volunteer Capacity</Label>
                <Textarea
                  id="staffCapacity"
                  value={grantForm.staffCapacity}
                  onChange={(e) => updateGrantForm("staffCapacity", e.target.value)}
                  placeholder="Describe your team size, roles, and availability..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastPrograms">Past Programs or Relevant Experience</Label>
                <Textarea
                  id="pastPrograms"
                  value={grantForm.pastPrograms}
                  onChange={(e) => updateGrantForm("pastPrograms", e.target.value)}
                  placeholder="What relevant work have you done before?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Systems in Place</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {SYSTEMS_IN_PLACE.map((system) => (
                    <div key={system} className="flex items-center space-x-2">
                      <Checkbox
                        id={`system-${system}`}
                        checked={grantForm.systemsInPlace.includes(system)}
                        onCheckedChange={() => toggleArrayValue("grant", "systemsInPlace", system)}
                      />
                      <Label htmlFor={`system-${system}`} className="text-sm cursor-pointer">{system}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Outcomes & Evaluation</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desiredOutcomes">Desired Outcomes *</Label>
                <Textarea
                  id="desiredOutcomes"
                  value={grantForm.desiredOutcomes}
                  onChange={(e) => updateGrantForm("desiredOutcomes", e.target.value)}
                  placeholder="What changes or results do you expect from this project?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measurementPlan">How will you measure success?</Label>
                <Textarea
                  id="measurementPlan"
                  value={grantForm.measurementPlan}
                  onChange={(e) => updateGrantForm("measurementPlan", e.target.value)}
                  placeholder="Surveys, attendance tracking, pre/post tests, interviews, etc."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Budget & Resources</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Total Estimated Project Cost</Label>
                  <Input
                    id="estimatedCost"
                    value={grantForm.estimatedCost}
                    onChange={(e) => updateGrantForm("estimatedCost", e.target.value)}
                    placeholder="e.g., $50,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="existingFunding">Existing Funding (if any)</Label>
                  <Input
                    id="existingFunding"
                    value={grantForm.existingFunding}
                    onChange={(e) => updateGrantForm("existingFunding", e.target.value)}
                    placeholder="e.g., $10,000 from donations"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inKindResources">In-Kind Resources</Label>
                <Textarea
                  id="inKindResources"
                  value={grantForm.inKindResources}
                  onChange={(e) => updateGrantForm("inKindResources", e.target.value)}
                  placeholder="e.g., Donated space from community center, volunteer hours..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportingData">Supporting Data (stats, stories, research)</Label>
                <Textarea
                  id="supportingData"
                  value={grantForm.supportingData}
                  onChange={(e) => updateGrantForm("supportingData", e.target.value)}
                  placeholder="Any data, testimonials, or research that supports your project..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Community Assessment Steps
  const renderAssessmentStep = () => {
    switch (assessmentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Community Basics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="communityName">Community/Neighborhood/City Name *</Label>
                <Input
                  id="communityName"
                  value={assessmentForm.communityName}
                  onChange={(e) => updateAssessmentForm("communityName", e.target.value)}
                  placeholder="e.g., West Side Chicago, Rural Greene County"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="communityType">Type of Community *</Label>
                <Select value={assessmentForm.communityType} onValueChange={(v) => updateAssessmentForm("communityType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urban">Urban</SelectItem>
                    <SelectItem value="suburban">Suburban</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                    <SelectItem value="mixed">Mixed/Transitional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Who Lives There</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="focusPopulations">Populations you are most focused on</Label>
                <Textarea
                  id="focusPopulations"
                  value={assessmentForm.focusPopulations}
                  onChange={(e) => updateAssessmentForm("focusPopulations", e.target.value)}
                  placeholder="Who are the main groups you want to serve or understand?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demographicInfo">Any known demographic info (if available)</Label>
                <Textarea
                  id="demographicInfo"
                  value={assessmentForm.demographicInfo}
                  onChange={(e) => updateAssessmentForm("demographicInfo", e.target.value)}
                  placeholder="Population size, income levels, age distribution, racial/ethnic makeup..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Key Issues</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Top Challenges (select 3-5)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COMMUNITY_CHALLENGES.map((challenge) => (
                    <div key={challenge} className="flex items-center space-x-2">
                      <Checkbox
                        id={`challenge-${challenge}`}
                        checked={assessmentForm.challenges.includes(challenge)}
                        onCheckedChange={() => toggleArrayValue("assessment", "challenges", challenge)}
                      />
                      <Label htmlFor={`challenge-${challenge}`} className="text-sm cursor-pointer">{challenge}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="challengesDetails">How do these issues show up day-to-day?</Label>
                <Textarea
                  id="challengesDetails"
                  value={assessmentForm.challengesDetails}
                  onChange={(e) => updateAssessmentForm("challengesDetails", e.target.value)}
                  placeholder="Describe what residents experience..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Assets & Strengths</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="existingOrganizations">Existing organizations, churches, schools, leaders</Label>
                <Textarea
                  id="existingOrganizations"
                  value={assessmentForm.existingOrganizations}
                  onChange={(e) => updateAssessmentForm("existingOrganizations", e.target.value)}
                  placeholder="Who are the key institutions and leaders in this community?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="traditionsAndCulture">Community traditions, culture, informal support systems</Label>
                <Textarea
                  id="traditionsAndCulture"
                  value={assessmentForm.traditionsAndCulture}
                  onChange={(e) => updateAssessmentForm("traditionsAndCulture", e.target.value)}
                  placeholder="Cultural strengths, traditions, how neighbors help each other..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physicalAssets">Physical assets (parks, centers, libraries, etc.)</Label>
                <Textarea
                  id="physicalAssets"
                  value={assessmentForm.physicalAssets}
                  onChange={(e) => updateAssessmentForm("physicalAssets", e.target.value)}
                  placeholder="What physical spaces and resources exist?"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Existing Efforts</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPrograms">Programs already trying to help</Label>
                <Textarea
                  id="currentPrograms"
                  value={assessmentForm.currentPrograms}
                  onChange={(e) => updateAssessmentForm("currentPrograms", e.target.value)}
                  placeholder="What organizations or programs are already working on these issues?"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatWorking">What seems to be working?</Label>
                <Textarea
                  id="whatWorking"
                  value={assessmentForm.whatWorking}
                  onChange={(e) => updateAssessmentForm("whatWorking", e.target.value)}
                  placeholder="Which efforts are having positive impact?"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="remainingGaps">What gaps remain?</Label>
                <Textarea
                  id="remainingGaps"
                  value={assessmentForm.remainingGaps}
                  onChange={(e) => updateAssessmentForm("remainingGaps", e.target.value)}
                  placeholder="What needs are still unmet? Where are the holes?"
                  rows={2}
                />
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Community Voice</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>How have you heard from residents?</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {COMMUNITY_VOICE_METHODS.map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox
                        id={`method-${method}`}
                        checked={assessmentForm.howHeard.includes(method)}
                        onCheckedChange={() => toggleArrayValue("assessment", "howHeard", method)}
                      />
                      <Label htmlFor={`method-${method}`} className="text-sm cursor-pointer">{method}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keyThemes">Key themes from community voices</Label>
                <Textarea
                  id="keyThemes"
                  value={assessmentForm.keyThemes}
                  onChange={(e) => updateAssessmentForm("keyThemes", e.target.value)}
                  placeholder="What are residents saying? What do they want? What concerns them most?"
                  rows={4}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Stakeholder Planner Steps
  const renderStakeholderStep = () => {
    switch (stakeholderStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Project Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stakeholderProjectName">Project or Program Name *</Label>
                <Input
                  id="stakeholderProjectName"
                  value={stakeholderForm.projectName}
                  onChange={(e) => updateStakeholderForm("projectName", e.target.value)}
                  placeholder="e.g., Neighborhood Revitalization Initiative"
                />
              </div>
              <div className="space-y-2">
                <Label>Select Stakeholder Types to Engage *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {STAKEHOLDER_TYPES.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`stakeholder-${type}`}
                        checked={stakeholderForm.stakeholderTypes.includes(type)}
                        onCheckedChange={() => {
                          toggleArrayValue("stakeholder", "stakeholderTypes", type);
                          if (!stakeholderForm.stakeholderDetails[type]) {
                            updateStakeholderForm("stakeholderDetails", {
                              ...stakeholderForm.stakeholderDetails,
                              [type]: {
                                whyMatter: "",
                                influenceLevel: "medium",
                                impactLevel: "medium",
                                engagementLevel: "consult",
                                channels: []
                              }
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`stakeholder-${type}`} className="text-sm cursor-pointer">{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Stakeholder Details</h3>
            {stakeholderForm.stakeholderTypes.length === 0 ? (
              <p className="text-muted-foreground">Please go back and select at least one stakeholder type.</p>
            ) : (
              <div className="space-y-6">
                {stakeholderForm.stakeholderTypes.map((stakeholder) => (
                  <Card key={stakeholder} className="border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{stakeholder}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Why they matter / their role</Label>
                        <Textarea
                          value={stakeholderForm.stakeholderDetails[stakeholder]?.whyMatter || ""}
                          onChange={(e) => updateStakeholderDetail(stakeholder, "whyMatter", e.target.value)}
                          placeholder="Why is this group important to engage?"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Influence Level</Label>
                          <Select 
                            value={stakeholderForm.stakeholderDetails[stakeholder]?.influenceLevel || "medium"}
                            onValueChange={(v) => updateStakeholderDetail(stakeholder, "influenceLevel", v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Impact Level (how affected)</Label>
                          <Select 
                            value={stakeholderForm.stakeholderDetails[stakeholder]?.impactLevel || "medium"}
                            onValueChange={(v) => updateStakeholderDetail(stakeholder, "impactLevel", v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Engagement Level</Label>
                          <Select 
                            value={stakeholderForm.stakeholderDetails[stakeholder]?.engagementLevel || "consult"}
                            onValueChange={(v) => updateStakeholderDetail(stakeholder, "engagementLevel", v)}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inform">Inform</SelectItem>
                              <SelectItem value="consult">Consult</SelectItem>
                              <SelectItem value="partner">Partner</SelectItem>
                              <SelectItem value="co-lead">Co-Lead</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Preferred Communication Channels</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {COMMUNICATION_CHANNELS.map((channel) => (
                            <div key={channel} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${stakeholder}-${channel}`}
                                checked={stakeholderForm.stakeholderDetails[stakeholder]?.channels?.includes(channel) || false}
                                onCheckedChange={() => toggleStakeholderChannel(stakeholder, channel)}
                              />
                              <Label htmlFor={`${stakeholder}-${channel}`} className="text-xs cursor-pointer">{channel}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Engagement Goals & Timeline</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="engagementGoals">What do you hope to achieve through engagement? *</Label>
                <Textarea
                  id="engagementGoals"
                  value={stakeholderForm.engagementGoals}
                  onChange={(e) => updateStakeholderForm("engagementGoals", e.target.value)}
                  placeholder="e.g., Buy-in from city officials, feedback from residents, co-design with youth, funding commitments..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeframe">Over what time frame will engagement occur?</Label>
                <Select value={stakeholderForm.timeframe} onValueChange={(v) => updateStakeholderForm("timeframe", v)}>
                  <SelectTrigger><SelectValue placeholder="Select timeframe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-month">1 month</SelectItem>
                    <SelectItem value="3-months">3 months</SelectItem>
                    <SelectItem value="6-months">6 months</SelectItem>
                    <SelectItem value="1-year">1 year</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Result Display Components
  const renderProgramResult = () => {
    if (!programResult) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            Program Design Summary
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(programResult, null, 2))}>
              Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setProgramResult(null); setProgramStep(1); }}>
              Start Over
            </Button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{programResult.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderGrantResult = () => {
    if (!grantResult) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            Grant Readiness Assessment
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(grantResult, null, 2))}>
              Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setGrantResult(null); setGrantStep(1); }}>
              Start Over
            </Button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{grantResult.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderAssessmentResult = () => {
    if (!assessmentResult) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            Community Assessment Summary
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(assessmentResult, null, 2))}>
              Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setAssessmentResult(null); setAssessmentStep(1); }}>
              Start Over
            </Button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{assessmentResult.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  const renderStakeholderResult = () => {
    if (!stakeholderResult) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="text-green-600" />
            Stakeholder Engagement Plan
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(stakeholderResult, null, 2))}>
              Copy All
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setStakeholderResult(null); setStakeholderStep(1); }}>
              Start Over
            </Button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown>{stakeholderResult.content}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Develop It - Community Development Tools | PivotHub</title>
        <meta name="description" content="AI-powered tools for community development, nonprofit work, youth programs, and social impact initiatives. Build programs, assess grant readiness, and plan stakeholder engagement." />
      </Helmet>
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Develop It</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-guided tools for community development, neighborhood revitalization, nonprofit work, 
              youth programs, faith-based outreach, and social impact initiatives.
            </p>
          </div>

          <div className="text-left mb-8 space-y-3 max-w-3xl mx-auto">
            <p className="text-muted-foreground">
              <strong className="text-foreground">Program Builder</strong> — Turn your program idea into a structured, 
              funder-ready design. Answer questions about your goals, target population, activities, and timeline, 
              and receive a complete Program Design Summary with SMART outcomes, a delivery model, and a pitch paragraph 
              you can paste into proposals.
            </p>
            
            <p className="text-muted-foreground">
              <strong className="text-foreground">Grant Readiness</strong> — Find out if your organization is ready 
              to pursue grants. Share your mission, project details, and capacity, and get a readiness snapshot highlighting 
              your strengths and gaps, plus draft narrative sections (needs statement, project description, evaluation plan) 
              you can adapt for applications.
            </p>
            
            <p className="text-muted-foreground">
              <strong className="text-foreground">Community Assessment</strong> — Describe your community's needs, 
              assets, and opportunities. Provide information about who lives there, the key challenges, existing resources, 
              and what residents are saying. You'll receive a Community Assessment Summary ready for grant applications, 
              presentations, or planning documents.
            </p>
            
            <p className="text-muted-foreground">
              <strong className="text-foreground">Stakeholder Planner</strong> — Plan who you need to engage and how. 
              Select your stakeholder groups (residents, officials, funders, partners), define their roles and influence, 
              and receive a strategy with talking points, communication methods, and an outreach timeline.
            </p>
            
            <p className="text-muted-foreground">
              <strong className="text-foreground">Dev Coach</strong> — Ask any community development question and get 
              real-time AI coaching. Whether you're starting a youth program, handling pushback from leadership, or figuring 
              out how to measure impact, the coach provides step-by-step guidance and practical options you can act on.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="program-builder" className="flex flex-col md:flex-row items-center gap-1 text-xs md:text-sm">
                <Building2 className="h-4 w-4" />
                <span className="hidden md:inline">Program Builder</span>
                <span className="md:hidden">Program</span>
              </TabsTrigger>
              <TabsTrigger value="grant-readiness" className="flex flex-col md:flex-row items-center gap-1 text-xs md:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden md:inline">Grant Readiness</span>
                <span className="md:hidden">Grants</span>
              </TabsTrigger>
              <TabsTrigger value="community-assessment" className="flex flex-col md:flex-row items-center gap-1 text-xs md:text-sm">
                <MapPin className="h-4 w-4" />
                <span className="hidden md:inline">Community</span>
                <span className="md:hidden">Community</span>
              </TabsTrigger>
              <TabsTrigger value="stakeholder-planner" className="flex flex-col md:flex-row items-center gap-1 text-xs md:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden md:inline">Stakeholders</span>
                <span className="md:hidden">Stakeholders</span>
              </TabsTrigger>
              <TabsTrigger value="dev-coach" className="flex flex-col md:flex-row items-center gap-1 text-xs md:text-sm">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">Dev Coach</span>
                <span className="md:hidden">Coach</span>
              </TabsTrigger>
            </TabsList>

            {/* Program Builder Tab */}
            <TabsContent value="program-builder">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Program Builder
                  </CardTitle>
                  <CardDescription>
                    Turn your idea into a structured, funder-ready community program.
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">4 credits</Badge>
                </CardHeader>
                <CardContent>
                  {programResult ? (
                    renderProgramResult()
                  ) : (
                    <>
                      <div className="mb-6">
                        <Progress value={(programStep / 8) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">Step {programStep} of 8</p>
                      </div>
                      {renderProgramStep()}
                      <div className="flex justify-between mt-8">
                        <Button
                          variant="outline"
                          onClick={() => setProgramStep(Math.max(1, programStep - 1))}
                          disabled={programStep === 1}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        {programStep < 8 ? (
                          <Button onClick={() => setProgramStep(programStep + 1)}>
                            Next <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <Button onClick={handleProgramSubmit} disabled={programLoading || !programForm.programName}>
                            {programLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Generate Program Design
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grant Readiness Tab */}
            <TabsContent value="grant-readiness">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Grant Readiness & Funding Prep Tool
                  </CardTitle>
                  <CardDescription>
                    Assess your readiness for grants and prepare core narrative pieces for proposals.
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">3 credits</Badge>
                </CardHeader>
                <CardContent>
                  {grantResult ? (
                    renderGrantResult()
                  ) : (
                    <>
                      <div className="mb-6">
                        <Progress value={(grantStep / 6) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">Step {grantStep} of 6</p>
                      </div>
                      {renderGrantStep()}
                      <div className="flex justify-between mt-8">
                        <Button
                          variant="outline"
                          onClick={() => setGrantStep(Math.max(1, grantStep - 1))}
                          disabled={grantStep === 1}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        {grantStep < 6 ? (
                          <Button onClick={() => setGrantStep(grantStep + 1)}>
                            Next <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <Button onClick={handleGrantSubmit} disabled={grantLoading || !grantForm.organizationName}>
                            {grantLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Assess Grant Readiness
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Community Assessment Tab */}
            <TabsContent value="community-assessment">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Community Assessment Tool
                  </CardTitle>
                  <CardDescription>
                    Describe your community in a way that's useful for planning and funding.
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">3 credits</Badge>
                </CardHeader>
                <CardContent>
                  {assessmentResult ? (
                    renderAssessmentResult()
                  ) : (
                    <>
                      <div className="mb-6">
                        <Progress value={(assessmentStep / 6) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">Step {assessmentStep} of 6</p>
                      </div>
                      {renderAssessmentStep()}
                      <div className="flex justify-between mt-8">
                        <Button
                          variant="outline"
                          onClick={() => setAssessmentStep(Math.max(1, assessmentStep - 1))}
                          disabled={assessmentStep === 1}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        {assessmentStep < 6 ? (
                          <Button onClick={() => setAssessmentStep(assessmentStep + 1)}>
                            Next <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <Button onClick={handleAssessmentSubmit} disabled={assessmentLoading || !assessmentForm.communityName}>
                            {assessmentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Generate Assessment
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stakeholder Planner Tab */}
            <TabsContent value="stakeholder-planner">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Stakeholder Engagement Planner
                  </CardTitle>
                  <CardDescription>
                    Plan who you need to engage, why, and how.
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">3 credits</Badge>
                </CardHeader>
                <CardContent>
                  {stakeholderResult ? (
                    renderStakeholderResult()
                  ) : (
                    <>
                      <div className="mb-6">
                        <Progress value={(stakeholderStep / 3) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">Step {stakeholderStep} of 3</p>
                      </div>
                      {renderStakeholderStep()}
                      <div className="flex justify-between mt-8">
                        <Button
                          variant="outline"
                          onClick={() => setStakeholderStep(Math.max(1, stakeholderStep - 1))}
                          disabled={stakeholderStep === 1}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                        {stakeholderStep < 3 ? (
                          <Button onClick={() => setStakeholderStep(stakeholderStep + 1)}>
                            Next <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : (
                          <Button onClick={handleStakeholderSubmit} disabled={stakeholderLoading || stakeholderForm.stakeholderTypes.length === 0}>
                            {stakeholderLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Generate Engagement Plan
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dev Coach Tab */}
            <TabsContent value="dev-coach">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    AI Community Development Coach
                  </CardTitle>
                  <CardDescription>
                    Get real-time guidance on community development challenges.
                  </CardDescription>
                  <Badge variant="secondary" className="w-fit">1 credit per message</Badge>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ScrollArea className="flex-1 pr-4 mb-4">
                    <div className="space-y-4">
                      {coachMessages.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium mb-2">Ask me anything about community development!</p>
                          <p className="text-sm">Examples:</p>
                          <ul className="text-sm mt-2 space-y-1">
                            <li>"I'm trying to start a youth program, where do I begin?"</li>
                            <li>"City leadership is pushing back on our idea, how do I respond?"</li>
                            <li>"How do I measure impact without a big data system?"</li>
                          </ul>
                        </div>
                      )}
                      {coachMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === "user" 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted"
                          }`}>
                            {msg.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p>{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {coachLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      placeholder="Ask your community development question..."
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCoachSend()}
                      disabled={coachLoading}
                    />
                    <Button onClick={handleCoachSend} disabled={coachLoading || !coachInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DevelopIt;
