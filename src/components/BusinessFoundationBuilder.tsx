import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Download, Sparkles, HelpCircle } from "lucide-react";
import { sanitizeAIContent } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from "@/lib/invokeFunction";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface FoundationData {
  businessName: string;
  industry: string;
  experience: string;
  passion: string;
  customers: string;
  idealCustomer: string;
  businessModel: string;
  goToMarket: string;
  values: string;
  goals: string;
}

interface FoundationResults {
  vision: string;
  mission: string;
  values: string;
  pillars: string;
  goals: string;
  objectives: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  idealCustomerProfile: string;
  marketSize: string;
  businessModel: string;
  goToMarketStrategy: string;
}

export const BusinessFoundationBuilder = () => {
  const [formData, setFormData] = useState<FoundationData>({
    businessName: "",
    industry: "",
    experience: "",
    passion: "",
    customers: "",
    idealCustomer: "",
    businessModel: "",
    goToMarket: "",
    values: "",
    goals: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<FoundationResults | null>(null);
  const [showDemographics, setShowDemographics] = useState(false);
  
  // Demographics state
  const [demographics, setDemographics] = useState({
    gender: [] as string[],
    ageRange: [] as string[],
    maritalStatus: [] as string[],
    lgbtqia: false,
    religiousAffiliation: [] as string[],
    incomeBracket: "",
    education: [] as string[],
    occupation: [] as string[]
  });

  const handleInputChange = (field: keyof FoundationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayValue = (array: string[], value: string) => {
    return array.includes(value) 
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  const applyDemographics = () => {
    let profile = "";
    
    if (demographics.gender.length > 0) {
      profile += `Gender: ${demographics.gender.join(", ")}. `;
    }
    if (demographics.ageRange.length > 0) {
      profile += `Age: ${demographics.ageRange.join(", ")}. `;
    }
    if (demographics.maritalStatus.length > 0) {
      profile += `Marital Status: ${demographics.maritalStatus.join(", ")}. `;
    }
    if (demographics.lgbtqia) {
      profile += `Inclusive of LGBTQIA+ community. `;
    }
    if (demographics.religiousAffiliation.length > 0) {
      profile += `Religious Affiliation: ${demographics.religiousAffiliation.join(", ")}. `;
    }
    if (demographics.incomeBracket) {
      profile += `Income: ${demographics.incomeBracket}. `;
    }
    if (demographics.education.length > 0) {
      profile += `Education: ${demographics.education.join(", ")}. `;
    }
    if (demographics.occupation.length > 0) {
      profile += `Occupation: ${demographics.occupation.join(", ")}. `;
    }

    setFormData(prev => ({ 
      ...prev, 
      idealCustomer: prev.idealCustomer 
        ? `${prev.idealCustomer}\n\n${profile}`.trim() 
        : profile 
    }));
    setShowDemographics(false);
  };

  const exportFoundation = () => {
    if (!results) return;
    
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

      // Cover page
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('BUSINESS FOUNDATION', pageWidth / 2, 100, { align: 'center' });
      doc.setFontSize(18);
      doc.text(formData.businessName || 'Your Business', pageWidth / 2, 120, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 140, { align: 'center' });
      
      doc.addPage();
      yPosition = margin;

      // Add all foundation sections
      const sections = [
        { title: "VISION STATEMENT", content: results.vision },
        { title: "MISSION STATEMENT", content: results.mission },
        { title: "CORE VALUES", content: results.values },
        { title: "STRATEGIC PILLARS", content: results.pillars },
        { title: "BUSINESS GOALS", content: results.goals },
        { title: "KEY OBJECTIVES", content: results.objectives },
        { title: "PROBLEM STATEMENT", content: results.problemStatement },
        { title: "SOLUTION", content: results.solution },
        { title: "TARGET AUDIENCE", content: results.targetAudience },
        { title: "IDEAL CUSTOMER PROFILE", content: results.idealCustomerProfile },
        { title: "MARKET SIZE", content: results.marketSize },
        { title: "BUSINESS MODEL", content: results.businessModel },
        { title: "GO-TO-MARKET STRATEGY", content: results.goToMarketStrategy }
      ];

      sections.forEach(section => {
        addText(section.title, 14, true);
        addText(section.content, 11);
        yPosition += 5;
      });

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

      doc.save(`business-foundation-${formData.businessName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`);
      toast.success('Business foundation exported to PDF!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  const generateFoundation = async () => {
    if (!formData.businessName || !formData.industry) {
      toast.error("Please fill in at least Business Name and Industry");
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get user session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use this tool");
        setIsGenerating(false);
        return;
      }

      const { data, error } = await invokeFunction('generate-business-content', {
        body: {
          type: 'business-foundation',
          data: formData
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Failed to generate business foundation');
      }

      if (!data?.content || data.content.length < 300) {
        throw new Error('Foundation content too short. Please try again.');
      }

      const sanitizedContent = sanitizeAIContent(data.content);
      const parsed = parseFoundationContent(sanitizedContent);
      setResults(parsed);
      toast.success("Business foundation created successfully!");
    } catch (error) {
      console.error('Error generating business foundation:', error);
      toast.error("Failed to generate business foundation. Please try again.");
      
      // Fallback results
      setResults({
        vision: `To become the leading ${formData.industry} provider, transforming how customers experience ${formData.passion || 'our services'}.`,
        mission: `We empower ${formData.customers || 'our customers'} by delivering innovative ${formData.industry} solutions that solve real problems and create lasting value.`,
        values: formData.values || `Integrity, Innovation, Customer Focus, Excellence, Continuous Improvement`,
        pillars: `Quality, Innovation, Customer Success, Sustainability`,
        goals: formData.goals || `Achieve market leadership, deliver exceptional customer satisfaction, build a sustainable business model`,
        objectives: `Increase customer base by 50% annually, maintain 95% customer satisfaction, achieve profitability within 18 months`,
        problemStatement: `Current ${formData.industry} solutions are inadequate, leaving customers frustrated with limited options, high costs, or poor service quality.`,
        solution: `We provide a comprehensive ${formData.industry} platform that combines cutting-edge technology with exceptional customer service to deliver superior results.`,
        targetAudience: `Our primary target audience includes ${formData.customers || 'businesses and individuals'} who value quality, innovation, and exceptional service in the ${formData.industry} space.`,
        idealCustomerProfile: formData.idealCustomer || `Mid-sized businesses with 50-500 employees seeking ${formData.industry} solutions`,
        marketSize: `The ${formData.industry} market represents a significant opportunity with strong growth potential driven by digital transformation and changing customer expectations.`,
        businessModel: formData.businessModel || `Subscription-based model with tiered pricing to serve different customer segments`,
        goToMarketStrategy: formData.goToMarket || `Digital marketing, strategic partnerships, and content marketing to reach target audience effectively`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseFoundationContent = (content: string): FoundationResults => {
    const sections = {
      vision: '',
      mission: '',
      values: '',
      pillars: '',
      goals: '',
      objectives: '',
      problemStatement: '',
      solution: '',
      targetAudience: '',
      idealCustomerProfile: '',
      marketSize: '',
      businessModel: '',
      goToMarketStrategy: ''
    };

    // Try to parse sections with markers
    const visionMatch = content.match(/\[VISION\](.*?)(?=\[|$)/s);
    const missionMatch = content.match(/\[MISSION\](.*?)(?=\[|$)/s);
    const valuesMatch = content.match(/\[VALUES\](.*?)(?=\[|$)/s);
    const pillarsMatch = content.match(/\[PILLARS\](.*?)(?=\[|$)/s);
    const goalsMatch = content.match(/\[GOALS\](.*?)(?=\[|$)/s);
    const objectivesMatch = content.match(/\[OBJECTIVES\](.*?)(?=\[|$)/s);
    const problemMatch = content.match(/\[PROBLEM\](.*?)(?=\[|$)/s);
    const solutionMatch = content.match(/\[SOLUTION\](.*?)(?=\[|$)/s);
    const audienceMatch = content.match(/\[AUDIENCE\](.*?)(?=\[|$)/s);
    const idealCustomerMatch = content.match(/\[IDEAL_CUSTOMER\](.*?)(?=\[|$)/s);
    const marketMatch = content.match(/\[MARKET_SIZE\](.*?)(?=\[|$)/s);
    const modelMatch = content.match(/\[BUSINESS_MODEL\](.*?)(?=\[|$)/s);
    const strategyMatch = content.match(/\[GO_TO_MARKET\](.*?)(?=\[|$)/s);

    if (visionMatch) sections.vision = visionMatch[1].trim();
    if (missionMatch) sections.mission = missionMatch[1].trim();
    if (valuesMatch) sections.values = valuesMatch[1].trim();
    if (pillarsMatch) sections.pillars = pillarsMatch[1].trim();
    if (goalsMatch) sections.goals = goalsMatch[1].trim();
    if (objectivesMatch) sections.objectives = objectivesMatch[1].trim();
    if (problemMatch) sections.problemStatement = problemMatch[1].trim();
    if (solutionMatch) sections.solution = solutionMatch[1].trim();
    if (audienceMatch) sections.targetAudience = audienceMatch[1].trim();
    if (idealCustomerMatch) sections.idealCustomerProfile = idealCustomerMatch[1].trim();
    if (marketMatch) sections.marketSize = marketMatch[1].trim();
    if (modelMatch) sections.businessModel = modelMatch[1].trim();
    if (strategyMatch) sections.goToMarketStrategy = strategyMatch[1].trim();

    // If no sections found, split by paragraphs
    if (!sections.vision) {
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      sections.vision = paragraphs[0] || '';
      sections.mission = paragraphs[1] || '';
      sections.values = paragraphs[2] || '';
      sections.pillars = paragraphs[3] || '';
      sections.goals = paragraphs[4] || '';
      sections.objectives = paragraphs[5] || '';
      sections.problemStatement = paragraphs[6] || '';
      sections.solution = paragraphs[7] || '';
      sections.targetAudience = paragraphs[8] || '';
      sections.idealCustomerProfile = paragraphs[9] || '';
      sections.marketSize = paragraphs[10] || '';
      sections.businessModel = paragraphs[11] || '';
      sections.goToMarketStrategy = paragraphs[12] || '';
    }

    return sections;
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Business Foundation Builder</h3>
      </div>
      <p className="text-muted-foreground mb-2">
        Build the essential foundation for your business
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Create your vision, mission, problem statement, solution, target audience, market size, business model, and go-to-market strategy - all the foundational elements you need before diving into detailed planning.
      </p>

      <Alert className="mb-6">
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 Pro Tip:</strong> The answers you provide here will give you the foundational content needed for the Pitch Deck Content Generator. Complete this first to have all your business details ready when creating your investor pitch deck.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name * - Your business name</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">Industry * - Select your business industry</Label>
            <Select value={formData.industry} onValueChange={(value) => handleInputChange("industry", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select an industry" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Healthcare">Healthcare</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Food & Beverage">Food & Beverage</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Real Estate">Real Estate</SelectItem>
                <SelectItem value="Consulting">Consulting</SelectItem>
                <SelectItem value="Marketing & Advertising">Marketing & Advertising</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="Transportation & Logistics">Transportation & Logistics</SelectItem>
                <SelectItem value="Hospitality & Tourism">Hospitality & Tourism</SelectItem>
                <SelectItem value="Entertainment & Media">Entertainment & Media</SelectItem>
                <SelectItem value="Professional Services">Professional Services</SelectItem>
                <SelectItem value="Beauty & Wellness">Beauty & Wellness</SelectItem>
                <SelectItem value="Fitness & Sports">Fitness & Sports</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Nonprofit">Nonprofit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Your Experience & Background - What relevant experience do you bring? What makes you qualified?</Label>
          <Textarea
            id="experience"
            value={formData.experience}
            onChange={(e) => handleInputChange("experience", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passion">Your Passion & Motivation - What drives you? Why does this matter to you?</Label>
          <Textarea
            id="passion"
            value={formData.passion}
            onChange={(e) => handleInputChange("passion", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customers">Who Are Your Customers? - Describe the people or businesses you want to serve</Label>
          <Textarea
            id="customers"
            value={formData.customers}
            onChange={(e) => handleInputChange("customers", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="idealCustomer">Ideal Customer Profile - Describe your perfect customer in detail (demographics, psychographics, behaviors)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDemographics(!showDemographics)}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              {showDemographics ? "Hide" : "Show"} Demographics Helper
            </Button>
          </div>
          
          {showDemographics && (
            <Card className="p-4 space-y-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">Select demographic options to help build your ideal customer profile:</p>
              
              {/* Gender */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Gender</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Male", "Female"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`gender-${option}`}
                        checked={demographics.gender.includes(option)}
                        onCheckedChange={() => setDemographics(prev => ({
                          ...prev,
                          gender: toggleArrayValue(prev.gender, option)
                        }))}
                      />
                      <label htmlFor={`gender-${option}`} className="text-sm cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Age Range</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`age-${option}`}
                        checked={demographics.ageRange.includes(option)}
                        onCheckedChange={() => setDemographics(prev => ({
                          ...prev,
                          ageRange: toggleArrayValue(prev.ageRange, option)
                        }))}
                      />
                      <label htmlFor={`age-${option}`} className="text-sm cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marital Status */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Marital Status</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["Single", "Married", "Divorced", "Widowed", "Partnered"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`marital-${option}`}
                        checked={demographics.maritalStatus.includes(option)}
                        onCheckedChange={() => setDemographics(prev => ({
                          ...prev,
                          maritalStatus: toggleArrayValue(prev.maritalStatus, option)
                        }))}
                      />
                      <label htmlFor={`marital-${option}`} className="text-sm cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* LGBTQIA+ */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lgbtqia"
                  checked={demographics.lgbtqia}
                  onCheckedChange={(checked) => setDemographics(prev => ({ ...prev, lgbtqia: checked as boolean }))}
                />
                <label htmlFor="lgbtqia" className="text-sm font-semibold cursor-pointer">LGBTQIA+ Inclusive</label>
              </div>

              {/* Religious Affiliation */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Religious Affiliation (Optional)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["Christian", "Muslim", "Jewish", "Hindu", "Buddhist", "Spiritual", "Non-religious", "All faiths"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`religion-${option}`}
                        checked={demographics.religiousAffiliation.includes(option)}
                        onCheckedChange={() => setDemographics(prev => ({
                          ...prev,
                          religiousAffiliation: toggleArrayValue(prev.religiousAffiliation, option)
                        }))}
                      />
                      <label htmlFor={`religion-${option}`} className="text-sm cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Income Bracket */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Income Bracket</Label>
                <RadioGroup value={demographics.incomeBracket} onValueChange={(value) => setDemographics(prev => ({ ...prev, incomeBracket: value }))}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {["Under $25k", "$25k-$50k", "$50k-$75k", "$75k-$100k", "$100k-$150k", "$150k+"].map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`income-${option}`} />
                        <label htmlFor={`income-${option}`} className="text-sm cursor-pointer">{option}</label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Education */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Education Level</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["High School", "Some College", "Bachelor's", "Master's", "Doctorate", "Trade School"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`education-${option}`}
                        checked={demographics.education.includes(option)}
                        onCheckedChange={() => setDemographics(prev => ({
                          ...prev,
                          education: toggleArrayValue(prev.education, option)
                        }))}
                      />
                      <label htmlFor={`education-${option}`} className="text-sm cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupation */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Occupation Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {["Professional", "Manager", "Student", "Entrepreneur", "Retired", "Homemaker", "Freelancer"].map(option => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`occupation-${option}`}
                        checked={demographics.occupation.includes(option)}
                        onCheckedChange={() => setDemographics(prev => ({
                          ...prev,
                          occupation: toggleArrayValue(prev.occupation, option)
                        }))}
                      />
                      <label htmlFor={`occupation-${option}`} className="text-sm cursor-pointer">{option}</label>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="button" onClick={applyDemographics} variant="outline" className="w-full">
                Apply Demographics to Profile
              </Button>
            </Card>
          )}
          
          <Textarea
            id="idealCustomer"
            value={formData.idealCustomer}
            onChange={(e) => handleInputChange("idealCustomer", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="values">Core Values - What principles guide your business? (e.g., integrity, innovation, customer focus)</Label>
          <Textarea
            id="values"
            value={formData.values}
            onChange={(e) => handleInputChange("values", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goals">Business Goals - What are your main business goals? (e.g., revenue targets, market position, impact)</Label>
          <Textarea
            id="goals"
            value={formData.goals}
            onChange={(e) => handleInputChange("goals", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessModel">Business Model - How will you make money? What's your revenue model?</Label>
          <Textarea
            id="businessModel"
            value={formData.businessModel}
            onChange={(e) => handleInputChange("businessModel", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goToMarket">Go-to-Market Strategy - How will you reach and acquire customers? What channels will you use?</Label>
          <Textarea
            id="goToMarket"
            value={formData.goToMarket}
            onChange={(e) => handleInputChange("goToMarket", e.target.value)}
            rows={2}
          />
        </div>

        <Button
          onClick={generateFoundation}
          disabled={isGenerating}
          size="lg"
          className="w-full"
          variant="hero"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isGenerating ? "Building Your Foundation..." : "Build Business Foundation (2 Credits)"}
        </Button>

        {results && (
          <div className="space-y-6 mt-8 pt-8 border-t">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-foreground">Your Business Foundation</h4>
              <Button variant="outline" size="sm" onClick={exportFoundation}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">1</span>
                  Vision Statement
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.vision}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">2</span>
                  Mission Statement
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.mission}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">3</span>
                  Core Values
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.values}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">4</span>
                  Strategic Pillars
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.pillars}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">5</span>
                  Business Goals
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.goals}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">6</span>
                  Key Objectives
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.objectives}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">7</span>
                  Problem Statement
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.problemStatement}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">8</span>
                  Solution
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.solution}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">9</span>
                  Target Audience
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.targetAudience}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">10</span>
                  Ideal Customer Profile
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.idealCustomerProfile}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">11</span>
                  Market Size
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.marketSize}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">12</span>
                  Business Model
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.businessModel}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">13</span>
                  Go-to-Market Strategy
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.goToMarketStrategy}</p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};