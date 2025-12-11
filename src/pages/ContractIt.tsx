import { useState } from "react";
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
import { FileText, ClipboardCheck, Building2, Shield, MapPin, Flag, Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateCapabilityStatementPDF } from "@/lib/pdf-templates/capability-statement-template";
import { Helmet } from "react-helmet-async";

// Types
interface CapabilityFormData {
  // Company Data
  businessName: string;
  address: string;
  website: string;
  phone: string;
  email: string;
  pocName: string;
  pocTitle: string;
  pocPhone: string;
  pocEmail: string;
  logoFile: File | null;
  uei: string;
  cageCode: string;
  naicsCodesInput: string;
  primaryNaics: string;
  pscCodes: string;
  nigpCodes: string;
  certifications: string[];
  contractVehicles: string;
  acceptsGovCard: boolean;
  // Core Competencies
  servicesProducts: string;
  competencyBullets: string;
  targetAgency: string;
  // Differentiators
  differentiator1: string;
  differentiator2: string;
  differentiator3: string;
  measurableStrengths: string;
  uniqueProcesses: string;
  credentials: string;
  // Past Performance
  hasPastPerformance: boolean;
  references: {
    customerName: string;
    projectTitle: string;
    description: string;
    value: string;
    contractNumber: string;
    contactInfo: string;
  }[];
  relevantExperience: string;
}

interface ReadinessFormData {
  // Section 1: Business Foundations
  businessName: string;
  legalStructure: string;
  yearsInBusiness: string;
  employees: string;
  goodsServices: string;
  geographicArea: string[];
  revenueRange: string;
  insuranceTypes: string[];
  hasSpecializedEquipment: boolean;
  equipmentDescription: string;
  // Section 2: Credentials & Security
  hasIndustryCertifications: boolean;
  industryCertifications: string[];
  hasSmallBusinessCerts: boolean;
  smallBusinessCerts: string[];
  securityClearance: string;
  interestedInDoD: boolean;
  willingSponsorClearance: boolean;
  understandsFCL: string;
  ownerMilitaryExp: boolean;
  employeeMilitaryBg: string[];
  // Section 3: Local Government
  localVendorRegistered: string;
  knowsLocalPortals: boolean;
  knowsNIGPCodes: boolean;
  nigpCodes: string;
  meetsLocalInsurance: string[];
  hasLocalGovExperience: boolean;
  localGovDescription: string;
  // Section 4: State Government
  targetStates: string[];
  hasStateVendorId: boolean;
  knowsStateBiddingPortal: boolean;
  stateCertifications: string[];
  knowsStateCodes: boolean;
  hasStateExperience: boolean;
  stateAgencies: string;
  // Section 5: Federal Government
  samRegistration: string;
  ueiNumber: string;
  cageCode: string;
  naicsCodesInput: string;
  pscCodes: string;
  federalCertifications: string[];
  hasFederalExperience: boolean;
  federalDescription: string;
  pursuingDefense: boolean;
  meetsCyberRequirements: string;
  hasDefenseWork: boolean;
  defenseDescription: string;
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming", "Washington D.C."
];

// Helper function to parse comma-separated NAICS codes
const parseNaicsCodes = (input: string): string[] => {
  return input
    .split(',')
    .map(code => code.trim())
    .filter(code => code.length > 0)
    .slice(0, 10); // Limit to 10 codes
};

const CERTIFICATIONS = [
  { id: "small-business", label: "Small Business" },
  { id: "wosb", label: "Woman-Owned Small Business (WOSB)" },
  { id: "mbe", label: "Minority-Owned (MBE)" },
  { id: "vosb", label: "Veteran-Owned (VOSB)" },
  { id: "sdvosb", label: "Service-Disabled Veteran-Owned (SDVOSB)" },
  { id: "hubzone", label: "HUBZone" },
  { id: "8a", label: "8(a)" },
  { id: "dbe", label: "Disadvantaged Business (DBE)" },
  { id: "iso", label: "ISO Certified" },
  { id: "cmmc", label: "CMMC" }
];

const ContractIt = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("capability");
  
  // Capability Statement State
  const [capabilityStep, setCapabilityStep] = useState(1);
  const [capabilityLoading, setCapabilityLoading] = useState(false);
  const [capabilityResult, setCapabilityResult] = useState<any>(null);
  const [capabilityForm, setCapabilityForm] = useState<CapabilityFormData>({
    businessName: "",
    address: "",
    website: "",
    phone: "",
    email: "",
    pocName: "",
    pocTitle: "",
    pocPhone: "",
    pocEmail: "",
    logoFile: null,
    uei: "",
    cageCode: "",
    naicsCodesInput: "",
    primaryNaics: "",
    pscCodes: "",
    nigpCodes: "",
    certifications: [],
    contractVehicles: "",
    acceptsGovCard: false,
    servicesProducts: "",
    competencyBullets: "",
    targetAgency: "",
    differentiator1: "",
    differentiator2: "",
    differentiator3: "",
    measurableStrengths: "",
    uniqueProcesses: "",
    credentials: "",
    hasPastPerformance: false,
    references: [{ customerName: "", projectTitle: "", description: "", value: "", contractNumber: "", contactInfo: "" }],
    relevantExperience: ""
  });

  // Readiness Assessment State
  const [readinessStep, setReadinessStep] = useState(1);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessResult, setReadinessResult] = useState<any>(null);
  const [readinessForm, setReadinessForm] = useState<ReadinessFormData>({
    businessName: "",
    legalStructure: "",
    yearsInBusiness: "",
    employees: "",
    goodsServices: "",
    geographicArea: [],
    revenueRange: "",
    insuranceTypes: [],
    hasSpecializedEquipment: false,
    equipmentDescription: "",
    hasIndustryCertifications: false,
    industryCertifications: [],
    hasSmallBusinessCerts: false,
    smallBusinessCerts: [],
    securityClearance: "none",
    interestedInDoD: false,
    willingSponsorClearance: false,
    understandsFCL: "",
    ownerMilitaryExp: false,
    employeeMilitaryBg: [],
    localVendorRegistered: "",
    knowsLocalPortals: false,
    knowsNIGPCodes: false,
    nigpCodes: "",
    meetsLocalInsurance: [],
    hasLocalGovExperience: false,
    localGovDescription: "",
    targetStates: [],
    hasStateVendorId: false,
    knowsStateBiddingPortal: false,
    stateCertifications: [],
    knowsStateCodes: false,
    hasStateExperience: false,
    stateAgencies: "",
    samRegistration: "",
    ueiNumber: "",
    cageCode: "",
    naicsCodesInput: "",
    pscCodes: "",
    federalCertifications: [],
    hasFederalExperience: false,
    federalDescription: "",
    pursuingDefense: false,
    meetsCyberRequirements: "",
    hasDefenseWork: false,
    defenseDescription: ""
  });

  // Capability Statement handlers
  const handleCapabilitySubmit = async () => {
    if (!user) {
      toast.error("Please sign in to generate your Capability Statement");
      return;
    }

    setCapabilityLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-capability-statement", {
        body: { formData: capabilityForm }
      });

      if (error) throw error;
      
      setCapabilityResult(data);
      toast.success("Capability Statement generated successfully!");
    } catch (error: any) {
      console.error("Error generating capability statement:", error);
      toast.error(error.message || "Failed to generate Capability Statement");
    } finally {
      setCapabilityLoading(false);
    }
  };

  const handleDownloadCapabilityPDF = () => {
    if (!capabilityResult) return;
    
    try {
      const doc = generateCapabilityStatementPDF(capabilityResult, capabilityForm);
      doc.save(`${capabilityForm.businessName || 'Capability'}-Statement.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  // Readiness Assessment handlers
  const handleReadinessSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to assess your contract readiness");
      return;
    }

    setReadinessLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-contract-readiness", {
        body: { formData: readinessForm }
      });

      if (error) throw error;
      
      setReadinessResult(data);
      toast.success("Readiness assessment complete!");
    } catch (error: any) {
      console.error("Error assessing readiness:", error);
      toast.error(error.message || "Failed to complete assessment");
    } finally {
      setReadinessLoading(false);
    }
  };

  const updateCapabilityForm = (field: keyof CapabilityFormData, value: any) => {
    setCapabilityForm(prev => ({ ...prev, [field]: value }));
  };

  const updateReadinessForm = (field: keyof ReadinessFormData, value: any) => {
    setReadinessForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (form: "capability" | "readiness", field: string, value: string) => {
    if (form === "capability") {
      const current = (capabilityForm as any)[field] as string[];
      const updated = current.includes(value) 
        ? current.filter(v => v !== value)
        : [...current, value];
      updateCapabilityForm(field as keyof CapabilityFormData, updated);
    } else {
      const current = (readinessForm as any)[field] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      updateReadinessForm(field as keyof ReadinessFormData, updated);
    }
  };

  // Capability Statement Form Steps
  const renderCapabilityStep = () => {
    switch (capabilityStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Business Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={capabilityForm.businessName}
                    onChange={(e) => updateCapabilityForm("businessName", e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={capabilityForm.website}
                    onChange={(e) => updateCapabilityForm("website", e.target.value)}
                    placeholder="www.yourcompany.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Physical Address *</Label>
                  <Input
                    id="address"
                    value={capabilityForm.address}
                    onChange={(e) => updateCapabilityForm("address", e.target.value)}
                    placeholder="123 Business St, City, State ZIP"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Business Phone *</Label>
                  <Input
                    id="phone"
                    value={capabilityForm.phone}
                    onChange={(e) => updateCapabilityForm("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={capabilityForm.email}
                    onChange={(e) => updateCapabilityForm("email", e.target.value)}
                    placeholder="info@yourcompany.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Point of Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pocName">Name *</Label>
                  <Input
                    id="pocName"
                    value={capabilityForm.pocName}
                    onChange={(e) => updateCapabilityForm("pocName", e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pocTitle">Title</Label>
                  <Input
                    id="pocTitle"
                    value={capabilityForm.pocTitle}
                    onChange={(e) => updateCapabilityForm("pocTitle", e.target.value)}
                    placeholder="CEO / President"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pocPhone">Phone</Label>
                  <Input
                    id="pocPhone"
                    value={capabilityForm.pocPhone}
                    onChange={(e) => updateCapabilityForm("pocPhone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pocEmail">Email</Label>
                  <Input
                    id="pocEmail"
                    type="email"
                    value={capabilityForm.pocEmail}
                    onChange={(e) => updateCapabilityForm("pocEmail", e.target.value)}
                    placeholder="john@yourcompany.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Federal/State Identifiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uei">Unique Entity Identifier (UEI)</Label>
                  <Input
                    id="uei"
                    value={capabilityForm.uei}
                    onChange={(e) => updateCapabilityForm("uei", e.target.value)}
                    placeholder="12-character UEI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cageCode">CAGE Code</Label>
                  <Input
                    id="cageCode"
                    value={capabilityForm.cageCode}
                    onChange={(e) => updateCapabilityForm("cageCode", e.target.value)}
                    placeholder="5-character code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pscCodes">PSC/FSC Codes</Label>
                  <Input
                    id="pscCodes"
                    value={capabilityForm.pscCodes}
                    onChange={(e) => updateCapabilityForm("pscCodes", e.target.value)}
                    placeholder="e.g., R499, D399"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nigpCodes">NIGP Codes (State/Local)</Label>
                  <Input
                    id="nigpCodes"
                    value={capabilityForm.nigpCodes}
                    onChange={(e) => updateCapabilityForm("nigpCodes", e.target.value)}
                    placeholder="e.g., 918-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="naicsCodesInput">NAICS Codes (Enter up to 10, comma-separated)</Label>
                <Input
                  id="naicsCodesInput"
                  value={capabilityForm.naicsCodesInput}
                  onChange={(e) => updateCapabilityForm("naicsCodesInput", e.target.value)}
                  placeholder="e.g., 541511, 541512, 238210"
                />
                <p className="text-xs text-muted-foreground">
                  Enter 6-digit NAICS codes separated by commas.{" "}
                  <a 
                    href="https://www.census.gov/naics/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Look up your NAICS codes →
                  </a>
                </p>
                {parseNaicsCodes(capabilityForm.naicsCodesInput).length > 0 && (
                  <div className="space-y-2 mt-3">
                    <Label htmlFor="primaryNaics">Primary NAICS Code</Label>
                    <Select value={capabilityForm.primaryNaics} onValueChange={(v) => updateCapabilityForm("primaryNaics", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary NAICS" />
                      </SelectTrigger>
                      <SelectContent>
                        {parseNaicsCodes(capabilityForm.naicsCodesInput).map((code) => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Certifications & Statuses</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CERTIFICATIONS.map((cert) => (
                  <div key={cert.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cert-${cert.id}`}
                      checked={capabilityForm.certifications.includes(cert.id)}
                      onCheckedChange={() => toggleArrayValue("capability", "certifications", cert.id)}
                    />
                    <label htmlFor={`cert-${cert.id}`} className="text-sm cursor-pointer">{cert.label}</label>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractVehicles">Contract Vehicles (GSA, BPA, IDIQ, etc.)</Label>
                <Input
                  id="contractVehicles"
                  value={capabilityForm.contractVehicles}
                  onChange={(e) => updateCapabilityForm("contractVehicles", e.target.value)}
                  placeholder="List any contract vehicles held"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptsGovCard"
                  checked={capabilityForm.acceptsGovCard}
                  onCheckedChange={(checked) => updateCapabilityForm("acceptsGovCard", checked)}
                />
                <label htmlFor="acceptsGovCard" className="text-sm cursor-pointer">Accepts Government Purchase Cards</label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Core Competencies</h3>
            <p className="text-sm text-muted-foreground">
              Describe your key services and capabilities. The AI will generate concise, keyword-driven bullet points.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="servicesProducts">Key Services/Products *</Label>
                <Textarea
                  id="servicesProducts"
                  value={capabilityForm.servicesProducts}
                  onChange={(e) => updateCapabilityForm("servicesProducts", e.target.value)}
                  placeholder="Describe your main services or products in detail. What do you do best? What solutions do you provide?"
                  className="min-h-[120px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competencyBullets">Additional Capability Details</Label>
                <Textarea
                  id="competencyBullets"
                  value={capabilityForm.competencyBullets}
                  onChange={(e) => updateCapabilityForm("competencyBullets", e.target.value)}
                  placeholder="Any specific capabilities, methodologies, or approaches you want highlighted (one per line)"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAgency">Target Agency/Industry (Optional)</Label>
                <Input
                  id="targetAgency"
                  value={capabilityForm.targetAgency}
                  onChange={(e) => updateCapabilityForm("targetAgency", e.target.value)}
                  placeholder="e.g., Department of Defense, VA, State DOT"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Differentiators</h3>
            <p className="text-sm text-muted-foreground">
              What makes your company stand out? Provide 1-3 strong reasons why government buyers should choose you.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="differentiator1">Key Differentiator #1 *</Label>
                <Textarea
                  id="differentiator1"
                  value={capabilityForm.differentiator1}
                  onChange={(e) => updateCapabilityForm("differentiator1", e.target.value)}
                  placeholder="What's your #1 competitive advantage?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="differentiator2">Key Differentiator #2</Label>
                <Textarea
                  id="differentiator2"
                  value={capabilityForm.differentiator2}
                  onChange={(e) => updateCapabilityForm("differentiator2", e.target.value)}
                  placeholder="What else sets you apart?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="differentiator3">Key Differentiator #3</Label>
                <Textarea
                  id="differentiator3"
                  value={capabilityForm.differentiator3}
                  onChange={(e) => updateCapabilityForm("differentiator3", e.target.value)}
                  placeholder="Any additional unique value proposition?"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurableStrengths">Measurable Strengths</Label>
                <Input
                  id="measurableStrengths"
                  value={capabilityForm.measurableStrengths}
                  onChange={(e) => updateCapabilityForm("measurableStrengths", e.target.value)}
                  placeholder="e.g., 99% on-time delivery, 40% cost savings, 24/7 support"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uniqueProcesses">Unique Processes, Tools, or Equipment</Label>
                <Textarea
                  id="uniqueProcesses"
                  value={capabilityForm.uniqueProcesses}
                  onChange={(e) => updateCapabilityForm("uniqueProcesses", e.target.value)}
                  placeholder="Describe any proprietary processes, specialized tools, or unique equipment"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credentials">Training, Credentials, or Specialized Expertise</Label>
                <Input
                  id="credentials"
                  value={capabilityForm.credentials}
                  onChange={(e) => updateCapabilityForm("credentials", e.target.value)}
                  placeholder="e.g., PMP certified staff, security clearances, specialized training"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground">Past Performance / References</h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasPastPerformance"
                  checked={capabilityForm.hasPastPerformance}
                  onCheckedChange={(checked) => updateCapabilityForm("hasPastPerformance", !!checked)}
                />
                <label htmlFor="hasPastPerformance" className="text-sm cursor-pointer font-medium">
                  I have past performance/references to include
                </label>
              </div>

              {capabilityForm.hasPastPerformance ? (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Include only references for which you have express permission to share.
                  </p>
                  {capabilityForm.references.map((ref, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Reference #{index + 1}</h4>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = capabilityForm.references.filter((_, i) => i !== index);
                                updateCapabilityForm("references", updated);
                              }}
                              className="text-destructive"
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Customer/Agency Name *</Label>
                            <Input
                              value={ref.customerName}
                              onChange={(e) => {
                                const updated = [...capabilityForm.references];
                                updated[index].customerName = e.target.value;
                                updateCapabilityForm("references", updated);
                              }}
                              placeholder="e.g., Department of Veterans Affairs"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Project Title *</Label>
                            <Input
                              value={ref.projectTitle}
                              onChange={(e) => {
                                const updated = [...capabilityForm.references];
                                updated[index].projectTitle = e.target.value;
                                updateCapabilityForm("references", updated);
                              }}
                              placeholder="e.g., IT Modernization Program"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <Label>Project Description *</Label>
                            <Textarea
                              value={ref.description}
                              onChange={(e) => {
                                const updated = [...capabilityForm.references];
                                updated[index].description = e.target.value;
                                updateCapabilityForm("references", updated);
                              }}
                              placeholder="Brief description of work performed and outcomes"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Project Value (Optional)</Label>
                            <Input
                              value={ref.value}
                              onChange={(e) => {
                                const updated = [...capabilityForm.references];
                                updated[index].value = e.target.value;
                                updateCapabilityForm("references", updated);
                              }}
                              placeholder="e.g., $500,000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Contract Number (Optional)</Label>
                            <Input
                              value={ref.contractNumber}
                              onChange={(e) => {
                                const updated = [...capabilityForm.references];
                                updated[index].contractNumber = e.target.value;
                                updateCapabilityForm("references", updated);
                              }}
                              placeholder="Contract/Task Order Number"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {capabilityForm.references.length < 3 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        updateCapabilityForm("references", [
                          ...capabilityForm.references,
                          { customerName: "", projectTitle: "", description: "", value: "", contractNumber: "", contactInfo: "" }
                        ]);
                      }}
                    >
                      + Add Another Reference
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No problem! Describe your relevant experience and the AI will create a professional summary.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="relevantExperience">Relevant Experience Summary *</Label>
                    <Textarea
                      id="relevantExperience"
                      value={capabilityForm.relevantExperience}
                      onChange={(e) => updateCapabilityForm("relevantExperience", e.target.value)}
                      placeholder="Describe your relevant work experience, projects completed, or expertise that demonstrates your capabilities..."
                      className="min-h-[150px]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Readiness Assessment Form Steps
  const renderReadinessStep = () => {
    switch (readinessStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Business Foundations</h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="r-businessName">Business Name *</Label>
                  <Input
                    id="r-businessName"
                    value={readinessForm.businessName}
                    onChange={(e) => updateReadinessForm("businessName", e.target.value)}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-legalStructure">Legal Structure *</Label>
                  <Select value={readinessForm.legalStructure} onValueChange={(v) => updateReadinessForm("legalStructure", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select structure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="s-corp">S-Corp</SelectItem>
                      <SelectItem value="sole-proprietor">Sole Proprietor</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="nonprofit">Nonprofit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-yearsInBusiness">Years in Business *</Label>
                  <Select value={readinessForm.yearsInBusiness} onValueChange={(v) => updateReadinessForm("yearsInBusiness", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="11-20">11-20 years</SelectItem>
                      <SelectItem value="20+">20+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-employees">Number of Employees *</Label>
                  <Select value={readinessForm.employees} onValueChange={(v) => updateReadinessForm("employees", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10</SelectItem>
                      <SelectItem value="11-50">11-50</SelectItem>
                      <SelectItem value="51-100">51-100</SelectItem>
                      <SelectItem value="101-500">101-500</SelectItem>
                      <SelectItem value="500+">500+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-goodsServices">Primary Goods/Services *</Label>
                <Textarea
                  id="r-goodsServices"
                  value={readinessForm.goodsServices}
                  onChange={(e) => updateReadinessForm("goodsServices", e.target.value)}
                  placeholder="Describe your primary products or services"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Geographic Service Area</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["Local", "Regional", "Statewide", "Multi-State", "Nationwide", "International"].map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`geo-${area}`}
                        checked={readinessForm.geographicArea.includes(area)}
                        onCheckedChange={() => toggleArrayValue("readiness", "geographicArea", area)}
                      />
                      <label htmlFor={`geo-${area}`} className="text-sm cursor-pointer">{area}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-revenueRange">Annual Revenue Range *</Label>
                <Select value={readinessForm.revenueRange} onValueChange={(v) => updateReadinessForm("revenueRange", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-100k">Under $100k</SelectItem>
                    <SelectItem value="100k-250k">$100k - $250k</SelectItem>
                    <SelectItem value="250k-500k">$250k - $500k</SelectItem>
                    <SelectItem value="500k-1m">$500k - $1M</SelectItem>
                    <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                    <SelectItem value="5m+">$5M+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Insurance Coverage Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["General Liability", "Workers Comp", "Auto", "Professional Liability", "Bonding", "Cyber Insurance"].map((ins) => (
                    <div key={ins} className="flex items-center space-x-2">
                      <Checkbox
                        id={`ins-${ins}`}
                        checked={readinessForm.insuranceTypes.includes(ins)}
                        onCheckedChange={() => toggleArrayValue("readiness", "insuranceTypes", ins)}
                      />
                      <label htmlFor={`ins-${ins}`} className="text-sm cursor-pointer">{ins}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-hasEquipment"
                    checked={readinessForm.hasSpecializedEquipment}
                    onCheckedChange={(checked) => updateReadinessForm("hasSpecializedEquipment", !!checked)}
                  />
                  <label htmlFor="r-hasEquipment" className="text-sm cursor-pointer">
                    Own specialized equipment or tools
                  </label>
                </div>
                {readinessForm.hasSpecializedEquipment && (
                  <Input
                    value={readinessForm.equipmentDescription}
                    onChange={(e) => updateReadinessForm("equipmentDescription", e.target.value)}
                    placeholder="Describe your specialized equipment"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Credentials, Certifications & Security</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-hasIndustryCerts"
                    checked={readinessForm.hasIndustryCertifications}
                    onCheckedChange={(checked) => updateReadinessForm("hasIndustryCertifications", !!checked)}
                  />
                  <label htmlFor="r-hasIndustryCerts" className="text-sm cursor-pointer font-medium">
                    Have industry certifications
                  </label>
                </div>
                {readinessForm.hasIndustryCertifications && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                    {["ISO", "CMMC", "OSHA", "Professional licenses", "Trade certifications", "IT certifications", "Other"].map((cert) => (
                      <div key={cert} className="flex items-center space-x-2">
                        <Checkbox
                          id={`indcert-${cert}`}
                          checked={readinessForm.industryCertifications.includes(cert)}
                          onCheckedChange={() => toggleArrayValue("readiness", "industryCertifications", cert)}
                        />
                        <label htmlFor={`indcert-${cert}`} className="text-sm cursor-pointer">{cert}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-hasSmallBizCerts"
                    checked={readinessForm.hasSmallBusinessCerts}
                    onCheckedChange={(checked) => updateReadinessForm("hasSmallBusinessCerts", !!checked)}
                  />
                  <label htmlFor="r-hasSmallBizCerts" className="text-sm cursor-pointer font-medium">
                    Have small business certifications
                  </label>
                </div>
                {readinessForm.hasSmallBusinessCerts && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                    {["WOSB", "MBE", "WBE", "VBE", "DBE", "SDVOSB", "VOSB", "HUBZone", "8(a)", "None yet"].map((cert) => (
                      <div key={cert} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sbcert-${cert}`}
                          checked={readinessForm.smallBusinessCerts.includes(cert)}
                          onCheckedChange={() => toggleArrayValue("readiness", "smallBusinessCerts", cert)}
                        />
                        <label htmlFor={`sbcert-${cert}`} className="text-sm cursor-pointer">{cert}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Security Clearances</Label>
                <RadioGroup 
                  value={readinessForm.securityClearance} 
                  onValueChange={(v) => updateReadinessForm("securityClearance", v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="clear-none" />
                    <label htmlFor="clear-none" className="text-sm cursor-pointer">None</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public-trust" id="clear-pt" />
                    <label htmlFor="clear-pt" className="text-sm cursor-pointer">Public Trust</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="secret" id="clear-secret" />
                    <label htmlFor="clear-secret" className="text-sm cursor-pointer">Secret</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="top-secret" id="clear-ts" />
                    <label htmlFor="clear-ts" className="text-sm cursor-pointer">Top Secret</label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-interestedDoD"
                    checked={readinessForm.interestedInDoD}
                    onCheckedChange={(checked) => updateReadinessForm("interestedInDoD", !!checked)}
                  />
                  <label htmlFor="r-interestedDoD" className="text-sm cursor-pointer">
                    Interested in pursuing DoD contracts
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-sponsorClearance"
                    checked={readinessForm.willingSponsorClearance}
                    onCheckedChange={(checked) => updateReadinessForm("willingSponsorClearance", !!checked)}
                  />
                  <label htmlFor="r-sponsorClearance" className="text-sm cursor-pointer">
                    Willing to sponsor employees for clearances
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-fclUnderstanding">Understand Facility Clearance (FCL/SCL) requirements?</Label>
                <Select value={readinessForm.understandsFCL} onValueChange={(v) => updateReadinessForm("understandsFCL", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="somewhat">Somewhat</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-ownerMilitary"
                    checked={readinessForm.ownerMilitaryExp}
                    onCheckedChange={(checked) => updateReadinessForm("ownerMilitaryExp", !!checked)}
                  />
                  <label htmlFor="r-ownerMilitary" className="text-sm cursor-pointer">
                    Owner has military experience
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Employee Military Backgrounds</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["None", "Enlisted", "Officer", "Logistics", "IT/Cyber", "Engineering", "Intelligence", "Medical", "Other"].map((bg) => (
                    <div key={bg} className="flex items-center space-x-2">
                      <Checkbox
                        id={`milbg-${bg}`}
                        checked={readinessForm.employeeMilitaryBg.includes(bg)}
                        onCheckedChange={() => toggleArrayValue("readiness", "employeeMilitaryBg", bg)}
                      />
                      <label htmlFor={`milbg-${bg}`} className="text-sm cursor-pointer">{bg}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Local Government Readiness</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Registered as a vendor in your city/county?</Label>
                <RadioGroup 
                  value={readinessForm.localVendorRegistered} 
                  onValueChange={(v) => updateReadinessForm("localVendorRegistered", v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="local-yes" />
                    <label htmlFor="local-yes" className="text-sm cursor-pointer">Yes</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="local-no" />
                    <label htmlFor="local-no" className="text-sm cursor-pointer">No</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not-sure" id="local-unsure" />
                    <label htmlFor="local-unsure" className="text-sm cursor-pointer">Not sure</label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="r-knowsLocalPortals"
                  checked={readinessForm.knowsLocalPortals}
                  onCheckedChange={(checked) => updateReadinessForm("knowsLocalPortals", !!checked)}
                />
                <label htmlFor="r-knowsLocalPortals" className="text-sm cursor-pointer">
                  Know your local procurement portals
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-knowsNIGP"
                    checked={readinessForm.knowsNIGPCodes}
                    onCheckedChange={(checked) => updateReadinessForm("knowsNIGPCodes", !!checked)}
                  />
                  <label htmlFor="r-knowsNIGP" className="text-sm cursor-pointer">
                    Know your NIGP codes
                  </label>
                </div>
                {readinessForm.knowsNIGPCodes && (
                  <Input
                    value={readinessForm.nigpCodes}
                    onChange={(e) => updateReadinessForm("nigpCodes", e.target.value)}
                    placeholder="Enter your NIGP codes"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>Meet local insurance requirements?</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["General liability", "Auto", "Bonding", "Worker's Comp", "Not sure"].map((ins) => (
                    <div key={ins} className="flex items-center space-x-2">
                      <Checkbox
                        id={`localins-${ins}`}
                        checked={readinessForm.meetsLocalInsurance.includes(ins)}
                        onCheckedChange={() => toggleArrayValue("readiness", "meetsLocalInsurance", ins)}
                      />
                      <label htmlFor={`localins-${ins}`} className="text-sm cursor-pointer">{ins}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-hasLocalExp"
                    checked={readinessForm.hasLocalGovExperience}
                    onCheckedChange={(checked) => updateReadinessForm("hasLocalGovExperience", !!checked)}
                  />
                  <label htmlFor="r-hasLocalExp" className="text-sm cursor-pointer">
                    Completed local government or school district work before
                  </label>
                </div>
                {readinessForm.hasLocalGovExperience && (
                  <Textarea
                    value={readinessForm.localGovDescription}
                    onChange={(e) => updateReadinessForm("localGovDescription", e.target.value)}
                    placeholder="Describe your local government experience"
                    className="min-h-[80px]"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">State Government Readiness</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Target States (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {US_STATES.map((state) => (
                    <div key={state} className="flex items-center space-x-2">
                      <Checkbox
                        id={`state-${state}`}
                        checked={readinessForm.targetStates.includes(state)}
                        onCheckedChange={() => toggleArrayValue("readiness", "targetStates", state)}
                      />
                      <label htmlFor={`state-${state}`} className="text-sm cursor-pointer">{state}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="r-stateVendorId"
                  checked={readinessForm.hasStateVendorId}
                  onCheckedChange={(checked) => updateReadinessForm("hasStateVendorId", !!checked)}
                />
                <label htmlFor="r-stateVendorId" className="text-sm cursor-pointer">
                  Have a state vendor ID
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="r-knowsStateBidding"
                  checked={readinessForm.knowsStateBiddingPortal}
                  onCheckedChange={(checked) => updateReadinessForm("knowsStateBiddingPortal", !!checked)}
                />
                <label htmlFor="r-knowsStateBidding" className="text-sm cursor-pointer">
                  Know your state's bidding portal
                </label>
              </div>

              <div className="space-y-2">
                <Label>State-Level Certifications</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["MBE", "WBE", "VBE", "DBE", "SBE", "None"].map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={`statecert-${cert}`}
                        checked={readinessForm.stateCertifications.includes(cert)}
                        onCheckedChange={() => toggleArrayValue("readiness", "stateCertifications", cert)}
                      />
                      <label htmlFor={`statecert-${cert}`} className="text-sm cursor-pointer">{cert}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="r-knowsStateCodes"
                  checked={readinessForm.knowsStateCodes}
                  onCheckedChange={(checked) => updateReadinessForm("knowsStateCodes", !!checked)}
                />
                <label htmlFor="r-knowsStateCodes" className="text-sm cursor-pointer">
                  Know your state-specific commodity/service codes
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-hasStateExp"
                    checked={readinessForm.hasStateExperience}
                    onCheckedChange={(checked) => updateReadinessForm("hasStateExperience", !!checked)}
                  />
                  <label htmlFor="r-hasStateExp" className="text-sm cursor-pointer">
                    Completed work for state agencies
                  </label>
                </div>
                {readinessForm.hasStateExperience && (
                  <Input
                    value={readinessForm.stateAgencies}
                    onChange={(e) => updateReadinessForm("stateAgencies", e.target.value)}
                    placeholder="List state agencies you've worked with"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Federal Contracting Readiness</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>SAM.gov Registration Status</Label>
                <RadioGroup 
                  value={readinessForm.samRegistration} 
                  onValueChange={(v) => updateReadinessForm("samRegistration", v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="sam-yes" />
                    <label htmlFor="sam-yes" className="text-sm cursor-pointer">Yes, registered</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in-process" id="sam-process" />
                    <label htmlFor="sam-process" className="text-sm cursor-pointer">In process</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="sam-no" />
                    <label htmlFor="sam-no" className="text-sm cursor-pointer">No</label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="r-uei">UEI Number</Label>
                  <Input
                    id="r-uei"
                    value={readinessForm.ueiNumber}
                    onChange={(e) => updateReadinessForm("ueiNumber", e.target.value)}
                    placeholder="12-character UEI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-cage">CAGE Code</Label>
                  <Input
                    id="r-cage"
                    value={readinessForm.cageCode}
                    onChange={(e) => updateReadinessForm("cageCode", e.target.value)}
                    placeholder="5-character code"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-naicsCodesInput">NAICS Codes (Enter up to 10, comma-separated)</Label>
                <Input
                  id="r-naicsCodesInput"
                  value={readinessForm.naicsCodesInput}
                  onChange={(e) => updateReadinessForm("naicsCodesInput", e.target.value)}
                  placeholder="e.g., 541511, 541512, 238210"
                />
                <p className="text-xs text-muted-foreground">
                  Enter 6-digit NAICS codes separated by commas.{" "}
                  <a 
                    href="https://www.census.gov/naics/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Look up your NAICS codes →
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-psc">PSC/FSC Codes</Label>
                <Input
                  id="r-psc"
                  value={readinessForm.pscCodes}
                  onChange={(e) => updateReadinessForm("pscCodes", e.target.value)}
                  placeholder="e.g., R499, D399"
                />
              </div>

              <div className="space-y-2">
                <Label>Federal Certifications</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["WOSB", "SDVOSB", "HUBZone", "8(a)", "SDB", "None"].map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={`fedcert-${cert}`}
                        checked={readinessForm.federalCertifications.includes(cert)}
                        onCheckedChange={() => toggleArrayValue("readiness", "federalCertifications", cert)}
                      />
                      <label htmlFor={`fedcert-${cert}`} className="text-sm cursor-pointer">{cert}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="r-hasFedExp"
                    checked={readinessForm.hasFederalExperience}
                    onCheckedChange={(checked) => updateReadinessForm("hasFederalExperience", !!checked)}
                  />
                  <label htmlFor="r-hasFedExp" className="text-sm cursor-pointer">
                    Done federal or subcontract work
                  </label>
                </div>
                {readinessForm.hasFederalExperience && (
                  <Input
                    value={readinessForm.federalDescription}
                    onChange={(e) => updateReadinessForm("federalDescription", e.target.value)}
                    placeholder="Describe your federal experience"
                  />
                )}
              </div>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">DoD-Specific Readiness</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="r-pursuingDefense"
                      checked={readinessForm.pursuingDefense}
                      onCheckedChange={(checked) => updateReadinessForm("pursuingDefense", !!checked)}
                    />
                    <label htmlFor="r-pursuingDefense" className="text-sm cursor-pointer">
                      Pursuing defense contracts
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="r-cyberReq">Meet minimum cybersecurity requirements?</Label>
                    <Select value={readinessForm.meetsCyberRequirements} onValueChange={(v) => updateReadinessForm("meetsCyberRequirements", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="partially">Partially</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="not-sure">Not sure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="r-hasDefenseWork"
                        checked={readinessForm.hasDefenseWork}
                        onCheckedChange={(checked) => updateReadinessForm("hasDefenseWork", !!checked)}
                      />
                      <label htmlFor="r-hasDefenseWork" className="text-sm cursor-pointer">
                        Have past defense-related work
                      </label>
                    </div>
                    {readinessForm.hasDefenseWork && (
                      <Textarea
                        value={readinessForm.defenseDescription}
                        onChange={(e) => updateReadinessForm("defenseDescription", e.target.value)}
                        placeholder="Describe your defense-related experience"
                        className="min-h-[80px]"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render readiness results
  const renderReadinessResults = () => {
    if (!readinessResult) return null;

    const getScoreColor = (score: number) => {
      if (score >= 80) return "text-green-600";
      if (score >= 60) return "text-yellow-600";
      return "text-red-600";
    };

    const getScoreBg = (score: number) => {
      if (score >= 80) return "bg-green-100";
      if (score >= 60) return "bg-yellow-100";
      return "bg-red-100";
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Local Government", score: readinessResult.localScore },
            { label: "State Government", score: readinessResult.stateScore },
            { label: "Federal Government", score: readinessResult.federalScore },
            { label: "DoD Readiness", score: readinessResult.dodScore }
          ].map((item) => (
            <Card key={item.label} className={`${getScoreBg(item.score)} border-0`}>
              <CardContent className="p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className={`text-3xl font-bold ${getScoreColor(item.score)}`}>{item.score}%</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-2">Overall Contract Readiness</p>
            <p className={`text-5xl font-bold ${getScoreColor(readinessResult.overallScore)}`}>
              {readinessResult.overallScore}%
            </p>
          </CardContent>
        </Card>

        {readinessResult.recommendations && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recommendations & Next Steps</h3>
            
            {readinessResult.recommendations.map((rec: any, index: number) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {rec.priority === "high" ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-secondary" />
                    )}
                    {rec.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                  {rec.actionItems && (
                    <ul className="mt-2 text-sm space-y-1">
                      {rec.actionItems.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button onClick={() => { setReadinessResult(null); setReadinessStep(1); }} variant="outline" className="w-full">
          Start New Assessment
        </Button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Contract It - Government Contracting Tools | PivotHub</title>
        <meta name="description" content="Create professional government Capability Statements and assess your contract readiness with AI-powered tools designed for federal, state, and local contracting." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="page-container section-spacing">
          <div className="content-width">
            <div className="text-center mb-8">
              <h1 className="section-header">Contract It</h1>
              <p className="section-description max-w-2xl mx-auto">
                Professional tools to help you succeed in government contracting
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="capability" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Capability Statement
                </TabsTrigger>
                <TabsTrigger value="readiness" className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" />
                  Contract Readiness
                </TabsTrigger>
              </TabsList>

              <TabsContent value="capability">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Capability Statement Generator
                    </CardTitle>
                    <CardDescription>
                      Create a professional, one-page Capability Statement that meets government contracting standards.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {capabilityResult ? (
                      <div className="space-y-6">
                        <div className="bg-secondary/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="h-5 w-5 text-secondary" />
                            <span className="font-medium">Capability Statement Generated!</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Your professional Capability Statement is ready. Download as PDF to share with government buyers.
                          </p>
                          <Button onClick={handleDownloadCapabilityPDF} className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                          </Button>
                        </div>
                        
                        <div className="border rounded-lg p-4 space-y-4">
                          <h3 className="font-semibold">Preview</h3>
                          {capabilityResult.companyData && (
                            <div>
                              <h4 className="font-medium text-sm text-primary">Company Data & Pertinent Codes</h4>
                              <p className="text-sm whitespace-pre-wrap">{capabilityResult.companyData}</p>
                            </div>
                          )}
                          {capabilityResult.coreCompetencies && (
                            <div>
                              <h4 className="font-medium text-sm text-primary">Core Competencies</h4>
                              <p className="text-sm whitespace-pre-wrap">{capabilityResult.coreCompetencies}</p>
                            </div>
                          )}
                          {capabilityResult.differentiators && (
                            <div>
                              <h4 className="font-medium text-sm text-primary">Differentiators</h4>
                              <p className="text-sm whitespace-pre-wrap">{capabilityResult.differentiators}</p>
                            </div>
                          )}
                          {capabilityResult.pastPerformance && (
                            <div>
                              <h4 className="font-medium text-sm text-primary">Past Performance</h4>
                              <p className="text-sm whitespace-pre-wrap">{capabilityResult.pastPerformance}</p>
                            </div>
                          )}
                        </div>

                        <Button onClick={() => { setCapabilityResult(null); setCapabilityStep(1); }} variant="outline" className="w-full">
                          Create New Statement
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Step {capabilityStep} of 4</span>
                            <span className="text-sm font-medium">
                              {capabilityStep === 1 && "Company Data"}
                              {capabilityStep === 2 && "Core Competencies"}
                              {capabilityStep === 3 && "Differentiators"}
                              {capabilityStep === 4 && "Past Performance"}
                            </span>
                          </div>
                          <Progress value={(capabilityStep / 4) * 100} className="h-2" />
                        </div>

                        {renderCapabilityStep()}

                        <div className="flex justify-between mt-8">
                          <Button
                            variant="outline"
                            onClick={() => setCapabilityStep(prev => prev - 1)}
                            disabled={capabilityStep === 1}
                          >
                            Previous
                          </Button>
                          
                          {capabilityStep < 4 ? (
                            <Button onClick={() => setCapabilityStep(prev => prev + 1)}>
                              Next
                            </Button>
                          ) : (
                            <Button 
                              onClick={handleCapabilitySubmit} 
                              disabled={capabilityLoading || !capabilityForm.businessName}
                            >
                              {capabilityLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                "Generate Capability Statement"
                              )}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="readiness">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                      Contract Readiness Assessment
                    </CardTitle>
                    <CardDescription>
                      Evaluate your readiness for local, state, and federal government contracting.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {readinessResult ? (
                      renderReadinessResults()
                    ) : (
                      <>
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">Section {readinessStep} of 5</span>
                            <span className="text-sm font-medium">
                              {readinessStep === 1 && "Business Foundations"}
                              {readinessStep === 2 && "Credentials & Security"}
                              {readinessStep === 3 && "Local Government"}
                              {readinessStep === 4 && "State Government"}
                              {readinessStep === 5 && "Federal Government"}
                            </span>
                          </div>
                          <Progress value={(readinessStep / 5) * 100} className="h-2" />
                        </div>

                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                          {[1, 2, 3, 4, 5].map((step) => (
                            <Badge
                              key={step}
                              variant={readinessStep === step ? "default" : "outline"}
                              className="cursor-pointer whitespace-nowrap"
                              onClick={() => setReadinessStep(step)}
                            >
                              {step === 1 && <Building2 className="h-3 w-3 mr-1" />}
                              {step === 2 && <Shield className="h-3 w-3 mr-1" />}
                              {step === 3 && <MapPin className="h-3 w-3 mr-1" />}
                              {step === 4 && <Flag className="h-3 w-3 mr-1" />}
                              {step === 5 && <Flag className="h-3 w-3 mr-1" />}
                              {step === 1 && "Business"}
                              {step === 2 && "Credentials"}
                              {step === 3 && "Local"}
                              {step === 4 && "State"}
                              {step === 5 && "Federal"}
                            </Badge>
                          ))}
                        </div>

                        {renderReadinessStep()}

                        <div className="flex justify-between mt-8">
                          <Button
                            variant="outline"
                            onClick={() => setReadinessStep(prev => prev - 1)}
                            disabled={readinessStep === 1}
                          >
                            Previous
                          </Button>
                          
                          {readinessStep < 5 ? (
                            <Button onClick={() => setReadinessStep(prev => prev + 1)}>
                              Next Section
                            </Button>
                          ) : (
                            <Button 
                              onClick={handleReadinessSubmit} 
                              disabled={readinessLoading || !readinessForm.businessName}
                            >
                              {readinessLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                "Get Readiness Assessment"
                              )}
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ContractIt;
