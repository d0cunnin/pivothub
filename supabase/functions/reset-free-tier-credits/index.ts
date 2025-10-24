import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const logStep = (step: string, data?: any) => {
  console.log(`[FREE-TIER] ${step}`, data || '');
};

serve(async (req) => {
  try {
    logStep('Starting free tier credit reset check');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const now = new Date();
    
    // Find free tier users whose anniversary has passed
    const { data: resetUsers, error } = await supabase
      .from('subscribers_public')
      .select('user_id, free_tier_start_date, monthly_ai_requests')
      .eq('subscribed', false)
      .lt('free_tier_start_date', now.toISOString())
      .not('free_tier_start_date', 'is', null);
    
    if (error) {
      logStep('Error fetching free tier users', error);
      throw error;
    }

    if (!resetUsers || resetUsers.length === 0) {
      logStep('No free tier resets needed');
      return new Response(JSON.stringify({ 
        processed: 0, 
        message: 'No free tier resets needed' 
      }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    logStep(`Found ${resetUsers.length} users ready for credit reset`);
    
    // Reset credits for each user
    for (const user of resetUsers) {
      const oldStartDate = new Date(user.free_tier_start_date);
      const nextResetDate = new Date(oldStartDate);
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
      
      const { error: updateError } = await supabase
        .from('subscribers_public')
        .update({
          monthly_ai_requests: 0,
          free_tier_start_date: nextResetDate.toISOString(),
          last_request_reset: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_id', user.user_id);
      
      if (updateError) {
        logStep(`Error resetting credits for user ${user.user_id}`, updateError);
        continue;
      }

      logStep(`Reset credits for user ${user.user_id}, next reset: ${nextResetDate.toISOString()}`);
    }
    
    return new Response(JSON.stringify({ 
      processed: resetUsers.length,
      message: `Successfully reset credits for ${resetUsers.length} free tier users`
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    logStep('Error processing free tier resets', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
