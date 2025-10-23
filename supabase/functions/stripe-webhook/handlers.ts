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
    .select('monthly_ai_requests, ai_request_limit, extra_credits, rollover_credits')
    .eq('user_id', secureData.user_id)
    .single();
  
  if (fetchError) {
    logStep('Error fetching current subscriber data', fetchError);
    throw fetchError;
  }
  
  // Calculate rollover: unused credits from last cycle
  const totalLastCycle = (currentData.ai_request_limit || 50) + (currentData.extra_credits || 0) + (currentData.rollover_credits || 0);
  const unusedCredits = Math.max(0, totalLastCycle - (currentData.monthly_ai_requests || 0));
  
  // Reset credits with rollover
  const { error: updateError } = await supabase
    .from('subscribers_public')
    .update({
      monthly_ai_requests: 0, // Reset usage
      rollover_credits: unusedCredits, // Carry forward unused credits
      billing_cycle_start: currentPeriodStart.toISOString(),
      next_billing_date: currentPeriodEnd.toISOString(),
      last_request_reset: new Date().toISOString(),
      subscription_end: currentPeriodEnd.toISOString(),
      subscribed: true,
      grace_period_end: null, // Clear grace period if any
      account_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', secureData.user_id);
    
  if (updateError) {
    logStep('Error resetting credits on payment', updateError);
    throw updateError;
  }
  
  logStep('Credits reset successfully with rollover', { 
    userId: secureData.user_id,
    rolloverCredits: unusedCredits,
    nextBillingDate: currentPeriodEnd 
  });
}

export async function handleFailedPayment(supabase: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = subscription.customer as string;
  
  const { data: secureData } = await supabase
    .from('subscribers_secure')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();
    
  if (!secureData) return;
  
  // Start 7-day grace period
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
  
  await supabase
    .from('subscribers_public')
    .update({
      account_status: 'warning',
      grace_period_end: gracePeriodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', secureData.user_id);
    
  logStep('Payment failed, grace period started', { 
    userId: secureData.user_id,
    gracePeriodEnd: gracePeriodEnd.toISOString()
  });
}
