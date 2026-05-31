import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mic, Podcast, Download, Loader2, Plus, X, Zap } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import heroImage from "@/assets/hero-image.jpg";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ToolGuard } from '@/components/ToolGuard';
import { EmailResultsPrompt } from '@/components/EmailResultsPrompt';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SpeakIt = () => {
  const [selectedPath, setSelectedPath] = useState<'speaker' | 'podcaster'>('speaker');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Shared fields
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [brandTone, setBrandTone] = useState('');
  const [socialHandles, setSocialHandles] = useState('');
  const [website, setWebsite] = useState('');
  const [brandColors, setBrandColors] = useState(['', '', '']);
  const [hasProfessionalPhotos, setHasProfessionalPhotos] = useState('');
  const [qualifications, setQualifications] = useState('');

  // Speaker-specific fields
  const [speakingGoals, setSpeakingGoals] = useState<string[]>([]);
  const [speakingTopics, setSpeakingTopics] = useState([
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
  ]);
  const [targetVenues, setTargetVenues] = useState<string[]>([]);
  const [pricingLevel, setPricingLevel] = useState('');
  const [availability, setAvailability] = useState('');

  // Podcaster-specific fields
  const [podcastTitle, setPodcastTitle] = useState('');
  const [format, setFormat] = useState<string[]>([]);
  const [frequency, setFrequency] = useState('');
  const [episodeLength, setEpisodeLength] = useState('');
  const [hasGuestStrategy, setHasGuestStrategy] = useState('');
  const [topicPillars, setTopicPillars] = useState(['', '', '', '', '']);
  const [platforms, setPlatforms] = useState<string[]>([]);

  const handleGenerate = async () => {
    // Validate required fields
    if (!fullName || !niche || !targetAudience || !brandTone || !qualifications) {
      toast.error('Please fill in all required shared fields');
      return;
    }

    if (selectedPath === 'speaker') {
      if (speakingGoals.length === 0 || !pricingLevel || targetVenues.length === 0) {
        toast.error('Please complete all speaker-specific fields');
        return;
      }
      const validTopics = speakingTopics.filter(t => t.title && t.description);
      if (validTopics.length < 3) {
        toast.error('Please provide at least 3 speaking topics');
        return;
      }
    } else {
      if (!podcastTitle || !frequency || !episodeLength || platforms.length === 0) {
        toast.error('Please complete all podcaster-specific fields');
        return;
      }
      const validPillars = topicPillars.filter(p => p.trim());
      if (validPillars.length < 5) {
        toast.error('Please provide at least 5 topic pillars');
        return;
      }
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return;
      }

      const requestBody = {
        path: selectedPath,
        sharedData: {
          fullName,
          businessName,
          niche,
          targetAudience,
          brandTone,
          socialHandles,
          website,
          brandColors: brandColors.filter(c => c),
          hasProfessionalPhotos: hasProfessionalPhotos === 'yes',
          qualifications,
        },
        ...(selectedPath === 'speaker' ? {
          speakerData: {
            speakingGoals,
            speakingTopics: speakingTopics.filter(t => t.title && t.description),
            targetVenues,
            pricingLevel,
            availability,
          },
        } : {
          podcasterData: {
            podcastTitle,
            format,
            frequency,
            episodeLength,
            hasGuestStrategy: hasGuestStrategy === 'yes',
            topicPillars: topicPillars.filter(p => p.trim()),
            platforms,
          },
        }),
      };

      const response = await supabase.functions.invoke('speak-it', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      if (!response.data?.plan) throw new Error('No plan was returned. Please try again.');

      setGeneratedPlan(response.data.plan);
      setShowResults(true);
      toast.success(`${selectedPath === 'speaker' ? 'Speaking' : 'Podcast'} launch plan generated! (3 credits used)`);
    } catch (error: any) {
      console.error('Error generating plan:', error);
      toast.error(error.message || 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedPlan) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 72;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 40;

    // Cover page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `${selectedPath === 'speaker' ? 'Public Speaking' : 'Podcast'} Launch Plan`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    
    yPosition += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated for: ${fullName}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition = pageHeight - 30;
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);
    doc.text('⚠️ This file is not stored. Please download to save a copy.', pageWidth / 2, yPosition, { align: 'center' });

    // Content pages
    doc.addPage();
    yPosition = margin;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const lines = generatedPlan.split('\n');
    for (const line of lines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }

      if (line.startsWith('## ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        const wrappedTitle = doc.splitTextToSize(line.replace('## ', ''), maxWidth);
        doc.text(wrappedTitle, margin, yPosition);
        yPosition += wrappedTitle.length * 7 + 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      } else if (line.startsWith('# ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        const wrappedTitle = doc.splitTextToSize(line.replace('# ', ''), maxWidth);
        doc.text(wrappedTitle, margin, yPosition);
        yPosition += wrappedTitle.length * 8 + 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
      } else if (line.trim()) {
        const wrappedText = doc.splitTextToSize(line, maxWidth);
        doc.text(wrappedText, margin, yPosition);
        yPosition += wrappedText.length * 5 + 3;
      } else {
        yPosition += 5;
      }
    }

    // Add footers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated by PivotHub Speak It | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      if (i > 1) {
        doc.setTextColor(255, 0, 0);
        doc.text('⚠️ Not stored on server. Save this file.', pageWidth / 2, pageHeight - 15, { align: 'center' });
      }
    }

    doc.save(`${selectedPath}-launch-plan-${fullName.replace(/\s+/g, '-')}.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const addTopicField = () => {
    setSpeakingTopics([...speakingTopics, { title: '', description: '' }]);
  };

  const removeTopicField = (index: number) => {
    if (speakingTopics.length > 3) {
      setSpeakingTopics(speakingTopics.filter((_, i) => i !== index));
    }
  };

  const addPillarField = () => {
    setTopicPillars([...topicPillars, '']);
  };

  const removePillarField = (index: number) => {
    if (topicPillars.length > 5) {
      setTopicPillars(topicPillars.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <Helmet>
        <title>Speak It - Launch Your Voice | PivotHub</title>
        <meta name="description" content="Launch your public speaking career or podcast brand with professional guidance, media kits, and 90-day rollout strategies." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="py-20 bg-primary relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
          
          <div className="container mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
                <span className="text-3xl font-bold text-white tracking-wider">SPEAK IT</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
                Launch Your Voice
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto text-center" style={{ animationDelay: '0.2s' }}>
                Professional launch strategies for speakers and podcasters
              </p>
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                  onClick={() => document.getElementById('speak-content')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Your Journey
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <main id="speak-content" className="flex-grow container mx-auto px-4 py-12">
          {/* Credit Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="text-lg px-6 py-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              3 Credits
            </Badge>
          </div>

          {/* Path Toggle */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Choose Your Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button
                  variant={selectedPath === 'speaker' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedPath('speaker')}
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Public Speaking
                </Button>
                <Button
                  variant={selectedPath === 'podcaster' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedPath('podcaster')}
                >
                  <Podcast className="mr-2 h-5 w-5" />
                  Podcasting
                </Button>
              </div>
            </CardContent>
          </Card>

          {!showResults ? (
            <>
              {/* Shared Information */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Your Information</CardTitle>
                  <CardDescription>These details apply to both paths</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessName">Business Name (optional)</Label>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Your business or brand name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="niche">Niche or Focus Area *</Label>
                    <Input
                      id="niche"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                      placeholder="e.g., Leadership, Tech Innovation, Mental Health"
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetAudience">Target Audience *</Label>
                    <Input
                      id="targetAudience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      placeholder="Who do you want to reach?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brandTone">Brand Tone *</Label>
                    <Select value={brandTone} onValueChange={setBrandTone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="motivational">Motivational</SelectItem>
                        <SelectItem value="faith-based">Faith-based</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="socialHandles">Social Handles (optional)</Label>
                      <Input
                        id="socialHandles"
                        value={socialHandles}
                        onChange={(e) => setSocialHandles(e.target.value)}
                        placeholder="@yourhandle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website (optional)</Label>
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Brand Colors (up to 3 hex codes)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {brandColors.map((color, index) => (
                        <Input
                          key={index}
                          value={color}
                          onChange={(e) => {
                            const newColors = [...brandColors];
                            newColors[index] = e.target.value;
                            setBrandColors(newColors);
                          }}
                          placeholder="#000000"
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Professional Photos *</Label>
                    <RadioGroup value={hasProfessionalPhotos} onValueChange={setHasProfessionalPhotos}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="photos-yes" />
                        <Label htmlFor="photos-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="photos-no" />
                        <Label htmlFor="photos-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="qualifications">Qualifications & Background *</Label>
                    <Textarea
                      id="qualifications"
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      placeholder="Your credentials, experience, and expertise"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Speaker-Specific Fields */}
              {selectedPath === 'speaker' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Speaking Details</CardTitle>
                    <CardDescription>Tell us about your speaking goals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Speaking Goals *</Label>
                      <div className="space-y-2 mt-2">
                        {['Keynotes', 'Workshops', 'Trainings', 'Emcee'].map((goal) => (
                          <div key={goal} className="flex items-center space-x-2">
                            <Checkbox
                              checked={speakingGoals.includes(goal)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSpeakingGoals([...speakingGoals, goal]);
                                } else {
                                  setSpeakingGoals(speakingGoals.filter(g => g !== goal));
                                }
                              }}
                            />
                            <Label>{goal}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Speaking Topics (minimum 3) *</Label>
                      {speakingTopics.map((topic, index) => (
                        <div key={index} className="border rounded-lg p-4 mb-3 relative">
                          {speakingTopics.length > 3 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => removeTopicField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <div className="space-y-2">
                            <Input
                              placeholder="Topic Title"
                              value={topic.title}
                              onChange={(e) => {
                                const newTopics = [...speakingTopics];
                                newTopics[index].title = e.target.value;
                                setSpeakingTopics(newTopics);
                              }}
                            />
                            <Textarea
                              placeholder="Short description"
                              value={topic.description}
                              onChange={(e) => {
                                const newTopics = [...speakingTopics];
                                newTopics[index].description = e.target.value;
                                setSpeakingTopics(newTopics);
                              }}
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" onClick={addTopicField} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Topic
                      </Button>
                    </div>

                    <div>
                      <Label>Target Venues *</Label>
                      <div className="space-y-2 mt-2">
                        {['Schools', 'Prisons', 'Juvenile Programs', 'Ministries', 'Corporations', 'Universities', 'Associations', 'Conferences'].map((venue) => (
                          <div key={venue} className="flex items-center space-x-2">
                            <Checkbox
                              checked={targetVenues.includes(venue)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTargetVenues([...targetVenues, venue]);
                                } else {
                                  setTargetVenues(targetVenues.filter(v => v !== venue));
                                }
                              }}
                            />
                            <Label>{venue}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="pricingLevel">Pricing Level *</Label>
                      <Select value={pricingLevel} onValueChange={setPricingLevel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pricing level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="starter">Starter ($500-$2,000)</SelectItem>
                          <SelectItem value="standard">Standard ($2,000-$5,000)</SelectItem>
                          <SelectItem value="premium">Premium ($5,000+)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="availability">Availability</Label>
                      <Textarea
                        id="availability"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        placeholder="Your availability for speaking engagements"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Podcaster-Specific Fields */}
              {selectedPath === 'podcaster' && (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Podcast Details</CardTitle>
                    <CardDescription>Tell us about your podcast vision</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="podcastTitle">Podcast Title *</Label>
                      <Input
                        id="podcastTitle"
                        value={podcastTitle}
                        onChange={(e) => setPodcastTitle(e.target.value)}
                        placeholder="Your podcast name"
                      />
                    </div>

                    <div>
                      <Label>Format *</Label>
                      <div className="space-y-2 mt-2">
                        {['Audio', 'Video', 'Live Stream'].map((fmt) => (
                          <div key={fmt} className="flex items-center space-x-2">
                            <Checkbox
                              checked={format.includes(fmt)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormat([...format, fmt]);
                                } else {
                                  setFormat(format.filter(f => f !== fmt));
                                }
                              }}
                            />
                            <Label>{fmt}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="frequency">Frequency *</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Biweekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="episodeLength">Average Episode Length *</Label>
                        <Select value={episodeLength} onValueChange={setEpisodeLength}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15-30">15-30 minutes</SelectItem>
                            <SelectItem value="30-45">30-45 minutes</SelectItem>
                            <SelectItem value="45-60">45-60 minutes</SelectItem>
                            <SelectItem value="60+">60+ minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Guest Strategy *</Label>
                      <RadioGroup value={hasGuestStrategy} onValueChange={setHasGuestStrategy}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="guest-yes" />
                          <Label htmlFor="guest-yes">Yes, I plan to have guests</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="guest-no" />
                          <Label htmlFor="guest-no">No, solo episodes only</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>Topic Pillars (minimum 5) *</Label>
                      {topicPillars.map((pillar, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <Input
                            value={pillar}
                            onChange={(e) => {
                              const newPillars = [...topicPillars];
                              newPillars[index] = e.target.value;
                              setTopicPillars(newPillars);
                            }}
                            placeholder={`Topic pillar ${index + 1}`}
                          />
                          {topicPillars.length > 5 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePillarField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" onClick={addPillarField} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Pillar
                      </Button>
                    </div>

                    <div>
                      <Label>Preferred Platforms *</Label>
                      <div className="space-y-2 mt-2">
                        {[
                          'Spotify for Podcasters',
                          'Riverside.fm',
                          'Podbean',
                          'Spreaker',
                          'YouTube Podcasts',
                          'Kajabi Podcasts',
                        ].map((platform) => (
                          <div key={platform} className="flex items-center space-x-2">
                            <Checkbox
                              checked={platforms.includes(platform)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setPlatforms([...platforms, platform]);
                                } else {
                                  setPlatforms(platforms.filter(p => p !== platform));
                                }
                              }}
                            />
                            <Label>{platform}</Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Note: There's no one-size-fits-all platform. Research each option based on features, 
                        analytics, and monetization. Spotify for Podcasters is ideal for beginners—it's free, 
                        integrates with Riverside for recording, and distributes automatically.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generate Button */}
              <div className="text-center">
                <ToolGuard toolName="speak-it">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    size="lg"
                    className="px-8"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Your Plan...
                      </>
                    ) : (
                      <>
                        Generate My {selectedPath === 'speaker' ? 'Speaker' : 'Podcaster'} Launch Plan
                        <span className="ml-2 text-xs">(3 credits)</span>
                      </>
                    )}
                  </Button>
                </ToolGuard>
              </div>
            </>
          ) : (
            /* Results Section */
            <Card>
              <CardHeader>
                <CardTitle>Your {selectedPath === 'speaker' ? 'Speaking' : 'Podcast'} Launch Plan</CardTitle>
                <CardDescription>
                  Your comprehensive plan has been generated. Download the PDF to save your copy.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="prose prose-lg max-w-none bg-card p-6 rounded-lg text-foreground">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4 text-primary border-b-2 border-primary/20 pb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3 text-primary" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-4 mb-2 text-secondary" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-3 ml-4" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-3 ml-4" {...props} />,
                          li: ({node, ...props}) => <li className="my-1" {...props} />,
                          p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-accent pl-4 italic my-4" {...props} />,
                        }}
                      >
                        {generatedPlan}
                      </ReactMarkdown>
                    </div>
                  </div>

                <div className="flex gap-4">
                  <Button onClick={handleDownloadPDF} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResults(false);
                      setGeneratedPlan(null);
                    }}
                  >
                    Generate New Plan
                  </Button>
                </div>

                <EmailResultsPrompt
                  assessmentType="speak-it"
                  results={{ plan: generatedPlan }}
                />
              </CardContent>
            </Card>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default SpeakIt;
