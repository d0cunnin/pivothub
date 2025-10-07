import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GrantAccessRequest {
  action: "grant" | "revoke" | "extend";
  userId: string;
  tier?: string;
  duration?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error("Admin check failed:", roleError);
      throw new Error("Admin access required");
    }

    const requestBody: GrantAccessRequest = await req.json();
    const { action, userId, tier, duration, notes } = requestBody;

    console.log("Admin action:", { action, userId, tier, duration, adminId: user.id });

    // Get current subscription state for audit log
    const { data: currentSub } = await supabase
      .from("subscribers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    let subscriptionEnd: string | null = null;

    if (action === "grant" && duration) {
      const now = new Date();
      switch (duration) {
        case "1-month":
          subscriptionEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
          break;
        case "3-months":
          subscriptionEnd = new Date(now.setMonth(now.getMonth() + 3)).toISOString();
          break;
        case "6-months":
          subscriptionEnd = new Date(now.setMonth(now.getMonth() + 6)).toISOString();
          break;
        case "1-year":
          subscriptionEnd = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
          break;
        case "lifetime":
          subscriptionEnd = new Date(now.setFullYear(now.getFullYear() + 100)).toISOString();
          break;
      }

      // Get user email for subscribers table
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser.user?.email || "";

      // Upsert subscription
      const { error: upsertError } = await supabase
        .from("subscribers")
        .upsert({
          user_id: userId,
          email: email,
          subscribed: true,
          subscription_tier: tier,
          subscription_end: subscriptionEnd,
          is_trial_active: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw upsertError;
      }

      // Log to audit trail
      await supabase
        .from("subscription_audit_log")
        .insert({
          user_id: userId,
          admin_id: user.id,
          action: action,
          previous_state: currentSub,
          new_state: {
            subscribed: true,
            subscription_tier: tier,
            subscription_end: subscriptionEnd,
          },
          notes: notes || null,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Access granted successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (action === "revoke") {
      const { error: updateError } = await supabase
        .from("subscribers")
        .update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          is_trial_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) throw updateError;

      // Log to audit trail
      await supabase
        .from("subscription_audit_log")
        .insert({
          user_id: userId,
          admin_id: user.id,
          action: action,
          previous_state: currentSub,
          new_state: { subscribed: false },
          notes: notes || null,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Access revoked successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error in admin-manage-subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
