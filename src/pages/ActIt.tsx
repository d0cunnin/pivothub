import { useState } from 'react';
import { WhatYouGet } from "@/components/tool-layout/WhatYouGet";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Clapperboard, Download, Loader2, Zap, Film, Theater, Tv, Play, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import heroImage from "@/assets/hero-image.jpg";
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from "@/lib/invokeFunction";
import { toast } from 'sonner';
import { ToolGuard } from '@/components/ToolGuard';
import { PdfWriter, MUTED } from '@/lib/pdfWriter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

const GENRES = [
  'Comedy', 'Drama', 'Thriller', 'Horror', 'Sci-Fi', 'Futuristic', 
  'Dystopian', 'Fantasy', 'Romance', 'Mystery', 'Action', 'Faith-based', 'Experimental'
];

const FORMATS = [
  { value: 'stage-play', label: 'Stage Play' },
  { value: 'film-feature', label: 'Film (Feature Length)' },
  { value: 'short-film', label: 'Short Film' },
  { value: 'web-series', label: 'Web Series' },
  { value: 'one-act-play', label: 'One-Act Play' },
  { value: 'skit-scene', label: 'Skit / Scene' },
];

const TARGET_AUDIENCES = ['Youth', 'Adult', 'Family', 'General Audience'];
const TONES = ['Light', 'Dark', 'Hopeful', 'Gritty', 'Inspirational', 'Suspenseful'];
const TIME_PERIODS = ['Past', 'Present', 'Future', 'Timeless'];
const SETTINGS = ['Urban', 'Rural', 'International', 'Fictional World'];
const LENGTHS = ['Short', 'Medium', 'Full-length'];

const ActIt = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConcept, setGeneratedConcept] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Required fields
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [format, setFormat] = useState('');

  // Optional fields
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState('');
  const [timePeriod, setTimePeriod] = useState('');
  const [settingPreference, setSettingPreference] = useState('');
  const [centralTheme, setCentralTheme] = useState('');
  const [hasFaithElements, setHasFaithElements] = useState(false);
  const [faithElementsDetails, setFaithElementsDetails] = useState('');
  const [lengthPreference, setLengthPreference] = useState('');

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGenerate = async () => {
    if (!projectTitle.trim()) {
      toast.error('Please enter a project title');
      return;
    }
    if (selectedGenres.length === 0) {
      toast.error('Please select at least one genre');
      return;
    }
    if (!format) {
      toast.error('Please select a format');
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return;
      }

      const requestBody = {
        projectTitle,
        genres: selectedGenres,
        format,
        targetAudience: targetAudience || undefined,
        tone: tone || undefined,
        timePeriod: timePeriod || undefined,
        settingPreference: settingPreference || undefined,
        centralTheme: centralTheme || undefined,
        hasFaithElements,
        faithElementsDetails: hasFaithElements ? faithElementsDetails : undefined,
        lengthPreference: lengthPreference || undefined,
      };

      const { data, error } = await invokeFunction('act-it', {
        body: requestBody,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.concept) throw new Error('No story concept was returned. Please try again.');

      setGeneratedConcept(data.concept);
      setShowResults(true);
      // Initialize all sections as expanded
      setExpandedSections({
        'concept': true,
        'genre': true,
        'setting': true,
        'characters': true,
        'background': true,
        'plot': true,
        'themes': true,
        'notes': true,
        'expansion': true,
      });
      toast.success('Story concept generated! (3 credits used)');
    } catch (error: any) {
      console.error('Error generating concept:', error);
      toast.error(error.message || 'Failed to generate concept');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedConcept) return;

    const formatLabel = FORMATS.find(f => f.value === format)?.label || format;
    const w = new PdfWriter();
    w.header(projectTitle || 'Story Concept', `Story Concept  ·  ${formatLabel}  ·  ${selectedGenres.join(', ')}`);
    w.text('PivotHub does not store this file. Keep this download to save your concept.', { size: 8.5, color: MUTED, after: 6 });
    w.markdown(generatedConcept);
    w.footer('Generated by PivotHub Act It');

    w.doc.save(`${projectTitle.replace(/\s+/g, '-')}-story-concept.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const resetForm = () => {
    setShowResults(false);
    setGeneratedConcept(null);
    setProjectTitle('');
    setSelectedGenres([]);
    setFormat('');
    setTargetAudience('');
    setTone('');
    setTimePeriod('');
    setSettingPreference('');
    setCentralTheme('');
    setHasFaithElements(false);
    setFaithElementsDetails('');
    setLengthPreference('');
  };

  return (
    <>
      <Helmet>
        <title>Act It - Story Studio for Film, Stage & Web | PivotHub</title>
        <meta name="description" content="Story Studio for screenwriters and playwrights. Turn a logline into a structured story concept with character profiles, plot outline, and production notes for film, stage, or web series." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="py-20 bg-primary relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80"></div>
          </div>
          
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
          <div className="absolute top-10 right-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 bg-accent/15 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/20 rounded-full blur-md"></div>
          
          <div className="container mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-white/15 mb-8 shadow-glow backdrop-blur-sm animate-fade-in-scale border border-white/20">
                <Clapperboard className="h-8 w-8 text-white mr-3" />
                <span className="text-3xl font-bold text-white tracking-wider">ACT IT — STORY STUDIO</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
                Story Studio for Screen & Stage
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto text-center" style={{ animationDelay: '0.2s' }}>
                Turn a logline into a complete story package — concept, characters, plot outline, and production notes for film, stage, or web series. (Outline, not a full script.)
              </p>
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                  onClick={() => document.getElementById('act-content')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Creating
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <main id="act-content" className="flex-grow container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <WhatYouGet heading="Your story package" items={[
              { icon: Clapperboard, name: "Story concept", description: "A logline and concept brief that captures your idea." },
              { icon: Theater, name: "Characters & plot", description: "Character profiles and a plot outline you can build a script from." },
              { icon: Download, name: "PDF to keep", description: "Download your story package as a PDF for pitches or planning." },
            ]} />
          </div>

          {/* Description Notice */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-muted/50 border border-border">
              <FileText className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">What You'll Get</h3>
                <p className="text-muted-foreground leading-relaxed">
                  ACT IT generates a professional story development package including concept briefs, character profiles, plot outlines, and production notes. This tool creates a <strong className="text-foreground">structured outline and concept</strong> — not a full script. Use your results as a foundation for scriptwriting, pitches, or production planning.
                </p>
              </div>
            </div>
          </div>

          <ToolGuard toolName="act-it">
            {!showResults ? (
              <>
                {/* Required Fields */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Film className="h-5 w-5" />
                      Project Details
                    </CardTitle>
                    <CardDescription>Required information for your story concept</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label htmlFor="projectTitle">Project Title (or Working Title) *</Label>
                      <Input
                        id="projectTitle"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        placeholder="Enter your project title"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="mb-3 block">Genre (Select one or more) *</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {GENRES.map((genre) => (
                          <div
                            key={genre}
                            className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedGenres.includes(genre)
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => toggleGenre(genre)}
                          >
                            <Checkbox
                              checked={selectedGenres.includes(genre)}
                              onCheckedChange={() => toggleGenre(genre)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm">{genre}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="format">Format *</Label>
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Optional Fields */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Theater className="h-5 w-5" />
                      Optional Details
                    </CardTitle>
                    <CardDescription>Provide additional context for a more tailored concept</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Target Audience</Label>
                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select audience" />
                          </SelectTrigger>
                          <SelectContent>
                            {TARGET_AUDIENCES.map((audience) => (
                              <SelectItem key={audience} value={audience.toLowerCase()}>
                                {audience}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Tone</Label>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                          <SelectContent>
                            {TONES.map((t) => (
                              <SelectItem key={t} value={t.toLowerCase()}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Time Period</Label>
                        <Select value={timePeriod} onValueChange={setTimePeriod}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select time period" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_PERIODS.map((period) => (
                              <SelectItem key={period} value={period.toLowerCase()}>
                                {period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Setting Preference</Label>
                        <Select value={settingPreference} onValueChange={setSettingPreference}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select setting" />
                          </SelectTrigger>
                          <SelectContent>
                            {SETTINGS.map((setting) => (
                              <SelectItem key={setting} value={setting.toLowerCase()}>
                                {setting}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="centralTheme">Central Theme or Message</Label>
                      <Textarea
                        id="centralTheme"
                        value={centralTheme}
                        onChange={(e) => setCentralTheme(e.target.value)}
                        placeholder="What core idea or message should the story explore?"
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 rounded-lg border">
                          <div>
                            <Label>Faith or Cultural Elements</Label>
                            <p className="text-sm text-muted-foreground">Include faith-based or cultural themes</p>
                          </div>
                          <Switch
                            checked={hasFaithElements}
                            onCheckedChange={setHasFaithElements}
                          />
                        </div>
                        {hasFaithElements && (
                          <div className="pl-2">
                            <Label htmlFor="faithElementsDetails">Specify Faith or Cultural Elements</Label>
                            <Input
                              id="faithElementsDetails"
                              value={faithElementsDetails}
                              onChange={(e) => setFaithElementsDetails(e.target.value)}
                              placeholder="e.g., Christian themes, African diaspora culture, Buddhist philosophy, Latino heritage..."
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <Label>Length Preference</Label>
                        <Select value={lengthPreference} onValueChange={setLengthPreference}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select length" />
                          </SelectTrigger>
                          <SelectContent>
                            {LENGTHS.map((length) => (
                              <SelectItem key={length} value={length.toLowerCase()}>
                                {length}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Generate Button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="px-12 py-6 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Story Concept...
                      </>
                    ) : (
                      <>
                        <Clapperboard className="mr-2 h-5 w-5" />
                        Generate Story Concept (3 Credits)
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Results Section */}
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {projectTitle}
                        </CardTitle>
                        <CardDescription>
                          {FORMATS.find(f => f.value === format)?.label} • {selectedGenres.join(', ')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleDownloadPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          Create New
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {generatedConcept || ''}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>

              </>
            )}
          </ToolGuard>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default ActIt;
