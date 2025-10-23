import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const cancelSchema = z.object({
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

    // Validate input
    const requestBody = await req.json();
    const validation = cancelSchema.safeParse(requestBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validation.error.issues }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get subscription data
    const { data: subscription, error: subError } = await supabaseClient
      .from("subscribers_public")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: "No active subscription found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (!subscription.subscribed) {
      return new Response(
        JSON.stringify({ error: "Subscription already cancelled" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Stripe customer ID from secure table using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: secureData, error: secureError } = await supabaseAdmin
      .from("subscribers_secure")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (secureError || !secureData?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "Stripe customer not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Cancel subscription in Stripe
    const stripeKey = Deno.env.get("stripe_restrictedkey_payments");
    if (!stripeKey) {
      throw new Error("Stripe API key not configured");
    }

    // Get active subscriptions for this customer
    const subscriptionsResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${secureData.stripe_customer_id}&status=active`,
      {
        headers: {
          "Authorization": `Bearer ${stripeKey}`,
        },
      }
    );

    const subscriptionsData = await subscriptionsResponse.json();

    if (subscriptionsData.data && subscriptionsData.data.length > 0) {
      // Schedule cancellation at period end instead of immediate cancellation
      for (const sub of subscriptionsData.data) {
        await fetch(`https://api.stripe.com/v1/subscriptions/${sub.id}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: "cancel_at_period_end=true",
        });
      }
    }

    // Update subscription status to pending cancellation
    const { error: updateError } = await supabaseClient
      .from("subscribers_public")
      .update({
        account_status: 'pending_cancellation',
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating subscription status:", updateError);
      // Continue anyway since Stripe cancellation succeeded
    }

    console.log(`Subscription cancelled for user ${user.id}. Reason: ${validation.data.reason || 'Not provided'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Subscription cancelled successfully. You will retain full access until ${subscription.subscription_end || 'the end of your billing period'}. All rollover credits will be removed at that time.` 
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Error in cancel-subscription function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
