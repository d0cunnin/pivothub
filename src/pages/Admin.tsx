import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Users, Activity, Search, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SupabaseUsageMonitor } from "@/components/SupabaseUsageMonitor";

interface UserWithSubscription {
  id: string;
  email: string;
  display_name?: string;
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
  is_trial_active: boolean;
  trial_end?: string;
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

  // Fetch all users with subscription data
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name");

      const { data: authUsers } = await supabase.auth.admin.listUsers();

      const { data: subscribers } = await supabase
        .from("subscribers")
        .select("*");

      const combinedData: UserWithSubscription[] = authUsers?.users.map(user => {
        const profile = profiles?.find(p => p.id === user.id);
        const subscription = subscribers?.find(s => s.user_id === user.id);

        return {
          id: user.id,
          email: user.email || "",
          display_name: profile?.display_name,
          subscribed: subscription?.subscribed || false,
          subscription_tier: subscription?.subscription_tier,
          subscription_end: subscription?.subscription_end,
          is_trial_active: subscription?.is_trial_active || false,
          trial_end: subscription?.trial_end,
        };
      }) || [];

      return combinedData;
    },
  });

  // Grant access mutation
  const grantAccessMutation = useMutation({
    mutationFn: async (params: { userId: string; tier: string; duration: string; notes: string }) => {
      const { data, error } = await supabase.functions.invoke("admin-manage-subscription", {
        body: {
          action: "grant",
          userId: params.userId,
          tier: params.tier,
          duration: params.duration,
          notes: params.notes,
        },
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

  const stats = {
    totalUsers: users?.length || 0,
    activeSubscriptions: users?.filter(u => u.subscribed).length || 0,
    trialUsers: users?.filter(u => u.is_trial_active).length || 0,
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

          {/* Supabase Usage Monitor */}
          <SupabaseUsageMonitor />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.trialUsers}</div>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, name, or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
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
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.display_name || "-"}</TableCell>
                          <TableCell>
                            {user.is_trial_active ? (
                              <Badge variant="outline">Trial</Badge>
                            ) : user.subscribed ? (
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
                          <TableCell>
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
        </main>
        <Footer />
      </div>

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
