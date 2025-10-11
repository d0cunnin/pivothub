import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Clock, 
  Target, 
  Search,
  Filter,
  Star,
  Users,
  Calendar,
  CheckCircle,
  ArrowRight,
  Brain,
  Briefcase
} from 'lucide-react';

// Enhanced learning path data with skill assessments integration
const learningPaths = [
  {
    id: 'data-science',
    title: 'Data Science Career Path',
    description: 'Transform into a data scientist with Python, machine learning, and statistics',
    duration: '12 weeks',
    level: 'Beginner to Advanced',
    category: 'Technology',
    rating: 4.8,
    enrollments: 15420,
    skills: ['Python', 'Statistics', 'Machine Learning', 'SQL', 'Data Visualization'],
    modules: [
      { name: 'Python Fundamentals', duration: '2 weeks', completed: false },
      { name: 'Statistics & Probability', duration: '2 weeks', completed: false },
      { name: 'Data Analysis with Pandas', duration: '3 weeks', completed: false },
      { name: 'Machine Learning Basics', duration: '3 weeks', completed: false },
      { name: 'Capstone Project', duration: '2 weeks', completed: false }
    ],
    prerequisites: ['Basic Math', 'Computer Literacy'],
    careerOutcomes: ['Data Scientist', 'Data Analyst', 'ML Engineer'],
    salaryRange: '$70,000 - $140,000',
    jobGrowth: '+22%'
  },
  {
    id: 'full-stack-dev',
    title: 'Full Stack Developer Path',
    description: 'Master front-end and back-end development to build complete web applications',
    duration: '16 weeks',
    level: 'Beginner',
    category: 'Technology',
    rating: 4.7,
    enrollments: 23150,
    skills: ['JavaScript', 'React', 'Node.js', 'Databases', 'CSS'],
    modules: [
      { name: 'HTML/CSS Foundations', duration: '2 weeks', completed: false },
      { name: 'JavaScript Mastery', duration: '4 weeks', completed: false },
      { name: 'React Development', duration: '4 weeks', completed: false },
      { name: 'Backend with Node.js', duration: '3 weeks', completed: false },
      { name: 'Database Integration', duration: '2 weeks', completed: false },
      { name: 'Final Project', duration: '1 week', completed: false }
    ],
    prerequisites: ['Basic Computer Skills'],
    careerOutcomes: ['Full Stack Developer', 'Frontend Developer', 'Backend Developer'],
    salaryRange: '$60,000 - $120,000',
    jobGrowth: '+8%'
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing Specialist',
    description: 'Learn modern marketing strategies, analytics, and campaign management',
    duration: '8 weeks',
    level: 'Beginner to Intermediate',
    category: 'Marketing',
    rating: 4.6,
    enrollments: 18750,
    skills: ['SEO', 'Social Media', 'Analytics', 'Content Marketing', 'Paid Advertising'],
    modules: [
      { name: 'Marketing Fundamentals', duration: '1 week', completed: false },
      { name: 'SEO & Content Strategy', duration: '2 weeks', completed: false },
      { name: 'Social Media Marketing', duration: '2 weeks', completed: false },
      { name: 'Paid Advertising (PPC)', duration: '2 weeks', completed: false },
      { name: 'Analytics & Optimization', duration: '1 week', completed: false }
    ],
    prerequisites: ['Basic Computer Skills', 'Communication Skills'],
    careerOutcomes: ['Digital Marketing Specialist', 'SEO Manager', 'Social Media Manager'],
    salaryRange: '$45,000 - $85,000',
    jobGrowth: '+10%'
  },
  {
    id: 'project-management',
    title: 'Project Management Professional',
    description: 'Lead projects successfully with agile methodologies and management tools',
    duration: '10 weeks',
    level: 'Intermediate',
    category: 'Business',
    rating: 4.9,
    enrollments: 12680,
    skills: ['Project Planning', 'Agile/Scrum', 'Risk Management', 'Leadership', 'Communication'],
    modules: [
      { name: 'Project Management Basics', duration: '2 weeks', completed: false },
      { name: 'Agile & Scrum Methodology', duration: '2 weeks', completed: false },
      { name: 'Risk & Resource Management', duration: '2 weeks', completed: false },
      { name: 'Leadership & Communication', duration: '2 weeks', completed: false },
      { name: 'PMP Certification Prep', duration: '2 weeks', completed: false }
    ],
    prerequisites: ['Work Experience', 'Basic Leadership Experience'],
    careerOutcomes: ['Project Manager', 'Scrum Master', 'Program Manager'],
    salaryRange: '$75,000 - $130,000',
    jobGrowth: '+7%'
  }
];

const skillCategories = [
  { name: 'Technology', count: 45, icon: '💻' },
  { name: 'Business', count: 32, icon: '📊' },
  { name: 'Marketing', count: 28, icon: '📈' },
  { name: 'Design', count: 24, icon: '🎨' },
  { name: 'Healthcare', count: 18, icon: '🏥' },
  { name: 'Finance', count: 22, icon: '💰' }
];

interface EnhancedUpskillDashboardProps {
  onRecommendation?: (pathId: string) => void;
}

export const EnhancedUpskillDashboard: React.FC<EnhancedUpskillDashboardProps> = ({
  onRecommendation 
}) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [enrolledPaths, setEnrolledPaths] = useState<Set<string>>(new Set());
  const [pathProgress, setPathProgress] = useState<Record<string, number>>({});

  const handleEnroll = (pathId: string) => {
    setEnrolledPaths(prev => new Set([...prev, pathId]));
    setPathProgress(prev => ({ ...prev, [pathId]: 0 }));
    onRecommendation?.(pathId);
  };

  const filteredPaths = learningPaths.filter(path => {
    const matchesSearch = path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || path.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesLevel = filterLevel === 'all' || path.level.toLowerCase().includes(filterLevel.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const currentPath = learningPaths.find(p => p.id === selectedPath);

  // Individual learning path detailed view
  if (currentPath) {
    const progress = pathProgress[currentPath.id] || 0;
    const isEnrolled = enrolledPaths.has(currentPath.id);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedPath(null)}>
            ← Back to Paths
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{currentPath.title}</h2>
            <p className="text-muted-foreground">Detailed learning path</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Path Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{currentPath.title}</CardTitle>
                    <CardDescription className="mt-2">{currentPath.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{currentPath.rating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isEnrolled && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{currentPath.duration}</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div className="text-center">
                    <Target className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{currentPath.level}</div>
                    <div className="text-xs text-muted-foreground">Level</div>
                  </div>
                  <div className="text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">{currentPath.enrollments.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Students</div>
                  </div>
                  <div className="text-center">
                    <Award className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-sm font-medium">Certificate</div>
                    <div className="text-xs text-muted-foreground">Included</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Course Modules</h4>
                  {currentPath.modules.map((module, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          module.completed ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {module.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{module.name}</div>
                          <div className="text-sm text-muted-foreground">{module.duration}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!isEnrolled && (
                  <Button 
                    onClick={() => handleEnroll(currentPath.id)} 
                    className="w-full bg-gradient-primary"
                    size="lg"
                  >
                    Enroll in Path
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentPath.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Career Outcomes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Potential Roles</h4>
                  <div className="space-y-1">
                    {currentPath.careerOutcomes.map((role, index) => (
                      <div key={index} className="text-sm text-muted-foreground">• {role}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Salary Range</h4>
                  <p className="text-sm text-muted-foreground">{currentPath.salaryRange}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Job Growth</h4>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">{currentPath.jobGrowth}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Your Upskilling Journey</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover personalized learning paths based on your goals and current skills.
          Build expertise in high-demand areas and advance your career.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Paths</CardTitle>
            <BookOpen className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learningPaths.length}</div>
            <p className="text-xs text-muted-foreground">Career-focused programs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
            <Target className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledPaths.size}</div>
            <p className="text-xs text-muted-foreground">Active learning paths</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Categories</CardTitle>
            <Brain className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillCategories.length}</div>
            <p className="text-xs text-muted-foreground">Different specializations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Career Growth</CardTitle>
            <Briefcase className="h-4 w-4 ml-auto text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+15%</div>
            <p className="text-xs text-muted-foreground">Avg. salary increase</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search learning paths, skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="design">Design</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Learning Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPaths.map((path) => {
          const isEnrolled = enrolledPaths.has(path.id);
          const progress = pathProgress[path.id] || 0;

          return (
            <Card key={path.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{path.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{path.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight">{path.title}</CardTitle>
                    <CardDescription className="mt-2">{path.description}</CardDescription>
                  </div>
                  {isEnrolled && (
                    <Badge className="bg-gradient-primary text-white ml-2">
                      Enrolled
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{path.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span>{path.level}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{path.enrollments.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{path.modules.length} modules</span>
                  </div>
                </div>

                {isEnrolled && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium">Key Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {path.skills.slice(0, 3).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {path.skills.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{path.skills.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedPath(path.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  {!isEnrolled ? (
                    <Button 
                      onClick={() => handleEnroll(path.id)}
                      className="flex-1 bg-gradient-primary"
                    >
                      Enroll Now
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setSelectedPath(path.id)}
                      className="flex-1 bg-gradient-primary"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPaths.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No learning paths found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or explore our skill categories
            </p>
          </CardContent>
        </Card>
      )}

      {/* Skill Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Explore by Skill Category</CardTitle>
          <CardDescription>
            Discover learning opportunities across different industries and specializations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {skillCategories.map((category, index) => (
              <button
                key={index}
                className="p-4 text-center border rounded-lg hover:bg-accent transition-colors"
                onClick={() => setFilterCategory(category.name.toLowerCase())}
              >
                <div className="text-2xl mb-2">{category.icon}</div>
                <div className="font-medium text-sm">{category.name}</div>
                <div className="text-xs text-muted-foreground">{category.count} courses</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};