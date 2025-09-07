import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Plus, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Star, 
  Calendar,
  DollarSign,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

const mockClientProfile = {
  name: "Jane Smith",
  company: "TechCorp Inc.",
  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
  totalProjects: 8,
  activeProjects: 3,
  totalSpent: 28750,
  averageRating: 4.8
};

const mockProjects = [
  {
    id: 1,
    title: "E-commerce Platform Development",
    budget: "$5,000",
    status: "in-progress",
    proposals: 12,
    freelancer: {
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 4.9
    },
    deadline: "2024-02-15",
    progress: 65
  },
  {
    id: 2,
    title: "Mobile App UI/UX Design",
    budget: "$2,500",
    status: "completed",
    proposals: 8,
    freelancer: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 4.8
    },
    deadline: "2024-01-28",
    progress: 100
  },
  {
    id: 3,
    title: "SEO & Content Marketing",
    budget: "$1,800",
    status: "reviewing",
    proposals: 15,
    freelancer: null,
    deadline: "2024-02-20",
    progress: 0
  }
];

const mockFreelancers = [
  {
    id: 1,
    name: "John Doe",
    title: "Full-Stack Developer",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 4.9,
    reviews: 23,
    hourlyRate: 85,
    skills: ["React", "Node.js", "TypeScript"],
    status: "working" // working, completed, hired
  },
  {
    id: 2,
    name: "Sarah Chen",
    title: "UI/UX Designer",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 4.8,
    reviews: 31,
    hourlyRate: 75,
    skills: ["Figma", "Adobe XD", "Prototyping"],
    status: "completed"
  }
];

export default function ClientDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "reviewing": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />;
      case "in-progress": return <Clock className="h-4 w-4" />;
      case "reviewing": return <Eye className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
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
                    <AvatarImage src={mockClientProfile.avatar} alt={mockClientProfile.name} />
                    <AvatarFallback>{mockClientProfile.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold mb-1">{mockClientProfile.name}</h1>
                  <p className="text-muted-foreground mb-3">{mockClientProfile.company}</p>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{mockClientProfile.averageRating}</span>
                    <span className="text-muted-foreground">client rating</span>
                  </div>
                  
                  <Link to="/client-onboarding">
                    <Button className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Post New Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Stats Cards */}
              <div className="lg:w-2/3 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <Briefcase className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">{mockClientProfile.totalProjects}</div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                  </CardContent>
                </Card>
                
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{mockClientProfile.activeProjects}</div>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </CardContent>
                </Card>
                
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">${mockClientProfile.totalSpent.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </CardContent>
                </Card>
                
                <Card className="premium-card">
                  <CardContent className="card-padding-sm text-center">
                    <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{mockFreelancers.length}</div>
                    <p className="text-sm text-muted-foreground">Freelancers Hired</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 lg:w-96">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="freelancers">Team</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
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
                          <p className="text-sm text-muted-foreground">Mobile App UI/UX Design by Sarah Chen</p>
                          <p className="text-xs text-muted-foreground">2 days ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">Progress update</p>
                          <p className="text-sm text-muted-foreground">E-commerce Platform is 65% complete</p>
                          <p className="text-xs text-muted-foreground">5 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium">New proposals</p>
                          <p className="text-sm text-muted-foreground">15 proposals received for SEO project</p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card className="premium-card">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Manage your projects and team</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link to="/client-onboarding" className="block">
                        <Button className="w-full justify-start">
                          <Plus className="h-4 w-4 mr-2" />
                          Post New Project
                        </Button>
                      </Link>
                      <Link to="/freelancer-marketplace" className="block">
                        <Button className="w-full justify-start" variant="outline">
                          <Users className="h-4 w-4 mr-2" />
                          Browse Freelancers
                        </Button>
                      </Link>
                      <Button className="w-full justify-start" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Check Messages
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Projects</h2>
                  <Link to="/client-onboarding">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Post New Project
                    </Button>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {mockProjects.map((project) => (
                    <Card key={project.id} className="premium-card">
                      <CardContent className="card-padding">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{project.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{project.proposals} proposals</span>
                              <span>Budget: {project.budget}</span>
                              <span>Due: {new Date(project.deadline).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(project.status)} flex items-center gap-1`}>
                            {getStatusIcon(project.status)}
                            {project.status.replace('-', ' ')}
                          </Badge>
                        </div>

                        {project.freelancer ? (
                          <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={project.freelancer.avatar} alt={project.freelancer.name} />
                              <AvatarFallback>{project.freelancer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{project.freelancer.name}</p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                <span className="text-sm">{project.freelancer.rating}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Message
                            </Button>
                          </div>
                        ) : (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                            <p className="text-sm text-yellow-800">
                              {project.status === "reviewing" ? "Reviewing proposals" : "No freelancer assigned yet"}
                            </p>
                          </div>
                        )}
                        
                        {project.status === "in-progress" && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View Details</Button>
                          {project.status === "reviewing" && (
                            <Button size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Review Proposals ({project.proposals})
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Freelancers Tab */}
              <TabsContent value="freelancers" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Team</h2>
                  <Link to="/freelancer-marketplace">
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Find More Freelancers
                    </Button>
                  </Link>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-4">
                  {mockFreelancers.map((freelancer) => (
                    <Card key={freelancer.id} className="premium-card">
                      <CardContent className="card-padding">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={freelancer.avatar} alt={freelancer.name} />
                            <AvatarFallback>{freelancer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                            <p className="text-muted-foreground mb-2">{freelancer.title}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="font-medium">{freelancer.rating}</span>
                              <span className="text-muted-foreground text-sm">({freelancer.reviews})</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {freelancer.skills.map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">${freelancer.hourlyRate}/hr</span>
                              <Badge variant={freelancer.status === "working" ? "default" : "outline"}>
                                {freelancer.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" className="flex-1">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button size="sm" variant="outline">View Profile</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6">
                <h2 className="text-2xl font-bold">Messages</h2>
                
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Once you start working with freelancers, your conversations will appear here.
                  </p>
                  <Link to="/client-onboarding">
                    <Button>Post Your First Project</Button>
                  </Link>
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