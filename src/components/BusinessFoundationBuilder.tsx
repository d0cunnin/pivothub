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
}

interface FoundationResults {
  vision: string;
  mission: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
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
    customers: ""
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
      { title: "PROBLEM STATEMENT", content: results.problemStatement },
      { title: "SOLUTION", content: results.solution },
      { title: "TARGET AUDIENCE", content: results.targetAudience },
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
        problemStatement: `Current ${formData.industry} solutions are inadequate, leaving customers frustrated with limited options, high costs, or poor service quality.`,
        solution: `We provide a comprehensive ${formData.industry} platform that combines cutting-edge technology with exceptional customer service to deliver superior results.`,
        targetAudience: `Our primary target audience includes ${formData.customers || 'businesses and individuals'} who value quality, innovation, and exceptional service in the ${formData.industry} space.`,
        marketSize: `The ${formData.industry} market represents a significant opportunity with strong growth potential driven by digital transformation and changing customer expectations.`,
        businessModel: `We operate on a subscription-based model with tiered pricing to serve different customer segments, from small businesses to enterprise clients.`,
        goToMarketStrategy: `Our go-to-market strategy focuses on digital marketing, strategic partnerships, and content marketing to reach our target audience effectively.`
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseFoundationContent = (content: string): FoundationResults => {
    const sections = {
      vision: '',
      mission: '',
      problemStatement: '',
      solution: '',
      targetAudience: '',
      marketSize: '',
      businessModel: '',
      goToMarketStrategy: ''
    };

    // Try to parse sections with markers
    const visionMatch = content.match(/\[VISION\](.*?)(?=\[|$)/s);
    const missionMatch = content.match(/\[MISSION\](.*?)(?=\[|$)/s);
    const problemMatch = content.match(/\[PROBLEM\](.*?)(?=\[|$)/s);
    const solutionMatch = content.match(/\[SOLUTION\](.*?)(?=\[|$)/s);
    const audienceMatch = content.match(/\[AUDIENCE\](.*?)(?=\[|$)/s);
    const marketMatch = content.match(/\[MARKET_SIZE\](.*?)(?=\[|$)/s);
    const modelMatch = content.match(/\[BUSINESS_MODEL\](.*?)(?=\[|$)/s);
    const strategyMatch = content.match(/\[GO_TO_MARKET\](.*?)(?=\[|$)/s);

    if (visionMatch) sections.vision = visionMatch[1].trim();
    if (missionMatch) sections.mission = missionMatch[1].trim();
    if (problemMatch) sections.problemStatement = problemMatch[1].trim();
    if (solutionMatch) sections.solution = solutionMatch[1].trim();
    if (audienceMatch) sections.targetAudience = audienceMatch[1].trim();
    if (marketMatch) sections.marketSize = marketMatch[1].trim();
    if (modelMatch) sections.businessModel = modelMatch[1].trim();
    if (strategyMatch) sections.goToMarketStrategy = strategyMatch[1].trim();

    // If no sections found, split by paragraphs
    if (!sections.vision) {
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      sections.vision = paragraphs[0] || '';
      sections.mission = paragraphs[1] || '';
      sections.problemStatement = paragraphs[2] || '';
      sections.solution = paragraphs[3] || '';
      sections.targetAudience = paragraphs[4] || '';
      sections.marketSize = paragraphs[5] || '';
      sections.businessModel = paragraphs[6] || '';
      sections.goToMarketStrategy = paragraphs[7] || '';
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
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              placeholder="Your business name"
              value={formData.businessName}
              onChange={(e) => handleInputChange("businessName", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="industry">Industry *</Label>
            <Input
              id="industry"
              placeholder="e.g., Tech, Healthcare, Retail"
              value={formData.industry}
              onChange={(e) => handleInputChange("industry", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="experience">Your Experience & Background</Label>
          <Textarea
            id="experience"
            placeholder="What relevant experience do you bring? What makes you qualified?"
            value={formData.experience}
            onChange={(e) => handleInputChange("experience", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passion">Your Passion & Motivation</Label>
          <Textarea
            id="passion"
            placeholder="What drives you? Why does this matter to you?"
            value={formData.passion}
            onChange={(e) => handleInputChange("passion", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customers">Who Are Your Customers?</Label>
          <Textarea
            id="customers"
            placeholder="Describe the people or businesses you want to serve"
            value={formData.customers}
            onChange={(e) => handleInputChange("customers", e.target.value)}
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
                  Problem Statement
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.problemStatement}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">4</span>
                  Solution
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.solution}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">5</span>
                  Target Audience
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.targetAudience}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">6</span>
                  Market Size
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.marketSize}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">7</span>
                  Business Model
                </h5>
                <Card className="p-4 bg-muted/30">
                  <p className="text-foreground whitespace-pre-wrap">{results.businessModel}</p>
                </Card>
              </div>

              <div className="space-y-2">
                <h5 className="font-semibold text-primary flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">8</span>
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