import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Palette, Type, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { toast } from "sonner";

interface LogoConcept {
  style: string;
  colors: string;
  fonts: string;
  concept: string;
  imageURL?: string;
}

export const LogoGenerator = () => {
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [style, setStyle] = useState('');
  const [colors, setColors] = useState('');
  const [fonts, setFonts] = useState('');
  const [textDesired, setTextDesired] = useState('');
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [concepts, setConcepts] = useState<LogoConcept[]>([]);

  const generateLogoConcepts = async () => {
    setIsGenerating(true);
    setConcepts([]);
    
    try {
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to generate logos');
        setIsGenerating(false);
        return;
      }

      // Use Supabase SDK with proper authentication
      const { data, error } = await invokeFunction('generate-logo', {
        body: {
          businessName,
          industry,
          style,
          colors,
          fonts,
          textDesired,
          additionalPrompt
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.logos) throw new Error('No logos received');

      // Convert API response to LogoConcept format, filtering out failed generations
      const logosConcepts: LogoConcept[] = data.logos
        .filter((logo: any) => logo.imageURL)
        .map((logo: any) => ({
          style: logo.style,
          colors: "AI Generated",
          fonts: "AI Generated", 
          concept: logo.concept,
          imageURL: logo.imageURL
        }));

      if (logosConcepts.length === 0) {
        throw new Error('No logos were successfully generated');
      }

      setConcepts(logosConcepts);
      toast.success('Logos generated successfully!');
    } catch (error) {
      console.error('Error generating logos:', error);
      toast.error(`Failed to generate logos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateLogoConcepts();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Palette className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Logo Concept Generator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">Generate custom logo designs for your business. Describe your vision and get multiple professional logo concepts to choose from.</p>
      
      <Alert className="mb-6 border-warning/50 bg-warning/10">
        <AlertCircle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm text-foreground">
          <strong>AI Logo Generator Disclaimer:</strong> The AI Logo Generator on this site creates designs automatically using artificial intelligence. All generated logos and images are provided for creative and informational purposes only.
          <br /><br />
          While we strive to produce original content, we cannot guarantee that any logo or design will be unique or free from resemblance to existing trademarks, copyrighted materials, or other intellectual property.
          <br /><br />
          By using this tool, you acknowledge and agree that:
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li>You are responsible for reviewing and verifying the originality and legal usability of any logo before using it for branding, marketing, or commercial purposes.</li>
            <li>This website and its creators do not claim ownership of your generated content.</li>
            <li>This website and its creators are not liable for any copyright, trademark, or intellectual property disputes that may arise from the use of generated designs.</li>
          </ul>
          <br />
          We recommend that you conduct a trademark search or consult a qualified legal professional before finalizing or distributing any logo created with this tool.
        </AlertDescription>
      </Alert>

      <Alert className="mb-6 border-primary/50 bg-primary/10">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm text-foreground">
          <strong>Please Note:</strong> All generated images are watermarked and non-downloadable by design. This tool is designed to help you explore creative ideas and visualize concepts for what your professional, finished logo might look like. To create a final, commercial-ready logo, we recommend working with a professional designer or branding specialist.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Name - Enter your business name</label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Industry - Select your industry</label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Choose industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="creative">Creative Services</SelectItem>
              <SelectItem value="food">Food & Beverage</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Preferred Style - Choose a style preference</label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Choose style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimalist">Minimalist</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="creative">Creative</SelectItem>
              <SelectItem value="tech">Tech-Forward</SelectItem>
              <SelectItem value="elegant">Elegant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Preferred Colors (Optional) - e.g., Blue and gold, vibrant colors, monochrome</label>
          <Input
            value={colors}
            onChange={(e) => setColors(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Preferred Fonts (Optional) - e.g., Modern sans-serif, classic serif, bold</label>
          <Input
            value={fonts}
            onChange={(e) => setFonts(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Text to Include (Optional) - e.g., Company name only, name + tagline</label>
          <Input
            value={textDesired}
            onChange={(e) => setTextDesired(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Additional Design Instructions (Optional) - Describe any specific elements, symbols, or concepts you want in your logo</label>
          <Textarea
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.target.value)}
            rows={3}
          />
        </div>

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="hero">
          {isGenerating ? "Generating Concepts..." : "Generate Logo Concepts (2 Credits)"}
        </Button>
      </form>

      {concepts.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground mb-4">Generated Logo Concepts</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {concepts.map((concept, index) => (
              <Card key={index} className="p-4 border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
                {concept.imageURL && (
                  <div className="mb-4 bg-muted rounded-lg overflow-hidden relative">
                    <img 
                      src={concept.imageURL} 
                      alt={`Logo concept: ${concept.style}`}
                      className="w-full h-auto"
                      onContextMenu={(e) => e.preventDefault()}
                      draggable={false}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-white/30 text-4xl font-bold rotate-[-45deg] select-none">
                        PREVIEW
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-secondary mt-1 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-foreground">{concept.style}</h5>
                      <p className="text-sm text-muted-foreground mt-1">{concept.concept}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};