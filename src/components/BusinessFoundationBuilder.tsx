import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Target, Download, Sparkles } from "lucide-react";
import { sanitizeAIContent } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

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

  const handleInputChange = (field: keyof FoundationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const exportFoundation = () => {
    if (!results) return;
    
    let content = `BUSINESS FOUNDATION DOCUMENT\n`;
    content += `Business: ${formData.businessName}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

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
      content += `${section.title}\n`;
      content += `${'-'.repeat(60)}\n\n`;
      content += `${section.content}\n\n`;
      content += `${'='.repeat(80)}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-foundation-${formData.businessName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateFoundation = async () => {
    if (!formData.businessName || !formData.industry) {
      toast.error("Please fill in at least Business Name and Industry");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-content', {
        body: {
          type: 'business-foundation',
          data: formData
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
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
            <Label htmlFor="industry">Industry * - e.g., Tech, Healthcare, Retail</Label>
            <Input
              id="industry"
              value={formData.industry}
              onChange={(e) => handleInputChange("industry", e.target.value)}
            />
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
          <Label htmlFor="idealCustomer">Ideal Customer Profile - Describe your perfect customer in detail (demographics, psychographics, behaviors)</Label>
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
          {isGenerating ? "Building Your Foundation..." : "Build Business Foundation"}
        </Button>

        {results && (
          <div className="space-y-6 mt-8 pt-8 border-t">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-foreground">Your Business Foundation</h4>
              <Button variant="outline" size="sm" onClick={exportFoundation}>
                <Download className="h-4 w-4 mr-2" />
                Export
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