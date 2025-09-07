import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Star, 
  DollarSign, 
  Clock, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Calendar,
  Settings,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

const mockProfile = {
  name: "John Doe",
  title: "Full-Stack Developer",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  rating: 4.9,
  reviews: 23,
  hourlyRate: 85,
  totalEarnings: 12450,
  completedProjects: 18,
  profileViews: 156,
  skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL"]
};

const mockProjects = [
  {
    id: 1,
    title: "E-commerce Platform Development",
    client: "TechCorp Inc.",
    budget: "$5,000",
    status: "in-progress",
    deadline: "2024-02-15",
    progress: 65
  },
  {
    id: 2,
    title: "Mobile App UI/UX Design",
    client: "StartupXYZ",
    budget: "$2,500",
    status: "completed",
    deadline: "2024-01-28",
    progress: 100
  },
  {
    id: 3,
    title: "API Integration Project",
    client: "DataFlow Ltd.",
    budget: "$1,800",
    status: "pending",
    deadline: "2024-02-20",
    progress: 0
  }
];

const mockMessages = [
  {
    id: 1,
    client: "Sarah Chen",
    project: "E-commerce Platform",
    lastMessage: "Great progress on the frontend! Can we schedule a call?",
    time: "2 hours ago",
    unread: true
  },
  {
    id: 2,
    client: "Mike Rodriguez",
    project: "Mobile App Design",
    lastMessage: "Thanks for the final deliverables. Excellent work!",
    time: "1 day ago",
    unread: false
  }
];

export default function FreelancerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />;
      case "in-progress": return <Clock className="h-4 w-4" />;
      case "pending": return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="section-spacing-sm">
        <div className="page-container">
          <div className="content-width">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <Card className="lg:w-1/3 premium-card">
                <CardContent className="card-padding text-center">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={mockProfile.avatar} alt={mockProfile.name} />
                    <AvatarFallback>{mockProfile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold mb-1">{mockProfile.name}</h1>
                  <p className="text-muted-foreground mb-3">{mockProfile.title}</p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{mockProfile.rating}</span>
                    <span className="text-muted-foreground">({mockProfile.reviews} reviews)</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {mockProfile.skills.slice(0, 3).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {mockProfile.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mockProfile.skills.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="lg:w-2/3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <DollarSign className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">${mockProfile.totalEarnings.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                  </CardContent>
                </Card>
                
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{mockProfile.completedProjects}</div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
                
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">${mockProfile.hourlyRate}</div>
                    <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  </CardContent>
                </Card>
                
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <Eye className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{mockProfile.profileViews}</div>
                    <p className="text-sm text-muted-foreground">Profile Views</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 lg:w-96">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Recent Activity */}
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Project completed</p>
                          <p className="text-sm text-muted-foreground">Mobile App UI/UX Design for StartupXYZ</p>
                          <p className="text-xs text-muted-foreground">2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">New message received</p>
                          <p className="text-sm text-muted-foreground">From Sarah Chen about E-commerce Platform</p>
                          <p className="text-xs text-muted-foreground">5 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Profile viewed</p>
                          <p className="text-sm text-muted-foreground">12 new profile views this week</p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Manage your freelancer profile and projects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button className="w-full justify-start" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Browse Available Projects
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Check Messages
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Portfolio
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Projects</h2>
                  <Link to="/browse-projects">
                    <Button>Browse New Projects</Button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {mockProjects.map((project) => (
                    <Card key={project.id} className="premium-card">
                      <CardContent className="card-padding">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
                            <p className="text-muted-foreground">Client: {project.client}</p>
                          </div>
                          <Badge className={`${getStatusColor(project.status)} flex items-center gap-1`}>
                            {getStatusIcon(project.status)}
                            {project.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="font-semibold">{project.budget}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Deadline</p>
                            <p className="font-semibold">{new Date(project.deadline).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Progress</p>
                            <p className="font-semibold">{project.progress}%</p>
                          </div>
                        </div>
                        
                        {project.status === "in-progress" && (
                          <div className="w-full bg-muted rounded-full h-2 mb-4">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View Details</Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message Client
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Messages</h2>
                  <Badge variant="secondary">
                    {mockMessages.filter(m => m.unread).length} unread
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {mockMessages.map((message) => (
                    <Card key={message.id} className={`premium-card cursor-pointer hover-scale ${message.unread ? 'border-primary/50' : ''}`}>
                      <CardContent className="card-padding">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{message.client}</h3>
                              {message.unread && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{message.project}</p>
                            <p className="text-sm">{message.lastMessage}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{message.time}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <h2 className="text-2xl font-bold">Profile Settings</h2>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>Update your basic profile details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">Edit Profile</Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle>Portfolio</CardTitle>
                      <CardDescription>Manage your portfolio and work samples</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">Manage Portfolio</Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle>Rates & Availability</CardTitle>
                      <CardDescription>Update your hourly rate and availability</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">Update Rates</Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle>Notifications</CardTitle>
                      <CardDescription>Manage email and platform notifications</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full" variant="outline">Notification Settings</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}