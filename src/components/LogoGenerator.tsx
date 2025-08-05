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
}

export const LogoGenerator = () => {
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [style, setStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [concepts, setConcepts] = useState<LogoConcept[]>([]);

  const generateLogoConcepts = async () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const mockConcepts: LogoConcept[] = [
        {
          style: "Modern Minimalist",
          colors: "Deep Blue (#1e40af) & White",
          fonts: "Inter, Clean Sans-serif",
          concept: "Clean geometric icon with business initials, emphasizing professionalism and trust"
        },
        {
          style: "Creative Badge",
          colors: "Forest Green (#059669) & Gold (#f59e0b)",
          fonts: "Montserrat, Bold Typography",
          concept: "Circular badge design with industry symbol, conveying expertise and reliability"
        },
        {
          style: "Tech-Forward",
          colors: "Electric Blue (#0ea5e9) & Charcoal (#374151)",
          fonts: "Roboto, Modern Geometric",
          concept: "Abstract tech-inspired icon with dynamic lines, suggesting innovation and growth"
        }
      ];
      setConcepts(mockConcepts);
      setIsGenerating(false);
    }, 2000);
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

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="default">
          {isGenerating ? "Generating Concepts..." : "Generate Logo Concepts"}
        </Button>
      </form>

      {concepts.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Logo Concepts</h4>
          {concepts.map((concept, index) => (
            <Card key={index} className="p-4 border-l-4 border-secondary">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mt-1">
                  <Type className="h-4 w-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-foreground mb-1">{concept.style}</h5>
                  <p className="text-sm text-muted-foreground mb-2">{concept.concept}</p>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Colors:</span> {concept.colors}</p>
                    <p><span className="font-medium">Typography:</span> {concept.fonts}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};