import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { FileText, Send, Download, ExternalLink, Calculator, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import heroImage from "@/assets/hero-image.jpg";
import { generateGrantProposalPDF } from '@/lib/pdf-templates/grant-template';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';
import { ToolGuard } from '@/components/ToolGuard';

interface GrantFormData {
  organizationName: string;
  projectTitle: string;
  projectDescription: string;
  grantAmountRequested: string;
  grantType: string;
  purposeOfFunds: string;
  targetPopulation: string;
  projectGoals: string;
  projectTimeline: string;
  communityImpact: string;
  sustainabilityPlan: string;
  organizationBackground: string;
  contactPersonName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  additionalInformation: string;
  grantRequirements: string;
  otherDetails: string;
  // Budget fields (optional but recommended)
  budgetPersonnel?: string;
  budgetEquipment?: string;
  budgetSupplies?: string;
  budgetTravel?: string;
  budgetContractual?: string;
  budgetOther?: string;
  budgetIndirect?: string;
  budgetIndirectRate?: string;
  matchingFunds?: string;
  matchingFundsSource?: string;
  budgetNotes?: string;
}

// Grant Research Resources
const GRANT_RESEARCH_RESOURCES = [
  {
    category: 'Federal Grants',
    resources: [
      { name: 'Grants.gov', url: 'https://www.grants.gov/', description: 'Official U.S. government grants database with 1,000+ federal programs' },
      { name: 'SBA.gov', url: 'https://www.sba.gov/funding-programs/grants', description: 'Small Business Administration grants and funding programs' },
      { name: 'SBIR.gov', url: 'https://www.sbir.gov/', description: 'Small Business Innovation Research and STTR programs' },
    ]
  },
  {
    category: 'State & Local',
    resources: [
      { name: 'NCSL State Grants', url: 'https://www.ncsl.org/', description: 'National Conference of State Legislatures grant database' },
      { name: 'USA.gov State Resources', url: 'https://www.usa.gov/state-grants', description: 'Directory of state economic development agencies' },
    ]
  },
  {
    category: 'Foundations',
    resources: [
      { name: 'Candid', url: 'https://fconline.foundationcenter.org/', description: 'Foundation Directory Online - comprehensive foundation database' },
      { name: 'Grant Watch', url: 'https://www.grantwatch.com/', description: 'Updated list of grants from foundations, corporations, and government' },
    ]
  },
  {
    category: 'Industry-Specific',
    resources: [
      { name: 'Google for Startups', url: 'https://startup.google.com/', description: 'Tech startup grants and accelerator programs' },
      { name: 'AWS Activate', url: 'https://aws.amazon.com/activate/', description: 'Amazon cloud credits and startup resources' },
      { name: 'NIH Grants', url: 'https://grants.nih.gov/', description: 'National Institutes of Health research grants' },
      { name: 'NEA Grants', url: 'https://www.arts.gov/grants', description: 'National Endowment for the Arts funding' },
    ]
  },
  {
    category: 'Small Business',
    resources: [
      { name: 'SBDC Locator', url: 'https://www.sba.gov/local-assistance', description: 'Find your local Small Business Development Center' },
      { name: 'SCORE', url: 'https://www.score.org/', description: 'Free business mentoring and grant assistance' },
    ]
  },
  {
    category: 'Corporate & CSR',
    resources: [
      { name: 'Corporate Grant Directory', url: 'https://www.instrumentl.com/grants/corporate', description: 'Database of corporate social responsibility grants' },
      { name: 'Giving Compass', url: 'https://givingcompass.org/', description: 'Corporate philanthropy and grant opportunities' },
    ]
  },
];

const FundIt = () => {
  const { session } = useAuth();
  const { remainingRequests, checkAndIncrementUsage } = useUsage();
  const [formData, setFormData] = useState<GrantFormData>({
    organizationName: '',
    projectTitle: '',
    projectDescription: '',
    grantAmountRequested: '',
    grantType: '',
    purposeOfFunds: '',
    targetPopulation: '',
    projectGoals: '',
    projectTimeline: '',
    communityImpact: '',
    sustainabilityPlan: '',
    organizationBackground: '',
    contactPersonName: '',
    contactTitle: '',
    contactEmail: '',
    contactPhone: '',
    additionalInformation: '',
    grantRequirements: '',
    otherDetails: '',
    budgetPersonnel: '',
    budgetEquipment: '',
    budgetSupplies: '',
    budgetTravel: '',
    budgetContractual: '',
    budgetOther: '',
    budgetIndirect: '',
    budgetIndirectRate: '',
    matchingFunds: '',
    matchingFundsSource: '',
    budgetNotes: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [generatedLOI, setGeneratedLOI] = useState('');

  const handleInputChange = (field: keyof GrantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate total budget from all budget fields
  const calculateTotalBudget = () => {
    const budgetFields = [
      formData.budgetPersonnel,
      formData.budgetEquipment,
      formData.budgetSupplies,
      formData.budgetTravel,
      formData.budgetContractual,
      formData.budgetOther,
      formData.budgetIndirect,
    ];
    
    const total = budgetFields.reduce((sum, field) => {
      const value = parseFloat(field?.replace(/[^0-9.]/g, '') || '0');
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    
    return total;
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate budget difference and determine color
  const getBudgetComparison = () => {
    const totalBudget = calculateTotalBudget();
    const requestedAmount = parseFloat(formData.grantAmountRequested?.replace(/[^0-9.]/g, '') || '0');
    
    if (!requestedAmount || !totalBudget) return null;
    
    const difference = totalBudget - requestedAmount;
    const percentageDiff = Math.abs(difference / requestedAmount) * 100;
    
    let colorClass = 'text-green-600';
    if (percentageDiff > 20) colorClass = 'text-red-600';
    else if (percentageDiff > 10) colorClass = 'text-yellow-600';
    
    return {
      totalBudget,
      requestedAmount,
      difference,
      percentageDiff,
      colorClass,
    };
  };

  const generateGrantDocuments = async () => {
    if (!formData.organizationName || !formData.projectTitle || !formData.projectDescription) {
      toast.error('Please fill in the required fields: Organization Name, Project Title, and Project Description');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Use secure Supabase client with automatic auth header injection
      const { data, error } = await supabase.functions.invoke('generate-grant-content', {
        body: formData
      });

      if (error) {
        // Handle specific error types
        if (error.message?.includes('JWT') || error.message?.includes('auth')) {
          toast.error('Session Expired', {
            description: 'Please log in again to continue.'
          });
        } else if (error.message?.includes('credits') || error.message?.includes('limit')) {
          toast.error('Insufficient Credits', {
            description: "You don't have enough credits for this operation."
          });
        } else if (error.message?.includes('rate limit')) {
          toast.error('Rate Limit Exceeded', {
            description: 'Please wait a moment before trying again.'
          });
        } else {
          throw error;
        }
        return;
      }

      const { proposal, letterOfIntent } = data;
      
      setGeneratedProposal(proposal);
      setGeneratedLOI(letterOfIntent);
      toast.success('AI-powered grant documents generated successfully!');
    } catch (error: any) {
      console.error('Error generating grant content:', error);
      toast.error('Failed to generate grant content', {
        description: error.message || 'Please try again.'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadProposalPDF = () => {
    if (!generatedProposal || !formData.organizationName || !formData.projectTitle) {
      toast.error('Please generate a proposal first');
      return;
    }

    try {
      const pdf = generateGrantProposalPDF(
        generatedProposal,
        generatedLOI,
        formData.organizationName,
        formData.projectTitle,
        {
          name: formData.contactPersonName || 'Contact Person',
          title: formData.contactTitle || 'Title',
          email: formData.contactEmail || 'email@example.com',
          phone: formData.contactPhone || '(555) 555-5555',
        }
      );
      pdf.save(`${formData.organizationName.replace(/\s+/g, '-')}-grant-proposal.pdf`);
      toast.success('Grant proposal PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Fund It - Grant Writing & Research Tools | PivotHub</title>
        <meta name="description" content="Generate professional grant proposals and letters of intent with AI assistance. Access curated grant research resources for federal, state, foundation, and corporate grants." />
      </Helmet>

      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero hero-glow overflow-hidden relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        <div className="floating-orb top-16 right-16 w-40 h-40 bg-primary/8 animate-float"></div>
        <div className="floating-orb bottom-24 left-16 w-32 h-32 bg-secondary/10 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb top-1/3 right-1/3 w-24 h-24 bg-accent/12 animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">FUND IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Grant Writing & Research
            </h1>
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-12 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto text-center" style={{ animationDelay: '0.2s' }}>
              AI-powered grant proposals + curated funding resources
            </p>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Tool Card */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                Grant Writing Tools
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Generate professional grant documents with AI assistance
              </p>
            </div>
            
            <Card className="premium-card max-w-3xl mx-auto mb-8">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl">LOI & Grant Proposal Generator</CardTitle>
                </div>
                <CardDescription>
                  Generate comprehensive grant proposals and letters of intent with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Professional formatting and structure</li>
                  <li>• Customized content for your organization</li>
                  <li>• Letter of Intent generation</li>
                  <li>• Download as professional PDF</li>
                  <li>• Cost: 4 credits per generation</li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Grant Generator Form and Results */}
          <section className="mb-16">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form Section */}
              <div className="lg:col-span-3">
                <Card className="h-fit">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FileText className="h-5 w-5" />
                      Grant Information
                    </CardTitle>
                    <CardDescription>
                      Fill in the details below to generate your grant proposal and letter of intent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="organizationName">Organization Name *</Label>
                        <Input
                          id="organizationName"
                          value={formData.organizationName}
                          onChange={(e) => handleInputChange('organizationName', e.target.value)}
                          placeholder="Your Organization Name"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grantAmountRequested">Grant Amount Requested</Label>
                        <Input
                          id="grantAmountRequested"
                          value={formData.grantAmountRequested}
                          onChange={(e) => handleInputChange('grantAmountRequested', e.target.value)}
                          placeholder="50000"
                          type="number"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grantType">Grant Type *</Label>
                      <Select onValueChange={(value) => handleInputChange('grantType', value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select grant type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="federal">Federal Grant</SelectItem>
                          <SelectItem value="state">State Grant</SelectItem>
                          <SelectItem value="local">Local/Municipal Grant</SelectItem>
                          <SelectItem value="foundation">Foundation Grant</SelectItem>
                          <SelectItem value="corporate">Corporate Grant</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit Grant</SelectItem>
                          <SelectItem value="research">Research Grant</SelectItem>
                          <SelectItem value="education">Education Grant</SelectItem>
                          <SelectItem value="community">Community Grant</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectTitle">Project Title *</Label>
                      <Input
                        id="projectTitle"
                        value={formData.projectTitle}
                        onChange={(e) => handleInputChange('projectTitle', e.target.value)}
                        placeholder="Your Project Title"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectDescription">Project Description *</Label>
                      <Textarea
                        id="projectDescription"
                        value={formData.projectDescription}
                        onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                        placeholder="Brief description of your project..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="purposeOfFunds">Purpose of Funds</Label>
                      <Select onValueChange={(value) => handleInputChange('purposeOfFunds', value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select purpose of funds" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="program">Program Development</SelectItem>
                          <SelectItem value="renovation">Renovation/Construction</SelectItem>
                          <SelectItem value="staffing">Staffing/Personnel</SelectItem>
                          <SelectItem value="equipment">Equipment/Technology</SelectItem>
                          <SelectItem value="operational">Operational Expenses</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetPopulation">Target Population</Label>
                        <Textarea
                          id="targetPopulation"
                          value={formData.targetPopulation}
                          onChange={(e) => handleInputChange('targetPopulation', e.target.value)}
                          placeholder="Who will benefit?"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="projectGoals">Project Goals</Label>
                        <Textarea
                          id="projectGoals"
                          value={formData.projectGoals}
                          onChange={(e) => handleInputChange('projectGoals', e.target.value)}
                          placeholder="Main goals and objectives"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="projectTimeline">Project Timeline</Label>
                        <Textarea
                          id="projectTimeline"
                          value={formData.projectTimeline}
                          onChange={(e) => handleInputChange('projectTimeline', e.target.value)}
                          placeholder="Implementation timeline"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="communityImpact">Community Impact</Label>
                        <Textarea
                          id="communityImpact"
                          value={formData.communityImpact}
                          onChange={(e) => handleInputChange('communityImpact', e.target.value)}
                          placeholder="Expected impact"
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sustainabilityPlan">Sustainability Plan</Label>
                      <Textarea
                        id="sustainabilityPlan"
                        value={formData.sustainabilityPlan}
                        onChange={(e) => handleInputChange('sustainabilityPlan', e.target.value)}
                        placeholder="How will project continue after grant funds?"
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organizationBackground">Organization Background</Label>
                      <Textarea
                        id="organizationBackground"
                        value={formData.organizationBackground}
                        onChange={(e) => handleInputChange('organizationBackground', e.target.value)}
                        placeholder="Brief history and mission"
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactPersonName">Contact Name</Label>
                        <Input
                          id="contactPersonName"
                          value={formData.contactPersonName}
                          onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                          placeholder="Contact Person"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactTitle">Contact Title</Label>
                        <Input
                          id="contactTitle"
                          value={formData.contactTitle}
                          onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                          placeholder="Job Title"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input
                          id="contactEmail"
                          value={formData.contactEmail}
                          onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                          placeholder="email@organization.org"
                          type="email"
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPhone">Contact Phone</Label>
                        <Input
                          id="contactPhone"
                          value={formData.contactPhone}
                          onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                          placeholder="(555) 123-4567"
                          type="tel"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grantRequirements">Grant Requirements</Label>
                      <Textarea
                        id="grantRequirements"
                        value={formData.grantRequirements}
                        onChange={(e) => handleInputChange('grantRequirements', e.target.value)}
                        placeholder="Specific requirements from grant guidelines"
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additionalInformation">Additional Information</Label>
                      <Textarea
                        id="additionalInformation"
                        value={formData.additionalInformation}
                        onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                        placeholder="Any additional details"
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    {/* Budget Breakdown Section */}
                    <Accordion type="single" collapsible className="w-full border rounded-lg">
                      <AccordionItem value="budget" className="border-0">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Calculator className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col items-start">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Budget Breakdown</span>
                                <Badge variant="secondary" className="text-xs">Highly Recommended</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground font-normal">
                                Provide detailed budget for more accurate proposal
                              </span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="space-y-4 pt-2">
                            {/* Budget Calculator Display */}
                            {(() => {
                              const comparison = getBudgetComparison();
                              const totalBudget = calculateTotalBudget();
                              
                              return totalBudget > 0 || formData.grantAmountRequested ? (
                                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                  <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Budget Calculator</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Calculated Total:</span>
                                      <p className="font-semibold text-lg">{formatCurrency(totalBudget)}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Requested Amount:</span>
                                      <p className="font-semibold text-lg">
                                        {formData.grantAmountRequested ? formatCurrency(parseFloat(formData.grantAmountRequested.replace(/[^0-9.]/g, '') || '0')) : '$0'}
                                      </p>
                                    </div>
                                    {comparison && (
                                      <div>
                                        <span className="text-muted-foreground">Difference:</span>
                                        <p className={`font-semibold text-lg ${comparison.colorClass}`}>
                                          {comparison.difference >= 0 ? '+' : ''}{formatCurrency(comparison.difference)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  {comparison && comparison.percentageDiff > 10 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      ⓘ Budget should generally match requested amount (currently {comparison.percentageDiff.toFixed(1)}% difference)
                                    </p>
                                  )}
                                </div>
                              ) : null;
                            })()}

                            <p className="text-sm text-muted-foreground">
                              Enter detailed budget information below. Leave blank if you want AI to estimate budget allocation.
                            </p>

                            {/* Personnel Costs */}
                            <div className="space-y-2">
                              <Label htmlFor="budgetPersonnel">
                                Personnel Costs
                                <span className="text-xs text-muted-foreground ml-2">(Salaries, benefits, contractors)</span>
                              </Label>
                              <Input
                                id="budgetPersonnel"
                                value={formData.budgetPersonnel}
                                onChange={(e) => handleInputChange('budgetPersonnel', e.target.value)}
                                placeholder="$50,000"
                                className="h-10"
                              />
                            </div>

                            {/* Equipment Costs */}
                            <div className="space-y-2">
                              <Label htmlFor="budgetEquipment">
                                Equipment Costs
                                <span className="text-xs text-muted-foreground ml-2">(Purchases over $5,000 per unit)</span>
                              </Label>
                              <Input
                                id="budgetEquipment"
                                value={formData.budgetEquipment}
                                onChange={(e) => handleInputChange('budgetEquipment', e.target.value)}
                                placeholder="$10,000"
                                className="h-10"
                              />
                            </div>

                            {/* Supplies & Materials */}
                            <div className="space-y-2">
                              <Label htmlFor="budgetSupplies">
                                Supplies & Materials
                                <span className="text-xs text-muted-foreground ml-2">(Consumable items under $5,000)</span>
                              </Label>
                              <Input
                                id="budgetSupplies"
                                value={formData.budgetSupplies}
                                onChange={(e) => handleInputChange('budgetSupplies', e.target.value)}
                                placeholder="$5,000"
                                className="h-10"
                              />
                            </div>

                            {/* Travel Costs */}
                            <div className="space-y-2">
                              <Label htmlFor="budgetTravel">
                                Travel Costs
                                <span className="text-xs text-muted-foreground ml-2">(Transportation, lodging, per diem)</span>
                              </Label>
                              <Input
                                id="budgetTravel"
                                value={formData.budgetTravel}
                                onChange={(e) => handleInputChange('budgetTravel', e.target.value)}
                                placeholder="$3,000"
                                className="h-10"
                              />
                            </div>

                            {/* Contractual Services */}
                            <div className="space-y-2">
                              <Label htmlFor="budgetContractual">
                                Contractual/Consultant Services
                                <span className="text-xs text-muted-foreground ml-2">(External consultants, vendors)</span>
                              </Label>
                              <Input
                                id="budgetContractual"
                                value={formData.budgetContractual}
                                onChange={(e) => handleInputChange('budgetContractual', e.target.value)}
                                placeholder="$8,000"
                                className="h-10"
                              />
                            </div>

                            {/* Other Direct Costs */}
                            <div className="space-y-2">
                              <Label htmlFor="budgetOther">
                                Other Direct Costs
                                <span className="text-xs text-muted-foreground ml-2">(Participant support, publication fees)</span>
                              </Label>
                              <Input
                                id="budgetOther"
                                value={formData.budgetOther}
                                onChange={(e) => handleInputChange('budgetOther', e.target.value)}
                                placeholder="$2,000"
                                className="h-10"
                              />
                            </div>

                            {/* Indirect Costs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="budgetIndirect">
                                  Indirect Costs (F&A)
                                  <span className="text-xs text-muted-foreground ml-2">(Administrative overhead)</span>
                                </Label>
                                <Input
                                  id="budgetIndirect"
                                  value={formData.budgetIndirect}
                                  onChange={(e) => handleInputChange('budgetIndirect', e.target.value)}
                                  placeholder="$7,500"
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="budgetIndirectRate">Indirect Rate (%)</Label>
                                <Input
                                  id="budgetIndirectRate"
                                  value={formData.budgetIndirectRate}
                                  onChange={(e) => handleInputChange('budgetIndirectRate', e.target.value)}
                                  placeholder="15"
                                  className="h-10"
                                />
                              </div>
                            </div>

                            {/* Matching Funds */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="matchingFunds">
                                  Matching Funds
                                  <span className="text-xs text-muted-foreground ml-2">(Non-grant funds committed)</span>
                                </Label>
                                <Input
                                  id="matchingFunds"
                                  value={formData.matchingFunds}
                                  onChange={(e) => handleInputChange('matchingFunds', e.target.value)}
                                  placeholder="$5,000"
                                  className="h-10"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="matchingFundsSource">Matching Funds Source</Label>
                                <Input
                                  id="matchingFundsSource"
                                  value={formData.matchingFundsSource}
                                  onChange={(e) => handleInputChange('matchingFundsSource', e.target.value)}
                                  placeholder="Organization reserves, donations"
                                  className="h-10"
                                />
                              </div>
                            </div>

                            {/* Budget Notes */}
                            <div className="space-y-2">
                              <Label htmlFor="budgetNotes">
                                Budget Notes (Optional)
                                <span className="text-xs text-muted-foreground ml-2">(Additional budget justification or context)</span>
                              </Label>
                              <Textarea
                                id="budgetNotes"
                                value={formData.budgetNotes}
                                onChange={(e) => handleInputChange('budgetNotes', e.target.value)}
                                placeholder="Explain unique budget items or special considerations..."
                                rows={3}
                                className="resize-none"
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <ToolGuard 
                      onUse={generateGrantDocuments}
                      toolName="grant-content"
                    >
                      <Button
                        onClick={() => {}} 
                        disabled={isGenerating}
                        className="w-full h-11"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating Documents...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Generate Grant Documents (4 Credits)
                          </>
                        )}
                      </Button>
                    </ToolGuard>
                  </CardContent>
                </Card>
              </div>

              {/* Results Section */}
              <div className="lg:col-span-2">
                {(generatedProposal || generatedLOI) && (
                  <Card className="h-fit sticky top-8">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Generated Documents</CardTitle>
                      <CardDescription>
                        Your AI-generated grant proposal and letter of intent
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="proposal" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="proposal">Grant Proposal</TabsTrigger>
                          <TabsTrigger value="loi">Letter of Intent</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="proposal" className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Grant Proposal</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={downloadProposalPDF}
                              className="h-8"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download PDF
                            </Button>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-foreground">{generatedProposal}</pre>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="loi" className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Letter of Intent</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={downloadProposalPDF}
                              className="h-8"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download PDF
                            </Button>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-foreground">{generatedLOI}</pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>

          {/* Grant Research Resources Section */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                Grant Research Resources
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Curated external resources to help you find grant opportunities. PivotHub provides the writing tools — you do the research.
              </p>
            </div>

            <Card className="max-w-5xl mx-auto">
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {GRANT_RESEARCH_RESOURCES.map((section, idx) => (
                    <AccordionItem key={idx} value={`section-${idx}`}>
                      <AccordionTrigger className="text-lg font-semibold">
                        {section.category}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-4 pt-2">
                          {section.resources.map((resource, ridx) => (
                            <Card key={ridx} className="border">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <CardTitle className="text-base mb-1">{resource.name}</CardTitle>
                                    <CardDescription className="text-sm">{resource.description}</CardDescription>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(resource.url, '_blank')}
                                    className="shrink-0"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Visit Site
                                  </Button>
                                </div>
                              </CardHeader>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FundIt;
