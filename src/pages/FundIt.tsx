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
import { FileText, Send, Download, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import heroImage from "@/assets/hero-image.jpg";

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
}

interface GrantSearchData {
  organizationType: string;
  industry: string;
  location: string;
  fundingAmount: string;
  organizationStage: string;
  category: string;
  subcategory: string;
}

interface Grant {
  id: string;
  name: string;
  organization: string;
  amountRange: string;
  deadline: string;
  description: string;
  eligibility: string[];
  matchScore: number;
  difficulty: string;
  applicationUrl?: string;
  websiteUrl?: string;
  tips: string;
  category: string;
}

interface LocalResource {
  id: string;
  name: string;
  type: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  hours: string[];
  category: string;
}

// Grant categories and subcategories data
const GRANT_CATEGORIES = {
  "Government & Public Sector": {
    "Community Development": "Grants for housing, neighborhood revitalization, and infrastructure.",
    "Economic Development": "Supports job creation, entrepreneurship, and business expansion.",
    "Education": "Funds for K–12, college, and educational innovation programs.",
    "Health & Human Services": "Supports healthcare access, mental health, and family support services.",
    "Environmental": "Promotes sustainability, green energy, and conservation initiatives.",
    "Arts & Culture": "Funds museums, creative arts, and cultural heritage programs.",
    "Justice & Public Safety": "Supports reentry, violence prevention, and emergency services.",
    "Transportation": "Infrastructure, electric vehicles, and public transit innovation.",
    "Technology & Innovation": "Digital inclusion, smart cities, and innovation funding."
  },
  "Business & Entrepreneurship": {
    "Small Business": "Start-up or expansion funding for for-profit businesses.",
    "Minority-Owned Business": "Grants to support minority entrepreneurs and business growth.",
    "Women-Owned Business": "Funds to empower women entrepreneurs.",
    "Veteran-Owned Business": "Capital and training for veteran business owners.",
    "Rural Business": "Grants to stimulate economic growth in rural areas.",
    "Innovation & Research": "R&D, tech, and product innovation grants.",
    "Export/Trade": "Supports international trade or export development.",
    "Green & Sustainability": "Funds for eco-friendly or sustainable business practices."
  },
  "Research & Academic": {
    "Scientific Research": "Grants for natural and applied sciences.",
    "Medical Research": "Supports biomedical and public health research.",
    "STEM Education": "Focused on improving science, tech, engineering, and math learning.",
    "Social Science Research": "Supports studies in sociology, psychology, or economics.",
    "Humanities & Arts Research": "Funds projects in arts, culture, and humanities.",
    "Technology & AI Research": "Supports artificial intelligence and data science innovation."
  },
  "Nonprofit & Community": {
    "Capacity Building": "Strengthens operations, leadership, and infrastructure.",
    "Program or Project": "Funds specific nonprofit activities or initiatives.",
    "Operating Support": "Provides general organizational funding.",
    "Capital Projects": "Supports construction, renovation, or equipment.",
    "Matching Grants": "Requires grantees to raise partial funds to qualify.",
    "Challenge Grants": "Incentivizes innovation or fundraising performance.",
    "Faith-Based": "Supports faith-led social impact initiatives.",
    "Youth Development": "Funds mentoring, after-school, and leadership programs.",
    "Family & Social Services": "Supports food security, counseling, or housing programs.",
    "Health & Wellness": "Focused on holistic or preventative health."
  },
  "Environmental & Sustainability": {
    "Clean Energy": "Renewable energy generation and adoption.",
    "Climate Action": "Projects addressing climate mitigation or adaptation.",
    "Agriculture & Food Security": "Supports farming innovation and hunger relief.",
    "Conservation": "Land, wildlife, or biodiversity preservation.",
    "Water & Sanitation": "Access to clean water and sanitation infrastructure."
  },
  "Arts, Culture, & Humanities": {
    "Arts Education": "Enhances arts learning and access.",
    "Performing Arts": "Funds music, theater, and dance programs.",
    "Visual Arts": "Supports artists, exhibits, and creative spaces.",
    "Media & Journalism": "Funds storytelling, journalism, and media innovation.",
    "Cultural Heritage": "Preserves traditions and cultural history."
  },
  "Health & Human Services": {
    "Behavioral Health": "Supports mental health and trauma care.",
    "Substance Abuse Recovery": "Prevention and rehabilitation programs.",
    "Public Health": "Promotes wellness and disease prevention.",
    "Nutrition & Food Access": "Improves food systems and healthy eating access.",
    "Holistic & Integrative Health": "Combines natural and traditional wellness models."
  },
  "Education & Workforce": {
    "Early Childhood": "Early learning and family support services.",
    "K–12 Education": "School-based enrichment and academic improvement.",
    "Higher Education": "College access, scholarships, and institutional innovation.",
    "STEM & Career Readiness": "Workforce pipelines in science and tech fields.",
    "Workforce & Apprenticeship": "Job training and upskilling programs.",
    "Digital Literacy": "Tech access and training in digital skills."
  },
  "Special Populations": {
    "Youth": "Youth engagement and empowerment initiatives.",
    "Seniors & Aging": "Health and quality of life programs for older adults.",
    "Veterans": "Employment, housing, and reintegration for veterans.",
    "Disability Inclusion": "Accessibility and inclusion projects.",
    "Minority Equity": "Racial equity and inclusion-focused programs.",
    "Rural & Underserved": "Supports development in low-resource communities."
  },
  "International & Global": {
    "Humanitarian Aid": "Disaster response and global assistance.",
    "Education & Health Abroad": "Improves access to global education and health care.",
    "Women's Empowerment": "Promotes gender equity and leadership abroad.",
    "Global Sustainability": "Climate and sustainability programs worldwide.",
    "Disaster Relief": "Supports crisis response and recovery efforts."
  }
};

const FundIt = () => {
  const [activeTab, setActiveTab] = useState('generator');
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
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [generatedLOI, setGeneratedLOI] = useState('');

  // Grant search state
  const [searchData, setSearchData] = useState<GrantSearchData>({
    organizationType: '',
    industry: '',
    location: '',
    fundingAmount: '',
    organizationStage: '',
    category: '',
    subcategory: '',
  });
  const [isSearching, setIsSearching] = useState(false);
  const [foundGrants, setFoundGrants] = useState<Grant[]>([]);
  const [localResources, setLocalResources] = useState<LocalResource[]>([]);
  const [isSearchingResources, setIsSearchingResources] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  const handleInputChange = (field: keyof GrantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (field: keyof GrantSearchData, value: string) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
    
    // Handle cascading dropdown for categories
    if (field === 'category') {
      const subcategories = Object.keys(GRANT_CATEGORIES[value as keyof typeof GRANT_CATEGORIES] || {});
      setAvailableSubcategories(subcategories);
      setSearchData(prev => ({ ...prev, category: value, subcategory: '' }));
    }
  };

  const generateGrantDocuments = async () => {
    if (!formData.organizationName || !formData.projectTitle || !formData.projectDescription) {
      toast.error('Please fill in the required fields: Organization Name, Project Title, and Project Description');
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/generate-grant-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate grant content');
      }

      const { proposal, letterOfIntent } = await response.json();
      
      setGeneratedProposal(proposal);
      setGeneratedLOI(letterOfIntent);
      toast.success('AI-powered grant documents generated successfully!');
    } catch (error) {
      console.error('Error generating grant content:', error);
      toast.error('Failed to generate grant content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const searchGrants = async () => {
    if (!searchData.organizationType || !searchData.category) {
      toast.error('Please fill in Organization Type and Category');
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch('https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/grant-finder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessType: searchData.organizationType,
          industry: searchData.industry,
          location: searchData.location,
          fundingAmount: searchData.fundingAmount,
          businessStage: searchData.organizationStage,
          category: searchData.category,
          subcategory: searchData.subcategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to search grants');
      }

      const data = await response.json();
      setFoundGrants(data.grants || []);
      toast.success(`Found ${data.grants?.length || 0} potential grant opportunities!`);
    } catch (error) {
      console.error('Error searching grants:', error);
      toast.error('Failed to search grants. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const searchLocalResources = async () => {
    if (!searchData.location) {
      toast.error('Please provide a location to find local grant assistance resources');
      return;
    }

    setIsSearchingResources(true);
    
    try {
      const response = await fetch('https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/grant-resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: searchData.location,
          category: searchData.category,
          subcategory: searchData.subcategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to find local resources');
      }

      const data = await response.json();
      setLocalResources(data.resources?.resources || []);
      toast.success(`Found ${data.resources?.resources?.length || 0} local grant assistance resources!`);
    } catch (error) {
      console.error('Error finding local resources:', error);
      toast.error('Failed to find local resources. Please try again.');
    } finally {
      setIsSearchingResources(false);
    }
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
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero hero-glow overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
        </div>
        
        {/* Sophisticated floating orbs */}
        <div className="floating-orb top-16 right-16 w-40 h-40 bg-primary/8 animate-float"></div>
        <div className="floating-orb bottom-24 left-16 w-32 h-32 bg-secondary/10 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="floating-orb top-1/3 right-1/3 w-24 h-24 bg-accent/12 animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="container mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
              <span className="text-3xl font-bold text-white tracking-wider">FUND IT</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
              Fund It
            </h1>
            <div className="text-left max-w-4xl mx-auto">
              <p className="text-lg md:text-xl text-white/90 mb-12 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Generate professional grant proposals and letters of intent with AI assistance
              </p>
            </div>
          </div>
        </div>
        
        <div className="section-divider absolute bottom-0 left-0"></div>
      </section>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Fund It Tools Section */}
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-4">
                Funding & Research Tools
              </h2>
              <p className="text-lg text-foreground leading-relaxed max-w-3xl mx-auto">
                Professional funding tools to help you secure grants and resources for your projects and organizations
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">AI Grant Proposal Generator</CardTitle>
                  </div>
                  <CardDescription>
                    Generate comprehensive grant proposals with AI assistance based on your project details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Professional grant proposal formatting</li>
                    <li>• Customized content for your organization</li>
                    <li>• Letter of intent generation</li>
                    <li>• Export to multiple formats</li>
                  </ul>
                </CardContent>
                <div className="px-6 pb-6">
                  <Button 
                    onClick={() => setActiveTab('generator')}
                    className="w-full"
                    variant="secondary"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Start Writing Grant
                  </Button>
                </div>
              </Card>
              
              <Card className="premium-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl">Grant Research Assistant</CardTitle>
                  </div>
                  <CardDescription>
                    Find relevant grant opportunities and funding sources for your specific needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Database of funding opportunities</li>
                    <li>• Eligibility matching</li>
                    <li>• Deadline tracking</li>
                    <li>• Application requirements</li>
                  </ul>
                </CardContent>
                <div className="px-6 pb-6">
                  <Button 
                    onClick={() => setActiveTab('research')}
                    className="w-full"
                    variant="default"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Grants
                  </Button>
                </div>
              </Card>
            </div>
          </section>

          {/* Main Content with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Grant Proposal Generator
              </TabsTrigger>
              <TabsTrigger value="research" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Grant Research Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator">
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
            </TabsContent>

            <TabsContent value="research">
              <div className="grid lg:grid-cols-5 gap-8">
                {/* Search Form Section */}
                <div className="lg:col-span-3">
                  <Card className="h-fit">
                    <CardHeader className="pb-6">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Search className="h-5 w-5" />
                        Grant Search Criteria
                      </CardTitle>
                      <CardDescription>
                        Enter your organization details to find relevant grant opportunities
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="organizationType">Organization Type *</Label>
                          <Select onValueChange={(value) => handleSearchChange('organizationType', value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select organization type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nonprofit">Nonprofit Organization</SelectItem>
                              <SelectItem value="faith-based">Faith Based Organization</SelectItem>
                              <SelectItem value="startup">Startup</SelectItem>
                              <SelectItem value="small-business">Small Business</SelectItem>
                              <SelectItem value="tech">Technology Company</SelectItem>
                              <SelectItem value="research">Research Institution</SelectItem>
                              <SelectItem value="educational">Educational Institution</SelectItem>
                              <SelectItem value="healthcare">Healthcare Organization</SelectItem>
                              <SelectItem value="agricultural">Agricultural Business</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry *</Label>
                          <Select onValueChange={(value) => handleSearchChange('industry', value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select industry" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="healthcare">Healthcare</SelectItem>
                              <SelectItem value="education">Education</SelectItem>
                              <SelectItem value="environment">Environment</SelectItem>
                              <SelectItem value="arts">Arts & Culture</SelectItem>
                              <SelectItem value="community">Community Development</SelectItem>
                              <SelectItem value="research">Research & Development</SelectItem>
                              <SelectItem value="agriculture">Agriculture</SelectItem>
                              <SelectItem value="manufacturing">Manufacturing</SelectItem>
                              <SelectItem value="renewable-energy">Renewable Energy</SelectItem>
                              <SelectItem value="social-services">Social Services</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={searchData.location}
                            onChange={(e) => handleSearchChange('location', e.target.value)}
                            placeholder="City, State, Country"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fundingAmount">Funding Amount Range</Label>
                          <Select onValueChange={(value) => handleSearchChange('fundingAmount', value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select funding range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0-10k">$0 - $10,000</SelectItem>
                              <SelectItem value="10k-50k">$10,000 - $50,000</SelectItem>
                              <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
                              <SelectItem value="100k-500k">$100,000 - $500,000</SelectItem>
                              <SelectItem value="500k-1m">$500,000 - $1,000,000</SelectItem>
                              <SelectItem value="1m+">$1,000,000+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organizationStage">Organization Stage</Label>
                        <Select onValueChange={(value) => handleSearchChange('organizationStage', value)}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select organization stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="idea">Idea Stage</SelectItem>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="early-stage">Early Stage</SelectItem>
                            <SelectItem value="growth">Growth Stage</SelectItem>
                            <SelectItem value="established">Established</SelectItem>
                            <SelectItem value="expansion">Expansion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Grant Category *</Label>
                          <Select onValueChange={(value) => handleSearchChange('category', value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(GRANT_CATEGORIES).map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subcategory">Grant Subcategory</Label>
                          <Select 
                            value={searchData.subcategory}
                            onValueChange={(value) => handleSearchChange('subcategory', value)}
                            disabled={!searchData.category}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder={searchData.category ? "Select subcategory" : "Select category first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSubcategories.map((subcat) => (
                                <SelectItem key={subcat} value={subcat}>
                                  {subcat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {searchData.category && searchData.subcategory && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {GRANT_CATEGORIES[searchData.category as keyof typeof GRANT_CATEGORIES][searchData.subcategory as keyof typeof GRANT_CATEGORIES[keyof typeof GRANT_CATEGORIES]]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          onClick={searchGrants} 
                          disabled={isSearching}
                          className="flex-1 h-11"
                          size="lg"
                        >
                          {isSearching ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Searching Grants...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Find Online Grants
                            </>
                          )}
                        </Button>
                        <Button 
                          onClick={searchLocalResources} 
                          disabled={isSearchingResources || !searchData.location}
                          variant="outline"
                          className="flex-1 h-11"
                          size="lg"
                        >
                          {isSearchingResources ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                              Finding Resources...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Find Local Assistance
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Online Grants Results */}
                  {foundGrants.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">Online Grant Opportunities</h3>
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-full text-sm">
                          {foundGrants.length}
                        </span>
                      </div>
                      
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {foundGrants.map((grant, index) => (
                          <Card key={index} className="border">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{grant.name}</CardTitle>
                                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                                  {grant.category}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{grant.organization}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                <span className="font-medium text-primary">{grant.amountRange}</span>
                                <span>{grant.deadline}</span>
                                <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                                  Match: {grant.matchScore}%
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-3">{grant.description}</p>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Eligibility:</span>
                                  <ul className="text-sm list-disc list-inside mt-1">
                                    {grant.eligibility.map((req, i) => (
                                      <li key={i}>{req}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">Difficulty: </span>
                                  <span className="text-sm">{grant.difficulty}</span>
                                </div>
                                {grant.tips && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Success Tips:</span>
                                    <p className="text-sm mt-1">{grant.tips}</p>
                                  </div>
                                )}
                                <div className="flex gap-2 mt-3">
                                  {grant.websiteUrl && (
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      onClick={() => window.open(grant.websiteUrl, '_blank')}
                                      className="flex-1"
                                    >
                                      <ArrowRight className="h-3 w-3 mr-1" />
                                      View Grant Website
                                    </Button>
                                  )}
                                  {grant.applicationUrl && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => window.open(grant.applicationUrl, '_blank')}
                                      className="flex-1"
                                    >
                                      Apply Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Local Grant Assistance Resources */}
                  {localResources.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-semibold">Local Grant Assistance Resources</h3>
                        <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm">
                          {localResources.length}
                        </span>
                      </div>
                      
                      <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {localResources.map((resource, index) => (
                          <Card key={index} className="border">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{resource.name}</CardTitle>
                                <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded-full">
                                  {resource.type}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                {resource.rating && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-yellow-500">★</span>
                                    <span>{resource.rating}</span>
                                  </div>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground mb-3">{resource.description}</p>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium text-muted-foreground">Address: </span>
                                  <span>{resource.address}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Phone: </span>
                                  <span>{resource.phone}</span>
                                </div>
                                {resource.website && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(resource.website, '_blank')}
                                    className="w-full mt-2"
                                  >
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    Visit Website
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FundIt;