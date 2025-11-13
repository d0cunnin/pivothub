import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, Activity, Search, Calendar, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupabaseUsageMonitor } from "@/components/SupabaseUsageMonitor";
import { PlatformAnalytics } from "@/components/admin/PlatformAnalytics";
import { RevenueAnalytics } from "@/components/admin/RevenueAnalytics";
import { UserDetailModal } from "@/components/admin/UserDetailModal";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { AssessmentAnalytics } from "@/components/admin/AssessmentAnalytics";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { CostAnalytics } from "@/components/admin/CostAnalytics";
import { SignupAuditViewer } from "@/components/admin/SignupAuditViewer";
import { FraudDetectionPanel } from "@/components/admin/FraudDetectionPanel";

interface UserWithSubscription {
  id: string;
  email: string;
  display_name?: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_package?: string;
  subscription_end?: string;
}

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [tier, setTier] = useState("Pro");
  const [duration, setDuration] = useState("1-month");
  const [notes, setNotes] = useState("");
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<{ id: string; email: string } | null>(null);

  // Fetch all users with subscription data
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name");

      const { data: secureData, error: secureError } = await supabase
        .from("subscribers_secure")
        .select("user_id, email");

      const { data: subscribers, error: subscribersError } = await supabase
        .from("subscribers_public")
        .select("user_id, subscribed, subscription_tier, subscription_package, subscription_end");

      if (profilesError) console.error("Error fetching profiles:", profilesError);
      if (secureError) console.error("Error fetching secure data:", secureError);
      if (subscribersError) console.error("Error fetching subscribers:", subscribersError);

      // Use profiles as the base (all registered users should have a profile)
      const combinedData: UserWithSubscription[] = profiles?.map(profile => {
        const secure = secureData?.find(s => s.user_id === profile.id);
        const subscription = subscribers?.find(s => s.user_id === profile.id);

        return {
          id: profile.id,
          email: secure?.email || "",
          display_name: profile.display_name,
          subscribed: subscription?.subscribed || false,
          subscription_tier: subscription?.subscription_tier,
          subscription_package: subscription?.subscription_package,
          subscription_end: subscription?.subscription_end,
        };
      }) || [];

      return combinedData;
    },
  });

  // Grant access mutation
  const grantAccessMutation = useMutation({
    mutationFn: async (params: { userId: string; tier: string; duration: string; notes: string }) => {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to manage subscriptions");
      }

      const { data, error } = await supabase.functions.invoke("admin-manage-subscription", {
        body: {
          action: "grant",
          userId: params.userId,
          tier: params.tier,
          duration: params.duration,
          notes: params.notes,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Access Granted",
        description: "Subscription has been successfully granted to the user.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setGrantModalOpen(false);
      setSelectedUser(null);
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to grant access",
        variant: "destructive",
      });
    },
  });

  const handleGrantAccess = () => {
    if (!selectedUser) return;
    grantAccessMutation.mutate({
      userId: selectedUser.id,
      tier,
      duration,
      notes,
    });
  };

  const openGrantModal = (user: UserWithSubscription) => {
    setSelectedUser(user);
    setGrantModalOpen(true);
  };

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id.includes(searchQuery)
  );

  const [liveStats, setLiveStats] = useState({
    totalUsers: users?.length || 0,
    activeSubscriptions: users?.filter(u => u.subscribed).length || 0,
    trialUsers: 0,
  });

  useEffect(() => {
    if (users) {
      setLiveStats({
        totalUsers: users.length,
        activeSubscriptions: users.filter(u => u.subscribed).length,
        trialUsers: 0,
      });
    }
  }, [users]);

  useEffect(() => {
    // Subscribe to new users
    const userChannel = supabase
      .channel('admin-users')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'profiles'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        setLiveStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }));
      })
      .subscribe();

    // Subscribe to subscription changes
    const subChannel = supabase
      .channel('admin-subscriptions')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'subscribers_public'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        if (payload.new.subscribed && !payload.old.subscribed) {
          setLiveStats(prev => ({ ...prev, activeSubscriptions: prev.activeSubscriptions + 1 }));
        } else if (!payload.new.subscribed && payload.old.subscribed) {
          setLiveStats(prev => ({ ...prev, activeSubscriptions: Math.max(0, prev.activeSubscriptions - 1) }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(subChannel);
    };
  }, [queryClient]);

  const exportToCSV = () => {
    if (!filteredUsers) return;
    
    const csvContent = [
      ["Email", "Name", "Status", "Tier", "Package", "Expires"].join(","),
      ...filteredUsers.map(user => [
        user.email,
        user.display_name || "",
        user.subscribed ? "Active" : "Explore Mode",
        user.subscription_tier || "",
        user.subscription_package || "None",
        user.subscription_end || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Manage user access and subscriptions</p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold transition-all duration-300">{liveStats.activeSubscriptions}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold transition-all duration-300">{liveStats.trialUsers}</div>
                  </CardContent>
                </Card>
              </div>
              
              <PlatformAnalytics />
              <RevenueAnalytics />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage user subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email, name, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button onClick={exportToCSV} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                          </TableRow>
                        ) : filteredUsers?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center">No users found</TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers?.map((user) => (
                            <TableRow 
                              key={user.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedUserDetail({ id: user.id, email: user.email });
                                setUserDetailModalOpen(true);
                              }}
                            >
                              <TableCell className="font-medium">{user.email}</TableCell>
                              <TableCell>{user.display_name || "-"}</TableCell>
                              <TableCell>
                                {user.subscribed ? (
                                  <Badge>Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Free</Badge>
                                )}
                              </TableCell>
                              <TableCell>{user.subscription_tier || "-"}</TableCell>
                              <TableCell>
                                {user.subscription_end
                                  ? new Date(user.subscription_end).toLocaleDateString()
                                  : "-"}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  onClick={() => openGrantModal(user)}
                                >
                                  Manage Access
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsDashboard />
              <AssessmentAnalytics />
            </TabsContent>

            <TabsContent value="cost" className="space-y-6">
              <CostAnalytics />
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <ActivityFeed />
              <AuditLogViewer />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <FraudDetectionPanel />
              <SignupAuditViewer />
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <SupabaseUsageMonitor />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>

      {selectedUserDetail && (
        <UserDetailModal
          userId={selectedUserDetail.id}
          userEmail={selectedUserDetail.email}
          isOpen={userDetailModalOpen}
          onClose={() => {
            setUserDetailModalOpen(false);
            setSelectedUserDetail(null);
          }}
        />
      )}

      {/* Grant Access Modal */}
      <Dialog open={grantModalOpen} onOpenChange={setGrantModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Subscription Access</DialogTitle>
            <DialogDescription>
              Manually grant subscription access to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-month">1 Month</SelectItem>
                  <SelectItem value="3-months">3 Months</SelectItem>
                  <SelectItem value="6-months">6 Months</SelectItem>
                  <SelectItem value="1-year">1 Year</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Beta tester, Partner access, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantAccess} disabled={grantAccessMutation.isPending}>
              {grantAccessMutation.isPending ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
};

export default Admin;
