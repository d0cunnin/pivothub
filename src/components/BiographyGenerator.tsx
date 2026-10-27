import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Target, Eye, Heart, Download } from 'lucide-react';
import { sanitizeAIContent, parseAISections } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from "@/lib/invokeFunction";
import { useToast } from '@/hooks/use-toast';
import { generateBiographyPDF } from '@/lib/pdf-reports/biography';

interface BiographyContent {
  founderBio100: string;
  founderBio250: string;
  founderBio500: string;
  businessBio100: string;
  businessBio200: string;
  businessBio500: string;
  vision: string;
  mission: string;
}

export const BiographyGenerator = () => {
  const { toast } = useToast();
  const [founderName, setFounderName] = useState('');
  const [background, setBackground] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [goals, setGoals] = useState('');
  const [dateOfFormation, setDateOfFormation] = useState('');
  const [productsServices, setProductsServices] = useState('');
  const [traction, setTraction] = useState('');
  const [achievements, setAchievements] = useState('');
  const [tone, setTone] = useState<'formal' | 'friendly' | 'faith-based'>('formal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<BiographyContent | null>(null);

  const generateContent = async () => {
    setIsGenerating(true);
    
    try {
      // Get user session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use this tool");
      }

      const { data, error } = await invokeFunction('generate-business-content', {
        body: {
          type: 'biography',
          data: { 
            founderName, 
            background, 
            businessType, 
            goals, 
            dateOfFormation, 
            productsServices, 
            traction, 
            achievements,
            tone
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Failed to generate biography');
      }

      if (!data?.content || data.content.length < 300) {
        throw new Error('Biography content too short. Please try again.');
      }

      // Parse AI response into biography sections
      const sections = parseAISections(data.content, 8);
      const generatedContent: BiographyContent = {
        founderBio100: sections[0] || `${founderName} is an experienced professional in ${background}, currently leading ${businessType}.`,
        founderBio250: sections[1] || `${founderName} is an experienced professional with a background in ${background}. As the founder of ${businessType}, ${founderName} brings expertise and dedication to the industry. ${achievements ? `Notable achievements include ${achievements}.` : ''}`,
        founderBio500: sections[2] || `${founderName} is a seasoned professional with extensive experience in ${background}. With a deep understanding of market needs and a commitment to excellence, ${founderName} founded ${businessType}${dateOfFormation ? ` in ${new Date(dateOfFormation).getFullYear()}` : ''}. ${achievements ? `Career highlights include ${achievements}.` : ''} ${founderName} leads the organization with a focus on ${goals.toLowerCase()}, driving innovation and growth in the industry.`,
        businessBio100: sections[3] || `${businessType} provides ${productsServices || 'innovative solutions'} to help clients achieve their goals.`,
        businessBio200: sections[4] || `${businessType} was founded${dateOfFormation ? ` in ${new Date(dateOfFormation).getFullYear()}` : ''} to ${goals.toLowerCase()}. We offer ${productsServices || 'comprehensive solutions'} designed to meet the needs of our clients. ${traction ? `We have achieved ${traction}.` : ''}`,
        businessBio500: sections[5] || `${businessType} was established${dateOfFormation ? ` in ${new Date(dateOfFormation).getFullYear()}` : ''} to address critical needs in the industry. Founded by ${founderName}, who brings expertise in ${background}, the company offers ${productsServices || 'innovative solutions'} designed to ${goals.toLowerCase()}. ${traction ? `The company has achieved significant traction, including ${traction}.` : ''} ${achievements ? `Recognized achievements include ${achievements}.` : ''} Our commitment to excellence and innovation drives sustainable growth and lasting value for clients.`,
        vision: sections[6] || `To become the leading ${businessType} that transforms the industry through innovation and excellence.`,
        mission: sections[7] || `Our mission is to ${goals.toLowerCase()} while maintaining integrity, innovation, and customer satisfaction.`
      };
      
      setContent(generatedContent);
      toast({ title: "Success", description: "Biography package generated successfully!" });
    } catch (error: any) {
      console.error('Error generating biography:', error);
      toast({ title: "Error", description: error.message || "Failed to generate biography", variant: "destructive" });
      // Enhanced fallback based on user input
      const fallbackContent: BiographyContent = {
        founderBio100: `${founderName} is an experienced professional in ${background}, currently leading ${businessType}.`,
        founderBio250: `${founderName} is an experienced professional with a background in ${background}. As the founder of ${businessType}, ${founderName} brings expertise and dedication to the industry. ${achievements ? `Notable achievements include ${achievements}.` : ''}`,
        founderBio500: `${founderName} is a seasoned professional with extensive experience in ${background}. With a deep understanding of market needs and a commitment to excellence, ${founderName} founded ${businessType}${dateOfFormation ? ` in ${new Date(dateOfFormation).getFullYear()}` : ''}. ${achievements ? `Career highlights include ${achievements}.` : ''} ${founderName} leads the organization with a focus on ${goals.toLowerCase()}, driving innovation and growth in the industry.`,
        businessBio100: `${businessType} provides ${productsServices || 'innovative solutions'} to help clients achieve their goals.`,
        businessBio200: `${businessType} was founded${dateOfFormation ? ` in ${new Date(dateOfFormation).getFullYear()}` : ''} to ${goals.toLowerCase()}. We offer ${productsServices || 'comprehensive solutions'} designed to meet the needs of our clients. ${traction ? `We have achieved ${traction}.` : ''}`,
        businessBio500: `${businessType} was established${dateOfFormation ? ` in ${new Date(dateOfFormation).getFullYear()}` : ''} to address critical needs in the industry. Founded by ${founderName}, who brings expertise in ${background}, the company offers ${productsServices || 'innovative solutions'} designed to ${goals.toLowerCase()}. ${traction ? `The company has achieved significant traction, including ${traction}.` : ''} ${achievements ? `Recognized achievements include ${achievements}.` : ''} Our commitment to excellence and innovation drives sustainable growth and lasting value for clients.`,
        vision: `To become the leading ${businessType} that transforms the industry through innovation and excellence.`,
        mission: `Our mission is to ${goals.toLowerCase()} while maintaining integrity, innovation, and customer satisfaction.`
      };
      setContent(fallbackContent);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateContent();
  };

  const downloadBiographyAsText = () => {
    if (!content) return;
    
    let fileContent = `FOUNDER & BUSINESS BIOGRAPHY PACKAGE\n`;
    fileContent += `Generated: ${new Date().toLocaleDateString()}\n`;
    fileContent += `Founder: ${founderName}\n`;
    fileContent += `Business: ${businessType}\n`;
    fileContent += `Tone: ${tone}\n\n`;
    fileContent += `${'='.repeat(80)}\n\n`;
    
    fileContent += `FOUNDER BIOGRAPHY (100 WORDS)\n${'-'.repeat(80)}\n${content.founderBio100}\n\n\n`;
    fileContent += `FOUNDER BIOGRAPHY (250 WORDS)\n${'-'.repeat(80)}\n${content.founderBio250}\n\n\n`;
    fileContent += `FOUNDER BIOGRAPHY (500 WORDS)\n${'-'.repeat(80)}\n${content.founderBio500}\n\n\n`;
    fileContent += `BUSINESS BIOGRAPHY (100 WORDS)\n${'-'.repeat(80)}\n${content.businessBio100}\n\n\n`;
    fileContent += `BUSINESS BIOGRAPHY (200 WORDS)\n${'-'.repeat(80)}\n${content.businessBio200}\n\n\n`;
    fileContent += `BUSINESS BIOGRAPHY (500 WORDS)\n${'-'.repeat(80)}\n${content.businessBio500}\n\n\n`;
    fileContent += `VISION STATEMENT\n${'-'.repeat(80)}\n${content.vision}\n\n\n`;
    fileContent += `MISSION STATEMENT\n${'-'.repeat(80)}\n${content.mission}\n`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biography-package-${founderName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadBiographyAsPDF = () => {
    if (!content) return;

    const doc = generateBiographyPDF({ founderName, businessType, tone, content });
    doc.save(`biography-package-${founderName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Downloaded!",
      description: "Your biography package has been saved as a PDF."
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Biography and Statement Maker</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Generate comprehensive biographies and statements for your business and founder profile.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Founder Name * - Enter founder's name</label>
          <Input
            value={founderName}
            onChange={(e) => setFounderName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Professional Background * - e.g., software development, marketing, healthcare</label>
          <Input
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Type * - e.g., consulting firm, tech startup, retail store</label>
          <Input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Goals * - Describe what you want to achieve with your business</label>
          <Textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Date of Formation (if applicable) - Select formation date</label>
          <Input
            type="date"
            value={dateOfFormation}
            onChange={(e) => setDateOfFormation(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Products/Services Offered (if applicable) - Describe your main products or services</label>
          <Textarea
            value={productsServices}
            onChange={(e) => setProductsServices(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Traction (if applicable) - e.g., number of customers, revenue milestones, partnerships</label>
          <Textarea
            value={traction}
            onChange={(e) => setTraction(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Achievements (if applicable) - e.g., awards, recognition, significant milestones</label>
          <Textarea
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Tone * - Select writing style</label>
          <Select value={tone} onValueChange={(value: 'formal' | 'friendly' | 'faith-based') => setTone(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal / Corporate</SelectItem>
              <SelectItem value="friendly">Friendly / Approachable</SelectItem>
              <SelectItem value="faith-based">Faith-Based</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Formal: Professional, executive-level • Friendly: Warm but professional • Faith-Based: Purpose-driven with spiritual language
          </p>
        </div>

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="hero">
          {isGenerating ? "Generating Biography Package..." : "Generate Biography Package - 3 Credits"}
        </Button>
      </form>

      {content && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Biography Package (8 Documents)</h4>
            <div className="flex gap-2">
              <Button 
                onClick={downloadBiographyAsPDF}
                variant="default"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button 
                onClick={downloadBiographyAsText}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Text
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Founder Biography (100 words)</h5>
                <Badge variant="outline" className="text-xs">Social Media / Event Bio</Badge>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">{content.founderBio100}</p>
                <p className="text-xs text-muted-foreground mt-2">Word count: {content.founderBio100.split(/\s+/).length}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Founder Biography (250 words)</h5>
                <Badge variant="outline" className="text-xs">Speaker Bio / Website</Badge>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">{content.founderBio250}</p>
                <p className="text-xs text-muted-foreground mt-2">Word count: {content.founderBio250.split(/\s+/).length}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Founder Biography (500 words)</h5>
                <Badge variant="outline" className="text-xs">Investor Materials / Press Release</Badge>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">{content.founderBio500}</p>
                <p className="text-xs text-muted-foreground mt-2">Word count: {content.founderBio500.split(/\s+/).length}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Business Biography (100 words)</h5>
                <Badge variant="outline" className="text-xs">Directory Listing / Email Signature</Badge>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">{content.businessBio100}</p>
                <p className="text-xs text-muted-foreground mt-2">Word count: {content.businessBio100.split(/\s+/).length}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Business Biography (200 words)</h5>
                <Badge variant="outline" className="text-xs">Pitch Deck / Partnership Materials</Badge>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">{content.businessBio200}</p>
                <p className="text-xs text-muted-foreground mt-2">Word count: {content.businessBio200.split(/\s+/).length}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Business Biography (500 words)</h5>
                <Badge variant="outline" className="text-xs">Investor Deck / Loan Application</Badge>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">{content.businessBio500}</p>
                <p className="text-xs text-muted-foreground mt-2">Word count: {content.businessBio500.split(/\s+/).length}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Vision Statement</h5>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{content.vision}</p>
              </Card>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-secondary" />
                <h5 className="font-semibold text-sm text-foreground">Mission Statement</h5>
              </div>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{content.mission}</p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};