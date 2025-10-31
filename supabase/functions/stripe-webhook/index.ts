import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { handleSuccessfulPayment, handleFailedPayment } from './handlers.ts';

const stripe = new Stripe(Deno.env.get('stripe_restrictedkey_payments') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Whitelist of accepted event types
const ACCEPTED_EVENT_TYPES = [
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  
  // Support dual-secret rotation for zero-downtime updates
  const webhookSecretV2 = Deno.env.get('STRIPE_WEBHOOK_SECRET_V2');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const secrets = [webhookSecretV2, webhookSecret].filter(Boolean);

  if (!signature || secrets.length === 0) {
    logStep('Missing signature or webhook secret');
    return new Response('Webhook configuration error', { status: 500 });
  }

  try {
    const body = await req.text();
    
    // Try each secret (supports rotation)
    let event: Stripe.Event | null = null;
    let lastError: Error | null = null;
    let signatureValid = false;
    
    for (const secret of secrets) {
      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          secret,
          undefined,
          cryptoProvider
        );
        signatureValid = true;
        logStep('Webhook signature verified', { eventType: event.type, eventId: event.id });
        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    if (!event) {
      logStep('Signature verification failed with all secrets', { error: lastError?.message });
      return new Response(`Webhook signature verification failed`, { status: 400 });
    }

    // Validate event type whitelist
    if (!ACCEPTED_EVENT_TYPES.includes(event.type)) {
      logStep('Event type not in whitelist', { eventType: event.type });
      return new Response(`Event type ${event.type} not accepted`, { status: 400 });
    }

    // Optional: Reject events older than 15 minutes (prevents old event replay)
    const eventAge = Date.now() - (event.created * 1000);
    const MAX_EVENT_AGE = 15 * 60 * 1000; // 15 minutes
    if (eventAge > MAX_EVENT_AGE) {
      logStep('Event too old', { eventAge: eventAge / 1000, eventId: event.id });
      return new Response('Event timestamp too old', { status: 400 });
    }

    logStep('Received event', { type: event.type });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for duplicate event (replay protection)
    const { data: existingEvent } = await supabase
      .from('processed_stripe_events')
      .select('event_id')
      .eq('event_id', event.id)
      .single();

    if (existingEvent) {
      logStep('Duplicate event ignored', { eventId: event.id });
      
      // Log duplicate attempt
      await supabase.from('webhook_audit_log').insert({
        event_id: event.id,
        event_type: event.type,
        signature_valid: true,
        processing_status: 'duplicate',
      });
      
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

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

    // Mark event as processed (idempotency)
    await supabase.from('processed_stripe_events').insert({
      event_id: event.id,
      event_type: event.type,
      processed_successfully: true,
    });

    // Log successful processing
    await supabase.from('webhook_audit_log').insert({
      event_id: event.id,
      event_type: event.type,
      signature_valid: true,
      processing_status: 'success',
    });

    logStep('Webhook processed successfully', { eventType: event.type, eventId: event.id });

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    logStep('ERROR', { message: error instanceof Error ? error.message : String(error) });
    
    // Log failed processing
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await supabase.from('webhook_audit_log').insert({
        event_id: 'unknown',
        event_type: 'unknown',
        signature_valid: false,
        processing_status: 'failed',
        error_message: error instanceof Error ? error.message : String(error),
      });
    } catch (auditErr) {
      logStep('Failed to log audit', auditErr);
    }
    
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

  // Get subscription package from price metadata
  const priceId = subscription.items.data[0]?.price.id;
  let newPackage: string | null = null;
  
  if (priceId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      newPackage = (price.metadata?.subscription_package as string) || null;
      logStep('Retrieved package from price metadata', { priceId, newPackage });
    } catch (error) {
      logStep('Error retrieving price metadata', error);
    }
  }

  // Get current user data to check for package changes
  const { data: currentData, error: fetchError } = await supabase
    .from('subscribers_public')
    .select('subscription_package, ai_request_limit, monthly_ai_requests, rollover_credits')
    .eq('user_id', secureData.user_id)
    .single();

  if (fetchError) {
    logStep('Error fetching current user data', fetchError);
    return;
  }

  // Determine new credit limit based on package
  const creditLimits: Record<string, number> = {
    'assess-prep-learn': 60,
    'build-teach-launch': 100,
    'fund-it': 60,
    'all-access': 150,
  };

  let newCreditLimit = currentData.ai_request_limit;
  let additionalCredits = 0;

  // Check if package changed
  if (newPackage && newPackage !== currentData.subscription_package) {
    const oldLimit = currentData.ai_request_limit;
    newCreditLimit = creditLimits[newPackage] || oldLimit;
    
    logStep('Package change detected', {
      oldPackage: currentData.subscription_package,
      newPackage: newPackage,
      oldLimit: oldLimit,
      newLimit: newCreditLimit
    });

    // On upgrade, optionally add prorated credits
    if (newCreditLimit > oldLimit) {
      // Calculate remaining days in billing cycle
      const now = new Date();
      const totalDays = Math.ceil((subscriptionEnd.getTime() - billingCycleStart.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Prorate the credit difference based on remaining days
      const creditDifference = newCreditLimit - oldLimit;
      additionalCredits = Math.floor((creditDifference * remainingDays) / totalDays);
      
      logStep('Prorating credits on upgrade', {
        totalDays,
        remainingDays,
        creditDifference,
        additionalCredits
      });
    }

    // DOWNGRADE: Enforce rollover cap and truncate credits
    if (newCreditLimit < oldLimit) {
      const newRolloverCap = newCreditLimit * 2;
      
      // Calculate current available credits
      const usedThisCycle = currentData.monthly_ai_requests || 0;
      const remainingMonthly = Math.max(0, oldLimit - usedThisCycle);
      const currentRollover = currentData.rollover_credits || 0;
      const extraCredits = currentData.extra_credits || 0;
      const totalAvailable = remainingMonthly + currentRollover + extraCredits;
      
      logStep('Downgrade detected', {
        oldLimit,
        newLimit: newCreditLimit,
        totalAvailable,
        newRolloverCap,
        willTruncate: totalAvailable > newRolloverCap
      });
      
      // If current credits exceed new rollover cap, truncate
      if (totalAvailable > newRolloverCap) {
        const creditsToLose = totalAvailable - newRolloverCap;
        
        // Distribute truncation: first from extra_credits, then rollover, then monthly
        let newExtraCredits = extraCredits;
        let newRollover = currentRollover;
        let newMonthlyUsed = usedThisCycle;
        
        if (extraCredits >= creditsToLose) {
          newExtraCredits = extraCredits - creditsToLose;
        } else {
          newExtraCredits = 0;
          const remaining = creditsToLose - extraCredits;
          
          if (currentRollover >= remaining) {
            newRollover = currentRollover - remaining;
          } else {
            newRollover = 0;
            // Force monthly usage to create deficit
            newMonthlyUsed = usedThisCycle + (remaining - currentRollover);
          }
        }
        
        // Store truncation values to be applied in updateData
        additionalCredits = -(creditsToLose); // Negative to indicate removal
        updateData.extra_credits = newExtraCredits;
        updateData.rollover_credits = newRollover;
        updateData.monthly_ai_requests = newMonthlyUsed;
        
        logStep('Credits truncated on downgrade', {
          creditsLost: creditsToLose,
          newExtraCredits,
          newRollover,
          newMonthlyUsed
        });
        
        // Send downgrade notification email (after update)
        const userId = secureData.user_id;
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

          if (profileData?.email) {
            await supabase.functions.invoke('send-billing-notification', {
              body: {
                type: 'downgrade_credits_truncated',
                userId,
                email: profileData.email,
                oldPackage: currentData.subscription_package,
                newPackage,
                creditsLost: creditsToLose,
                remainingCredits: newRolloverCap,
              },
            });
            logStep('Downgrade credits truncated email sent');
          }
        } catch (emailError) {
          logStep('Failed to send downgrade email', emailError);
        }
      }
    }
  }

  // Update subscription status, billing cycle dates, and credit limits
  const updateData: any = {
    subscribed: subscription.status === 'active',
    subscription_end: subscriptionEnd.toISOString(),
    billing_cycle_start: billingCycleStart.toISOString(),
    next_billing_date: subscriptionEnd.toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Add package and credit limit updates if package changed
  if (newPackage && newPackage !== currentData.subscription_package) {
    updateData.subscription_package = newPackage;
    updateData.ai_request_limit = newCreditLimit;
    
    // Add prorated credits to rollover if upgrading
    if (additionalCredits > 0) {
      updateData.rollover_credits = (currentData.rollover_credits || 0) + additionalCredits;
    }
  }

  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update(updateData)
    .eq('user_id', secureData.user_id);

  if (updateError) {
    logStep('Error updating subscription', updateError);
    throw updateError;
  }

  logStep('Subscription change processed successfully', { 
    packageChanged: newPackage !== currentData.subscription_package,
    creditsAdded: additionalCredits 
  });
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
