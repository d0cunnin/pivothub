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
import { AIUsageMonitor } from "@/components/admin/AIUsageMonitor";
import { AdminTwoStepGate } from "@/components/admin/AdminTwoStepGate";
import { AIUsageAlerts } from "@/components/admin/AIUsageAlerts";
import { useAuth } from "@/contexts/AuthContext";
import { monthlyAdminCredits } from "../../supabase/functions/_shared/adminCreditPolicy";

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
  const { refreshSubscription } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [tier, setTier] = useState("starter");
  const [duration, setDuration] = useState("1");
  const [customCredits, setCustomCredits] = useState("40");
  const [grantRequestId, setGrantRequestId] = useState(() => crypto.randomUUID());
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
        .rpc("get_subscriber_secure_data");

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
          email: secure?.email_masked || "",
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
    mutationFn: async (params: { userId: string; plan: string; months: number; note: string; requestId: string; customCredits?: number }) => {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to grant Tool Credits");
      }

      monthlyAdminCredits(params.plan, params.customCredits);
      const { data, error } = await supabase.functions.invoke("admin-grant-credits", { body: params });
      if (error) {
        let message = error.message;
        if (error.context instanceof Response) {
          const details = await error.context.json().catch(() => null);
          message = details?.error || message;
        }
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);
      return data as { credits: number; months: number; balance: { remaining: number } };
    },
    onSuccess: (data) => {
      toast({
        title: "Complimentary Tool Credits Granted",
        description: `${data.credits} Tool Credits per month for ${data.months} month(s). New available balance: ${data.balance.remaining} Tool Credits.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries();
      void refreshSubscription();
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
      plan: tier,
      months: Number(duration),
      note: notes,
      requestId: grantRequestId,
      customCredits: tier === "custom" ? Number(customCredits) : undefined,
    });
  };

  const openGrantModal = (user: UserWithSubscription) => {
    setSelectedUser(user);
    setGrantRequestId(crypto.randomUUID());
    setTier("starter");
    setDuration("1");
    setCustomCredits("40");
    setNotes("");
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
        user.subscribed ? "Active" : "Free plan",
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

          <AIUsageAlerts />

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="ai-usage">AI Usage</TabsTrigger>
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

            <TabsContent value="ai-usage" className="space-y-6">
              <AIUsageAlerts />
              <AIUsageMonitor />
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
            <DialogTitle>Grant Complimentary Tool Credits</DialogTitle>
            <DialogDescription>
              Grant credits to {selectedUser?.display_name || selectedUser?.email || selectedUser?.id}. No paid subscription or charge is created.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <AdminTwoStepGate onVerifiedChange={setMfaVerified} />
            <div>
              <Label htmlFor="tier">Monthly Tool Credits</Label>
              <Select value={tier} onValueChange={value => { setTier(value); setGrantRequestId(crypto.randomUUID()); }}>
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter — 40/month</SelectItem>
                  <SelectItem value="pro">Pro — 100/month</SelectItem>
                  <SelectItem value="all-access">All-Access — 250/month</SelectItem>
                  <SelectItem value="custom">Custom credits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tier === "custom" && <div>
              <Label htmlFor="custom-credits">Credits per month</Label>
              <Input id="custom-credits" type="number" min={1} max={100000} step={1} value={customCredits} onChange={event => { setCustomCredits(event.target.value); setGrantRequestId(crypto.randomUUID()); }} />
            </div>}

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={value => { setDuration(value); setGrantRequestId(crypto.randomUUID()); }}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">The first month's credits are available now. Later credits start each monthly anniversary. Each month's credits expire three months after issuance; billing stays unchanged.</p>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Beta tester, Partner access, etc."
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setGrantRequestId(crypto.randomUUID()); }}
                maxLength={2000}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantAccess} disabled={grantAccessMutation.isPending || !mfaVerified}>
              {grantAccessMutation.isPending ? "Granting..." : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
};

export default Admin;
