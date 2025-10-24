import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleSuccessfulPayment, handleFailedPayment } from './handlers.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    logStep('Received event', { type: event.type });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle subscription events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Check if this is an extra credits purchase
      if (session.metadata?.type === 'extra_credits') {
        await handleExtraCredits(supabase, session);
      } else if (session.mode === 'subscription') {
        await handleSubscriptionCheckout(supabase, session);
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await handleSuccessfulPayment(supabase, invoice);
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await handleFailedPayment(supabase, invoice);
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(supabase, subscription);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancellation(supabase, subscription);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    logStep('ERROR', { message: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function handleSubscriptionCheckout(supabase: any, session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const userId = session.metadata?.userId;
  const subscriptionPackage = session.metadata?.subscription_package;

  if (!userId) {
    logStep('No userId in metadata');
    return;
  }

  logStep('Processing subscription checkout', { userId, customerId, subscriptionPackage });
  
  // Get user email for notifications
  const { data: secureData } = await supabase
    .from('subscribers_secure')
    .select('email')
    .eq('user_id', userId)
    .single();

  // Get subscription details
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    logStep('No subscription found');
    return;
  }

  const subscription = subscriptions.data[0];
  const subscriptionEnd = new Date(subscription.current_period_end * 1000);
  const billingCycleStart = new Date(subscription.current_period_start * 1000);

  // Get current subscriber data to check if upgrading from Explore Mode
  const { data: currentData } = await supabase
    .from('subscribers_public')
    .select('monthly_ai_requests, ai_request_limit, rollover_credits, subscribed')
    .eq('user_id', userId)
    .single();

  // Calculate leftover Explore Mode credits if upgrading from free tier (NO rollover)
  let preservedCredits = 0;
  if (currentData && !currentData.subscribed) {
    // User was on Explore Mode - preserve remaining credits (capped at 100)
    const exploreTotal = 5;
    preservedCredits = Math.max(0, exploreTotal - (currentData.monthly_ai_requests || 0));
    preservedCredits = Math.min(preservedCredits, 50 * 2); // Cap at 2× monthly limit
    logStep('Preserving Explore Mode credits on upgrade', { preservedCredits });
  }

  // Update subscribers_public - grant full credits immediately on first subscription
  const { error: publicError } = await supabase
    .from('subscribers_public')
    .update({
      subscribed: true,
      subscription_package: subscriptionPackage,
      subscription_end: subscriptionEnd.toISOString(),
      subscription_start_date: billingCycleStart.toISOString(), // Track anniversary
      billing_cycle_start: billingCycleStart.toISOString(),
      next_billing_date: subscriptionEnd.toISOString(),
      ai_request_limit: 50,
      rollover_credits: preservedCredits,
      monthly_ai_requests: 0,
      last_request_reset: new Date().toISOString(),
      payment_retry_count: 0,
      grace_period_end: null,
      account_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (publicError) {
    logStep('Error updating subscribers_public', publicError);
    throw publicError;
  }

  // Update subscribers_secure
  const customer = await stripe.customers.retrieve(customerId);
  const { error: secureError } = await supabase
    .from('subscribers_secure')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      email: (customer as any).email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  if (secureError) {
    logStep('Error updating subscribers_secure', secureError);
    throw secureError;
  }

  logStep('Subscription checkout processed successfully');
  
  // Send welcome email
  try {
    const packageNames: Record<string, string> = {
      'assess-prep-learn': 'Assess It + Prep It + Learn It',
      'build-teach-launch': 'Build It + Teach It + Launch It',
      'fund-it': 'Fund It',
      'all-access': 'All Access Pass',
    };

    await supabase.functions.invoke('send-billing-notification', {
      body: {
        type: 'subscription_success',
        userId: userId,
        email: secureData?.email || (customer as any).email,
        subscriptionPackage: packageNames[subscriptionPackage] || subscriptionPackage,
        monthlyCredits: 50 + preservedCredits,
        nextBillingDate: subscriptionEnd.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        }),
      }
    });
    logStep('Welcome email sent');
  } catch (emailError) {
    logStep('Failed to send welcome email', emailError);
    // Don't throw - email failure shouldn't block webhook processing
  }
}

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  logStep('Processing subscription change', { customerId, status: subscription.status });

  // Find user by stripe_customer_id
  const { data: secureData, error: secureError } = await supabase
    .from('subscribers_secure')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (secureError || !secureData) {
    logStep('User not found for customer', { customerId });
    return;
  }

  const subscriptionEnd = new Date(subscription.current_period_end * 1000);
  const billingCycleStart = new Date(subscription.current_period_start * 1000);

  // Update subscription status and billing cycle dates
  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update({
      subscribed: subscription.status === 'active',
      subscription_end: subscriptionEnd.toISOString(),
      billing_cycle_start: billingCycleStart.toISOString(),
      next_billing_date: subscriptionEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', secureData.user_id);

  if (updateError) {
    logStep('Error updating subscription', updateError);
    throw updateError;
  }

  logStep('Subscription change processed successfully');
}

async function handleSubscriptionCancellation(supabase: any, subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  logStep('Processing subscription cancellation/deletion', { 
    customerId,
    canceledAt: subscription.canceled_at,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: subscription.current_period_end
  });

  // Find user by stripe_customer_id
  const { data: secureData, error: secureError } = await supabase
    .from('subscribers_secure')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (secureError || !secureData) {
    logStep('User not found for customer', { customerId });
    return;
  }

  // Manual cancellation: Set anniversary 30 days after billing cycle ends
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const now = new Date();
  
  // Calculate next reset date (30 days after billing cycle ends)
  const nextResetDate = new Date(currentPeriodEnd);
  nextResetDate.setMonth(nextResetDate.getMonth() + 1);
  
  logStep('Downgrading to Explore Mode with 5 credits');
  
  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update({
      subscribed: false,
      subscription_end: null,
      subscription_package: null,
      subscription_tier: null,
      subscription_start_date: null,
      billing_cycle_start: null,
      next_billing_date: null,
      ai_request_limit: 5,
      rollover_credits: 0,
      monthly_ai_requests: 0, // User starts with 5 available
      extra_credits: 0,
      free_tier_start_date: nextResetDate.toISOString(), // Anniversary 30 days after billing ends
      last_request_reset: currentPeriodEnd.toISOString(),
      payment_retry_count: 0,
      grace_period_end: null,
      account_status: 'active',
      updated_at: now.toISOString()
    })
    .eq('user_id', secureData.user_id);

  if (updateError) {
    logStep('Error downgrading to Explore Mode', updateError);
    throw updateError;
  }

  logStep('User downgraded to Explore Mode', { 
    userId: secureData.user_id,
    billingCycleEnd: currentPeriodEnd.toISOString(),
    nextAnniversaryDate: nextResetDate.toISOString()
  });
}

async function handleExtraCredits(supabase: any, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const credits = parseInt(session.metadata?.credits || '0', 10);

  if (!userId || !credits) {
    logStep('Missing userId or credits in metadata');
    return;
  }

  logStep('Processing extra credits purchase', { userId, credits });

  // Add credits to user's account
  const { data: currentData, error: fetchError } = await supabase
    .from('subscribers_public')
    .select('extra_credits')
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    logStep('Error fetching current credits', fetchError);
    throw fetchError;
  }

  const newCredits = (currentData.extra_credits || 0) + credits;

  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update({
      extra_credits: newCredits,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    logStep('Error updating extra credits', updateError);
    throw updateError;
  }

  logStep('Extra credits added successfully', { newTotal: newCredits });
}
