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

export const AccountSettings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold">Account Settings</h1>

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
                    <li>All assessments and progress</li>
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
