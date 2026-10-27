import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Hash, Share2, Calendar, Copy, Download, FileText, Image, Video } from 'lucide-react';
import { toast } from 'sonner';
import { generateSocialCalendarPDF } from '@/lib/pdf-reports/social-media-calendar';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from "@/lib/invokeFunction";

interface SocialMediaPost {
  day: number;
  date: string;
  platform: string;
  contentType: string;
  caption: string;
  hashtags: string[];
  visualSuggestion: string;
  bestTime: string;
}

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'twitter', name: 'X (Twitter)' },
];

export const SocialMediaGenerator = () => {
  const [businessName, setBusinessName] = useState('');
  const [businessNiche, setBusinessNiche] = useState('');
  const [creatorType, setCreatorType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentFocus, setContentFocus] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'linkedin']);
  const [tone, setTone] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [contentCalendar, setContentCalendar] = useState<SocialMediaPost[]>([]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const generateContent = async () => {
    if (!businessName || !businessNiche || !creatorType || !targetAudience || !contentFocus || selectedPlatforms.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Please sign in to generate content");
        setIsGenerating(false);
        return;
      }

      const { data, error } = await invokeFunction('social-media-content', {
        body: {
          businessName,
          businessNiche,
          creatorType,
          targetAudience,
          contentFocus,
          platforms: selectedPlatforms,
          tone
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error || 'Failed to generate content calendar');
      }

      if (!data?.contentCalendar || !Array.isArray(data.contentCalendar) || data.contentCalendar.length === 0) {
        throw new Error('Invalid or empty content calendar received');
      }

      const hasValidContent = data.contentCalendar.every((post: any) => 
        post.caption && post.caption.length > 20
      );
      
      if (!hasValidContent) {
        throw new Error('Content too short. Please try again.');
      }

      setContentCalendar(data.contentCalendar);
      toast.success('30-day content calendar generated!');
      
    } catch (error) {
      console.error('Error generating content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content calendar';
      toast.error(errorMessage);
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

  const downloadPDF = () => {
    if (contentCalendar.length === 0) return;

    const pdf = generateSocialCalendarPDF({
      businessName,
      businessNiche,
      platforms: selectedPlatforms.map(p => PLATFORMS.find(plat => plat.id === p)?.name || p),
      tone,
      posts: contentCalendar,
    });
    pdf.save(`${businessName.replace(/\s+/g, '-')}-content-calendar.pdf`);
    toast.success('PDF downloaded successfully!');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Share2 className="h-5 w-5 text-secondary" />
        <h3 className="text-xl font-bold text-foreground">Social Media Content Generator</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-6">
        Create a 30-day content calendar with posts, hashtags, and posting schedules for your platforms.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <Label htmlFor="businessName" className="text-sm font-medium">Business Name *</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., Acme Coffee Co."
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="businessNiche" className="text-sm font-medium">Business Niche / Industry *</Label>
          <Textarea
            id="businessNiche"
            value={businessNiche}
            onChange={(e) => setBusinessNiche(e.target.value)}
            placeholder="e.g., Specialty coffee roaster and café serving local community with ethically sourced beans and artisan pastries"
            rows={3}
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="creatorType" className="text-sm font-medium">What describes you best? *</Label>
          <Select value={creatorType} onValueChange={setCreatorType} required>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select your creator type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new-creator">New Social Media Content Creator</SelectItem>
              <SelectItem value="business-owner">Business Owner</SelectItem>
              <SelectItem value="author">Author / Writer</SelectItem>
              <SelectItem value="musician">Singer / Musician</SelectItem>
              <SelectItem value="artist">Visual Artist / Designer</SelectItem>
              <SelectItem value="coach">Coach / Consultant</SelectItem>
              <SelectItem value="influencer">Influencer / Personality</SelectItem>
              <SelectItem value="nonprofit">Nonprofit / Social Cause</SelectItem>
              <SelectItem value="educator">Educator / Teacher</SelectItem>
              <SelectItem value="fitness">Fitness / Wellness Professional</SelectItem>
              <SelectItem value="other">Other Professional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetAudience" className="text-sm font-medium">Target Audience *</Label>
          <Textarea
            id="targetAudience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="e.g., Women ages 25-45 interested in sustainable living and wellness, middle to upper income, environmentally conscious"
            rows={3}
            required
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Describe your ideal audience: demographics, interests, pain points, goals
          </p>
        </div>

        <div>
          <Label htmlFor="contentFocus" className="text-sm font-medium">What type of content do you create? *</Label>
          <Textarea
            id="contentFocus"
            value={contentFocus}
            onChange={(e) => setContentFocus(e.target.value)}
            placeholder="e.g., Educational content about personal finance, behind-the-scenes of music production, motivational fitness tips, book recommendations and author interviews"
            rows={3}
            required
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">Platform Focus *</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PLATFORMS.map((platform) => (
              <div key={platform.id} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.id}
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => togglePlatform(platform.id)}
                />
                <Label
                  htmlFor={platform.id}
                  className="text-sm font-normal cursor-pointer"
                >
                  {platform.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="tone" className="text-sm font-medium">Tone Preference *</Label>
          <Select value={tone} onValueChange={setTone} required>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose your brand tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional & Authoritative</SelectItem>
              <SelectItem value="casual">Casual & Friendly</SelectItem>
              <SelectItem value="inspiring">Inspiring & Motivational</SelectItem>
              <SelectItem value="educational">Educational & Informative</SelectItem>
              <SelectItem value="humorous">Fun & Humorous</SelectItem>
              <SelectItem value="empowering">Empowering & Supportive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={isGenerating} size="lg" className="w-full" variant="hero">
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating 30-Day Calendar...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Generate 30-Day Content Calendar (2 Credits)
            </>
          )}
        </Button>
      </form>

      {contentCalendar.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground">30-Day Content Calendar</h4>
            <Button 
              onClick={downloadPDF}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 max-h-[600px] overflow-y-auto pr-2">
            {contentCalendar.map((post, index) => (
              <Card key={index} className="p-4 border-l-4 border-secondary hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground">Day {post.day} - {post.date}</h5>
                        <p className="text-xs text-muted-foreground">{post.platform} • {post.contentType}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${post.caption}\n\n${post.hashtags.join(' ')}`)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Caption */}
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Caption:</Label>
                    <p className="text-sm text-foreground leading-relaxed mt-1">
                      {post.caption}
                    </p>
                  </div>

                  {/* Hashtags */}
                  <div className="flex flex-wrap gap-1">
                    {post.hashtags.map((hashtag, hashIndex) => (
                      <span
                        key={hashIndex}
                        className="inline-flex items-center gap-1 text-xs bg-secondary/10 text-secondary px-2 py-1 rounded"
                      >
                        <Hash className="h-3 w-3" />
                        {hashtag.replace('#', '')}
                      </span>
                    ))}
                  </div>

                  {/* Visual Suggestion */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {post.contentType.toLowerCase().includes('video') || 
                         post.contentType.toLowerCase().includes('reel') ? (
                          <Video className="h-4 w-4 text-secondary" />
                        ) : (
                          <Image className="h-4 w-4 text-secondary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs font-medium text-muted-foreground">Visual Suggestion:</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {post.visualSuggestion}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Best Time */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Best time to post: {post.bestTime}</span>
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