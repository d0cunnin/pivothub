import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // CRITICAL: Ensure user record exists in public.users before checkout
    const { data: userData, error: userCheckError } = await supabaseClient
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData) {
      logStep("User not found in public.users, creating record");
      
      // Create user record idempotently
      const { error: insertError } = await supabaseClient
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          subscription_tier: 'explore',
          ai_credits_remaining: 5,
          ai_credits_total: 5
        });
      
      if (insertError && insertError.code !== '23505') { // Ignore duplicate key errors
        logStep("Failed to create user record", { error: insertError });
        throw new Error("User record creation failed. Please try again.");
      }
      
      logStep("User record created successfully");
    } else {
      logStep("User record exists", { userData });
    }

    const { tier, assessmentId } = await req.json();
    logStep("Request received", { tier, assessmentId });

    const stripe = new Stripe(Deno.env.get("stripe_restrictedkey_payments") || "", { apiVersion: "2023-10-16" });
    
    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Define pricing based on tier
    const pricing = {
      "starter": { amount: 1900, name: "Starter", package: "starter" },
      "pro": { amount: 3900, name: "Pro", package: "pro" },
      "all-access": { amount: 7900, name: "All-Access", package: "all_access" }
    };

    const selectedPlan = pricing[tier as keyof typeof pricing];
    if (!selectedPlan) throw new Error("Invalid subscription tier");
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selectedPlan.name },
            unit_amount: selectedPlan.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/pricing?success=true`,
      cancel_url: `${req.headers.get("origin")}/pricing?canceled=true`,
      metadata: { tier, subscription_package: selectedPlan.package || tier, userId: user.id },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});