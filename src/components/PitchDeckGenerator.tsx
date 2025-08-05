import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Presentation, Download, Eye } from "lucide-react";

interface PitchData {
  companyName: string;
  problem: string;
  solution: string;
  marketSize: string;
  businessModel: string;
  competition: string;
  fundingAmount: string;
  useOfFunds: string;
  teamBackground: string;
  traction: string;
}

interface Slide {
  title: string;
  content: string;
}

export const PitchDeckGenerator = () => {
  const [formData, setFormData] = useState<PitchData>({
    companyName: "",
    problem: "",
    solution: "",
    marketSize: "",
    businessModel: "",
    competition: "",
    fundingAmount: "",
    useOfFunds: "",
    teamBackground: "",
    traction: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);

  const handleInputChange = (field: keyof PitchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePitchDeck = async () => {
    setIsGenerating(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const generatedSlides: Slide[] = [
      {
        title: "Company Overview",
        content: `${formData.companyName || "Your Company"}\n\nTransforming the way people ${formData.solution || "solve problems"} through innovative technology and exceptional service.`
      },
      {
        title: "The Problem",
        content: formData.problem || "Current solutions are inadequate, expensive, or difficult to use. Customers need a better way to achieve their goals efficiently and cost-effectively."
      },
      {
        title: "Our Solution",
        content: formData.solution || "We provide an innovative platform that simplifies complex processes, reduces costs, and delivers exceptional user experience."
      },
      {
        title: "Market Opportunity",
        content: `Market Size: ${formData.marketSize || "$10B+ addressable market"}\n\nRapid growth expected due to digital transformation trends and increasing demand for efficient solutions.`
      },
      {
        title: "Business Model",
        content: formData.businessModel || "Subscription-based SaaS model with multiple pricing tiers\n• Basic: $29/month\n• Professional: $99/month\n• Enterprise: Custom pricing"
      },
      {
        title: "Competition",
        content: formData.competition || "While competitors exist, we differentiate through:\n• Superior user experience\n• Advanced features\n• Competitive pricing\n• Exceptional customer support"
      },
      {
        title: "Traction",
        content: formData.traction || "• 500+ early users\n• $50K monthly recurring revenue\n• 95% customer satisfaction\n• Growing at 20% month-over-month"
      },
      {
        title: "Team",
        content: formData.teamBackground || "Experienced team with proven track record:\n• CEO: 10+ years industry experience\n• CTO: Former tech lead at Fortune 500\n• CMO: Marketing expert with startup exits"
      },
      {
        title: "Funding Request",
        content: `Seeking: $${formData.fundingAmount || "500,000"}\n\nUse of Funds:\n${formData.useOfFunds || "• 40% Product development\n• 30% Marketing & sales\n• 20% Team expansion\n• 10% Operations"}`
      },
      {
        title: "Next Steps",
        content: "Ready to scale and capture market opportunity\n\n• Expand team\n• Accelerate growth\n• Launch new features\n• Enter new markets\n\nLet's discuss how we can work together!"
      }
    ];
    
    setSlides(generatedSlides);
    setIsGenerating(false);
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Presentation className="h-6 w-6 text-primary" />
          Pitch Deck Generator
        </CardTitle>
        <CardDescription>
          Create a compelling investor pitch deck for your startup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              placeholder="Your company name"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fundingAmount">Funding Amount ($)</Label>
            <Input
              id="fundingAmount"
              placeholder="500000"
              type="number"
              value={formData.fundingAmount}
              onChange={(e) => handleInputChange("fundingAmount", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="problem">Problem Statement</Label>
          <Textarea
            id="problem"
            placeholder="What problem are you solving?"
            value={formData.problem}
            onChange={(e) => handleInputChange("problem", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solution">Solution</Label>
          <Textarea
            id="solution"
            placeholder="How does your product solve this problem?"
            value={formData.solution}
            onChange={(e) => handleInputChange("solution", e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="marketSize">Market Size</Label>
            <Input
              id="marketSize"
              placeholder="e.g., $10B addressable market"
              value={formData.marketSize}
              onChange={(e) => handleInputChange("marketSize", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="traction">Current Traction</Label>
            <Input
              id="traction"
              placeholder="e.g., users, revenue, growth"
              value={formData.traction}
              onChange={(e) => handleInputChange("traction", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessModel">Business Model</Label>
          <Textarea
            id="businessModel"
            placeholder="How do you make money?"
            value={formData.businessModel}
            onChange={(e) => handleInputChange("businessModel", e.target.value)}
            rows={2}
          />
        </div>

        <Button 
          onClick={generatePitchDeck}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? "Generating Pitch Deck..." : "Generate Pitch Deck"}
        </Button>

        {slides.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Generated Pitch Deck ({slides.length} slides)</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="grid gap-4 max-h-80 overflow-y-auto">
              {slides.map((slide, index) => (
                <Card key={index} className="border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Slide {index + 1}: {slide.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{slide.content}</pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};