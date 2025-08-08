import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Award, BookOpen, Target, Users, CheckCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  skills: string[];
  certificate: string;
  lessons: Array<{
    id: string;
    title: string;
    description: string;
    duration: string;
  }>;
}

interface CoursePreviewProps {
  course: Course;
  onRegister: (courseId: string) => void;
  isRegistered: boolean;
  onStartCourse: (courseId: string) => void;
}

export const CoursePreview: React.FC<CoursePreviewProps> = ({
  course,
  onRegister,
  isRegistered,
  onStartCourse
}) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setShowPreview(true)}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <p className="text-muted-foreground mt-2 text-sm">{course.description}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {course.duration}
            </Badge>
            <Badge variant="outline">{course.level}</Badge>
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {course.lessons.length} modules
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Skills:</h4>
            <div className="flex flex-wrap gap-1">
              {course.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {course.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{course.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>

          <Button 
            className="w-full"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              setShowPreview(true);
            }}
          >
            View Course Details
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5" />
              {course.title}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">Course Modules</TabsTrigger>
              <TabsTrigger value="outcomes">Learning Outcomes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="font-semibold">{course.duration}</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="font-semibold">{course.level}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="font-semibold">{course.lessons.length}</div>
                    <div className="text-xs text-muted-foreground">Modules</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <div className="font-semibold">Certificate</div>
                    <div className="text-xs text-muted-foreground">Included</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Skills You'll Develop
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {course.skills.map((skill, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certificate Included
                  </h3>
                  <p className="text-sm text-muted-foreground">{course.certificate}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="modules" className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold">Course Modules ({course.lessons.length} total)</h3>
                {course.lessons.map((lesson, index) => (
                  <Card key={lesson.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-medium">{lesson.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {lesson.duration}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="outcomes" className="space-y-4">
              <div className="space-y-4">
                <h3 className="font-semibold">What You'll Achieve</h3>
                
                <div className="grid gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Learning Objectives
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Master the core concepts and practical applications</li>
                      <li>• Develop hands-on skills through interactive exercises</li>
                      <li>• Build confidence in real-world scenarios</li>
                      <li>• Create a portfolio of practical projects</li>
                    </ul>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Career Benefits
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Enhance your professional skill set</li>
                      <li>• Increase your market value and earning potential</li>
                      <li>• Open new career opportunities</li>
                      <li>• Stay competitive in your field</li>
                    </ul>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Certification
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Upon successful completion, you'll receive a verified certificate: <strong>{course.certificate}</strong>
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4 border-t">
            {isRegistered ? (
              <Button 
                onClick={() => {
                  onStartCourse(course.id);
                  setShowPreview(false);
                }}
                className="flex-1 bg-gradient-primary"
              >
                Start Learning
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  onRegister(course.id);
                  setShowPreview(false);
                }}
                className="flex-1 bg-gradient-primary"
              >
                Register for Course
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};