import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Edit3,
  Copy,
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ResumeAnalysis {
  overallScore: number;
  issues: {
    category: 'language' | 'metrics' | 'formatting' | 'content';
    severity: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
    location: string;
  }[];
  improvedBulletPoints: {
    original: string;
    improved: string;
    explanation: string;
  }[];
  improvedSummary: {
    original: string;
    improved: string;
    explanation: string;
  };
}

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  generatedLetter: string;
  // New fields to prevent hallucinations
  yourName: string;
  relevantExperience: string;
  keyAchievements: string;
  whyCompany: string;
  relevantSkills: string;
  yearsExperience: string;
}

export const ResumeCoachLetter = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    generatedLetter: '',
    yourName: '',
    relevantExperience: '',
    keyAchievements: '',
    whyCompany: '',
    relevantSkills: '',
    yearsExperience: ''
  });
  const [loading, setLoading] = useState(false);
  const [showImproved, setShowImproved] = useState(false);
  const [improvedResume, setImprovedResume] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumeText(text);
          toast.success('Resume uploaded successfully');
        };
        reader.readAsText(file);
      } else {
        toast.error('Please upload a .txt file or paste your resume text');
      }
    }
  };

  // Analyze resume
  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please provide resume content');
      return;
    }

    setLoading(true);
    try {
      // Simulate AI analysis - in real implementation, this would call your AI service
      const mockAnalysis: ResumeAnalysis = {
        overallScore: 72,
        issues: [
          {
            category: 'language',
            severity: 'high',
            description: 'Passive language detected',
            suggestion: 'Use strong action verbs like "Led," "Achieved," "Implemented"',
            location: 'Professional Experience section'
          },
          {
            category: 'metrics',
            severity: 'high',
            description: 'Missing quantifiable results',
            suggestion: 'Add specific numbers, percentages, or metrics to show impact',
            location: 'Multiple bullet points'
          },
          {
            category: 'content',
            severity: 'medium',
            description: 'Generic job duties listed',
            suggestion: 'Focus on achievements and outcomes rather than daily tasks',
            location: 'Current role description'
          },
          {
            category: 'formatting',
            severity: 'low',
            description: 'Inconsistent tense usage',
            suggestion: 'Use past tense for previous roles, present tense for current role',
            location: 'Throughout document'
          }
        ],
        improvedBulletPoints: [
          {
            original: 'Responsible for managing social media accounts',
            improved: 'Managed 5 social media accounts, increasing engagement by 45% and follower growth by 2,300 over 6 months',
            explanation: 'Added specific metrics and quantified the impact of the work'
          },
          {
            original: 'Worked with team to complete projects',
            improved: 'Collaborated with cross-functional team of 8 members to deliver 12 projects on time, resulting in 15% increase in client satisfaction',
            explanation: 'Specified team size, project count, and measurable outcome'
          },
          {
            original: 'Helped customers with their problems',
            improved: 'Resolved 95% of customer inquiries within 24 hours, maintaining 4.8/5 customer satisfaction rating across 500+ interactions',
            explanation: 'Quantified resolution rate, timeframe, and customer satisfaction metrics'
          }
        ],
        improvedSummary: {
          original: 'Experienced professional with good communication skills and ability to work in teams.',
          improved: 'Results-driven Marketing Professional with 5+ years of experience driving 40% revenue growth through data-driven digital campaigns. Proven track record of leading cross-functional teams and delivering projects that exceed client expectations by 25%. Expert in social media strategy, content marketing, and performance analytics.',
          explanation: 'Added specific years of experience, quantified achievements, and relevant technical skills'
        }
      };

      setAnalysis(mockAnalysis);
      setActiveTab('analysis');
      toast.success('Resume analysis completed');
    } catch (error) {
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate cover letter
  const generateCoverLetter = async () => {
    if (!coverLetterData.jobTitle || !coverLetterData.companyName) {
      toast.error('Please provide job title and company name');
      return;
    }

    if (!coverLetterData.yourName) {
      toast.error('Please provide your name');
      return;
    }

    setLoading(true);
    try {
      // Generate cover letter using only provided information
      let letter = `Dear Hiring Manager,\n\n`;
      
      // Opening paragraph
      letter += `I am writing to express my interest in the ${coverLetterData.jobTitle} position at ${coverLetterData.companyName}.`;
      
      if (coverLetterData.yearsExperience) {
        letter += ` With ${coverLetterData.yearsExperience} of experience, I am excited about the opportunity to contribute to your team.`;
      } else {
        letter += ` I am excited about the opportunity to contribute to your team.`;
      }
      
      letter += `\n\n`;

      // Experience and achievements paragraph
      if (coverLetterData.relevantExperience || coverLetterData.keyAchievements) {
        if (coverLetterData.relevantExperience) {
          letter += `${coverLetterData.relevantExperience}`;
          if (coverLetterData.keyAchievements) {
            letter += ` ${coverLetterData.keyAchievements}`;
          }
          letter += `\n\n`;
        } else if (coverLetterData.keyAchievements) {
          letter += `${coverLetterData.keyAchievements}\n\n`;
        }
      }

      // Skills paragraph
      if (coverLetterData.relevantSkills) {
        letter += `My key skills include: ${coverLetterData.relevantSkills}\n\n`;
      }

      // Why company paragraph
      if (coverLetterData.whyCompany) {
        letter += `${coverLetterData.whyCompany}\n\n`;
      } else {
        letter += `I am particularly interested in ${coverLetterData.companyName} and would welcome the opportunity to discuss how I can contribute to your team's success.\n\n`;
      }

      // Closing
      letter += `Thank you for your consideration. I look forward to hearing from you.\n\n`;
      letter += `Sincerely,\n${coverLetterData.yourName}`;

      setCoverLetterData(prev => ({ ...prev, generatedLetter: letter }));
      toast.success('Cover letter generated successfully using your information');
    } catch (error) {
      toast.error('Failed to generate cover letter. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply improvements to resume
  const applyImprovements = () => {
    if (!analysis) return;

    let improved = resumeText;
    
    // Apply bullet point improvements
    analysis.improvedBulletPoints.forEach(item => {
      improved = improved.replace(item.original, item.improved);
    });

    // Apply summary improvement
    if (analysis.improvedSummary.original) {
      improved = improved.replace(analysis.improvedSummary.original, analysis.improvedSummary.improved);
    }

    setImprovedResume(improved);
    setShowImproved(true);
    toast.success('Improvements applied to resume');
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Download Resume Guide as PDF
  const downloadResumeGuidePDF = () => {
    if (!analysis) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPos = margin;

    const addFooter = (pageNum: number) => {
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('Resume Optimization Guide - PivotHub Professional Career Services', pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    const checkPageBreak = (spaceNeeded: number) => {
      if (yPos + spaceNeeded > pageHeight - 25) {
        addFooter(doc.getNumberOfPages());
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(0);
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      
      for (const line of lines) {
        checkPageBreak(fontSize * 0.5);
        doc.text(line, margin, yPos);
        yPos += fontSize * 0.5;
      }
    };

    // Cover Page
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 100, 'F');
    doc.setTextColor(255);
    doc.setFontSize(28);
    doc.text('RESUME OPTIMIZATION GUIDE', pageWidth / 2, 40, { align: 'center' });
    doc.setFontSize(18);
    doc.text('Professional Career Services', pageWidth / 2, 60, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 80, { align: 'center' });
    doc.text(`Overall Score: ${analysis.overallScore}/100`, pageWidth / 2, 95, { align: 'center' });

    addFooter(1);

    // Analysis Results
    doc.addPage();
    yPos = margin;
    
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.text('RESUME ANALYSIS RESULTS', pageWidth / 2, 13, { align: 'center' });
    yPos = 30;

    doc.setTextColor(0);
    addText(`Overall Score: ${analysis.overallScore}/100`, 14, true);
    yPos += 5;

    analysis.issues.forEach((issue, index) => {
      checkPageBreak(30);
      yPos += 5;
      addText(`${index + 1}. ${issue.category.toUpperCase()} (${issue.severity})`, 12, true);
      addText(`Issue: ${issue.description}`, 10);
      addText(`Suggestion: ${issue.suggestion}`, 10);
      addText(`Location: ${issue.location}`, 9);
      yPos += 5;
    });

    // Improvements
    doc.addPage();
    yPos = margin;
    
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 20, 'F');
    doc.setTextColor(255);
    doc.setFontSize(16);
    doc.text('RECOMMENDED IMPROVEMENTS', pageWidth / 2, 13, { align: 'center' });
    yPos = 30;

    doc.setTextColor(0);
    analysis.improvedBulletPoints.forEach((item, index) => {
      checkPageBreak(40);
      yPos += 5;
      addText(`Example ${index + 1}:`, 12, true);
      addText(`Before: ${item.original}`, 10);
      addText(`After: ${item.improved}`, 10, true);
      addText(`Why: ${item.explanation}`, 9);
      yPos += 5;
    });

    // Improved Summary
    if (analysis.improvedSummary) {
      checkPageBreak(50);
      yPos += 10;
      addText('PROFESSIONAL SUMMARY UPGRADE:', 12, true);
      yPos += 5;
      addText(`Before: ${analysis.improvedSummary.original}`, 10);
      yPos += 5;
      addText(`After: ${analysis.improvedSummary.improved}`, 10, true);
      yPos += 5;
      addText(`Explanation: ${analysis.improvedSummary.explanation}`, 9);
    }

    addFooter(doc.getNumberOfPages());

    doc.save(`resume-optimization-guide-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast.success('PDF Downloaded! Your resume optimization guide has been saved.');
  };

  // Download functionality (mock)
  const downloadDocument = (content: string, filename: string, format: 'pdf' | 'docx') => {
    // In real implementation, this would convert to PDF/DOCX
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format === 'pdf' ? 'pdf' : 'docx'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded as ${format.toUpperCase()}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Resume</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="improved">Improved Resume</TabsTrigger>
          <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">📄 Resume & Cover Letter Optimization</h3>
                <p className="text-muted-foreground mb-6">
                  Get expert analysis from a professional with 15+ years in HR and recruiting. Transform job duties into results-oriented achievements that command attention and bypass AI filters. Download your optimization guide as PDF.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload your resume (.txt file)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Paste Resume Text</label>
                  <Textarea
                    placeholder="Paste your resume content here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={12}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">What we'll analyze:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Language & Tone</h5>
                      <p className="text-sm text-muted-foreground">Action verbs, passive voice, and professional language</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Metrics & Results</h5>
                      <p className="text-sm text-muted-foreground">Quantifiable achievements and impact measurements</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Content Quality</h5>
                      <p className="text-sm text-muted-foreground">Achievements vs. duties, relevance, and clarity</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Edit3 className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium">Formatting</h5>
                      <p className="text-sm text-muted-foreground">Consistency, tense usage, and structure</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={analyzeResume} 
                disabled={loading || !resumeText.trim()}
                className="w-full"
              >
                {loading ? 'Analyzing Resume...' : 'Analyze My Resume'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {analysis ? (
            <div className="space-y-6">
              {/* Overall Score */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Resume Analysis Results</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-bold text-primary">{analysis.overallScore}/100</span>
                    <Badge variant={analysis.overallScore >= 80 ? 'default' : analysis.overallScore >= 60 ? 'secondary' : 'destructive'}>
                      {analysis.overallScore >= 80 ? 'Excellent' : analysis.overallScore >= 60 ? 'Good' : 'Needs Work'}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.overallScore}%` }}
                  ></div>
                </div>
              </Card>

              {/* Issues & Recommendations */}
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Issues & Recommendations</h4>
                <div className="space-y-4">
                  {analysis.issues.map((issue, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium capitalize">{issue.category}</span>
                        </div>
                        <Badge variant="outline" className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{issue.description}</p>
                      <p className="text-sm font-medium">Suggestion: {issue.suggestion}</p>
                      <p className="text-xs text-muted-foreground mt-1">Location: {issue.location}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Before & After Examples */}
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Improved Bullet Points</h4>
                <div className="space-y-6">
                  {analysis.improvedBulletPoints.map((item, index) => (
                    <div key={index} className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-red-600">Before</h5>
                          <p className="text-sm p-3 bg-red-50 border border-red-200 rounded">{item.original}</p>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-green-600">After</h5>
                          <p className="text-sm p-3 bg-green-50 border border-green-200 rounded">{item.improved}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                        <strong>Why this works:</strong> {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Professional Summary Improvement */}
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Improved Professional Summary</h4>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-red-600">Original Summary</h5>
                      <p className="text-sm p-3 bg-red-50 border border-red-200 rounded">{analysis.improvedSummary.original}</p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-green-600">Improved Summary</h5>
                      <p className="text-sm p-3 bg-green-50 border border-green-200 rounded">{analysis.improvedSummary.improved}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>Improvement rationale:</strong> {analysis.improvedSummary.explanation}
                  </p>
                </div>
              </Card>

              <div className="flex gap-3 mt-6">
                <Button onClick={downloadResumeGuidePDF} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Guide
                </Button>
                <Button onClick={applyImprovements} variant="outline" className="flex-1">
                  Apply All Improvements to Resume
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
              <p className="text-muted-foreground mb-4">
                Upload and analyze your resume first to see detailed feedback.
              </p>
              <Button onClick={() => setActiveTab('upload')}>
                Upload Resume
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Improved Resume Tab */}
        <TabsContent value="improved" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Improved Resume</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImproved(!showImproved)}
                  >
                    {showImproved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showImproved ? 'Show Original' : 'Show Improved'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(showImproved ? improvedResume : resumeText)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={showImproved ? 'default' : 'secondary'}>
                    {showImproved ? 'Improved Version' : 'Original Version'}
                  </Badge>
                  {showImproved && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Optimized
                    </Badge>
                  )}
                </div>
                
                <Textarea
                  value={showImproved ? improvedResume : resumeText}
                  onChange={(e) => {
                    if (showImproved) {
                      setImprovedResume(e.target.value);
                    } else {
                      setResumeText(e.target.value);
                    }
                  }}
                  rows={20}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={() => downloadDocument(showImproved ? improvedResume : resumeText, 'resume', 'pdf')}
                  disabled={!resumeText}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => downloadDocument(showImproved ? improvedResume : resumeText, 'resume', 'docx')}
                  disabled={!resumeText}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Download DOCX
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Cover Letter Tab */}
        <TabsContent value="cover-letter" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Generate Custom Cover Letter</h3>
                <p className="text-muted-foreground mb-4">
                  Create a personalized cover letter based on your improved resume and the specific job you're applying for.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-2">Why We Need Your Specific Details</h4>
                      <p className="text-sm text-blue-800">
                        To avoid generating fake achievements or experiences you don't have, we need you to provide your actual background. 
                        The AI will only use the information you provide - no made-up metrics or accomplishments will be added.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Name *</label>
                    <Input
                      placeholder="Your full name"
                      value={coverLetterData.yourName}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, yourName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Title *</label>
                    <Input
                      placeholder="e.g., Senior Marketing Manager"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company Name *</label>
                    <Input
                      placeholder="e.g., TechCorp Industries"
                      value={coverLetterData.companyName}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Years of Experience</label>
                    <Input
                      placeholder="e.g., 5+ years, 2 years"
                      value={coverLetterData.yearsExperience}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, yearsExperience: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Description (Optional)</label>
                    <Textarea
                      placeholder="Paste the job description to create a more targeted cover letter..."
                      value={coverLetterData.jobDescription}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobDescription: e.target.value }))}
                      rows={6}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Relevant Experience</label>
                    <Textarea
                      placeholder="Describe your relevant work experience, roles, and responsibilities that relate to this position..."
                      value={coverLetterData.relevantExperience}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, relevantExperience: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Key Achievements</label>
                    <Textarea
                      placeholder="List your specific achievements, metrics, and accomplishments. Use exact numbers and results..."
                      value={coverLetterData.keyAchievements}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, keyAchievements: e.target.value }))}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Relevant Skills</label>
                    <Textarea
                      placeholder="List your key skills, technologies, certifications that match the job requirements..."
                      value={coverLetterData.relevantSkills}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, relevantSkills: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Why This Company?</label>
                    <Textarea
                      placeholder="Explain why you're interested in this company specifically. Research the company and mention specific reasons..."
                      value={coverLetterData.whyCompany}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, whyCompany: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={generateCoverLetter} 
                disabled={loading || !coverLetterData.jobTitle || !coverLetterData.companyName || !coverLetterData.yourName}
                className="w-full"
              >
                {loading ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
              </Button>

              {coverLetterData.generatedLetter && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Generated Cover Letter</h4>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(coverLetterData.generatedLetter)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCoverLetterData(prev => ({ ...prev, generatedLetter: '' }))}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    value={coverLetterData.generatedLetter}
                    onChange={(e) => setCoverLetterData(prev => ({ ...prev, generatedLetter: e.target.value }))}
                    rows={15}
                    className="font-mono text-xs"
                  />

                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => downloadDocument(coverLetterData.generatedLetter, 'cover-letter', 'pdf')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => downloadDocument(coverLetterData.generatedLetter, 'cover-letter', 'docx')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download DOCX
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};