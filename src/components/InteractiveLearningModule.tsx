import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { CheckCircle, Play, BookOpen, Award, Clock, Star, Download, Code, FileText, CheckSquare, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  lessons: Lesson[];
  skills: string[];
  certificate: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  content: string;
  quiz?: QuizQuestion[];
  activities?: HandsOnActivity[];
  resources?: DownloadableResource[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface HandsOnActivity {
  id: string;
  title: string;
  type: 'exercise' | 'project' | 'coding' | 'reflection';
  description: string;
  instructions: string[];
  submissionType?: 'text' | 'file' | 'code';
  template?: string;
}

interface DownloadableResource {
  id: string;
  title: string;
  type: 'pdf' | 'template' | 'cheatsheet' | 'workbook';
  description: string;
  fileUrl: string;
  fileName: string;
}

interface InteractiveLearningModuleProps {
  module: LearningModule;
  onProgressUpdate?: (moduleId: string, progress: number) => void;
}

export const InteractiveLearningModule: React.FC<InteractiveLearningModuleProps> = ({
  module,
  onProgressUpdate
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [activityResponses, setActivityResponses] = useState<Record<string, string>>({});
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());

  const progress = (completedLessons.size / module.lessons.length) * 100;

  const handleStartLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  };

  const handleCompleteLesson = (lessonId: string) => {
    const newCompletedLessons = new Set(completedLessons);
    newCompletedLessons.add(lessonId);
    setCompletedLessons(newCompletedLessons);
    
    const newProgress = (newCompletedLessons.size / module.lessons.length) * 100;
    onProgressUpdate?.(module.id, newProgress);
    
    setCurrentLesson(null);
    toast.success('Lesson completed! Great job!');
    
    if (newProgress === 100) {
      toast.success(`🎉 Congratulations! You've completed ${module.title} and earned your certificate!`);
    }
  };

  const handleQuizAnswer = (questionId: string, answerIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const checkQuizAnswers = (lesson: Lesson): boolean => {
    if (!lesson.quiz) return true;
    
    return lesson.quiz.every(q => quizAnswers[q.id] === q.correctAnswer);
  };

  const handleActivityResponse = (activityId: string, response: string) => {
    setActivityResponses(prev => ({ ...prev, [activityId]: response }));
  };

  const handleCompleteActivity = (activityId: string) => {
    const newCompletedActivities = new Set(completedActivities);
    newCompletedActivities.add(activityId);
    setCompletedActivities(newCompletedActivities);
    toast.success('Activity completed!');
  };

  const handleDownloadResource = (resource: DownloadableResource) => {
    // Simulate download - in real app, this would download the actual file
    toast.success(`Downloading ${resource.fileName}...`);
    // Create a mock download link
    const link = document.createElement('a');
    link.href = resource.fileUrl;
    link.download = resource.fileName;
    link.click();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'coding': return <Code className="h-4 w-4" />;
      case 'reflection': return <Lightbulb className="h-4 w-4" />;
      case 'project': return <CheckSquare className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'template': return '📋';
      case 'cheatsheet': return '📝';
      case 'workbook': return '📚';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Overview */}
      <Card className="bg-gradient-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                {module.title}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {module.description}
              </CardDescription>
            </div>
            {progress === 100 && (
              <Badge className="bg-gradient-primary text-white">
                <Award className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {module.duration}
            </Badge>
            <Badge variant="outline">
              <Star className="h-3 w-3 mr-1" />
              {module.level}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Skills you'll learn:</h4>
            <div className="flex flex-wrap gap-2">
              {module.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Content or Lesson List */}
      {currentLesson ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              {currentLesson.title}
            </CardTitle>
            <CardDescription>{currentLesson.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="activities">Activities ({currentLesson.activities?.length || 0})</TabsTrigger>
                <TabsTrigger value="resources">Resources ({currentLesson.resources?.length || 0})</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line">{currentLesson.content}</div>
                </div>
              </TabsContent>

              <TabsContent value="activities" className="space-y-4">
                {currentLesson.activities && currentLesson.activities.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Hands-On Activities</h3>
                    {currentLesson.activities.map((activity) => (
                      <Card key={activity.id} className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          {getActivityIcon(activity.type)}
                          <h4 className="font-medium">{activity.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{activity.description}</p>
                        
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm">Instructions:</h5>
                          <ol className="list-decimal list-inside space-y-1 text-sm">
                            {activity.instructions.map((instruction, index) => (
                              <li key={index}>{instruction}</li>
                            ))}
                          </ol>
                        </div>

                        {activity.submissionType && (
                          <div className="mt-4 space-y-3">
                            <h5 className="font-medium text-sm">Your Response:</h5>
                            {activity.submissionType === 'text' && (
                              <Textarea
                                placeholder="Type your response here..."
                                value={activityResponses[activity.id] || ''}
                                onChange={(e) => handleActivityResponse(activity.id, e.target.value)}
                                className="min-h-24"
                              />
                            )}
                            {activity.submissionType === 'code' && (
                              <Textarea
                                placeholder="Paste your code here..."
                                value={activityResponses[activity.id] || activity.template || ''}
                                onChange={(e) => handleActivityResponse(activity.id, e.target.value)}
                                className="font-mono text-sm min-h-32"
                              />
                            )}
                            <Button
                              onClick={() => handleCompleteActivity(activity.id)}
                              disabled={completedActivities.has(activity.id) || !activityResponses[activity.id]?.trim()}
                              variant={completedActivities.has(activity.id) ? "outline" : "default"}
                              size="sm"
                            >
                              {completedActivities.has(activity.id) ? 'Completed ✓' : 'Submit Activity'}
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No activities available for this lesson.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resources" className="space-y-4">
                {currentLesson.resources && currentLesson.resources.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Downloadable Resources</h3>
                    <div className="grid gap-3">
                      {currentLesson.resources.map((resource) => (
                        <Card key={resource.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{getResourceIcon(resource.type)}</span>
                              <div>
                                <h4 className="font-medium">{resource.title}</h4>
                                <p className="text-sm text-muted-foreground">{resource.description}</p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDownloadResource(resource)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Download className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No downloadable resources for this lesson.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quiz" className="space-y-4">
                {currentLesson.quiz && currentLesson.quiz.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Knowledge Check</h3>
                    {currentLesson.quiz.map((question, qIndex) => (
                      <Card key={question.id} className="p-4">
                        <h4 className="font-medium mb-3">{question.question}</h4>
                        <div className="space-y-2">
                          {question.options.map((option, oIndex) => (
                            <label key={oIndex} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="radio"
                                name={question.id}
                                value={oIndex}
                                onChange={() => handleQuizAnswer(question.id, oIndex)}
                                className="text-primary"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No quiz available for this lesson.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentLesson(null)}>
                Back to Lessons
              </Button>
              <Button 
                onClick={() => handleCompleteLesson(currentLesson.id)}
                disabled={currentLesson.quiz && !checkQuizAnswers(currentLesson)}
                className="bg-gradient-primary"
              >
                Complete Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Course Content</CardTitle>
            <CardDescription>
              {module.lessons.length} lessons • {completedLessons.size} completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {module.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {completedLessons.has(lesson.id) ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 border-2 rounded-full border-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">{lesson.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {lesson.duration}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartLesson(lesson)}
                      disabled={completedLessons.has(lesson.id)}
                    >
                      {completedLessons.has(lesson.id) ? 'Review' : 'Start'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificate Section */}
      {progress === 100 && (
        <Card className="bg-gradient-primary text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6" />
              Certificate Earned!
            </CardTitle>
            <CardDescription className="text-white/80">
              You have successfully completed {module.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Download Certificate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};