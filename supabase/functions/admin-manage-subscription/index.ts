import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { requireAdminMfa } from "../_shared/adminMfaGuard.ts";

const logStep = (step: string, data?: any) => {
  console.log(`[ADMIN-MANAGE] ${step}`, data || '');
};

// Admin action validation schema
const adminManageSchema = z.object({
  action: z.enum(['grant', 'revoke', 'extend']),
  userId: z.string().uuid(),
  tier: z.enum(['Basic', 'Premium', 'Enterprise']).optional(),
  duration: z.enum(['1-month', '3-months', '6-months', '1-year', 'lifetime']).optional(),
  notes: z.string().max(1000).optional()
});

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

  let startTime = Date.now();
  let ip = 'unknown';
  let adminId: string | null = null;

  try {
    logStep('Starting admin subscription management');

    // Parse and validate input
    const requestData = await req.json();
    const validation = adminManageSchema.safeParse(requestData);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply security guard (no credit cost for admins)
    const guardResult = await guard(req, {
      endpoint: 'admin-manage-subscription',
      cost: 0,
      requireAuth: true,
      requireCaptcha: false,
      maxReqsPerMinute: 60
    });

    startTime = guardResult.startTime;
    ip = guardResult.ip;
    adminId = guardResult.userId;

    // Check if user has admin role using has_role function
    const { data: isAdmin, error: roleError } = await guardResult.supabase.rpc('has_role', {
      _user_id: adminId,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      await logRequest(guardResult.supabase, {
        userId: adminId,
        endpoint: 'admin-manage-subscription',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'Forbidden: Admin access required',
        requestDurationMs: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Admin verified:', adminId);

    // Create service role client for MFA check
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Require MFA for admin subscription management
    const mfaCheck = await requireAdminMfa(supabaseAdmin, adminId);
    if (mfaCheck.error) {
      logStep('MFA check failed:', mfaCheck.error);
      await logRequest(guardResult.supabase, {
        userId: adminId,
        endpoint: 'admin-manage-subscription',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: mfaCheck.error,
        requestDurationMs: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ error: mfaCheck.error, code: 'MFA_REQUIRED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('MFA verified for admin');

    // Use validated data
    const requestBody = validation.data as GrantAccessRequest;
    const { action, userId, tier, duration, notes } = requestBody;

    logStep('Admin action initiated', { action, userId, tier, duration, adminId });

    // Check rate limit (max 100 admin actions per hour)
    const { data: rateLimitCheck, error: rateLimitError } = await guardResult.supabase
      .rpc('check_admin_rate_limit', {
        p_admin_user_id: adminId,
        p_action_type: 'subscription_management',
        p_max_actions: 100,
        p_window_minutes: 60
      });
    
    if (rateLimitError) {
      logStep('Rate limit check error', rateLimitError);
    }
    
    if (rateLimitCheck === false) {
      logStep('Rate limit exceeded for admin', adminId);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. You have performed too many admin actions. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current subscription state for audit log
    const { data: currentSub } = await supabaseAdmin
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
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = authUser.user?.email || "";

      // Upsert subscription
      const { error: upsertError } = await supabaseAdmin
        .from("subscribers_public")
        .upsert({
          user_id: userId,
          subscribed: true,
          subscription_tier: tier,
          subscription_end: subscriptionEnd,
          ai_request_limit: requestLimit,
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
      
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_user_id: adminId,
        action: `grant_subscription_${tier}_${duration}`,
        target_user_id: userId,
        details: {
          previous_state: previousState,
          new_state: newState,
          notes: notes,
          duration: duration
        },
        ip_address: ip,
        user_agent: req.headers.get('user-agent') || 'unknown'
      });
      
      logStep('Audit log created');

      // Also log to legacy audit table for compatibility
      await supabaseAdmin
        .from("subscription_audit_log")
        .insert({
          user_id: userId,
          admin_id: adminId,
          action: action,
          previous_state: currentSub,
          new_state: newState,
          notes: notes || null,
        });

      // Log successful request
      await logRequest(guardResult.supabase, {
        userId: adminId,
        endpoint: 'admin-manage-subscription',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: true,
        requestDurationMs: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ success: true, message: "Access granted successfully" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else if (action === "revoke") {
      const { error: updateError } = await supabaseAdmin
        .from("subscribers_public")
        .update({
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
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
      
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_user_id: adminId,
        action: 'revoke_subscription',
        target_user_id: userId,
        details: {
          previous_state: previousState,
          new_state: newState,
          notes: notes
        },
        ip_address: ip,
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

      // Also log to legacy audit table
      await supabaseAdmin
        .from("subscription_audit_log")
        .insert({
          user_id: userId,
          admin_id: adminId,
          action: action,
          previous_state: currentSub,
          new_state: newState,
          notes: notes || null,
        });

      // Log successful request
      await logRequest(guardResult.supabase, {
        userId: adminId,
        endpoint: 'admin-manage-subscription',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: true,
        requestDurationMs: Date.now() - startTime
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
    
    // Handle guard errors (Response objects)
    if (error instanceof Response) {
      return error;
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
