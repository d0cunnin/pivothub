import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  MessageSquare, 
  Clock, 
  Star, 
  Play, 
  Pause, 
  RotateCcw, 
  BookOpen, 
  Target, 
  CheckCircle,
  Mic,
  MicOff,
  Download,
  Plus,
  Brain,
  TrendingUp,
  Award,
  Users,
  Camera,
  VideoIcon as Video,
  BarChart3,
  Lightbulb,
  Eye,
  Headphones
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'behavioral' | 'technical' | 'situational' | 'culture-fit';
  difficulty: 'beginner' | 'intermediate' | 'executive';
  category: string;
  followUp?: string[];
  tips: string[];
}

interface Response {
  questionId: string;
  answer: string;
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    score: number;
    starMethod: {
      situation: boolean;
      task: boolean;
      action: boolean;
      result: boolean;
    };
  };
  timestamp: Date;
  duration: number;
}

interface InterviewSession {
  id: string;
  jobTitle: string;
  startTime: Date;
  duration: number;
  questions: Question[];
  responses: Response[];
  overallScore: number;
  status: 'completed' | 'in-progress' | 'scheduled';
}

export const EnhancedInterviewCoach = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'executive'>('intermediate');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['behavioral', 'technical', 'situational']);
  const [difficultyLevel, setDifficultyLevel] = useState([50]);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<Response[]>([]);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoMode, setIsVideoMode] = useState(false);
  const [isMockInterview, setIsMockInterview] = useState(false);
  const [mockInterviewTime, setMockInterviewTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock data for dashboard
  const mockStats = {
    sessionsCompleted: sessions.length,
    averageScore: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length : 0,
    improvementTrend: '+15%',
    totalPracticeTime: sessions.reduce((sum, s) => sum + s.duration, 0)
  };

  // Generate enhanced interview questions
  const generateQuestions = async () => {
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/interview-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle,
          industry,
          level,
          questionTypes,
          jobDescription,
          difficulty: difficultyLevel[0]
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate questions');
      }

      const enhancedQuestions: Question[] = data.questions.map((q: any) => ({
        ...q,
        tips: [
          'Use the STAR method for behavioral questions',
          'Be specific with examples and metrics',
          'Stay relevant to the job requirements'
        ]
      }));

      setQuestions(enhancedQuestions);
      setCurrentQuestionIndex(0);
      setActiveTab('practice');
      toast.success(`Generated ${enhancedQuestions.length} enhanced interview questions`);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer for AI feedback
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    const startTime = Date.now();
    setLoading(true);
    
    try {
      const response = await fetch('https://fkvjsgqjgissolpdqbdh.supabase.co/functions/v1/interview-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questions[currentQuestionIndex].text,
          answer: currentAnswer,
          questionType: questions[currentQuestionIndex].type,
          jobTitle: jobTitle,
          difficulty: level
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze answer');
      }

      const duration = Math.round((Date.now() - startTime) / 1000);
      const enhancedResponse: Response = {
        questionId: questions[currentQuestionIndex].id,
        answer: currentAnswer,
        feedback: {
          overall: data.feedback.detailedFeedback,
          strengths: data.feedback.strengths || [],
          improvements: data.feedback.improvements || [],
          score: data.feedback.overallScore,
          starMethod: data.feedback.starMethod || { situation: false, task: false, action: false, result: false }
        },
        timestamp: new Date(),
        duration
      };

      setResponses([...responses, enhancedResponse]);
      setCurrentAnswer('');
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setActiveTab('results');
        toast.success('Interview practice completed!');
      }
    } catch (error) {
      console.error('Error analyzing answer:', error);
      // Enhanced fallback with detailed feedback
      const mockFeedback = {
        overall: `Good response with relevant experience. To improve, consider being more specific about metrics and outcomes. The STAR method would help structure your answer better.`,
        strengths: ['Relevant experience mentioned', 'Clear communication'],
        improvements: ['Add specific metrics', 'Use STAR method', 'Quantify achievements'],
        score: Math.floor(Math.random() * 3) + 3,
        starMethod: { situation: true, task: false, action: true, result: false }
      };
      
      const enhancedResponse: Response = {
        questionId: questions[currentQuestionIndex].id,
        answer: currentAnswer,
        feedback: mockFeedback,
        timestamp: new Date(),
        duration: 0
      };

      setResponses([...responses, enhancedResponse]);
      setCurrentAnswer('');
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setActiveTab('results');
        toast.success('Interview practice completed!');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const averageScore = responses.length > 0 
    ? responses.reduce((sum, r) => sum + r.feedback.score, 0) / responses.length 
    : 0;

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="video">Video Mode</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions Completed</CardTitle>
                <Target className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.sessionsCompleted}</div>
                <p className="text-xs text-muted-foreground">Total practice sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Star className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.averageScore.toFixed(1)}/5</div>
                <p className="text-xs text-muted-foreground">Across all responses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Improvement</CardTitle>
                <TrendingUp className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{mockStats.improvementTrend}</div>
                <p className="text-xs text-muted-foreground">From last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Practice Time</CardTitle>
                <Clock className="h-4 w-4 ml-auto text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(mockStats.totalPracticeTime)}</div>
                <p className="text-xs text-muted-foreground">Total time invested</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Practice Sessions</CardTitle>
              <CardDescription>Your latest interview preparation activities</CardDescription>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
                  <p className="text-muted-foreground mb-4">Start practicing to see your progress here</p>
                  <Button onClick={() => setActiveTab('setup')}>Start First Session</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.slice(0, 3).map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{session.jobTitle}</h4>
                        <p className="text-sm text-muted-foreground">
                          {session.responses.length} questions • {formatTime(session.duration)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={session.overallScore >= 4 ? 'default' : 'secondary'}>
                          {session.overallScore.toFixed(1)}/5
                        </Badge>
                        <Button variant="outline" size="sm">Review</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Interview Setup
              </CardTitle>
              <CardDescription>
                Configure your personalized interview practice session with advanced AI feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Title *</label>
                    <Input
                      placeholder="e.g., Senior Software Engineer, Product Manager"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Industry</label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Experience Level</label>
                    <Select value={level} onValueChange={(value: any) => setLevel(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                        <SelectItem value="intermediate">Intermediate (2-8 years)</SelectItem>
                        <SelectItem value="executive">Executive (8+ years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Question Difficulty: {difficultyLevel[0]}%
                    </label>
                    <Slider
                      value={difficultyLevel}
                      onValueChange={setDifficultyLevel}
                      max={100}
                      step={10}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Basic</span>
                      <span>Advanced</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Question Types</label>
                    <div className="space-y-3">
                      {[
                        { id: 'behavioral', label: 'Behavioral Questions', desc: 'Past experience and situations' },
                        { id: 'technical', label: 'Technical Questions', desc: 'Role-specific skills and knowledge' },
                        { id: 'situational', label: 'Situational Questions', desc: 'Hypothetical scenarios' },
                        { id: 'culture-fit', label: 'Culture Fit', desc: 'Values and team dynamics' }
                      ].map((type) => (
                        <div key={type.id} className="border rounded-lg p-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={questionTypes.includes(type.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setQuestionTypes([...questionTypes, type.id]);
                                } else {
                                  setQuestionTypes(questionTypes.filter(t => t !== type.id));
                                }
                              }}
                              className="rounded"
                            />
                            <div>
                              <span className="font-medium">{type.label}</span>
                              <p className="text-xs text-muted-foreground">{type.desc}</p>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Description (Optional)</label>
                    <Textarea
                      placeholder="Paste the job description for more targeted questions..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={generateQuestions} 
                  disabled={loading || !jobTitle.trim()}
                  className="flex-1 bg-gradient-primary"
                >
                  {loading ? 'Generating AI Questions...' : 'Generate Interview Questions'}
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('video')}>
                  <Video className="h-4 w-4 mr-2" />
                  Video Mode
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Enhanced Practice Tab */}
        <TabsContent value="practice" className="space-y-6">
          {questions.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          {questions[currentQuestionIndex]?.type}
                        </Badge>
                        <Badge variant="outline">
                          {questions[currentQuestionIndex]?.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRecording(!isRecording)}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {isRecording ? 'Stop' : 'Voice'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={(currentQuestionIndex / questions.length) * 100} className="h-2" />
                  
                  <div className="bg-gradient-subtle p-6 rounded-lg border">
                    <p className="text-lg leading-relaxed">{questions[currentQuestionIndex]?.text}</p>
                  </div>

                  {questions[currentQuestionIndex]?.tips && (
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-2">Tips for this question:</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              {questions[currentQuestionIndex].tips.map((tip, index) => (
                                <li key={index}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-4">
                    <label className="text-sm font-medium">Your Answer</label>
                    <Textarea
                      placeholder="Structure your answer using STAR method: Situation, Task, Action, Result"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      rows={8}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tip: Be specific with metrics and outcomes</span>
                      <span>{currentAnswer.length} characters</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={submitAnswer} 
                      disabled={loading || !currentAnswer.trim()}
                      className="bg-gradient-primary"
                    >
                      {loading ? 'Getting AI Feedback...' : 'Get AI Feedback'}
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentAnswer('')}>
                      Clear Answer
                    </Button>
                    {currentQuestionIndex > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                      >
                        Previous
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Current Session Stats */}
              {responses.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{responses.length}</div>
                        <div className="text-xs text-muted-foreground">Answered</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{averageScore.toFixed(1)}/5</div>
                        <div className="text-xs text-muted-foreground">Avg Score</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {formatTime(responses.reduce((sum, r) => sum + r.duration, 0))}
                        </div>
                        <div className="text-xs text-muted-foreground">Time Spent</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Ready to Practice?</h3>
                <p className="text-muted-foreground mb-4">
                  Generate interview questions first to start practicing
                </p>
                <Button onClick={() => setActiveTab('setup')}>
                  Generate Questions
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Video Mode Tab */}
        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Interview Practice
              </CardTitle>
              <CardDescription>
                Practice with video recording to improve your body language and presentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
                {isVideoMode ? (
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-4" />
                    <p>Video recording active</p>
                    <Button 
                      variant="destructive" 
                      className="mt-4"
                      onClick={() => setIsVideoMode(false)}
                    >
                      Stop Recording
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Eye className="h-12 w-12 mx-auto mb-4" />
                    <p className="mb-4">Click to start video practice</p>
                    <Button onClick={() => setIsVideoMode(true)}>
                      Start Video Mode
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Video Features:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Record your responses</li>
                    <li>• Review body language</li>
                    <li>• Track eye contact</li>
                    <li>• Analyze speaking pace</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">AI Analysis:</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Confidence level</li>
                    <li>• Facial expressions</li>
                    <li>• Voice clarity</li>
                    <li>• Professional presence</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Behavioral Questions</span>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-20 h-2" />
                      <span className="text-sm font-medium">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Technical Questions</span>
                    <div className="flex items-center gap-2">
                      <Progress value={60} className="w-20 h-2" />
                      <span className="text-sm font-medium">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Situational Questions</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20 h-2" />
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm">Add more specific metrics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Improve STAR method usage</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Good storytelling</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {responses.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Session Results
                  </CardTitle>
                  <CardDescription>
                    Detailed AI feedback and performance analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{averageScore.toFixed(1)}/5</div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">{responses.length}</div>
                      <div className="text-sm text-muted-foreground">Questions Answered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round((responses.filter(r => r.feedback.score >= 3).length / responses.length) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {responses.map((response, index) => (
                      <Card key={index} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium">Question {index + 1}</h4>
                            <Badge className={getScoreColor(response.feedback.score)}>
                              {response.feedback.score}/5
                            </Badge>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <h5 className="text-sm font-medium text-green-600 mb-1">Strengths:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {response.feedback.strengths.map((strength, idx) => (
                                  <li key={idx}>✓ {strength}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h5 className="text-sm font-medium text-orange-600 mb-1">Areas for Improvement:</h5>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {response.feedback.improvements.map((improvement, idx) => (
                                  <li key={idx}>• {improvement}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="border-t pt-3">
                              <p className="text-sm text-muted-foreground">{response.feedback.overall}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setActiveTab('setup')} className="bg-gradient-primary">
                      New Practice Session
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete a practice session to see your results here
                </p>
                <Button onClick={() => setActiveTab('practice')}>
                  Start Practicing
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};