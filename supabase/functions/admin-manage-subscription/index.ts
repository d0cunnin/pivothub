import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, data?: any) => {
  console.log(`[ADMIN-MANAGE] ${step}`, data || '');
};

interface GrantAccessRequest {
  action: "grant" | "revoke" | "extend";
  userId: string;
  tier?: string;
  duration?: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Starting admin subscription management');
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Get IP address and user agent for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Get the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }
    
    logStep('User authenticated', user.id);

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole) {
      logStep('Admin check failed', { userId: user.id, roleError });
      throw new Error("Admin access required");
    }
    
    logStep('Admin verified', user.id);
    
    // Check rate limit (max 100 admin actions per hour)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_admin_rate_limit', {
        p_admin_user_id: user.id,
        p_action_type: 'subscription_management',
        p_max_actions: 100,
        p_window_minutes: 60
      });
    
    if (rateLimitError) {
      logStep('Rate limit check error', rateLimitError);
    }
    
    if (rateLimitCheck === false) {
      logStep('Rate limit exceeded for admin', user.id);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. You have performed too many admin actions. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody: GrantAccessRequest = await req.json();
    const { action, userId, tier, duration, notes } = requestBody;

    logStep('Admin action initiated', { action, userId, tier, duration, adminId: user.id });

    // Get current subscription state for audit log
    const { data: currentSub } = await supabase
      .from("subscribers_public")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    logStep('Current subscription state retrieved', currentSub);
    
    // Store previous state for audit log
    const previousState = currentSub ? {
      subscribed: currentSub.subscribed,
      subscription_tier: currentSub.subscription_tier,
      subscription_end: currentSub.subscription_end,
      ai_request_limit: currentSub.ai_request_limit
    } : null;

    let subscriptionEnd: string | null = null;

    if (action === "grant" && duration) {
      const now = new Date();
      switch (duration) {
        case "1-month":
          subscriptionEnd = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
          break;
        case "3-months":
          subscriptionEnd = new Date(now.setMonth(now.getMonth() + 3)).toISOString();
          break;
        case "6-months":
          subscriptionEnd = new Date(now.setMonth(now.getMonth() + 6)).toISOString();
          break;
        case "1-year":
          subscriptionEnd = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
          break;
        case "lifetime":
          subscriptionEnd = new Date(now.setFullYear(now.getFullYear() + 100)).toISOString();
          break;
      }

      // Determine request limit based on tier
      let requestLimit = 50;
      if (tier === "Premium") requestLimit = 100;
      if (tier === "Enterprise") requestLimit = 250;

      // Get user email for subscribers table
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser.user?.email || "";

      // Upsert subscription
      const { error: upsertError } = await supabase
        .from("subscribers_public")
        .upsert({
          user_id: userId,
          subscribed: true,
          subscription_tier: tier,
          subscription_end: subscriptionEnd,
          ai_request_limit: requestLimit,
          is_trial_active: false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (upsertError) {
        logStep('Upsert error', upsertError);
        throw upsertError;
      }

      logStep('Subscription updated successfully');
      
      // Create audit log entry
      const newState = {
        subscribed: true,
        subscription_tier: tier,
        subscription_end: subscriptionEnd,
        ai_request_limit: requestLimit
      };
      
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: `grant_subscription_${tier}_${duration}`,
        target_user_id: userId,
        details: {
          previous_state: previousState,
          new_state: newState,
          notes: notes,
          duration: duration
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });
      
      logStep('Audit log created');

      // Also log to legacy audit table for compatibility
      await supabase
        .from("subscription_audit_log")
        .insert({
          user_id: userId,
          admin_id: user.id,
          action: action,
          previous_state: currentSub,
          new_state: newState,
          notes: notes || null,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Access granted successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (action === "revoke") {
      const { error: updateError } = await supabase
        .from("subscribers_public")
        .update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          is_trial_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (updateError) {
        logStep('Revoke error', updateError);
        throw updateError;
      }
      
      logStep('Subscription revoked successfully');
      
      // Create audit log entry
      const newState = { subscribed: false };
      
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user.id,
        action: 'revoke_subscription',
        target_user_id: userId,
        details: {
          previous_state: previousState,
          new_state: newState,
          notes: notes
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });

      // Also log to legacy audit table
      await supabase
        .from("subscription_audit_log")
        .insert({
          user_id: userId,
          admin_id: user.id,
          action: action,
          previous_state: currentSub,
          new_state: newState,
          notes: notes || null,
        });

      return new Response(
        JSON.stringify({ success: true, message: "Access revoked successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    logStep('Error in admin-manage-subscription', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
