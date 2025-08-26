import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Award, BookOpen, Clock, Target, Filter, LogIn } from 'lucide-react';
import { InteractiveLearningModule } from './InteractiveLearningModule';
import { CoursePreview } from './CoursePreview';
import { useLearningProgress } from '@/hooks/useLearningProgress';
import { useAuth } from '@/contexts/AuthContext';

// Mini courses - Essential skills without the fluff
const learningModules = [
  {
    id: 'ai-technology',
    title: 'AI & Technology Essentials',
    description: 'Learn AI basics in simple terms. Get comfortable with AI tools that can actually help you.',
    duration: '1-2 hours',
    level: 'Beginner',
    skills: ['AI Basics', 'Productivity Tools', 'Digital Confidence'],
    certificate: 'AI Essentials Mini Course Certificate',
    lessons: [
      {
        id: 'module-1',
        title: 'What is AI and Why Should I Use It?',
        description: 'Breaks down AI in simple terms and explains why it\'s relevant to daily life',
        duration: 'Short video',
        completed: false,
        videoPath: 'What is AI and Why Should I Use It??.mp4',
        content: `What is AI?
AI is like having a smart assistant that can help with writing, research, and daily tasks.

Key Points:
• AI helps with everyday tasks (like GPS, email suggestions, shopping recommendations)
• It's a tool to make life easier, not replace you
• You don't need tech skills to use it
• Start simple - most AI tools are designed for regular people

Bottom Line: AI is already helping you daily. Learning to use it intentionally can save you time and stress.`,
        activities: [
          {
            id: 'ai-audit-activity',
            title: 'Personal AI Audit',
            type: 'reflection' as const,
            description: 'Discover how much AI you\'re already using in your daily life',
            instructions: [
              'Look at your smartphone and list 5 apps you use regularly',
              'For each app, identify which features might use AI (suggestions, recommendations, voice recognition, etc.)',
              'Think about other AI tools you encounter: GPS navigation, streaming recommendations, online shopping suggestions',
              'Reflect on how these AI features have changed your behavior or made tasks easier'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'ai-glossary',
            title: 'AI Terms Glossary',
            type: 'cheatsheet' as const,
            description: 'Quick reference guide to essential AI terminology',
            fileUrl: '#',
            fileName: 'AI-Glossary-Cheatsheet.pdf'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is the best way to think about AI for everyday people?',
            options: [
              'A complicated computer program only experts can use',
              'A smart assistant that can help make life easier',
              'Something only young people can understand',
              'A replacement for human thinking'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'module-2',
        title: 'How AI Can Work With and For You',
        description: 'Understanding AI as your collaborative partner, not replacement',
        duration: 'Short video',
        completed: false,
        videoPath: 'How AI Can Work With and For You.mp4',
        content: `Working WITH AI, Not FOR AI

Think of AI as your research assistant and first-draft writer.

What AI Does Well:
• Research and summarize information
• Write first drafts of documents
• Organize and structure information
• Generate ideas and options
• Handle repetitive tasks

What You Do Best:
• Make final decisions
• Add personal touch and creativity
• Review and improve AI output
• Apply information to your situation
• Maintain relationships and values

The Partnership:
• AI does the prep work and heavy lifting
• You provide judgment, creativity, and personal insight
• Always review what AI creates
• Use AI as your starting point, not your final answer

This way you get more done while keeping your unique value and voice.`,
        activities: [
          {
            id: 'ai-collaboration-test',
            title: 'AI Partnership Experiment',
            type: 'exercise' as const,
            description: 'Practice collaborating with AI on a real project',
            instructions: [
              'Choose a current project or task you\'re working on',
              'Identify which parts AI could help with (research, drafting, organizing)',
              'Use AI to complete those parts, then add your personal touch',
              'Compare the final result to what you would have done alone',
              'Reflect on how this collaboration approach could improve your work'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'collaboration-guide',
            title: 'Human-AI Collaboration Best Practices',
            type: 'cheatsheet' as const,
            description: 'Quick reference for effective AI collaboration techniques',
            fileUrl: '#',
            fileName: 'AI-Collaboration-Guide.pdf'
          }
        ],
        quiz: [
          {
            id: 'q2',
            question: 'What\'s the best way to work with AI?',
            options: [
              'Let AI make all decisions for you',
              'Use AI output exactly as it\'s generated',
              'Partner with AI - let it handle preparation while you add creativity and judgment',
              'Only use AI for simple tasks'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'module-3',
        title: 'How Can AI Help Me for the Workforce?',
        description: 'Learn how AI can boost your career and workplace confidence',
        duration: 'Short video',
        completed: false,
        videoPath: 'How Can AI Help Me for the Workforce?.mp4',
        content: `AI for Career Success

AI helps you look professional and confident at work.

Job Search Support:
• Write better resumes and cover letters
• Practice interview answers
• Research companies quickly
• Improve your LinkedIn profile

Daily Work Help:
• Draft professional emails
• Prepare for meetings
• Learn industry updates
• Solve problems faster

Career Growth:
• Identify skill gaps
• Set clear goals
• Build your professional image

Key Point: AI doesn't replace your value - it helps you show your best professional self.`,
        activities: [
          {
            id: 'career-ai-audit',
            title: 'Career AI Opportunity Assessment',
            type: 'exercise' as const,
            description: 'Identify where AI can most help your career goals',
            instructions: [
              'List your top 3 career goals for the next year',
              'For each goal, identify 2-3 specific tasks AI could help with',
              'Choose one AI tool to try for each career goal',
              'Create an action plan for using AI in your professional development',
              'Set a timeline for implementing these AI solutions'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'career-ai-toolkit',
            title: 'AI Career Development Toolkit',
            type: 'template' as const,
            description: 'Templates and guides for using AI in career advancement',
            fileUrl: '#',
            fileName: 'Career-AI-Toolkit.xlsx'
          }
        ],
        quiz: [
          {
            id: 'q3',
            question: 'How can AI help with job interviews?',
            options: [
              'By attending the interview for you',
              'By helping you practice questions and research the company',
              'By guaranteeing you get the job',
              'By making you seem more technical'
            ],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'module-4',
        title: 'How Can AI Help My Productivity?',
        description: 'Discover practical ways AI can boost your daily productivity',
        duration: 'Short video',
        completed: false,
        videoPath: 'How Can AI Help My Productivity?.mp4',
        content: `How AI Boosts Your Productivity

AI handles the repetitive stuff so you can focus on what matters.

Simple Ways AI Helps:
• Writes email drafts from your key points
• Creates schedules and manages calendars  
• Organizes information and research
• Breaks big tasks into smaller steps
• Suggests next actions when you're stuck

Real Example: 
Instead of 30 minutes writing an email, give AI your main points and get a good draft in 2 minutes. You edit it and move on to important work.

The Goal: Let AI do the prep work while you handle the creative and personal parts.`,
        activities: [
          {
            id: 'productivity-experiment',
            title: 'AI Productivity Challenge',
            type: 'exercise' as const,
            description: 'Test AI tools for your biggest productivity pain points',
            instructions: [
              'Identify your top 3 daily productivity challenges',
              'Choose one AI tool to help with each challenge',
              'Use each tool for one specific task',
              'Document time saved and quality of results',
              'Plan how to integrate the most helpful tool into your routine'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'productivity-tools-guide',
            title: 'AI Productivity Tools Guide',
            type: 'workbook' as const,
            description: 'Comprehensive guide to AI tools for common productivity tasks',
            fileUrl: '#',
            fileName: 'AI-Productivity-Guide.pdf'
          }
        ],
        quiz: [
          {
            id: 'q4',
            question: 'What is the main benefit of using AI for productivity?',
            options: [
              'Working longer hours',
              'Replacing all human work',
              'Handling routine tasks so you can focus on important things',
              'Making everything completely automatic'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'module-5',
        title: 'Making the Best of AI',
        description: 'Maximize AI\'s benefits while maintaining your human value and ethics',
        duration: 'Short video',
        completed: false,
        videoPath: 'Making the Best of AI.mp4',
        content: `Using AI Effectively and Responsibly

Get the most from AI while staying true to yourself.

Smart AI Use:
• Start with tasks that take you the most time
• Try different tools to see what works
• Gradually add AI to your routine
• Focus on your biggest challenges first

Stay Human:
• Always check AI's work
• Add your personal touch
• Trust your instincts
• Keep building real relationships

Be Ethical:
• Be honest when you use AI help
• Respect others' work and privacy
• Use AI to help, not to trick people
• Stay aware of AI's limits

Future Success:
• Keep learning as AI improves
• Develop skills that work well with AI
• Help others learn to use AI well
• Remember: you control how AI fits your life

The best approach: Use AI thoughtfully to enhance your abilities while staying authentic.`,
        activities: [
          {
            id: 'ai-integration-plan',
            title: 'Personal AI Integration Strategy',
            type: 'reflection' as const,
            description: 'Create your personalized plan for using AI effectively and ethically',
            instructions: [
              'Identify 3 areas where AI could most benefit your life or work',
              'Choose specific AI tools for each area and set learning goals',
              'Define your personal ethics and boundaries for AI use',
              'Create a plan for staying updated on AI developments',
              'Set up a system for regularly evaluating and adjusting your AI use'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'ai-ethics-guide',
            title: 'Ethical AI Use Guidelines',
            type: 'cheatsheet' as const,
            description: 'Framework for responsible and ethical AI adoption',
            fileUrl: '#',
            fileName: 'AI-Ethics-Guide.pdf'
          },
          {
            id: 'ai-tools-comparison',
            title: 'AI Tools Comparison Chart',
            type: 'template' as const,
            description: 'Compare different AI tools to find the best fit for your needs',
            fileUrl: '#',
            fileName: 'AI-Tools-Comparison.xlsx'
          }
        ],
        quiz: [
          {
            id: 'q5',
            question: 'What\'s the most important principle for making the best of AI?',
            options: [
              'Using as many AI tools as possible',
              'Replacing all human work with AI',
              'Strategically using AI to enhance your abilities while maintaining your values',
              'Avoiding AI until it\'s perfect'
            ],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'module-6',
        title: 'The History and Future of AI',
        description: 'Learn about AI\'s journey from past to future and what it means for you',
        duration: 'Short video',
        completed: false,
        videoPath: 'The History and Future of AI.mp4',
        content: `AI's Quick Timeline
• Past: Started in research labs, was complicated
• Now: Easy-to-use apps and tools for everyone
• Future: Even more helpful and integrated into daily life

What You Need to Know:
• AI is proven and stable technology
• It keeps getting easier to use
• Starting now gives you an advantage
• You don't need to be an expert to benefit

The Point: AI went from rocket science to everyday tool. Learning the basics now sets you up for success.`,
        activities: [
          {
            id: 'ai-timeline-reflection',
            title: 'Personal AI Timeline',
            type: 'reflection' as const,
            description: 'Map your own relationship with AI technology over time',
            instructions: [
              'Think back to the first time you encountered AI (even if you didn\'t know it was AI)',
              'List 3-5 AI tools or features you\'ve adopted over the years',
              'Reflect on how your attitude toward AI has changed',
              'Identify one AI development you\'re most excited about for the future'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'ai-timeline-infographic',
            title: 'AI History Timeline',
            type: 'pdf' as const,
            description: 'Visual timeline of key AI milestones from 1950 to today',
            fileUrl: '#',
            fileName: 'AI-Timeline.pdf'
          }
        ],
        quiz: [
          {
            id: 'q6',
            question: 'Why is understanding AI\'s history important for everyday users?',
            options: [
              'To become an AI expert',
              'To understand it\'s a proven, evolving technology worth learning',
              'To impress others with technical knowledge',
              'To predict exactly what will happen next'
            ],
            correctAnswer: 1
          }
        ]
      }
    ]
  },
  {
    id: 'business-building',
    title: 'Business Building Basics',
    description: 'Start your business with confidence. Practical steps without the complexity.',
    duration: '4-5 hours',
    level: 'Beginner',
    skills: ['Brand Building', 'Marketing Basics', 'Business Planning'],
    certificate: 'Business Basics Mini Course Certificate',
    lessons: [
      {
        id: 'beautiful-brand',
        title: 'Build a Beautiful Brand — Even on a Shoestring Budget',
        description: 'Teaches affordable, beginner-friendly branding tips',
        duration: '25 min',
        completed: false,
        videoUrl: 'https://fkvjsgqjgissolpdqbdh.supabase.co/storage/v1/object/public/course-media/business-building/beautiful-brand/lesson-video.mp4',
        content: `Build Your Brand on a Budget

Your brand is how customers see and remember your business.

Brand Basics:
• Know your mission (why you exist)
• Define your personality (professional, friendly, etc.)  
• Know your customers and what they need
• Be consistent everywhere

Simple Brand Building:
• Use free tools like Canva for design
• Pick 2-3 colors and stick with them
• Choose simple, readable fonts
• Create templates for social media
• Write in the same voice everywhere

Budget Tips:
• Take good photos with your phone
• Use consistent colors and fonts
• Create simple templates
• Be authentic and helpful
• Focus on solving real problems

Remember: People connect with brands that are genuine and solve their problems, not perfect logos.`,
        activities: [
          {
            id: 'brand-foundation-worksheet',
            title: 'Brand Foundation Worksheet',
            type: 'exercise' as const,
            description: 'Define your brand\'s core elements',
            instructions: [
              'Write your business mission in one clear sentence',
              'List 5 words that describe your brand personality',
              'Describe your ideal customer in detail',
              'List 3 things that make you different from competitors',
              'Define what you promise to deliver to customers'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'brand-toolkit',
            title: 'DIY Brand Toolkit',
            type: 'template' as const,
            description: 'Templates and guides for creating your brand identity',
            fileUrl: '#',
            fileName: 'DIY-Brand-Toolkit.zip'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What is the most important element of a strong brand?',
            options: [
              'An expensive logo',
              'Consistent experience and authentic personality',
              'Having many social media followers',
              'Using trendy design elements'
            ],
            correctAnswer: 1
          }
        ]
      }
    ]
  },
  {
    id: 'web-development',
    title: 'Web Development Basics',
    description: 'Build your first simple website. Learn the essentials without getting overwhelmed.',
    duration: '5-6 hours',
    level: 'Beginner',
    skills: ['HTML Basics', 'CSS Basics', 'Website Building'],
    certificate: 'Web Development Basics Mini Course Certificate',
    lessons: [
      {
        id: 'frontend-dev',
        title: 'What is Front-End Development?',
        description: 'Learn what front-end development is and what front-end developers do every day',
        duration: '30 min',
        completed: false,
        videoUrl: 'https://fkvjsgqjgissolpdqbdh.supabase.co/storage/v1/object/public/course-media/web-development/frontend-dev/lesson-video.mp4',
        content: `Understanding Front-End Development

Front-end development is the art and science of creating the parts of websites and applications that users see and interact with directly.

What Front-End Developers Do:
• Build user interfaces (the visual parts of websites/apps)
• Ensure websites work on all devices and browsers
• Implement designs from UI/UX designers
• Optimize websites for speed and accessibility
• Connect front-end interfaces to back-end systems
• Debug and fix user interface issues

Core Technologies:
• HTML: The structure and content of web pages
• CSS: The styling and layout of web pages
• JavaScript: The interactive behavior of web pages
• Frameworks/Libraries: React, Vue, Angular, etc.
• Build Tools: Webpack, Vite, etc.
• Version Control: Git and GitHub

Daily Tasks:
• Writing clean, maintainable code
• Testing across different browsers and devices
• Collaborating with designers and back-end developers
• Staying updated with new technologies and best practices
• Problem-solving and debugging issues
• Optimizing performance and user experience

Career Opportunities:
• Front-End Developer
• UI Developer
• React/Vue/Angular Developer
• Full-Stack Developer
• Web Designer with coding skills
• Freelance web developer

Why It's Exciting:
• You see immediate visual results of your work
• High demand for skilled front-end developers
• Great entry point into tech careers
• Combines creativity with logical thinking
• Excellent remote work opportunities
• Constantly evolving with new tools and techniques

Whether you want to build your own projects, start a freelance business, or join a tech company, front-end development skills open many doors in today's digital world.`,
        activities: [
          {
            id: 'frontend-exploration',
            title: 'Front-End Developer Research',
            type: 'research' as const,
            description: 'Research front-end developer roles and requirements',
            instructions: [
              'Visit 3 job boards and find 5 front-end developer job postings',
              'List the most commonly required skills and technologies',
              'Note the salary ranges and experience levels',
              'Identify 2-3 companies you\'d be interested in working for',
              'Research the career path from junior to senior front-end developer'
            ],
            submissionType: 'text' as const
          }
        ],
        resources: [
          {
            id: 'frontend-roadmap',
            title: 'Front-End Developer Learning Roadmap',
            type: 'guide' as const,
            description: 'Step-by-step guide to becoming a front-end developer',
            fileUrl: '#',
            fileName: 'Frontend-Developer-Roadmap.pdf'
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'What are the three core technologies of front-end development?',
            options: [
              'HTML, CSS, Python',
              'HTML, CSS, JavaScript',
              'CSS, JavaScript, PHP',
              'HTML, JavaScript, SQL'
            ],
            correctAnswer: 1
          }
        ]
      }
    ]
  }
];

export const LearningDashboard: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const { session } = useAuth();
  const { progress, loading } = useLearningProgress();

  const filteredModules = learningModules.filter(module => 
    filterLevel === 'all' || module.level === filterLevel
  );

  const handleStartCourse = (module: any) => {
    setSelectedModule(module);
  };

  const handleBackToDashboard = () => {
    setSelectedModule(null);
  };

  const handleRegister = (courseId: string) => {
    // Registration logic would go here
    console.log('Registering for course:', courseId);
  };

  const isRegistered = (courseId: string) => {
    // Check if user is registered for this course
    return progress?.enrollments.includes(courseId) || false;
  };

  // Calculate total lessons across all courses for better progress calculation
  const totalLessonsAcrossAllCourses = learningModules.reduce((total, module) => total + module.lessons.length, 0);

  if (selectedModule) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={handleBackToDashboard}
          className="mb-4"
        >
          ← Back to Dashboard
        </Button>
        <InteractiveLearningModule module={selectedModule} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Learning Dashboard</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Quick, focused mini courses with just the essentials you need to get started
        </p>
      </div>

      {!session ? (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <LogIn className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Sign In to Access Mini Courses</CardTitle>
            <CardDescription>
              Create an account to track your progress and access focused learning content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => window.location.href = '/auth'}>
              Sign In / Sign Up
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Overview */}
          {progress && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Mini Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{progress.enrollments.length}</div>
                  <p className="text-xs text-muted-foreground">Active learning paths</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.values(progress?.completedLessons || {}).flat().length}</div>
                  <p className="text-xs text-muted-foreground">Lessons mastered</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalLessonsAcrossAllCourses > 0 && progress?.completedLessons
                      ? Math.round((Object.values(progress.completedLessons).flat().length / totalLessonsAcrossAllCourses) * 100) + '%'
                      : '0%'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Across all mini courses</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mini Course Filter */}
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mini Course Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => (
              <CoursePreview
                key={module.id}
                course={module}
                onRegister={handleRegister}
                isRegistered={isRegistered(module.id)}
                onStartCourse={() => handleStartCourse(module)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};