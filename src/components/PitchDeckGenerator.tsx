import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Presentation, Download, Eye, Play } from "lucide-react";
import { sanitizeAIContent } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { PitchDeckPresentation } from './PitchDeckPresentation';

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
  const [showPresentation, setShowPresentation] = useState(false);

  const handleInputChange = (field: keyof PitchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Keyboard navigation for presentation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showPresentation) {
        if (e.key === 'Escape') {
          setShowPresentation(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPresentation]);

  const generatePitchDeck = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-business-content', {
        body: {
          type: 'pitch-deck',
          data: formData
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse AI response into slide format
      const sanitizedContent = sanitizeAIContent(data.content);
      const generatedSlides = parsePitchDeckSlides(sanitizedContent);
      
      setSlides(generatedSlides);
    } catch (error) {
      console.error('Error generating pitch deck:', error);
      // Enhanced fallback based on user input
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
          title: "Competitive Landscape",
          content: formData.competition || "While competitors exist, we differentiate through:\n• Superior user experience\n• Advanced features\n• Competitive pricing\n• Exceptional customer support"
        },
        {
          title: "Traction & Metrics",
          content: formData.traction || "• 500+ early users\n• $50K monthly recurring revenue\n• 95% customer satisfaction\n• Growing at 20% month-over-month"
        },
        {
          title: "Team",
          content: formData.teamBackground || "Experienced team with proven track record in the industry. Combined expertise in technology, business development, and market strategy."
        },
        {
          title: "Funding Request",
          content: `We are seeking $${formData.fundingAmount || "500,000"} to accelerate growth and market expansion.\n\n${formData.useOfFunds || "Funds will be used for product development, marketing, and team expansion to capture market opportunity."}`
        },
        {
          title: "Use of Funds",
          content: formData.useOfFunds || "• 40% Product Development\n• 30% Marketing & Sales\n• 20% Team Expansion\n• 10% Operations & Infrastructure"
        },
        {
          title: "Financial Projections",
          content: "3-Year Revenue Forecast:\n• Year 1: Break-even with $500K revenue\n• Year 2: $2M revenue, 25% profit margin\n• Year 3: $5M revenue, 35% profit margin\n\nProjected ROI: 5-7x over 3 years"
        },
        {
          title: "Next Steps",
          content: "Timeline for investment deployment:\n• Month 1-2: Team hiring and onboarding\n• Month 3-6: Product development and testing\n• Month 6-12: Market launch and scaling\n\nLooking for strategic investors who bring industry expertise and network connections."
        }
      ];
      setSlides(generatedSlides);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to parse pitch deck slides from AI response
  const parsePitchDeckSlides = (content: string): Slide[] => {
    const slides: Slide[] = [];
    
    // Split by slide markers
    let sections = content.split(/\[SLIDE_TITLE\]|\[.*?\]|Slide \d+:/i).filter(section => section.trim());
    
    // If no clear slide markers, split by double newlines
    if (sections.length < 3) {
      sections = content.split(/\n\n+/).filter(section => section.trim() && section.length > 20);
    }

    sections.forEach((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      if (lines.length === 0) return;

      let title = '';
      let slideContent = '';

      // Try to identify title from first line
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && !firstLine.includes('.') && lines.length > 1) {
        title = firstLine;
        slideContent = lines.slice(1).join('\n').trim();
      } else {
        // Generate title based on content or position
        const standardTitles = [
          "Company Overview", "Problem Statement", "Our Solution", "Market Opportunity",
          "Business Model", "Competitive Analysis", "Traction", "Team", "Financial Projections",
          "Funding Request", "Use of Funds", "Next Steps"
        ];
        title = standardTitles[index] || `Slide ${index + 1}`;
        slideContent = section.trim();
      }

      if (title && slideContent) {
        slides.push({
          title,
          content: slideContent
        });
      }
    });

    // Ensure we have at least a few key slides
    if (slides.length === 0) {
      slides.push({
        title: "Company Overview",
        content: `${formData.companyName || "Your Company"} - Brief description of your business and mission.`
      });
    }

    return slides.slice(0, 12); // Limit to 12 slides
  };

  return (
    <>
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Presentation className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Pitch Deck Generator</h3>
      </div>
      <p className="text-muted-foreground mb-2">
        Create a compelling investor pitch deck for your startup
      </p>
      <p className="text-sm text-muted-foreground mb-6">Create a professional investor pitch deck with all essential slides. Perfect for fundraising meetings and investor presentations.</p>
      <div className="space-y-6">
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
          size="lg"
          className="w-full"
          variant="hero"
        >
          {isGenerating ? "Generating Pitch Deck..." : "Generate Pitch Deck"}
        </Button>

        {slides.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Generated Pitch Deck ({slides.length} slides)</h3>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setShowPresentation(true)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Present
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
            <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
              {slides.map((slide, index) => (
                <Card 
                  key={index} 
                  className="border hover:border-primary/50 cursor-pointer transition-colors"
                  onClick={() => setShowPresentation(true)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      {slide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {slide.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Click any slide or press "Present" to view full presentation
            </p>
          </div>
        )}
      </div>
    </Card>
    
    {/* Presentation Mode */}
    {showPresentation && (
      <PitchDeckPresentation 
        slides={slides}
        companyName={formData.companyName || "Your Company"}
        onClose={() => setShowPresentation(false)}
      />
    )}
    </>
  );
};