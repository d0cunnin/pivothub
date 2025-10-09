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

    const { tier, assessmentId } = await req.json();
    logStep("Request received", { tier, assessmentId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2023-10-16" });
    
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
      basic: { amount: 799, name: "Basic Plan" },     // $7.99
      pro: { amount: 1499, name: "Pro Plan" },        // $14.99
      "ebook-career": { amount: 299, name: "Career Transformation Guide" },
      "ebook-business": { amount: 299, name: "Business Startup Handbook" },
      "ebook-skills": { amount: 299, name: "Skills Development Mastery" },
      "side-income-blueprint": { amount: 4700, name: "Side Income Blueprint" }
    };

    const selectedPlan = pricing[tier as keyof typeof pricing];
    if (!selectedPlan) throw new Error("Invalid subscription tier");

    // Determine if it's an e-book or subscription
    const isEbook = tier.includes('ebook');
    const isSideIncome = tier === 'side-income-blueprint';
    
    const successUrl = isSideIncome && assessmentId
      ? `${req.headers.get("origin")}/side-income-blueprint?assessment=${assessmentId}&success=true`
      : `${req.headers.get("origin")}/pricing?success=true`;
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selectedPlan.name },
            unit_amount: selectedPlan.amount,
            ...(isEbook || isSideIncome ? {} : { recurring: { interval: "month" } }),
          },
          quantity: 1,
        },
      ],
      mode: (isEbook || isSideIncome) ? "payment" : "subscription",
      success_url: successUrl,
      cancel_url: `${req.headers.get("origin")}/pricing?canceled=true`,
      metadata: assessmentId ? { assessmentId, userId: user.id } : {},
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