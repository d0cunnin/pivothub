import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Presentation, Download, Eye, Play, FileText, Info } from "lucide-react";
import { sanitizeAIContent } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { PitchDeckPresentation } from './PitchDeckPresentation';
import jsPDF from 'jspdf';

interface PitchData {
  companyName: string;
  presenterName: string;
  problem: string;
  solution: string;
  marketSize: string;
  goToMarketStrategy: string;
  businessModel: string;
  competition: string;
  fundingAmount: string;
  useOfFunds: string;
  teamBackground: string;
  traction: string;
  primaryColor: string;
  accentColor: string;
  logo?: string;
}

interface Slide {
  title: string;
  content: string;
}

export const PitchDeckGenerator = () => {
  const [formData, setFormData] = useState<PitchData>({
    companyName: "",
    presenterName: "",
    problem: "",
    solution: "",
    marketSize: "",
    goToMarketStrategy: "",
    businessModel: "",
    competition: "",
    fundingAmount: "",
    useOfFunds: "",
    teamBackground: "",
    traction: "",
    primaryColor: "#6366f1",
    accentColor: "#8b5cf6"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [showPresentation, setShowPresentation] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const handleInputChange = (field: keyof PitchData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAsText = () => {
    let content = `INVESTOR PITCH DECK\n`;
    content += `Company: ${formData.companyName || 'Your Company'}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    slides.forEach((slide, index) => {
      content += `\nSLIDE ${index + 1}: ${slide.title.toUpperCase()}\n`;
      content += `${'-'.repeat(60)}\n\n`;
      content += `${slide.content}\n\n`;
      content += `${'='.repeat(80)}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-deck-${formData.companyName.replace(/\s+/g, '-').toLowerCase() || 'startup'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    const pdf = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    slides.forEach((slide, index) => {
      if (index > 0) {
        pdf.addPage();
      }

      // Add subtle background color
      pdf.setFillColor(249, 250, 251);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Add company branding header
      if (logoPreview) {
        try {
          pdf.addImage(logoPreview, 'PNG', margin, 10, 20, 20);
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      }
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(formData.companyName || 'Company Name', pageWidth - margin, 15, { align: 'right' });

      // Slide title
      pdf.setFontSize(24);
      pdf.setTextColor(51, 65, 85);
      pdf.setFont('helvetica', 'bold');
      const titleY = 45;
      pdf.text(slide.title, margin, titleY, { maxWidth: contentWidth });

      // Slide content
      pdf.setFontSize(14);
      pdf.setTextColor(71, 85, 105);
      pdf.setFont('helvetica', 'normal');
      const contentY = titleY + 15;
      
      const lines = slide.content.split('\n').filter(line => line.trim());
      let currentY = contentY;
      
      lines.forEach((line, lineIndex) => {
        if (currentY > pageHeight - 40) return; // Prevent overflow
        
        const cleanLine = line.replace(/^[•\-\*]\s*/, '');
        const wrappedLines = pdf.splitTextToSize(cleanLine, contentWidth - 10);
        
        // Bullet point
        pdf.setFontSize(16);
        pdf.text('•', margin, currentY);
        
        // Content
        pdf.setFontSize(14);
        pdf.text(wrappedLines, margin + 8, currentY, { maxWidth: contentWidth - 10 });
        
        currentY += (wrappedLines.length * 8) + 5;
      });

      // Footer with page number
      pdf.setFontSize(10);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`${index + 1} / ${slides.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(new Date().toLocaleDateString(), pageWidth - margin, pageHeight - 10, { align: 'right' });
    });

    pdf.save(`pitch-deck-${formData.companyName.replace(/\s+/g, '-').toLowerCase() || 'startup'}-${new Date().toISOString().split('T')[0]}.pdf`);
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
          data: {
            companyName: formData.companyName,
            presenterName: formData.presenterName,
            problem: formData.problem,
            solution: formData.solution,
            marketSize: formData.marketSize,
            goToMarketStrategy: formData.goToMarketStrategy,
            businessModel: formData.businessModel,
            competition: formData.competition,
            fundingAmount: formData.fundingAmount,
            useOfFunds: formData.useOfFunds,
            teamBackground: formData.teamBackground,
            traction: formData.traction
          }
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
      // Enhanced fallback with bullet points
      const generatedSlides: Slide[] = [
        {
          title: "Title / Cover",
          content: `• ${formData.companyName || 'Your Company'}\n• Presenter: ${formData.presenterName || 'Your Name'}\n• Transforming the market with innovative solutions`
        },
        {
          title: "Problem",
          content: formData.problem 
            ? `• ${formData.problem.split('.')[0]}\n• Current solutions are inadequate\n• Market needs better approach`
            : "• Market challenges exist\n• Current solutions fall short\n• Growing demand for innovation"
        },
        {
          title: "Solution",
          content: formData.solution 
            ? `• ${formData.solution.split('.')[0]}\n• Innovative approach to market needs\n• Proven technology foundation`
            : "• Innovative solution addressing core problems\n• Technology-driven approach\n• Validated with early users"
        },
        {
          title: "Market Opportunity",
          content: formData.marketSize 
            ? `• Total addressable market: ${formData.marketSize}\n• Rapid market growth trajectory\n• Strong customer demand signals`
            : "• Large addressable market\n• Growing at significant rate\n• Strong customer demand"
        },
        {
          title: "Product / Technology",
          content: formData.solution 
            ? `• ${formData.solution.split('.')[0]}\n• Scalable platform architecture\n• Proprietary technology advantage`
            : "• Advanced product capabilities\n• Scalable technology platform\n• Continuous innovation pipeline"
        },
        {
          title: "Business Model",
          content: formData.businessModel 
            ? `• Revenue model: ${formData.businessModel}\n• Attractive unit economics\n• Multiple revenue streams`
            : "• Subscription-based revenue model\n• Strong unit economics\n• Scalable customer acquisition"
        },
        {
          title: "Go-to-Market Strategy",
          content: formData.goToMarketStrategy 
            ? `• ${formData.goToMarketStrategy.split('.')[0]}\n• Multi-channel customer acquisition\n• Strategic partnership approach`
            : "• Direct sales and digital marketing\n• Strategic partnerships\n• Phased market expansion"
        },
        {
          title: "Competition / Differentiation",
          content: formData.competition 
            ? `• Key competitors: ${formData.competition}\n• Superior product capabilities\n• Strong customer satisfaction\n• Defensible market position`
            : "• Competitive but fragmented market\n• Clear differentiation strategy\n• Strong competitive advantages"
        },
        {
          title: "Financials / Traction",
          content: formData.traction 
            ? `• ${formData.traction}\n• Funding: ${formData.fundingAmount || 'Seeking investment'}\n• Strong growth metrics\n• Path to profitability`
            : "• Early traction with customers\n• Growing revenue\n• Clear path to profitability"
        },
        {
          title: "Team & Ask / Closing",
          content: `• Team: ${formData.teamBackground || 'Experienced team with proven track record'}\n• Funding ask: ${formData.fundingAmount || 'Investment amount TBD'}\n• ${formData.useOfFunds || 'Fuel growth and market expansion'}\n• Contact us to join our journey`
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
    const expectedTitles = [
      "Title / Cover",
      "Problem",
      "Solution", 
      "Market Opportunity",
      "Product / Technology",
      "Business Model",
      "Go-to-Market Strategy",
      "Competition / Differentiation",
      "Financials / Traction",
      "Team & Ask / Closing"
    ];
    
    // Split by [Title] markers
    const slidePattern = /\[(.*?)\]/g;
    const parts = content.split(slidePattern);
    
    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].trim();
      const slideContent = parts[i + 1]?.trim() || '';
      
      if (title && slideContent) {
        // Extract only bullet points (lines starting with •)
        const bulletLines = slideContent
          .split('\n')
          .filter(line => line.trim().startsWith('•'))
          .slice(0, 5) // Max 5 bullets
          .join('\n');
        
        slides.push({
          title: title,
          content: bulletLines || slideContent
        });
      }
    }
    
    // If parsing failed, ensure we have exactly 10 slides with expected titles
    if (slides.length < 10) {
      const contentLines = content.split('\n').filter(l => l.trim());
      const bulletsPerSlide = Math.max(3, Math.floor(contentLines.length / 10));
      
      return expectedTitles.map((title, index) => {
        const startIdx = index * bulletsPerSlide;
        const slideLines = contentLines.slice(startIdx, startIdx + bulletsPerSlide);
        return {
          title,
          content: slideLines.map(l => l.startsWith('•') ? l : `• ${l}`).join('\n')
        };
      });
    }
    
    // Limit to exactly 10 slides
    return slides.slice(0, 10);
  };

  return (
    <>
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Presentation className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Pitch Deck Content Generator</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Generate investor-ready pitch deck content with all essential slides for presentations.</p>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>💡 New to This?</strong> If you don't have answers for these inputs yet, we recommend completing the <strong>Business Foundation Builder</strong> first (found in Step 1 above). It will help you develop all the core business information needed for a compelling pitch deck.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Branding Section */}
        <Card className="p-4 bg-muted/30">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Presentation className="h-4 w-4" />
            Presentation Branding
          </h4>
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
              <Label htmlFor="presenterName">Presenter Name</Label>
              <Input
                id="presenterName"
                placeholder="Your full name"
                value={formData.presenterName}
                onChange={(e) => handleInputChange("presenterName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Company Logo</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="cursor-pointer"
                />
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" className="h-10 w-10 object-contain rounded" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => handleInputChange("accentColor", e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => handleInputChange("accentColor", e.target.value)}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
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

        <div className="space-y-2">
          <Label htmlFor="goToMarketStrategy">Go-to-Market Strategy</Label>
          <Textarea
            id="goToMarketStrategy"
            placeholder="How will you acquire customers and enter the market?"
            value={formData.goToMarketStrategy}
            onChange={(e) => handleInputChange("goToMarketStrategy", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="competition">Competition</Label>
          <Textarea
            id="competition"
            placeholder="Who are your main competitors? What makes you different?"
            value={formData.competition}
            onChange={(e) => handleInputChange("competition", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="useOfFunds">Use of Funds</Label>
          <Textarea
            id="useOfFunds"
            placeholder="How will you allocate the funding? (e.g., 40% product development, 30% marketing, 20% hiring, 10% operations)"
            value={formData.useOfFunds}
            onChange={(e) => handleInputChange("useOfFunds", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="teamBackground">Team Background</Label>
          <Textarea
            id="teamBackground"
            placeholder="Key team members, their credentials, relevant experience, and why this team can execute"
            value={formData.teamBackground}
            onChange={(e) => handleInputChange("teamBackground", e.target.value)}
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
          {isGenerating ? "Generating Pitch Deck..." : "Generate Pitch Deck (3 Credits)"}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportAsPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportAsText}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Text
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
        primaryColor={formData.primaryColor}
        accentColor={formData.accentColor}
        logo={formData.logo}
        onClose={() => setShowPresentation(false)}
      />
    )}
    </>
  );
};