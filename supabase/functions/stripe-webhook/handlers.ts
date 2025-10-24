import Stripe from 'https://esm.sh/stripe@14.21.0';

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

export async function handleSuccessfulPayment(supabase: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  
  logStep('Processing successful payment', { subscriptionId });
  
  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;
  
  // Find user
  const { data: secureData, error: secureError } = await supabase
    .from('subscribers_secure')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (secureError || !secureData) {
    logStep('User not found for customer', { customerId });
    return;
  }
  
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  
  // Get current subscriber data to calculate rollover
  const { data: currentData, error: fetchError } = await supabase
    .from('subscribers_public')
    .select('monthly_ai_requests, ai_request_limit, extra_credits, rollover_credits, subscription_start_date')
    .eq('user_id', secureData.user_id)
    .single();
  
  if (fetchError) {
    logStep('Error fetching current subscriber data', fetchError);
    throw fetchError;
  }
  
  // Calculate rollover with 2× cap
  const monthlyLimit = currentData.ai_request_limit || 50;
  const totalLastCycle = monthlyLimit + (currentData.extra_credits || 0) + (currentData.rollover_credits || 0);
  const unusedCredits = Math.max(0, totalLastCycle - (currentData.monthly_ai_requests || 0));
  const cappedRollover = Math.min(unusedCredits, monthlyLimit * 2);
  
  logStep('Rollover calculation', { 
    unusedCredits, 
    monthlyLimit, 
    cappedRollover,
    maxAllowed: monthlyLimit * 2 
  });
  
  // Reset credits with capped rollover
  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update({
      monthly_ai_requests: 0,
      rollover_credits: cappedRollover,
      billing_cycle_start: currentPeriodStart.toISOString(),
      next_billing_date: currentPeriodEnd.toISOString(),
      last_request_reset: new Date().toISOString(),
      subscription_end: currentPeriodEnd.toISOString(),
      subscribed: true,
      grace_period_end: null,
      payment_retry_count: 0,
      account_status: 'active',
      updated_at: new Date().toISOString(),
      subscription_start_date: currentData.subscription_start_date || currentPeriodStart.toISOString()
    })
    .eq('user_id', secureData.user_id);
    
  if (updateError) {
    logStep('Error resetting credits on payment', updateError);
    throw updateError;
  }
  
  logStep('Credits reset with capped rollover', { 
    userId: secureData.user_id,
    rolloverCredits: cappedRollover,
    nextBillingDate: currentPeriodEnd 
  });
}

export async function handleFailedPayment(supabase: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  logStep('Processing failed payment', { invoiceId: invoice.id, subscriptionId });

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;

  // Find user by stripe_customer_id
  const { data: secureData, error: secureError } = await supabase
    .from('subscribers_secure')
    .select('user_id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (secureError || !secureData) {
    logStep('User not found for customer', { customerId });
    return;
  }

  // Get subscription details
  const { data: subscriberData } = await supabase
    .from('subscribers_public')
    .select('subscription_tier, subscription_package, payment_retry_count, grace_period_end')
    .eq('user_id', secureData.user_id)
    .single();

  const currentRetryCount = subscriberData?.payment_retry_count || 0;
  const newRetryCount = currentRetryCount + 1;

  // Set or reuse existing grace period
  const gracePeriodEnd = subscriberData?.grace_period_end 
    ? new Date(subscriberData.grace_period_end)
    : (() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      })();

  logStep('Payment failure details', {
    retryAttempt: newRetryCount,
    gracePeriodEnd: gracePeriodEnd.toISOString()
  });

  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update({
      account_status: 'warning',
      grace_period_end: gracePeriodEnd.toISOString(),
      payment_retry_count: newRetryCount,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', secureData.user_id);

  if (updateError) {
    logStep('Error updating grace period', updateError);
    throw updateError;
  }

  logStep('Grace period updated', { 
    userId: secureData.user_id, 
    gracePeriodEnd,
    retryCount: newRetryCount 
  });

  // Send payment failed email
  try {
    await supabase.functions.invoke('send-billing-notification', {
      body: {
        type: 'payment_failed',
        userId: secureData.user_id,
        email: secureData.email,
        subscriptionTier: subscriberData?.subscription_tier,
        subscriptionPackage: subscriberData?.subscription_package,
        retryAttempt: newRetryCount,
        gracePeriodEndDate: gracePeriodEnd.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        }),
      }
    });
    logStep('Payment failed email sent');
  } catch (emailError) {
    logStep('Failed to send email', emailError);
    // Don't throw - email failure shouldn't block webhook processing
  }
}
