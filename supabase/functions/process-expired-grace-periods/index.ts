import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const logStep = (step: string, data?: any) => {
  console.log(`[GRACE-PERIOD] ${step}`, data || '');
};

serve(async (req) => {
  try {
    logStep('Starting grace period expiration check');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const now = new Date();
    
    // Find users with expired grace periods
    const { data: expiredUsers, error } = await supabase
      .from('subscribers_public')
      .select('user_id, subscription_package, grace_period_end, email:profiles!inner(email)')
      .eq('account_status', 'warning')
      .lt('grace_period_end', now.toISOString())
      .not('grace_period_end', 'is', null);
    
    if (error) {
      logStep('Error fetching expired users', error);
      throw error;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      logStep('No expired grace periods found');
      return new Response(JSON.stringify({ 
        processed: 0, 
        message: 'No expired grace periods found' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    logStep(`Found ${expiredUsers.length} expired grace periods`);
    
    // Downgrade each user to Explore Mode
    for (const user of expiredUsers) {
      const nextResetDate = new Date();
      nextResetDate.setDate(nextResetDate.getDate() + 30);
      
      const { error: updateError } = await supabase
        .from('subscribers_public')
        .update({
          subscribed: false,
          subscription_package: null,
          subscription_tier: null,
          subscription_end: null,
          subscription_start_date: null,
          billing_cycle_start: null,
          next_billing_date: null,
          ai_request_limit: 5,
          rollover_credits: 0,
          monthly_ai_requests: 0,
          extra_credits: 0,
          free_tier_start_date: nextResetDate.toISOString(),
          last_request_reset: now.toISOString(),
          grace_period_end: null,
          payment_retry_count: 0,
          account_status: 'active',
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.user_id);
      
      if (updateError) {
        logStep(`Error downgrading user ${user.user_id}`, updateError);
        continue;
      }

      logStep(`Downgraded user ${user.user_id} to Explore Mode`);
      
      // Send auto-downgrade notification email
      try {
        await supabase.functions.invoke('send-billing-notification', {
          body: {
            type: 'auto_downgrade',
            userId: user.user_id,
            email: (user as any).email?.email,
            subscriptionPackage: user.subscription_package,
          },
        });
        logStep(`Auto-downgrade email sent to ${user.user_id}`);
      } catch (emailError) {
        logStep(`Failed to send email to ${user.user_id}`, emailError);
      }
    }
    
    return new Response(JSON.stringify({ 
      processed: expiredUsers.length,
      message: `Successfully downgraded ${expiredUsers.length} users to Explore Mode`
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logStep('Error processing grace periods', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
