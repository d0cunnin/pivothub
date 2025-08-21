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

// Real course content - AI & Technology and Business Building
const learningModules = [
  {
    id: 'ai-technology',
    title: 'AI & Technology for Everyday People',
    description: 'Master AI tools and concepts without tech overwhelm - designed specifically for non-technical people',
    duration: '6-8 weeks',
    level: 'Beginner',
    skills: ['AI Literacy', 'Productivity Tools', 'Digital Confidence', 'Future-Proofing'],
    certificate: 'AI Literacy for Everyday People Certificate',
    lessons: [
      {
        id: 'what-is-ai-and-why',
        title: 'What is AI and Why Should I Use It?',
        description: 'Breaks down AI in simple terms and explains why it\'s relevant to daily life',
        duration: '25 min',
        completed: false,
        videoPath: 'What is AI and Why Should I Use It??.mp4',
        content: `Welcome to AI & Technology for Everyday People!

In this course, we'll demystify AI and show you exactly how it can improve your daily life - no tech degree required.

What You'll Learn in This Lesson:
• What AI really is (in plain English)
• Why AI matters to YOU personally
• How AI is already part of your daily routine
• Simple examples you can relate to
• Why you don't need to be afraid of AI

Key Takeaway: AI isn't magic or rocket science - it's a powerful tool that can make your life easier, more productive, and more enjoyable. Think of it as having a really smart assistant who never gets tired and is always ready to help.

By the end of this lesson, you'll understand exactly what AI is and why it's worth learning about - even if you consider yourself "not a tech person."`,
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
        id: 'history-and-future-ai',
        title: 'The History and Future of AI',
        description: 'Learn about AI\'s journey from past to future and what it means for you',
        duration: '28 min',
        completed: false,
        videoPath: 'The History and Future of AI.mp4',
        content: `Understanding AI's Journey: Past, Present & Future

Knowing where AI came from and where it's heading helps you make better decisions about how to use it in your own life.

AI Timeline Highlights:
• 1950s: The birth of AI concepts
• 1990s: Early practical applications
• 2000s: Internet and data revolution
• 2010s: Machine learning breakthroughs
• 2020s: AI becomes accessible to everyone

What This Means for You:
• AI is not a new fad - it's here to stay
• The technology keeps getting easier to use
• Early adopters get the biggest advantages
• You don't need to wait for "perfect" AI to start benefiting

Future Trends to Watch:
• More personalized AI assistants
• Better integration with everyday tools
• Improved accuracy and reliability
• Greater accessibility for non-technical users`,
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
            id: 'q2',
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
      },
      {
        id: 'ai-productivity-help',
        title: 'How Can AI Help My Productivity?',
        description: 'Discover practical ways AI can boost your daily productivity',
        duration: '30 min',
        completed: false,
        videoPath: 'How Can AI Help My Productivity?.mp4',
        content: `Work Smarter, Not Harder with AI

The secret to productivity isn't working more hours - it's letting AI handle the boring, repetitive stuff so you can focus on what matters most.

AI Productivity Boosters:
• Automatic scheduling and calendar management
• Email drafting and response suggestions
• Task prioritization and planning
• Research and information gathering
• Document creation and editing
• Social media content planning

Mental Load Relief:
AI can help reduce the constant mental juggling we all do by:
• Remembering important dates and deadlines
• Organizing your thoughts and ideas
• Breaking big projects into manageable steps
• Keeping track of multiple ongoing tasks
• Suggesting next steps when you're stuck

Real Example: Instead of spending 30 minutes writing a professional email, you can give AI the key points and have a polished draft in 2 minutes. Then you spend your saved time on things that actually need your human touch.`,
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
            id: 'q3',
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
        id: 'ai-workforce-help',
        title: 'How Can AI Help Me for the Workforce?',
        description: 'Learn how AI can boost your career and workplace confidence',
        duration: '32 min',
        completed: false,
        videoPath: 'How Can AI Help Me for the Workforce?.mp4',
        content: `Build Work Confidence with AI Support

Whether you're job searching, wanting a promotion, or just trying to feel more confident at work, AI can be your secret weapon for professional growth.

Resume & Job Search Help:
• Writing compelling resume bullets
• Tailoring your resume for specific jobs
• Practicing interview questions and answers
• Researching companies before interviews
• Writing professional cover letters
• LinkedIn profile optimization

Daily Work Confidence:
• Drafting professional emails and messages
• Preparing for meetings and presentations
• Learning new skills relevant to your job
• Staying updated on industry trends
• Problem-solving when you're stuck
• Communicating complex ideas clearly

Career Development:
• Identifying skills gaps and learning paths
• Setting realistic professional goals
• Building a professional online presence
• Networking conversation starters
• Salary negotiation preparation

Remember: AI doesn't replace your unique value - it amplifies it by helping you present your best professional self.`,
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
            id: 'q4',
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
        id: 'ai-work-with-you',
        title: 'How AI Can Work With and For You',
        description: 'Understanding AI as your collaborative partner, not replacement',
        duration: '26 min',
        completed: false,
        videoPath: 'How AI Can Work With and For You.mp4',
        content: `AI: Your Collaborative Partner

Think of AI as having a team member who's excellent at research, writing first drafts, organizing information, and handling repetitive tasks - and they work alongside you, not instead of you.

What Your AI Partner Can Do:
• Research topics thoroughly and summarize findings
• Write first drafts of emails, documents, and reports
• Organize and categorize information
• Create outlines and structure for projects
• Generate ideas and brainstorm solutions
• Proofread and improve your writing
• Create schedules and manage timelines
• Handle data entry and organization

The Perfect Partnership:
• AI handles the preparation and grunt work
• You provide the creativity, judgment, and personal touch
• AI does the initial heavy lifting
• You refine, personalize, and make final decisions
• AI processes information quickly
• You interpret and apply it to your specific situation

Best Practices for AI Collaboration:
• Always review and edit AI output
• Use AI as a starting point, not the final product
• Combine AI efficiency with your human insight
• Be specific about what you need
• Think of AI as a collaborator, not a replacement

This partnership approach helps you accomplish more while staying true to your own voice and values.`,
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
            id: 'q5',
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
        id: 'making-best-of-ai',
        title: 'Making the Best of AI',
        description: 'Maximize AI\'s benefits while maintaining your human value and ethics',
        duration: '35 min',
        completed: false,
        videoPath: 'Making the Best of AI.mp4',
        content: `Getting the Most Out of AI While Staying True to Yourself

The goal isn't to become dependent on AI, but to use it strategically to enhance your natural abilities and achieve your personal and professional goals.

Maximizing AI Benefits:
• Start with your biggest pain points or time-consuming tasks
• Experiment with different AI tools to find what works for you
• Gradually integrate AI into your existing workflows
• Focus on AI applications that align with your values and goals
• Keep learning and adapting as AI technology improves

Maintaining Your Human Edge:
• Use AI to enhance, not replace, your critical thinking
• Always fact-check and verify AI-generated information
• Add your personal perspective and experience to AI outputs
• Maintain genuine human connections and relationships
• Trust your instincts when something doesn't feel right

Ethical AI Use:
• Be transparent when you've used AI assistance
• Respect others' privacy and intellectual property
• Use AI to help others, not to deceive or manipulate
• Stay informed about AI limitations and potential biases
• Consider the broader impact of your AI use on others

Future-Proofing Your Approach:
• Stay curious and open to new AI developments
• Focus on developing skills that complement AI
• Build a sustainable relationship with AI technology
• Help others learn to use AI responsibly
• Remember that you're in control of how AI fits into your life

The best AI users are those who thoughtfully integrate AI into their lives while maintaining their humanity, ethics, and unique value.`,
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
            id: 'q6',
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
      }
    ]
  },
  {
    id: 'business-building',
    title: 'Business Building for Beginners and Solopreneurs',
    description: 'Start and grow your business with confidence - no MBA required, just practical steps that work',
    duration: '8-10 weeks',
    level: 'Beginner',
    skills: ['Brand Building', 'Marketing Strategy', 'Financial Planning', 'AI Business Tools'],
    certificate: 'Small Business Fundamentals Certificate',
    lessons: [
      {
        id: 'beautiful-brand',
        title: 'Build a Beautiful Brand — Even on a Shoestring Budget',
        description: 'Teaches affordable, beginner-friendly branding tips',
        duration: '25 min',
        completed: false,
        videoUrl: 'https://fkvjsgqjgissolpdqbdh.supabase.co/storage/v1/object/public/course-media/business-building/beautiful-brand/lesson-video.mp4',
        content: `Create a Professional Brand Without Breaking the Bank

Your brand is more than just a logo - it's the complete experience people have with your business. Here's how to build something beautiful and memorable, even with limited funds.

Brand Foundation Elements:
• Your mission and values (why you exist)
• Your unique voice and personality
• Your target audience and their needs
• Your key differentiators and strengths
• Your brand promise and customer experience

Budget-Friendly Brand Building:

Visual Identity:
• Use free design tools like Canva or GIMP
• Choose a simple, readable font combination
• Pick a cohesive color palette (2-3 colors max)
• Create consistent visual templates
• Design a simple, memorable logo

Brand Voice:
• Define your personality (professional, friendly, edgy, etc.)
• Write in a consistent tone across all communications
• Use the same vocabulary and style everywhere
• Let your authentic personality shine through
• Stay true to your values in all messaging

Low-Cost Brand Building Tactics:
• Create branded social media templates
• Use consistent colors and fonts everywhere
• Develop a simple brand style guide
• Take professional-looking photos with your phone
• Write compelling copy that reflects your personality

Brand Experience:
• Deliver consistent quality in everything you do
• Respond promptly and professionally to customers
• Package/present your work beautifully
• Ask for feedback and testimonials
• Exceed expectations whenever possible

Remember: People connect with authentic brands that solve real problems. Focus on being genuinely helpful rather than trying to look "perfect."`,
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
    title: 'Intro to Web & Software Development',
    description: 'Learn the fundamentals of web and software development - perfect for beginners wanting to understand the tech world',
    duration: '6-8 weeks',
    level: 'Beginner',
    skills: ['HTML/CSS Basics', 'JavaScript Fundamentals', 'Development Concepts', 'Programming Logic', 'Vibe Coding', 'AI Agents'],
    certificate: 'Web Development Fundamentals Certificate',
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
          Master new skills with our comprehensive courses designed for real-world success
        </p>
      </div>

      {!session ? (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <LogIn className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Sign In to Access Courses</CardTitle>
            <CardDescription>
              Create an account to track your progress and access premium learning content
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
                  <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
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
                  <p className="text-xs text-muted-foreground">Across all courses</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Course Filter */}
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

          {/* Course Grid */}
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