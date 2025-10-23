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

  // Update subscribers_public - grant full credits immediately on first subscription
  const { error: publicError } = await supabase
    .from('subscribers_public')
    .update({
      subscribed: true,
      subscription_package: subscriptionPackage,
      subscription_end: subscriptionEnd.toISOString(),
      billing_cycle_start: billingCycleStart.toISOString(),
      next_billing_date: subscriptionEnd.toISOString(),
      ai_request_limit: 50,
      monthly_ai_requests: 0, // Start with full credits
      last_request_reset: new Date().toISOString(),
      grace_period_end: null, // Clear any grace period
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

  logStep('Processing subscription cancellation', { customerId });

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

  // Update subscription status - don't immediately downgrade, set grace period instead
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7); // 7-day grace period

  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update({
      subscribed: false,
      subscription_end: null,
      subscription_package: null,
      grace_period_end: gracePeriodEnd.toISOString(),
      account_status: 'warning',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', secureData.user_id);

  if (updateError) {
    logStep('Error cancelling subscription', updateError);
    throw updateError;
  }

  logStep('Subscription cancellation processed successfully');
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
