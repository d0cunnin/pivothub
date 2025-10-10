import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const deleteSchema = z.object({
  confirmation: z.literal("DELETE"),
  reason: z.string().max(500).optional()
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Validate input - user must type "DELETE" to confirm
    const requestBody = await req.json();
    const validation = deleteSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid confirmation", 
          message: "You must type DELETE to confirm account deletion" 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`Starting account deletion for user ${user.id}. Reason: ${validation.data.reason || 'Not provided'}`);

    // Use service role to delete user data
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Cancel any active Stripe subscriptions first
    try {
      const { data: secureData } = await supabaseAdmin
        .from("subscribers_secure")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

      if (secureData?.stripe_customer_id) {
        const stripeKey = Deno.env.get("stripe_restrictedkey_payments");
        if (stripeKey) {
          // Cancel all active subscriptions
          const subscriptionsResponse = await fetch(
            `https://api.stripe.com/v1/subscriptions?customer=${secureData.stripe_customer_id}&status=active`,
            { headers: { "Authorization": `Bearer ${stripeKey}` } }
          );
          
          const subscriptionsData = await subscriptionsResponse.json();
          if (subscriptionsData.data) {
            for (const sub of subscriptionsData.data) {
              await fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${stripeKey}` },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error cancelling Stripe subscriptions:", error);
      // Continue with account deletion
    }

    // Delete user data from all tables (RLS policies will handle cascade)
    // The ON DELETE CASCADE on auth.users will handle most cleanup
    const tables = [
      "activity_submissions",
      "lesson_progress",
      "quiz_results",
      "user_progress",
      "tool_usage_analytics",
      "result_feedback",
      "assessment_results",
      "course_enrollments",
      "side_income_assessments",
      "side_income_reports",
      "conversation_context",
      "user_preferences",
      "subscribers_public",
      "subscribers_secure",
      "subscription_audit_log",
      "profiles"
    ];

    for (const table of tables) {
      try {
        await supabaseAdmin
          .from(table)
          .delete()
          .eq("user_id", user.id);
      } catch (error) {
        console.error(`Error deleting from ${table}:`, error);
        // Continue with other tables
      }
    }

    // Finally, delete the auth user (this will cascade to any remaining data)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteUserError) {
      console.error("Error deleting user from auth:", deleteUserError);
      throw new Error("Failed to delete user account");
    }

    console.log(`Account successfully deleted for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Your account has been permanently deleted." 
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
