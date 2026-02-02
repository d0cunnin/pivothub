import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Download, Loader2, Zap, AlertTriangle, ScrollText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import heroImage from "@/assets/hero-image.jpg";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ToolGuard } from '@/components/ToolGuard';
import jsPDF from 'jspdf';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

const StudyIt = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Form field
  const [topic, setTopic] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a biblical topic');
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to continue');
        return;
      }

      const response = await supabase.functions.invoke('study-it', {
        body: { topic: topic.trim() },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;

      setGeneratedContent(response.data.content);
      setShowResults(true);
      // Initialize all sections as expanded
      setExpandedSections({
        'definition': true,
        'etymology': true,
        'strongs': true,
        'oldTestament': true,
        'newTestament': true,
      });
      toast.success('Biblical reference generated! (2 credits used)');
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!generatedContent) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 40;

    // Cover page
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Biblical Reference', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text(topic, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Reference-only material. No commentary or interpretation.', pageWidth / 2, yPosition, { align: 'center' });
    
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

    const lines = generatedContent.split('\n');
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
      } else if (line.startsWith('### ')) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        const wrappedTitle = doc.splitTextToSize(line.replace('### ', ''), maxWidth);
        doc.text(wrappedTitle, margin, yPosition);
        yPosition += wrappedTitle.length * 6 + 4;
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
        `Generated by PivotHub Study It | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      if (i > 1) {
        doc.setTextColor(255, 0, 0);
        doc.text('⚠️ Not stored on server. Save this file.', pageWidth / 2, pageHeight - 15, { align: 'center' });
      }
    }

    doc.save(`${topic.replace(/\s+/g, '-')}-biblical-reference.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const resetForm = () => {
    setShowResults(false);
    setGeneratedContent(null);
    setTopic('');
  };

  // Parse sections from markdown
  const parseSections = (content: string) => {
    const sections: { title: string; key: string; content: string }[] = [];
    const regex = /## (\d+\.\s+)?([^\n]+)\n([\s\S]*?)(?=## \d|$)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const title = match[2].trim();
      const sectionContent = match[3].trim();
      const key = title.toLowerCase().replace(/\s+/g, '-');
      sections.push({ title, key, content: sectionContent });
    }
    
    return sections;
  };

  return (
    <>
      <Helmet>
        <title>Study It - Biblical Reference Tool | PivotHub</title>
        <meta name="description" content="A structured, reference-only biblical breakdown for study, teaching preparation, and academic review. Definitions, etymology, Strong's Concordance, and scripture references." />
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
                <BookOpen className="h-8 w-8 text-white mr-3" />
                <span className="text-3xl font-bold text-white tracking-wider">STUDY IT</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up text-center">
                Biblical Reference Tool
              </h1>
              <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 font-light leading-relaxed animate-fade-in max-w-4xl mx-auto text-center" style={{ animationDelay: '0.2s' }}>
                Biblical reference. Original language. Scripture only.
              </p>
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="shadow-glow transition-elegant hover:scale-105 px-12 py-6 text-lg"
                  onClick={() => document.getElementById('study-content')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Studying
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <main id="study-content" className="flex-grow container mx-auto px-4 py-12">
          {/* Credit Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="text-lg px-6 py-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              2 Credits
            </Badge>
          </div>

          {/* Description Notice */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-muted/50 border border-border">
              <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Reference Only — No Commentary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  STUDY IT provides <strong className="text-foreground">factual, structured reference material</strong> for biblical topics. This includes definitions, original language etymology, Strong's Concordance entries, and scripture references. 
                  <br /><br />
                  <strong className="text-foreground">This tool does NOT:</strong> preach, interpret, teach, apply, or provide commentary. It exists solely to present biblical reference data in a neutral, academic format for study, teaching preparation, and research.
                </p>
              </div>
            </div>
          </div>

          <ToolGuard toolName="study-it">
            {!showResults ? (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ScrollText className="h-5 w-5" />
                    Biblical Topic
                  </CardTitle>
                  <CardDescription>Enter a single word or short phrase to study</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="topic">Topic *</Label>
                    <Input
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Faith, Grace, Repentance, Kingdom of God"
                      className="mt-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isGenerating) {
                          handleGenerate();
                        }
                      }}
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Enter a biblical concept, word, or short phrase for structured reference.
                    </p>
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !topic.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Reference...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Generate Biblical Reference
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button onClick={resetForm} variant="secondary">
                    Study Another Topic
                  </Button>
                </div>

                {/* Results Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Biblical Reference: {topic}
                    </CardTitle>
                    <CardDescription>
                      Reference-only material. No preaching, commentary, or interpretation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedContent && parseSections(generatedContent).map((section) => (
                      <Collapsible 
                        key={section.key}
                        open={expandedSections[section.key] !== false}
                        onOpenChange={() => toggleSection(section.key)}
                        className="mb-4"
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                          <h3 className="font-semibold text-left">{section.title}</h3>
                          {expandedSections[section.key] !== false ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 border-x border-b rounded-b-lg">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {section.content}
                            </ReactMarkdown>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </ToolGuard>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default StudyIt;
