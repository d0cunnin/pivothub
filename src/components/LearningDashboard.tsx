import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Award, BookOpen, Clock, Target, Filter } from 'lucide-react';
import { InteractiveLearningModule } from './InteractiveLearningModule';

// Sample learning modules data
const learningModules = [
  {
    id: 'web-dev',
    title: 'Web Development Fundamentals',
    description: 'Master HTML, CSS, and JavaScript to build modern websites',
    duration: '8 weeks',
    level: 'Beginner',
    skills: ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
    certificate: 'Web Development Certificate',
    lessons: [
      {
        id: 'html-basics',
        title: 'HTML Fundamentals',
        description: 'Learn the structure and semantics of HTML',
        duration: '45 min',
        completed: false,
        content: `Welcome to HTML Fundamentals!

HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page using markup.

Key Concepts:
- Elements and Tags
- Document Structure
- Semantic HTML
- Forms and Input Elements
- Best Practices

Let's start with the basic structure of an HTML document:

<!DOCTYPE html>
<html>
<head>
    <title>My First Web Page</title>
</head>
<body>
    <h1>Welcome to HTML!</h1>
    <p>This is your first paragraph.</p>
</body>
</html>`,
        quiz: [
          {
            id: 'q1',
            question: 'What does HTML stand for?',
            options: [
              'HyperText Markup Language',
              'High Tech Modern Language',
              'Home Tool Markup Language',
              'HyperText Modern Language'
            ],
            correctAnswer: 0
          }
        ]
      },
      {
        id: 'css-basics',
        title: 'CSS Styling',
        description: 'Learn to style your web pages with CSS',
        duration: '50 min',
        completed: false,
        content: `CSS (Cascading Style Sheets) Fundamentals

CSS is used to style and layout web pages. It controls the visual presentation of HTML elements.

Key Topics:
- Selectors and Properties
- Colors and Typography
- Box Model
- Layout Techniques
- Responsive Design

Basic CSS Example:
h1 {
    color: #333;
    font-size: 24px;
    margin-bottom: 16px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}`,
        quiz: [
          {
            id: 'q2',
            question: 'Which CSS property is used to change text color?',
            options: ['font-color', 'text-color', 'color', 'foreground'],
            correctAnswer: 2
          }
        ]
      }
    ]
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing Mastery',
    description: 'Learn modern digital marketing strategies and tools',
    duration: '6 weeks',
    level: 'Intermediate',
    skills: ['SEO', 'Social Media', 'Analytics', 'Content Marketing'],
    certificate: 'Digital Marketing Certificate',
    lessons: [
      {
        id: 'seo-basics',
        title: 'SEO Fundamentals',
        description: 'Understanding search engine optimization',
        duration: '40 min',
        completed: false,
        content: `Search Engine Optimization (SEO) Fundamentals

SEO is the practice of optimizing your website to rank higher in search engine results pages (SERPs).

Core SEO Concepts:
- Keyword Research
- On-Page Optimization
- Technical SEO
- Link Building
- Local SEO

Key SEO Elements:
- Title Tags
- Meta Descriptions
- Header Tags (H1, H2, H3)
- Internal Linking
- Page Speed
- Mobile Optimization

Remember: SEO is a long-term strategy that requires consistent effort and patience.`
      }
    ]
  },
  {
    id: 'data-analysis',
    title: 'Data Analysis with Excel',
    description: 'Master data analysis techniques using Microsoft Excel',
    duration: '4 weeks',
    level: 'Beginner',
    skills: ['Excel', 'Data Visualization', 'Pivot Tables', 'Formulas'],
    certificate: 'Data Analysis Certificate',
    lessons: [
      {
        id: 'excel-basics',
        title: 'Excel Fundamentals',
        description: 'Get started with Excel basics',
        duration: '35 min',
        completed: false,
        content: `Microsoft Excel Fundamentals

Excel is a powerful spreadsheet application used for data analysis, calculation, and visualization.

Basic Excel Skills:
- Worksheets and Workbooks
- Cells, Rows, and Columns
- Basic Formulas (SUM, AVERAGE, COUNT)
- Data Formatting
- Charts and Graphs

Essential Formulas:
=SUM(A1:A10) - Adds values in range
=AVERAGE(A1:A10) - Calculates average
=COUNT(A1:A10) - Counts numbers in range
=IF(A1>10,"Yes","No") - Conditional logic

Practice these basics before moving to advanced topics!`
      }
    ]
  }
];

export const LearningDashboard: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

  const handleProgressUpdate = (moduleId: string, progress: number) => {
    setModuleProgress(prev => ({ ...prev, [moduleId]: progress }));
  };

  const filteredModules = learningModules.filter(module => {
    if (filterLevel !== 'all' && module.level.toLowerCase() !== filterLevel) return false;
    return true;
  });

  const currentModule = learningModules.find(m => m.id === selectedModule);

  const overallProgress = Object.values(moduleProgress).length > 0 
    ? Object.values(moduleProgress).reduce((sum, progress) => sum + progress, 0) / Object.values(moduleProgress).length
    : 0;

  const completedModules = Object.values(moduleProgress).filter(progress => progress === 100).length;

  if (currentModule) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedModule(null)}>
            ← Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Learning in Progress</h2>
            <p className="text-muted-foreground">Continue your learning journey</p>
          </div>
        </div>
        
        <InteractiveLearningModule 
          module={currentModule} 
          onProgressUpdate={handleProgressUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Learning Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
            <BookOpen className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningModules.length}</div>
            <p className="text-xs text-muted-foreground">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedModules}</div>
            <p className="text-xs text-muted-foreground">Certificates earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
            <Progress value={overallProgress} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const progress = moduleProgress[module.id] || 0;
          const isCompleted = progress === 100;
          
          return (
            <Card key={module.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <CardDescription className="mt-2">{module.description}</CardDescription>
                  </div>
                  {isCompleted && (
                    <Badge className="bg-gradient-primary text-white">
                      <Award className="h-3 w-3 mr-1" />
                      Done
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
                  <Badge variant="outline">{module.level}</Badge>
                </div>

                {progress > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Skills:</h4>
                  <div className="flex flex-wrap gap-1">
                    {module.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {module.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{module.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-primary"
                  onClick={() => setSelectedModule(module.id)}
                >
                  {progress > 0 && progress < 100 ? 'Continue Learning' : 
                   isCompleted ? 'Review Course' : 'Start Course'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};