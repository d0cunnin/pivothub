import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUsage } from "@/contexts/UsageContext";
import { getPackageDisplayName } from "@/utils/packageAccess";
import { CreditCard, Calendar, AlertCircle, Zap } from "lucide-react";

export const AccountSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { subscribed, subscriptionTier, subscriptionPackage, subscriptionEnd } = useAuth();
  const { monthlyRequests, remainingRequests, refreshUsage } = useUsage();
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { reason: cancelReason }
      });

      if (error) throw error;

      toast({
        title: "Subscription Cancelled",
        description: data.message || "Your subscription has been cancelled successfully.",
      });

      setCancelReason("");
      
      // Refresh the page to update subscription status
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Invalid Confirmation",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { 
          confirmation: deleteConfirmation,
          reason: deleteReason 
        }
      });

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });

      // Sign out and redirect to home
      await supabase.auth.signOut();
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseCredits = async (credits: number) => {
    // Check subscription status
    if (!subscribed) {
      toast({
        title: "Subscription Required",
        description: "Extra credits are only available for active paid subscribers. Please upgrade your plan first.",
        variant: "destructive",
      });
      navigate('/pricing');
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('purchase-extra-credits', {
        body: { credits }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      
      let errorMessage = "Failed to initiate purchase";
      
      if (error?.message?.includes('SUBSCRIPTION_REQUIRED')) {
        errorMessage = "You need an active subscription to purchase extra credits";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Account Settings</h1>
      
      {/* Usage & Credits Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Usage & Credits
          </CardTitle>
          <CardDescription>
            Track your AI tool usage and manage extra credits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="font-semibold text-2xl">
                {monthlyRequests} <span className="text-sm font-normal text-muted-foreground">used this month</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {remainingRequests} requests remaining
              </div>
            </div>
          </div>

          {/* Only show extra credits section if user has active paid subscription */}
          {subscribed ? (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Purchase Extra Credits</Label>
              <div className="text-sm text-muted-foreground mb-3">
                Need more AI requests this month? Purchase extra credits that roll over.
              </div>
              <div className="grid gap-3">
                <Button
                  variant="outline"
                  onClick={() => handlePurchaseCredits(10)}
                  disabled={isLoading}
                  className="justify-between h-auto py-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">10 Extra Credits</div>
                    <div className="text-xs text-muted-foreground">Great for occasional use</div>
                  </div>
                  <span className="font-bold text-lg">$5.00</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePurchaseCredits(25)}
                  disabled={isLoading}
                  className="justify-between h-auto py-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">25 Extra Credits</div>
                    <div className="text-xs text-muted-foreground">Best value</div>
                  </div>
                  <span className="font-bold text-lg">$10.00</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePurchaseCredits(50)}
                  disabled={isLoading}
                  className="justify-between h-auto py-4"
                >
                  <div className="text-left">
                    <div className="font-semibold">50 Extra Credits</div>
                    <div className="text-xs text-muted-foreground">For power users</div>
                  </div>
                  <span className="font-bold text-lg">$18.00</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <div className="font-semibold">Extra Credits Unavailable</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Extra credits are only available for active paid subscribers.
                  </div>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => navigate('/pricing')}
                  >
                    View Subscription Plans
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Subscription Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Details
          </CardTitle>
          <CardDescription>
            View and manage your subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            {subscribed ? (
              <>
                <CreditCard className="h-5 w-5 mt-0.5 text-primary" />
                <div className="flex-1">
                  <div className="font-semibold text-lg capitalize">
                    {getPackageDisplayName(subscriptionPackage)}
                  </div>
                  {subscriptionEnd && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Renews on {new Date(subscriptionEnd).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-semibold text-lg">Free Plan</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Upgrade to access premium features
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => window.location.href = '/pricing'}
              variant="default"
            >
              {subscribed ? 'Manage Subscription' : 'Upgrade Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Cancel Subscription</CardTitle>
          <CardDescription>
            Cancel your paid subscription. You'll retain access until the end of your billing period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancelReason">Reason for cancelling (optional)</Label>
            <Textarea
              id="cancelReason"
              placeholder="Help us improve by telling us why you're cancelling..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
            />
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel Subscription
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your subscription will be cancelled immediately, but you'll retain access until the end of your current billing period.
                  You can resubscribe at any time.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelSubscription} disabled={isLoading}>
                  {isLoading ? "Cancelling..." : "Cancel Subscription"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deleteReason">Reason for deletion (optional)</Label>
            <Textarea
              id="deleteReason"
              placeholder="Help us understand why you're leaving..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deleteConfirmation">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="deleteConfirmation"
              placeholder="Type DELETE here"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
            />
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={isLoading || deleteConfirmation !== "DELETE"}
              >
                Delete Account Permanently
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All assessment results and progress</li>
                    <li>Course enrollments and submissions</li>
                    <li>Analytics and feedback</li>
                    <li>Subscription information</li>
                    <li>User profile and preferences</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount} 
                  disabled={isLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLoading ? "Deleting..." : "Delete My Account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <p className="text-sm text-muted-foreground">
            Note: Any active subscriptions will be automatically cancelled before account deletion.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
