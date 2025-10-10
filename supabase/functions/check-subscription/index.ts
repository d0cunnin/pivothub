import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    // First check if user has subscriber record, create if not exists
    const { data: subscriberData, error: subscriberError } = await supabaseClient
      .from("subscribers_public")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let subscriber = subscriberData;
    
    // If no subscriber record exists, create one (this handles existing users)
    if (subscriberError && subscriberError.code === 'PGRST116') {
      logStep("Creating subscriber record for existing user");
      const { data: newSubscriber, error: createError } = await supabaseClient
        .from("subscribers_public")
        .insert({
          user_id: user.id,
          email: user.email,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          is_trial_active: true
        })
        .select()
        .single();
      
      if (createError) throw new Error(`Failed to create subscriber record: ${createError.message}`);
      subscriber = newSubscriber;
    } else if (subscriberError) {
      throw new Error(`Failed to fetch subscriber data: ${subscriberError.message}`);
    }

    // Check if trial has expired and update if necessary
    const now = new Date();
    const trialEnd = subscriber?.trial_end ? new Date(subscriber.trial_end) : null;
    const isTrialExpired = trialEnd && now > trialEnd;
    
    if (subscriber?.is_trial_active && isTrialExpired) {
      logStep("Trial expired, updating subscriber record");
      const { error: updateError } = await supabaseClient
        .from("subscribers_public")
        .update({ is_trial_active: false })
        .eq("user_id", user.id);
      
      if (updateError) throw new Error(`Failed to update trial status: ${updateError.message}`);
      subscriber.is_trial_active = false;
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, returning trial/free status");
      return new Response(JSON.stringify({ 
        subscribed: false,
        is_trial_active: subscriber?.is_trial_active || false,
        trial_end: subscriber?.trial_end || null,
        trial_days_remaining: subscriber?.is_trial_active && trialEnd ? 
          Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionTier = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      
      // Determine subscription tier from price
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      if (amount <= 999) {
        subscriptionTier = "Basic";
      } else if (amount <= 1699) {
        subscriptionTier = "Pro";
      } else {
        subscriptionTier = "Enterprise";
      }
      logStep("Determined subscription tier", { priceId, amount, subscriptionTier });
    } else {
      logStep("No active subscription found");
    }

    // Update public subscription data
    await supabaseClient.from("subscribers_public").upsert({
      email: user.email,
      user_id: user.id,
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      // If user has active subscription, trial should be inactive
      is_trial_active: hasActiveSub ? false : (subscriber?.is_trial_active || false),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    // Store Stripe customer ID securely (service role only)
    await supabaseClient.from("subscribers_secure").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    logStep("Updated database with subscription info", { subscribed: hasActiveSub, subscriptionTier });
    
    // Calculate trial info for response
    const finalTrialEnd = subscriber?.trial_end ? new Date(subscriber.trial_end) : null;
    const trialDaysRemaining = subscriber?.is_trial_active && finalTrialEnd ? 
      Math.max(0, Math.ceil((finalTrialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
    
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      is_trial_active: hasActiveSub ? false : (subscriber?.is_trial_active || false),
      trial_end: subscriber?.trial_end || null,
      trial_days_remaining: trialDaysRemaining
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});