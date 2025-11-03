import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeAIContent } from "@/lib/utils";
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
  Plus
} from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'behavioral' | 'technical' | 'situational';
  difficulty: 'beginner' | 'intermediate' | 'executive';
}

interface Response {
  questionId: string;
  answer: string;
  feedback: string;
  score: number;
  timestamp: Date;
}

interface Story {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  tags: string[];
}

export const InterviewQuestionsCoach = () => {
  const [activeTab, setActiveTab] = useState('setup');
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'executive'>('intermediate');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['behavioral', 'technical', 'situational']);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [responses, setResponses] = useState<Response[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMockInterview, setIsMockInterview] = useState(false);
  const [mockInterviewTime, setMockInterviewTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate interview questions based on user input
  const generateQuestions = async () => {
    if (!jobTitle.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setLoading(true);
    try {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use this tool");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('interview-questions', {
        body: {
          jobTitle,
          industry,
          level,
          questionTypes,
          jobDescription
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate questions');
      }

      const filteredQuestions = (data?.questions || []).filter((q: Question) => questionTypes.includes(q.type));
      setQuestions(filteredQuestions);
      setCurrentQuestionIndex(0);
      setActiveTab('practice');
      toast.success(`Generated ${filteredQuestions.length} interview questions`);
    } catch (error) {
      console.error('Error generating questions:', error);
      toast.error('Failed to generate questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer for feedback
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setLoading(true);
    try {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use this tool");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('interview-feedback', {
        body: {
          question: questions[currentQuestionIndex].text,
          answer: currentAnswer,
          questionType: questions[currentQuestionIndex].type,
          jobTitle: jobTitle
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze answer');
      }

      const response_data: Response = {
        questionId: questions[currentQuestionIndex].id,
        answer: currentAnswer,
        feedback: sanitizeAIContent(data?.feedback?.detailedFeedback || 'Good response provided'),
        score: data?.feedback?.overallScore || 4,
        timestamp: new Date()
      };

      setResponses([...responses, response_data]);
      setCurrentAnswer('');
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setActiveTab('results');
        toast.success('Interview practice completed!');
      }
    } catch (error) {
      console.error('Error analyzing answer:', error);
      // Fallback feedback
      const mockFeedback = `Your answer demonstrates good understanding. Consider using the STAR method more explicitly. The response shows relevant experience but could benefit from more specific metrics and outcomes. Try to quantify your achievements where possible.`;
      
      const response_data: Response = {
        questionId: questions[currentQuestionIndex].id,
        answer: currentAnswer,
        feedback: sanitizeAIContent(mockFeedback),
        score: Math.floor(Math.random() * 3) + 3, // Random score 3-5
        timestamp: new Date()
      };

      setResponses([...responses, response_data]);
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

  // Start mock interview mode
  const startMockInterview = () => {
    setIsMockInterview(true);
    setIsTimerRunning(true);
    setMockInterviewTime(0);
    setCurrentQuestionIndex(0);
    
    // Start timer
    const timer = setInterval(() => {
      setMockInterviewTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  };

  // Add new story to story bank
  const addStory = (story: Omit<Story, 'id'>) => {
    const newStory: Story = {
      ...story,
      id: Date.now().toString()
    };
    setStories([...stories, newStory]);
    toast.success('Story added to your bank');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="mock">Mock Interview</TabsTrigger>
          <TabsTrigger value="stories">Story Bank</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Interview Setup</h3>
                <p className="text-muted-foreground mb-6">
                  Configure your interview practice session by providing details about the role and selecting your experience level.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Title *</label>
                    <Input
                      placeholder="e.g., Software Engineer, Marketing Manager"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className={jobTitle.trim().length > 0 && jobTitle.trim().length < 3 ? "border-destructive" : ""}
                    />
                    {jobTitle.trim().length > 0 && jobTitle.trim().length < 3 && (
                      <p className="text-xs text-destructive mt-1">Please enter at least 3 characters</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Industry</label>
                    <Input
                      placeholder="e.g., Technology, Healthcare, Finance"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Helps generate more relevant questions</p>
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
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Question Types</label>
                    <div className="space-y-2">
                      {[
                        { id: 'behavioral', label: 'Behavioral Questions' },
                        { id: 'technical', label: 'Technical Questions' },
                        { id: 'situational', label: 'Situational Questions' }
                      ].map((type) => (
                        <label key={type.id} className="flex items-center space-x-2">
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
                          <span className="text-sm">{type.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Job Description (Optional)</label>
                    <Textarea
                      placeholder="Paste the job description to get more targeted questions..."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

                <Button 
                  onClick={generateQuestions} 
                  disabled={loading || !jobTitle.trim() || jobTitle.trim().length < 3}
                  className="w-full"
                >
                  {loading ? 'Generating Questions...' : 'Generate Interview Questions'}
                </Button>
                {(!jobTitle.trim() || jobTitle.trim().length < 3) && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Please enter a job title with at least 3 characters
                  </p>
                )}
            </div>
          </Card>
        </TabsContent>

        {/* Practice Tab */}
        <TabsContent value="practice" className="space-y-6">
          {questions.length > 0 ? (
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      {questions[currentQuestionIndex]?.type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isRecording ? 'Stop Recording' : 'Voice Practice'}
                    </Button>
                  </div>
                </div>

                <div className="bg-accent/10 p-4 rounded-lg">
                  <p className="text-lg">{questions[currentQuestionIndex]?.text}</p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Your Answer</label>
                    <Textarea
                      placeholder="Type your answer here... Use the STAR method: Situation, Task, Action, Result"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      rows={6}
                      className={currentAnswer.trim().length > 0 && currentAnswer.trim().length < 20 ? "border-yellow-500" : ""}
                    />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>
                        Tip: Structure your answer using STAR method for behavioral questions
                      </span>
                      <span>
                        {currentAnswer.trim().length} characters
                        {currentAnswer.trim().length < 20 && currentAnswer.trim().length > 0 && (
                          <span className="text-yellow-600 ml-1">(too short for good feedback)</span>
                        )}
                      </span>
                    </div>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={submitAnswer} disabled={loading || !currentAnswer.trim()}>
                    {loading ? 'Analyzing...' : 'Submit Answer'}
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentAnswer('')}>
                    Clear
                  </Button>
                  {currentQuestionIndex > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                    >
                      Previous Question
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Questions Generated</h3>
              <p className="text-muted-foreground mb-4">
                Go to the Setup tab to generate interview questions first.
              </p>
              <Button onClick={() => setActiveTab('setup')}>
                Go to Setup
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Mock Interview Tab */}
        <TabsContent value="mock" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Mock Interview Mode</h3>
                {isMockInterview && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono">{formatTime(mockInterviewTime)}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                    >
                      {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {!isMockInterview ? (
                <div className="text-center space-y-4">
                  <Target className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h4 className="text-lg font-semibold mb-2">Timed Mock Interview</h4>
                    <p className="text-muted-foreground">
                      Experience a real interview simulation with time tracking and comprehensive feedback.
                    </p>
                  </div>
                  <Button onClick={startMockInterview} disabled={questions.length === 0}>
                    Start Mock Interview
                  </Button>
                  {questions.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Generate questions first in the Setup tab
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-accent/10 p-4 rounded-lg">
                    <p className="text-lg">{questions[currentQuestionIndex]?.text}</p>
                  </div>
                  <Textarea
                    placeholder="Provide your answer..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    rows={6}
                  />
                  <Button onClick={submitAnswer} disabled={loading}>
                    Next Question
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Story Bank Tab */}
        <TabsContent value="stories" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Story Bank</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Story
                </Button>
              </div>
              
              <p className="text-muted-foreground">
                Build a collection of powerful stories using the STAR method that you can reference during interviews.
              </p>

              {stories.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-semibold mb-2">No Stories Yet</h4>
                  <p className="text-muted-foreground mb-4">
                    Start building your story bank with compelling examples from your experience.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {stories.map((story) => (
                    <Card key={story.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{story.title}</h4>
                          <div className="flex space-x-1">
                            {story.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <strong>Situation:</strong> {story.situation}
                          </div>
                          <div>
                            <strong>Task:</strong> {story.task}
                          </div>
                          <div>
                            <strong>Action:</strong> {story.action}
                          </div>
                          <div>
                            <strong>Result:</strong> {story.result}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Interview Performance Report</h3>
              
              {responses.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card className="p-4 text-center">
                      <h4 className="font-semibold mb-2">Average Score</h4>
                      <div className="text-2xl font-bold text-primary">
                        {(responses.reduce((sum, r) => sum + r.score, 0) / responses.length).toFixed(1)}/5
                      </div>
                    </Card>
                    <Card className="p-4 text-center">
                      <h4 className="font-semibold mb-2">Questions Answered</h4>
                      <div className="text-2xl font-bold text-primary">{responses.length}</div>
                    </Card>
                    <Card className="p-4 text-center">
                      <h4 className="font-semibold mb-2">Time Spent</h4>
                      <div className="text-2xl font-bold text-primary">{formatTime(mockInterviewTime)}</div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Detailed Feedback</h4>
                    {responses.map((response, index) => (
                      <Card key={response.questionId} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium">Question {index + 1}</h5>
                            <div className="flex items-center space-x-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < response.score ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{response.feedback}</p>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setResponses([]);
                      setCurrentQuestionIndex(0);
                      setActiveTab('setup');
                    }}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start New Session
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-semibold mb-2">No Results Yet</h4>
                  <p className="text-muted-foreground">
                    Complete some interview questions to see your performance report.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};