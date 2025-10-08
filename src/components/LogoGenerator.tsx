import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Type, Sparkles } from 'lucide-react';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [concepts, setConcepts] = useState<LogoConcept[]>([]);

  const generateLogoConcepts = async () => {
    setIsGenerating(true);
    setConcepts([]);
    
    try {
      const response = await fetch(`https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/generate-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessName,
          industry,
          style
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

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
    } catch (error) {
      console.error('Error generating logos:', error);
      alert(`Failed to generate logos: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      
      <p className="text-sm text-muted-foreground mb-6">Generate custom logo designs for your business. Describe your vision and get multiple professional logo concepts to choose from.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Name</label>
          <Input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Industry</label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
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
          <label className="block text-sm font-medium mb-2 text-foreground">Preferred Style</label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a style preference" />
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

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="hero">
          {isGenerating ? "Generating Concepts..." : "Generate Logo Concepts"}
        </Button>
      </form>

      {concepts.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground mb-4">Generated Logo Concepts</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {concepts.map((concept, index) => (
              <Card key={index} className="p-4 border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
                {concept.imageURL && (
                  <div className="mb-4 bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={concept.imageURL} 
                      alt={`Logo concept: ${concept.style}`}
                      className="w-full h-auto"
                    />
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
                  {concept.imageURL && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = concept.imageURL!;
                        link.download = `${businessName}-logo-${index + 1}.png`;
                        link.click();
                      }}
                    >
                      Download Logo
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};