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
import { FileText, Send, Download } from 'lucide-react';
import { toast } from 'sonner';

interface GrantFormData {
  organizationName: string;
  projectTitle: string;
  projectDescription: string;
  grantAmountRequested: string;
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
}

const GrantWriting = () => {
  const [formData, setFormData] = useState<GrantFormData>({
    organizationName: '',
    projectTitle: '',
    projectDescription: '',
    grantAmountRequested: '',
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
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [generatedLOI, setGeneratedLOI] = useState('');

  const handleInputChange = (field: keyof GrantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateGrantDocuments = async () => {
    if (!formData.organizationName || !formData.projectTitle || !formData.projectDescription) {
      toast.error('Please fill in the required fields: Organization Name, Project Title, and Project Description');
      return;
    }

    setIsGenerating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));

    const mockProposal = `
GRANT PROPOSAL

Organization: ${formData.organizationName}
Project Title: ${formData.projectTitle}

EXECUTIVE SUMMARY
${formData.projectDescription}

PROJECT DESCRIPTION
${formData.organizationBackground || 'Our organization has been serving the community with dedication and excellence.'} This project, "${formData.projectTitle}", aims to ${formData.projectGoals || 'achieve significant positive impact in our community'}.

TARGET POPULATION
${formData.targetPopulation || 'Community members who will benefit from this initiative'}

GOALS AND OBJECTIVES
${formData.projectGoals || 'To create meaningful change and sustainable impact through innovative programming and community engagement.'}

TIMELINE
${formData.projectTimeline || 'This project will be implemented over 12 months with specific milestones and deliverables.'}

BUDGET AND FUNDING REQUEST
We respectfully request $${formData.grantAmountRequested || '50,000'} to support this initiative. Funds will be allocated for ${formData.purposeOfFunds || 'program implementation, staffing, and essential resources'}.

COMMUNITY IMPACT
${formData.communityImpact || 'This project will create lasting positive change, benefiting hundreds of community members and establishing a foundation for continued growth.'}

SUSTAINABILITY
${formData.sustainabilityPlan || 'We have developed a comprehensive sustainability plan that includes ongoing fundraising, partnerships, and community support to ensure project continuity beyond the grant period.'}

CONTACT INFORMATION
${formData.contactPersonName || 'Project Director'}
${formData.contactTitle || 'Executive Director'}
Email: ${formData.contactEmail || 'contact@organization.org'}
Phone: ${formData.contactPhone || '(555) 123-4567'}

${formData.additionalInformation ? `ADDITIONAL INFORMATION\n${formData.additionalInformation}` : ''}
    `.trim();

    const mockLOI = `
LETTER OF INTENT

${new Date().toLocaleDateString()}

Dear Grant Review Committee,

${formData.organizationName} is pleased to submit this Letter of Intent for the "${formData.projectTitle}" project. We are requesting $${formData.grantAmountRequested || '50,000'} to support this important initiative.

PROJECT OVERVIEW
${formData.projectDescription}

OUR ORGANIZATION
${formData.organizationBackground || 'Our organization has been a trusted community partner, dedicated to creating positive change and supporting those in need.'}

PROJECT IMPACT
This project will directly benefit ${formData.targetPopulation || 'community members'} and create lasting positive change through ${formData.communityImpact || 'innovative programming and sustainable solutions'}.

We believe this project aligns perfectly with your foundation's mission and funding priorities. We would welcome the opportunity to submit a full proposal and discuss how this project can advance our shared goals.

Thank you for your consideration.

Sincerely,

${formData.contactPersonName || 'Project Director'}
${formData.contactTitle || 'Executive Director'}
${formData.organizationName}
${formData.contactEmail || 'contact@organization.org'}
${formData.contactPhone || '(555) 123-4567'}
    `.trim();

    setGeneratedProposal(mockProposal);
    setGeneratedLOI(mockLOI);
    setIsGenerating(false);
    toast.success('Grant documents generated successfully!');
  };

  const downloadDocument = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              AI Grant Writing Assistant
            </h1>
            <p className="text-lg text-muted-foreground">
              Generate professional grant proposals and letters of intent with AI assistance
            </p>
          </div>

          {/* Main Content Grid */}
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
                  <Label htmlFor="projectDescription">Project Description / Summary *</Label>
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
                      placeholder="Who will benefit from this project?"
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectGoals">Project Goals & Objectives</Label>
                    <Textarea
                      id="projectGoals"
                      value={formData.projectGoals}
                      onChange={(e) => handleInputChange('projectGoals', e.target.value)}
                      placeholder="What are the main goals and objectives?"
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
                      placeholder="Timeline for project implementation..."
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
                      placeholder="How will this project impact the community?"
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
                    placeholder="How will the project continue after grant funds?"
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
                    placeholder="Brief history and mission of your organization..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">Contact Person Name</Label>
                    <Input
                      id="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                      placeholder="Contact Name"
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
                  <Label htmlFor="grantRequirements">Grant Requirements & Details</Label>
                  <Textarea
                    id="grantRequirements"
                    value={formData.grantRequirements}
                    onChange={(e) => handleInputChange('grantRequirements', e.target.value)}
                    placeholder="Funding guidelines, eligibility criteria, restrictions, formatting requirements..."
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
                    placeholder="Any additional requirements or information..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otherDetails">Other Details</Label>
                  <Textarea
                    id="otherDetails"
                    value={formData.otherDetails}
                    onChange={(e) => handleInputChange('otherDetails', e.target.value)}
                    placeholder="Any other details not covered above..."
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <Button 
                  onClick={generateGrantDocuments} 
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
                      Generate Grant Documents
                    </>
                  )}
                </Button>
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
                          onClick={() => downloadDocument(generatedProposal, 'grant-proposal.txt')}
                          className="h-8"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{generatedProposal}</pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="loi" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Letter of Intent</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDocument(generatedLOI, 'letter-of-intent.txt')}
                          className="h-8"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{generatedLOI}</pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
             </div>
           </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GrantWriting;