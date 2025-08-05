import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { User, Target, Eye, Heart } from 'lucide-react';

interface BiographyContent {
  founderBio: string;
  vision: string;
  mission: string;
}

export const BiographyGenerator = () => {
  const [founderName, setFounderName] = useState('');
  const [background, setBackground] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [goals, setGoals] = useState('');
  const [dateOfFormation, setDateOfFormation] = useState('');
  const [productsServices, setProductsServices] = useState('');
  const [traction, setTraction] = useState('');
  const [achievements, setAchievements] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<BiographyContent | null>(null);

  const generateContent = async () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      const mockContent: BiographyContent = {
        founderBio: `${founderName} is a passionate entrepreneur with a background in ${background}. ${dateOfFormation ? `Founded in ${new Date(dateOfFormation).getFullYear()}, ` : ''}With years of experience and a deep understanding of market needs, ${founderName} founded this ${businessType} to make a meaningful impact in the industry.${achievements ? ` Notable achievements include ${achievements}.` : ''} Their commitment to excellence and innovation drives the company's success and growth.`,
        vision: `To become the leading ${businessType} that transforms how people interact with our industry, creating lasting positive change and setting new standards for quality and service excellence.${traction ? ` Building on our current success of ${traction}, we aim to expand our impact significantly.` : ''}`,
        mission: `Our mission is to ${goals.toLowerCase()} while maintaining the highest standards of integrity, innovation, and customer satisfaction.${productsServices ? ` Through our ${productsServices}, we are committed to` : ' We are committed to'} building long-term relationships with our clients and contributing positively to our community.`
      };
      setContent(mockContent);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateContent();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Business Biography and Statement</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Founder Name *</label>
          <Input
            value={founderName}
            onChange={(e) => setFounderName(e.target.value)}
            placeholder="Enter founder's name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Professional Background *</label>
          <Input
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="e.g., software development, marketing, healthcare"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Type *</label>
          <Input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g., consulting firm, tech startup, retail store"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Goals *</label>
          <Textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Describe what you want to achieve with your business"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Date of Formation (if applicable)</label>
          <Input
            type="date"
            value={dateOfFormation}
            onChange={(e) => setDateOfFormation(e.target.value)}
            placeholder="Select formation date"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Products/Services Offered (if applicable)</label>
          <Textarea
            value={productsServices}
            onChange={(e) => setProductsServices(e.target.value)}
            placeholder="Describe your main products or services"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Traction (if applicable)</label>
          <Textarea
            value={traction}
            onChange={(e) => setTraction(e.target.value)}
            placeholder="e.g., number of customers, revenue milestones, partnerships"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Achievements (if applicable)</label>
          <Textarea
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            placeholder="e.g., awards, recognition, significant milestones"
            rows={2}
          />
        </div>

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="hero">
          {isGenerating ? "Generating Content..." : "Generate Business Biography & Statement"}
        </Button>
      </form>

      {content && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-secondary" />
              <h4 className="font-semibold text-foreground">Founder Biography</h4>
            </div>
            <Card className="p-4 bg-muted/50">
              <p className="text-muted-foreground leading-relaxed">{content.founderBio}</p>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-secondary" />
              <h4 className="font-semibold text-foreground">Vision Statement</h4>
            </div>
            <Card className="p-4 bg-muted/50">
              <p className="text-muted-foreground leading-relaxed">{content.vision}</p>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-secondary" />
              <h4 className="font-semibold text-foreground">Mission Statement</h4>
            </div>
            <Card className="p-4 bg-muted/50">
              <p className="text-muted-foreground leading-relaxed">{content.mission}</p>
            </Card>
          </div>
        </div>
      )}
    </Card>
  );
};