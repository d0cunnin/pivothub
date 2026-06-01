import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthGuard } from "@/components/AuthGuard";
import { PlatformOnboarding } from "@/components/PlatformOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, BarChart3, Calendar, CreditCard, TrendingUp, Zap, Award, BookOpen, Rocket, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { getPackageDisplayName } from "@/utils/packageAccess";
import { CreateItBlueprint, EMPTY_FORM } from "@/types/createit";
import { downloadCreateItBlueprintPDF } from "@/lib/CreateItBlueprintPDF";
import { toast } from "sonner";

interface ToolUsage {
  tool_name: string;
  count: number;
  last_used: string;
}

interface UserProgress {
  assessment_type: string;
  achieved_at: string;
  milestone?: string;
}

interface CreateItProject {
  id: string;
  platform_name: string;
  platform_description: string | null;
  industry: string | null;
  platform_type: string | null;
  blueprint_json: CreateItBlueprint;
  created_at: string;
}

const Dashboard = () => {
  const { user, subscribed, subscriptionTier, subscriptionPackage, subscriptionEnd } = useAuth();
  const { monthlyRequests, remainingRequests, totalAvailable, rolloverCredits } = useUsage();
  const [toolUsage, setToolUsage] = useState<ToolUsage[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [courseEnrollments, setCourseEnrollments] = useState<number>(0);
  const [createItProjects, setCreateItProjects] = useState<CreateItProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      checkOnboarding();
    }
  }, [user]);

  const checkOnboarding = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking onboarding:', error);
        return;
      }

      if (!data || !data.onboarding_completed) {
        setShowOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load tool usage analytics
      const { data: analyticsData } = await supabase
        .from('tool_usage_analytics')
        .select('tool_name, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (analyticsData) {
        const toolCounts = analyticsData.reduce((acc: Record<string, { count: number; last_used: string }>, curr) => {
          if (!acc[curr.tool_name]) {
            acc[curr.tool_name] = { count: 0, last_used: curr.created_at };
          }
          acc[curr.tool_name].count++;
          return acc;
        }, {});

        const toolUsageArray = Object.entries(toolCounts)
          .map(([tool_name, data]) => ({
            tool_name,
            count: data.count,
            last_used: data.last_used
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setToolUsage(toolUsageArray);
      }

      // Load user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('assessment_type, achieved_at, milestone')
        .eq('user_id', user?.id)
        .order('achieved_at', { ascending: false })
        .limit(5);

      if (progressData) {
        setUserProgress(progressData);
      }

      // Load course enrollments
      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setCourseEnrollments(count || 0);

      // Load Create It platform blueprints (My Projects / Saved Blueprints)
      const { data: blueprintData } = await supabase
        .from('create_it_blueprints')
        .select('id, platform_name, platform_description, industry, platform_type, blueprint_json, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (blueprintData) {
        setCreateItProjects(blueprintData as unknown as CreateItProject[]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const usagePercentage = totalAvailable > 0 ? ((monthlyRequests / totalAvailable) * 100) : 0;

  const downloadBlueprint = (project: CreateItProject) => {
    try {
      downloadCreateItBlueprintPDF({
        form: {
          ...EMPTY_FORM,
          appName: project.platform_name,
          platformDescription: project.platform_description || "",
          primaryPurpose: project.industry || "",
          platformType: project.platform_type || "",
        },
        blueprint: project.blueprint_json,
        userName: user?.email || undefined,
      });
      toast.success("Blueprint downloaded as PDF!");
    } catch (error) {
      console.error("PDF download failed:", error);
      toast.error("Could not download the blueprint.");
    }
  };

  return (
    <AuthGuard>
      <PlatformOnboarding open={showOnboarding} onOpenChange={setShowOnboarding} />
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <Header />
        <main className="flex-1 pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back! Here's an overview of your activity and progress.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {/* AI Usage Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Requests</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{remainingRequests} / {totalAvailable}</div>
                  <p className="text-xs text-muted-foreground">
                    {rolloverCredits > 0 ? `(+${rolloverCredits} rolled over)` : `Used ${monthlyRequests} this month`}
                  </p>
                  <Progress value={usagePercentage} className="mt-2" />
                </CardContent>
              </Card>

              {/* Subscription Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plan</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">
                    {subscribed ? getPackageDisplayName(subscriptionPackage) : 'Explore Mode'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {subscribed && subscriptionEnd
                      ? `Renews ${new Date(subscriptionEnd).toLocaleDateString()}`
                      : '5 free credits per month'}
                  </p>
                </CardContent>
              </Card>

              {/* Tools Used Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tools Used</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{toolUsage.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Different tools accessed
                  </p>
                </CardContent>
              </Card>

              {/* Courses Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{courseEnrollments}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently enrolled
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {/* Tool Usage Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Most Used Tools
                  </CardTitle>
                  <CardDescription>Your top 5 tools by usage</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : toolUsage.length > 0 ? (
                    <div className="space-y-3">
                      {toolUsage.map((tool, index) => (
                        <div key={tool.tool_name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{tool.tool_name}</div>
                              <div className="text-xs text-muted-foreground">
                                Last used {new Date(tool.last_used).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-xl font-bold">{tool.count}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No tool usage yet</p>
                      <p className="text-sm">Start using PivotHub tools to see your activity here</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Progress
                  </CardTitle>
                  <CardDescription>Your latest achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : userProgress.length > 0 ? (
                    <div className="space-y-3">
                      {userProgress.map((progress, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Award className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium capitalize">{progress.assessment_type}</div>
                            {progress.milestone && (
                              <div className="text-sm text-muted-foreground">{progress.milestone}</div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(progress.achieved_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No progress recorded yet</p>
                      <p className="text-sm">Complete assessment tools to track your progress</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Create It — AI Platform Blueprints */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="h-5 w-5" />
                      My AI Platform Blueprints
                    </CardTitle>
                    <CardDescription>Your saved Create It blueprints and downloads</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/createit">
                      New Blueprint <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => <div key={i} className="h-14 bg-muted animate-pulse rounded" />)}
                  </div>
                ) : createItProjects.length > 0 ? (
                  <div className="space-y-3">
                    {createItProjects.map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{project.platform_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {project.industry ? `${project.industry} · ` : ""}
                            {new Date(project.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" variant="ghost" onClick={() => downloadBlueprint(project)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/createit">View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Rocket className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No platform blueprints yet</p>
                    <p className="text-sm">Use Create It to design your first AI-powered platform</p>
                    <Button className="mt-4" asChild>
                      <Link to="/createit">Open Create It</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with popular features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                    <Link to="/createit">
                      <Rocket className="h-6 w-6" />
                      <span>Create a Platform</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                    <Link to="/assessit">
                      <BarChart3 className="h-6 w-6" />
                      <span>Take Assessment</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                    <Link to="/learnit">
                      <BookOpen className="h-6 w-6" />
                      <span>Browse Courses</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                    <Link to="/pricing">
                      <CreditCard className="h-6 w-6" />
                      <span>Manage Plan</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
                    <Link to="/settings">
                      <Activity className="h-6 w-6" />
                      <span>Account Settings</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
