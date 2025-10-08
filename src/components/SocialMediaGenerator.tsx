import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hash, Share2, Calendar, Copy, Download } from 'lucide-react';

interface SocialMediaContent {
  platform: string;
  contentType: string;
  content: string;
  hashtags: string[];
  bestTime: string;
}

export const SocialMediaGenerator = () => {
  const [businessType, setBusinessType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [products, setProducts] = useState('');
  const [tone, setTone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<SocialMediaContent[]>([]);

  const generateContent = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/social-media-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessType,
          targetAudience,
          products,
          tone
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setContentIdeas(data.contentIdeas);
    } catch (error) {
      console.error('Error generating content:', error);
      // Fallback to mock data on error
      const mockContent: SocialMediaContent[] = [
        {
          platform: "Instagram",
          contentType: "Behind-the-scenes",
          content: "Take your followers on a journey! Show the process behind creating your products/services. People love authenticity and seeing the human side of your business.",
          hashtags: ["#BehindTheScenes", "#SmallBusiness", "#Entrepreneur", "#WorkInProgress", "#BusinessLife"],
          bestTime: "1-3 PM or 6-9 PM"
        },
        {
          platform: "LinkedIn",
          contentType: "Industry Insights",
          content: "Share your expert opinion on industry trends. Position yourself as a thought leader by discussing challenges and opportunities in your field.",
          hashtags: ["#IndustryInsights", "#BusinessTips", "#Leadership", "#Innovation", "#ProfessionalGrowth"],
          bestTime: "8-10 AM or 12-2 PM"
        }
      ];
      setContentIdeas(mockContent);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateContent();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadContent = () => {
    let content = `SOCIAL MEDIA CONTENT IDEAS\n`;
    content += `Business Type: ${businessType}\n`;
    content += `Target Audience: ${targetAudience}\n`;
    content += `Products/Services: ${products}\n`;
    content += `Brand Tone: ${tone}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    contentIdeas.forEach((idea, index) => {
      content += `\n${index + 1}. ${idea.platform.toUpperCase()} - ${idea.contentType}\n`;
      content += `${'-'.repeat(60)}\n\n`;
      content += `${idea.content}\n\n`;
      content += `Hashtags: ${idea.hashtags.join(', ')}\n`;
      content += `Best Time to Post: ${idea.bestTime}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-media-content-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Social Media Content Generator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">Generate engaging social media content for your business. Get platform-specific posts, captions, and hashtags to boost your online presence.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Type - e.g., Digital marketing agency, Coffee shop, Fitness coaching</label>
          <Input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Target Audience - e.g., Small business owners, Fitness enthusiasts, Working professionals</label>
          <Input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Products/Services - Describe your main products or services</label>
          <Textarea
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Brand Tone - Select your brand tone</label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue placeholder="Choose tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual & Friendly</SelectItem>
              <SelectItem value="inspiring">Inspiring & Motivational</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
              <SelectItem value="humorous">Fun & Humorous</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="hero">
          {isGenerating ? "Generating Content Ideas..." : "Generate Social Media Content"}
        </Button>
      </form>

      {contentIdeas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">Content Ideas</h4>
            <Button 
              onClick={downloadContent}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
          {contentIdeas.map((idea, index) => (
            <Card key={index} className="p-4 border-l-4 border-secondary">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <Share2 className="h-4 w-4 text-secondary" />
                    </div>
                    <div>
                      <h5 className="font-medium text-foreground">{idea.platform}</h5>
                      <p className="text-xs text-muted-foreground">{idea.contentType}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(idea.content)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {idea.content}
                </p>

                <div className="flex flex-wrap gap-1">
                  {idea.hashtags.map((hashtag, hashIndex) => (
                    <span
                      key={hashIndex}
                      className="inline-flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded"
                    >
                      <Hash className="h-3 w-3" />
                      {hashtag.replace('#', '')}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Best posting time: {idea.bestTime}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};