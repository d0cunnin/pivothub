import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hash, Share2, Calendar, Copy } from 'lucide-react';

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
    // Simulate API call
    setTimeout(() => {
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
        },
        {
          platform: "Facebook",
          contentType: "Customer Success Story",
          content: "Highlight how your product/service made a difference for a customer. Use their testimonial and show before/after results when possible.",
          hashtags: ["#CustomerSuccess", "#Testimonial", "#HappyCustomers", "#Results", "#CommunityLove"],
          bestTime: "1-4 PM or 6-9 PM"
        },
        {
          platform: "Twitter/X",
          contentType: "Quick Tips",
          content: "Share actionable tips related to your industry. Make them concise and valuable - something your audience can implement immediately.",
          hashtags: ["#MondayMotivation", "#BusinessTips", "#Productivity", "#Success", "#Entrepreneur"],
          bestTime: "9 AM or 7-9 PM"
        },
        {
          platform: "TikTok",
          contentType: "Educational Content",
          content: "Create short, engaging videos explaining complex concepts in simple terms. Use trending sounds and keep it under 60 seconds.",
          hashtags: ["#LearnOnTikTok", "#BusinessHacks", "#Education", "#LifeHacks", "#SmallBizTips"],
          bestTime: "6-10 AM or 7-9 PM"
        }
      ];
      setContentIdeas(mockContent);
      setIsGenerating(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateContent();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Social Media Content Generator</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Business Type</label>
          <Input
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g., Digital marketing agency, Coffee shop, Fitness coaching"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Target Audience</label>
          <Input
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Small business owners, Fitness enthusiasts, Working professionals"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Products/Services</label>
          <Textarea
            value={products}
            onChange={(e) => setProducts(e.target.value)}
            placeholder="Describe your main products or services"
            rows={2}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-foreground">Brand Tone</label>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger>
              <SelectValue placeholder="Select your brand tone" />
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

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="default">
          {isGenerating ? "Generating Content Ideas..." : "Generate Social Media Content"}
        </Button>
      </form>

      {contentIdeas.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">Content Ideas</h4>
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