import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  FileDown,
  Zap,
  Target,
  Award,
  BarChart3,
  Lightbulb,
  Brain,
  Wand2,
  Star,
  Users,
  Calendar,
  Mail
} from 'lucide-react';

interface ResumeAnalysis {
  overallScore: number;
  categories: {
    name: string;
    score: number;
    issues: ResumeIssue[];
  }[];
  atsScore: number;
  keywordMatching: number;
  readabilityScore: number;
  professionalFormatting: number;
}

interface ResumeIssue {
  category: 'language' | 'metrics' | 'formatting' | 'content' | 'ats' | 'keywords';
  severity: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  location: string;
  example?: string;
}

interface ResumeImprovement {
  section: string;
  original: string;
  improved: string;
  explanation: string;
  impact: 'high' | 'medium' | 'low';
}

interface CoverLetterData {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  generatedLetter: string;
  tone: 'professional' | 'enthusiastic' | 'confident';
  format: 'standard' | 'modern' | 'executive';
  // New fields to prevent hallucinations
  yourName: string;
  relevantExperience: string;
  keyAchievements: string;
  whyCompany: string;
  relevantSkills: string;
  yearsExperience: string;
}

export const EnhancedResumeCoach = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [improvements, setImprovements] = useState<ResumeImprovement[]>([]);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    generatedLetter: '',
    tone: 'professional',
    format: 'standard',
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
  const [jobMatchScore, setJobMatchScore] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock analytics data
  const mockAnalytics = {
    resumesAnalyzed: 12,
    averageImprovement: 34,
    topWeakness: 'Missing quantifiable results',
    strongestArea: 'Professional experience'
  };

  // Handle file upload with multiple format support
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumeText(text);
          toast.success('Resume uploaded successfully');
        };
        reader.readAsText(file);
      } else {
        toast.error('Please upload a .txt, .pdf, or .docx file');
      }
    }
  };

  // Enhanced AI resume analysis
  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast.error('Please provide resume content');
      return;
    }

    setLoading(true);
    try {
      // In production, this would call a real AI service
      const mockAnalysis: ResumeAnalysis = {
        overallScore: 73,
        atsScore: 68,
        keywordMatching: 45,
        readabilityScore: 82,
        professionalFormatting: 77,
        categories: [
          {
            name: 'Professional Summary',
            score: 65,
            issues: [
              {
                category: 'content',
                severity: 'high',
                description: 'Generic summary lacks specific achievements',
                suggestion: 'Include 2-3 quantified accomplishments',
                location: 'Summary section',
                example: 'Results-driven professional with 5+ years driving 40% revenue growth'
              }
            ]
          },
          {
            name: 'Work Experience', 
            score: 78,
            issues: [
              {
                category: 'metrics',
                severity: 'high',
                description: 'Missing quantifiable results',
                suggestion: 'Add numbers, percentages, dollar amounts',
                location: 'Multiple bullet points',
                example: 'Managed social media accounts → Managed 5 social media accounts, increasing engagement by 45%'
              },
              {
                category: 'language',
                severity: 'medium',
                description: 'Passive language in descriptions',
                suggestion: 'Use strong action verbs',
                location: 'Job descriptions',
                example: 'Led, Achieved, Implemented, Optimized'
              }
            ]
          },
          {
            name: 'Skills & Keywords',
            score: 58,
            issues: [
              {
                category: 'keywords',
                severity: 'high',
                description: 'Missing industry keywords',
                suggestion: 'Include relevant technical skills and buzzwords',
                location: 'Skills section',
                example: 'Add specific technologies, certifications, methodologies'
              }
            ]
          }
        ]
      };

      const mockImprovements: ResumeImprovement[] = [
        {
          section: 'Professional Summary',
          original: 'Experienced marketing professional with good communication skills.',
          improved: 'Results-driven Marketing Professional with 5+ years driving 40% revenue growth through data-driven digital campaigns. Proven track record leading cross-functional teams and delivering projects exceeding client expectations by 25%.',
          explanation: 'Added specific metrics, quantified achievements, and relevant skills',
          impact: 'high'
        },
        {
          section: 'Work Experience',
          original: 'Managed social media accounts for various clients',
          improved: 'Managed 5 social media accounts, increasing engagement by 45% and follower growth by 2,300 over 6 months while maintaining 4.8/5 client satisfaction rating',
          explanation: 'Quantified all achievements and added measurable outcomes',
          impact: 'high'
        },
        {
          section: 'Skills',
          original: 'Marketing, Communication, Social Media',
          improved: 'Digital Marketing Strategy • SEO/SEM • Google Analytics • Social Media Management • Content Marketing • A/B Testing • CRM (Salesforce, HubSpot) • Marketing Automation',
          explanation: 'Expanded with specific technical skills and tools',
          impact: 'medium'
        }
      ];

      setAnalysis(mockAnalysis);
      setImprovements(mockImprovements);
      setActiveTab('analysis');
      toast.success('AI analysis completed with detailed insights');
    } catch (error) {
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // AI-powered job matching
  const analyzeJobMatch = async (jobDescription: string) => {
    if (!resumeText || !jobDescription) return;

    setLoading(true);
    try {
      // Simulate AI job matching analysis
      const matchScore = Math.floor(Math.random() * 30) + 60; // 60-90%
      setJobMatchScore(matchScore);
      
      toast.success(`Job match analysis: ${matchScore}% compatibility`);
    } catch (error) {
      toast.error('Failed to analyze job match');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI cover letter
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
      const toneMap = {
        professional: 'formal and respectful',
        enthusiastic: 'energetic and passionate', 
        confident: 'assertive and accomplished'
      };

      // Build the cover letter using only provided information
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

  // Apply all AI improvements
  const applyAllImprovements = () => {
    if (!improvements.length) return;

    let improved = resumeText;
    
    improvements.forEach(improvement => {
      improved = improved.replace(improvement.original, improvement.improved);
    });

    setImprovedResume(improved);
    setShowImproved(true);
    toast.success('All AI improvements applied to resume');
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="improvements">AI Improvements</TabsTrigger>
          <TabsTrigger value="job-match">Job Match</TabsTrigger>
          <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resumes Analyzed</CardTitle>
                <FileText className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockAnalytics.resumesAnalyzed}</div>
                <p className="text-xs text-muted-foreground">Total reviews</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
                <TrendingUp className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+{mockAnalytics.averageImprovement}%</div>
                <p className="text-xs text-muted-foreground">Score increase</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Score</CardTitle>
                <Award className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis?.overallScore || 0}/100</div>
                <p className="text-xs text-muted-foreground">Latest analysis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
                <Target className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analysis?.atsScore || 0}%</div>
                <p className="text-xs text-muted-foreground">ATS compatibility</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with AI-powered resume optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab('upload')}>
                  <Upload className="h-6 w-6 mb-2" />
                  Upload Resume
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab('analysis')}>
                  <Brain className="h-6 w-6 mb-2" />
                  AI Analysis
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab('job-match')}>
                  <Target className="h-6 w-6 mb-2" />
                  Job Matching
                </Button>
                <Button variant="outline" className="h-20 flex-col" onClick={() => setActiveTab('cover-letter')}>
                  <Mail className="h-6 w-6 mb-2" />
                  Cover Letter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Analysis */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Analysis Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.overallScore}/100</div>
                    <div className="text-sm text-muted-foreground">Overall</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.atsScore}%</div>
                    <div className="text-sm text-muted-foreground">ATS</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.keywordMatching}%</div>
                    <div className="text-sm text-muted-foreground">Keywords</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.readabilityScore}%</div>
                    <div className="text-sm text-muted-foreground">Readability</div>
                  </div>
                </div>
                <Button onClick={() => setActiveTab('improvements')} className="w-full bg-gradient-primary">
                  View AI Improvements
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Enhanced Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Resume Analysis
              </CardTitle>
              <CardDescription>
                Upload your resume for comprehensive AI analysis and professional optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 text-center bg-gradient-subtle">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-medium mb-2">Upload Your Resume</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports .pdf, .docx, and .txt formats
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-primary"
                    >
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="outline">or</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Paste Resume Content</label>
                  <Textarea
                    placeholder="Paste your resume text here for instant analysis..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* AI Analysis Features */}
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    AI Analysis Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium">ATS Optimization</h5>
                          <p className="text-sm text-muted-foreground">Ensure your resume passes applicant tracking systems</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium">Performance Metrics</h5>
                          <p className="text-sm text-muted-foreground">Quantify achievements and add missing metrics</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Target className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium">Keyword Optimization</h5>
                          <p className="text-sm text-muted-foreground">Match industry keywords and job requirements</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Edit3 className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium">Language Enhancement</h5>
                          <p className="text-sm text-muted-foreground">Transform passive descriptions into powerful statements</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium">Professional Formatting</h5>
                          <p className="text-sm text-muted-foreground">Ensure consistency and professional appearance</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <Users className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium">Industry Standards</h5>
                          <p className="text-sm text-muted-foreground">Align with current industry best practices</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={analyzeResume} 
                disabled={loading || !resumeText.trim()}
                className="w-full h-12 text-lg bg-gradient-primary"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {analysis ? (
            <>
              {/* Score Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Resume Analysis Results
                  </CardTitle>
                  <CardDescription>Comprehensive AI evaluation with actionable insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}/100
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                      <Progress value={analysis.overallScore} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                        {analysis.atsScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">ATS Friendly</div>
                      <Progress value={analysis.atsScore} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.keywordMatching)}`}>
                        {analysis.keywordMatching}%
                      </div>
                      <div className="text-sm text-muted-foreground">Keywords</div>
                      <Progress value={analysis.keywordMatching} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.readabilityScore)}`}>
                        {analysis.readabilityScore}%
                      </div>
                      <div className="text-sm text-muted-foreground">Readability</div>
                      <Progress value={analysis.readabilityScore} className="h-2 mt-2" />
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(analysis.professionalFormatting)}`}>
                        {analysis.professionalFormatting}%
                      </div>
                      <div className="text-sm text-muted-foreground">Formatting</div>
                      <Progress value={analysis.professionalFormatting} className="h-2 mt-2" />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={() => setActiveTab('improvements')} className="bg-gradient-primary">
                      View AI Improvements
                      <Wand2 className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                {analysis.categories.map((category, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <Badge className={getScoreColor(category.score)}>
                          {category.score}/100
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Progress value={category.score} className="h-3 mb-4" />
                      <div className="space-y-3">
                        {category.issues.map((issue, issueIndex) => (
                          <div key={issueIndex} className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium text-sm">{issue.description}</span>
                              </div>
                              <Badge variant="outline" className={`${getSeverityColor(issue.severity)} text-xs`}>
                                {issue.severity}
                              </Badge>
                            </div>
                            <p className="text-sm mb-2">💡 {issue.suggestion}</p>
                            {issue.example && (
                              <p className="text-xs bg-white/50 p-2 rounded italic">
                                Example: {issue.example}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your resume to get started with AI analysis
                </p>
                <Button onClick={() => setActiveTab('upload')}>
                  Upload Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Improvements Tab */}
        <TabsContent value="improvements" className="space-y-6">
          {improvements.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    AI-Powered Improvements
                  </CardTitle>
                  <CardDescription>
                    Professional optimizations to enhance your resume's impact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {improvements.length} improvements identified
                      </p>
                    </div>
                    <Button onClick={applyAllImprovements} className="bg-gradient-primary">
                      Apply All Improvements
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {improvements.map((improvement, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-lg">{improvement.section}</h4>
                            <Badge variant={improvement.impact === 'high' ? 'default' : 'secondary'}>
                              {improvement.impact} impact
                            </Badge>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-6 mb-4">
                            <div>
                              <h5 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Before
                              </h5>
                              <p className="text-sm p-3 bg-red-50 border border-red-200 rounded">
                                {improvement.original}
                              </p>
                            </div>
                            <div>
                              <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                After
                              </h5>
                              <p className="text-sm p-3 bg-green-50 border border-green-200 rounded">
                                {improvement.improved}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-blue-50 border border-blue-200 rounded p-4">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <h6 className="font-medium text-blue-900 mb-1">Why this improvement matters:</h6>
                                <p className="text-sm text-blue-800">{improvement.explanation}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {showImproved && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optimized Resume</CardTitle>
                    <CardDescription>Your resume with all AI improvements applied</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={improvedResume}
                      onChange={(e) => setImprovedResume(e.target.value)}
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-3 mt-4">
                      <Button onClick={() => copyToClipboard(improvedResume)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Improvements Available</h3>
                <p className="text-muted-foreground mb-4">
                  Complete an AI analysis first to get personalized improvements
                </p>
                <Button onClick={() => setActiveTab('analysis')}>
                  View Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Job Matching Tab */}
        <TabsContent value="job-match" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI Job Matching Analysis
              </CardTitle>
              <CardDescription>
                Analyze how well your resume matches specific job postings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Title</label>
                    <Input
                      placeholder="e.g., Senior Software Engineer"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company Name</label>
                    <Input
                      placeholder="e.g., Tech Company Inc."
                      value={coverLetterData.companyName}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Description</label>
                    <Textarea
                      placeholder="Paste the full job description here..."
                      value={coverLetterData.jobDescription}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobDescription: e.target.value }))}
                      rows={8}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => analyzeJobMatch(coverLetterData.jobDescription)}
                disabled={loading || !resumeText || !coverLetterData.jobDescription}
                className="w-full bg-gradient-primary"
              >
                {loading ? 'Analyzing Match...' : 'Analyze Job Match'}
              </Button>

              {jobMatchScore > 0 && (
                <Card className="bg-gradient-card">
                  <CardContent className="p-6">
                    <div className="text-center mb-6">
                      <div className={`text-4xl font-bold ${getScoreColor(jobMatchScore)}`}>
                        {jobMatchScore}%
                      </div>
                      <div className="text-lg text-muted-foreground">Job Match Score</div>
                      <Progress value={jobMatchScore} className="h-4 mt-4" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Matched Keywords</h4>
                        <div className="space-y-2">
                          <Badge>React</Badge>
                          <Badge>JavaScript</Badge>
                          <Badge>Node.js</Badge>
                          <Badge>Leadership</Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Missing Keywords</h4>
                        <div className="space-y-2">
                          <Badge variant="outline">GraphQL</Badge>
                          <Badge variant="outline">AWS</Badge>
                          <Badge variant="outline">TypeScript</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Cover Letter Tab */}
        <TabsContent value="cover-letter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                AI Cover Letter Generator
              </CardTitle>
              <CardDescription>
                Create personalized, professional cover letters that complement your resume
              </CardDescription>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2">Accurate, No-Hallucination Cover Letters</h4>
                    <p className="text-sm text-blue-800">
                      We generate cover letters using only the information you provide. No fake achievements, made-up metrics, 
                      or fictional experiences will be added. Please fill in your actual details for the most authentic letter.
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      placeholder="Position you're applying for"
                      value={coverLetterData.jobTitle}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company Name *</label>
                    <Input
                      placeholder="Company name"
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
                    <label className="text-sm font-medium mb-2 block">Tone</label>
                    <Select value={coverLetterData.tone} onValueChange={(value: any) => setCoverLetterData(prev => ({ ...prev, tone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                        <SelectItem value="confident">Confident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Format</label>
                    <Select value={coverLetterData.format} onValueChange={(value: any) => setCoverLetterData(prev => ({ ...prev, format: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
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

                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Description (Optional)</label>
                    <Textarea
                      placeholder="Paste job description for more targeted content..."
                      value={coverLetterData.jobDescription}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, jobDescription: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={generateCoverLetter} 
                disabled={loading || !coverLetterData.jobTitle || !coverLetterData.companyName || !coverLetterData.yourName}
                className="w-full bg-gradient-primary"
              >
                {loading ? 'Generating Cover Letter...' : 'Generate Cover Letter'}
              </Button>

              {coverLetterData.generatedLetter && (
                <Card>
                  <CardHeader>
                    <CardTitle>Generated Cover Letter</CardTitle>
                    <CardDescription>AI-crafted letter tailored to your application</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={coverLetterData.generatedLetter}
                      onChange={(e) => setCoverLetterData(prev => ({ ...prev, generatedLetter: e.target.value }))}
                      rows={20}
                      className="font-mono text-sm"
                    />
                    <div className="flex gap-3 mt-4">
                      <Button onClick={() => copyToClipboard(coverLetterData.generatedLetter)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Letter
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button variant="outline" onClick={generateCoverLetter}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};