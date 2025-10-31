import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, data?: any) => {
  console.log(`[EXTRA-CREDITS] ${step}`, data || '');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting extra credits purchase');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      logStep('Error getting user', userError);
      throw new Error('Unauthorized');
    }

    logStep('User authenticated', user.id);

    const { credits } = await req.json();
    logStep('Credits requested', credits);

    if (![25, 70, 150].includes(credits)) {
      throw new Error('Invalid credit amount. Must be 25, 70, or 150.');
    }

    const stripe = new Stripe(Deno.env.get('stripe_restrictedkey_payments') || '', {
      apiVersion: '2023-10-16',
    });

    // Get user email and subscription status
    const { data: subscriber } = await supabase
      .from('subscribers_public')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Validate user has active paid subscription
    if (!subscriber) {
      logStep('No subscriber record found');
      return new Response(
        JSON.stringify({ 
          error: 'No subscription found. Please subscribe to a plan first.' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has active paid subscription (not free tier)
    const now = new Date();
    const subscriptionEnd = subscriber.subscription_end ? new Date(subscriber.subscription_end) : null;
    const isSubscriptionActive = subscriber.subscribed && subscriptionEnd && subscriptionEnd > now;

    if (!isSubscriptionActive) {
      logStep('User does not have active paid subscription', {
        subscribed: subscriber.subscribed,
        subscription_end: subscriber.subscription_end,
        is_trial_active: subscriber.is_trial_active
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Extra credits are only available for active subscribers. Please upgrade your plan first.',
          code: 'SUBSCRIPTION_REQUIRED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Explicitly block free tier users from purchasing credits (only paid subscribers can buy)
    if (!subscriber.subscribed) {
      logStep('Free tier user attempted to purchase credits');
      return new Response(
        JSON.stringify({ 
          error: 'Extra credits are not available on the free tier. Please subscribe to a paid plan first.',
          code: 'FREE_TIER_NOT_ALLOWED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Subscription validated - user can purchase credits');

    // Get or create Stripe customer
    let customerId = subscriber?.stripe_customer_id;
    
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: user.id }
        });
        customerId = customer.id;
      }
    }

    // Pricing for extra credits
    const pricing: Record<number, number> = {
      25: 1000,  // $10.00
      70: 2500,  // $25.00
      150: 5000  // $50.00
    };

    const amount = pricing[credits];

    // Create checkout session for extra credits
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${credits} Extra AI Requests`,
              description: `Add ${credits} extra AI requests to your account`
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/settings?extra_credits=success`,
      cancel_url: `${req.headers.get('origin')}/settings?extra_credits=cancelled`,
      metadata: {
        user_id: user.id,
        credits: credits.toString(),
        type: 'extra_credits'
      }
    });

    logStep('Checkout session created', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    logStep('Error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});