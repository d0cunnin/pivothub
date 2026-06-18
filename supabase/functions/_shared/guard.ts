// Shared security guard for all Edge Functions
// Provides: authentication, rate limiting, credit deduction, CORS, audit logging

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface GuardConfig {
  endpoint: string;
  cost?: number;
  requireAuth?: boolean;
  requireCaptcha?: boolean;
  maxReqsPerMinute?: number;
  maxBodySize?: number;
}

export interface GuardResult {
  supabase: SupabaseClient;
  userId: string | null;
  ip: string;
  startTime: number;
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://fkvjsgqjgissolpdqbdh.supabase.co',
  'https://www.pivothub.io',
  'https://pivothub.io',
  'https://app.pivothub.io'
];

const WINDOW_SECONDS = 60;

export async function guard(req: Request, config: GuardConfig): Promise<GuardResult> {
  const startTime = Date.now();
  const {
    endpoint,
    cost = 0,
    requireAuth = true,
    requireCaptcha = false,
    maxReqsPerMinute = 30,
    maxBodySize = 100_000 // 100KB default
  } = config;

  // Extract IP (check various headers for proxied requests)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';

  // CORS validation
  const origin = req.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed) || origin.includes('lovable.app') || origin.includes('lovableproject.com')
  );
  console.log('[GUARD] Origin check', { origin, isAllowedOrigin });
  if (origin && !isAllowedOrigin) {
    throw new Response(
      JSON.stringify({ error: 'Origin not allowed', details: origin }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  // Content-Type check
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 415, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Body size limit (prevent DoS)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxBodySize) {
      throw new Response(
        JSON.stringify({ error: 'Request body too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Extract JWT token from Authorization header
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  
  // Initialize Supabase client with caller's JWT
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  // Authentication check
  let userId: string | null = null;
  if (requireAuth) {
    console.log('[GUARD] Authentication check:', {
      endpoint,
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenPrefix: token.substring(0, 20) + '...',
      tokenLength: token.length
    });
    
    // Verify the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    console.log('[GUARD] Auth result:', {
      endpoint,
      hasUser: !!user,
      userId: user?.id || 'none',
      errorCode: userError?.code || 'none',
      errorMessage: userError?.message || 'none'
    });
    
    if (!user || userError) {
      await logRequest(supabase, {
        userId: null,
        endpoint,
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: `Unauthorized: ${userError?.message || 'No user found'}`,
        requestDurationMs: Date.now() - startTime
      });
      throw new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          details: userError?.message || 'Auth session missing!'
        }), 
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    userId = user.id;
  }

  // CAPTCHA verification (if required)
  if (requireCaptcha) {
    const body = await req.clone().json().catch(() => ({}));
    const token = body?.captchaToken;
    
    if (!token) {
      await logRequest(supabase, {
        userId,
        endpoint,
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'CAPTCHA required',
        requestDurationMs: Date.now() - startTime
      });
      throw new Response(
        JSON.stringify({ error: 'CAPTCHA verification required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Cloudflare Turnstile
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (turnstileSecret) {
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: turnstileSecret,
            response: token,
            remoteip: ip
          })
        }
      );
      
      const result = await verifyRes.json();
      if (!result.success) {
        await logRequest(supabase, {
          userId,
          endpoint,
          ip,
          userAgent: req.headers.get('user-agent') || 'unknown',
          creditsCharged: 0,
          success: false,
          errorMessage: 'CAPTCHA verification failed',
          requestDurationMs: Date.now() - startTime
        });
        throw new Response(
          JSON.stringify({ error: 'CAPTCHA verification failed' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // IP-based rate limiting
  try {
    const { error: throttleError } = await supabase.rpc('throttle_ip', {
      p_ip: ip,
      p_endpoint: endpoint,
      p_window_seconds: WINDOW_SECONDS,
      p_max_reqs: maxReqsPerMinute
    });

    if (throttleError) {
      await logRequest(supabase, {
        userId,
        endpoint,
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'Rate limit exceeded',
        requestDurationMs: Date.now() - startTime
      });
      throw new Response(
        JSON.stringify({ error: 'Rate limit exceeded - Please try again later', retryAfter: 60 }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
      );
    }
  } catch (e) {
    if (e instanceof Response) throw e;
    // If throttle check fails, continue but log it
    console.error('Throttle check failed:', e);
  }

  // Per-user rate limiting (5 requests per minute per endpoint)
  if (requireAuth && userId) {
    try {
      const { error: userThrottleError } = await supabase.rpc('throttle_user', {
        p_user_id: userId,
        p_endpoint: endpoint,
        p_window_seconds: WINDOW_SECONDS,
        p_max_reqs: 5
      });

      if (userThrottleError) {
        if (userThrottleError.message.includes('USER_RATE_LIMIT_EXCEEDED')) {
          await logRequest(supabase, {
            userId,
            endpoint,
            ip,
            userAgent: req.headers.get('user-agent') || 'unknown',
            creditsCharged: 0,
            success: false,
            errorMessage: 'Per-user rate limit exceeded (5/min)',
            requestDurationMs: Date.now() - startTime
          });
          
          throw new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded', 
              message: 'You can make up to 5 requests per minute to this tool. Please wait before trying again.',
              retryAfter: 60
            }),
            { 
              status: 429,
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json', 
                'Retry-After': '60' 
              }
            }
          );
        }
        throw userThrottleError;
      }
    } catch (e) {
      if (e instanceof Response) throw e;
      // If per-user throttle check fails, log but don't block request
      console.error('User throttle check failed:', e);
    }
  }

  // CREDIT DEDUCTION REMOVED FROM GUARD
  // Credits are now deducted AFTER successful generation using deductCreditsOnSuccess()
  // This prevents charging users for failed requests

  return { supabase, userId, ip, startTime };
}

/**
 * Deduct credits AFTER successful generation
 * Only call this after AI output has been successfully generated
 * 
 * @param requestHash - Optional hash for idempotency (prevents double-charging)
 */
export async function deductCreditsOnSuccess(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string,
  cost: number,
  requestHash?: string
): Promise<void> {
  if (cost === 0) return;

  // Create service role client for admin checks
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check if user is admin (skip credit deduction for QA testing)
  const { data: roleData } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleData) {
    console.log('[CREDITS] Admin user - skipping credit deduction');
    return;
  }

  // Check for duplicate request (idempotency)
  if (requestHash) {
    const { data: existingRequest } = await serviceClient
      .from('credit_deduction_log')
      .select('request_hash')
      .eq('request_hash', requestHash)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRequest) {
      console.log('[CREDITS] Duplicate request detected - skipping deduction');
      return;
    }
  }

  // Deduct credits
  const { data, error } = await supabase.rpc(
    'check_and_increment_ai_usage',
    {
      p_user_id: userId,
      p_tool_name: endpoint,
      p_credits_to_use: cost
    }
  );

  if (error || !data?.can_use) {
    console.error('[CREDITS] Post-generation deduction failed:', error);
    // Log but don't block (user already got output)
  }

  // Log deduction for audit trail
  if (requestHash) {
    await serviceClient
      .from('credit_deduction_log')
      .insert({
        user_id: userId,
        endpoint,
        credits_deducted: cost,
        request_hash: requestHash,
        deducted_at: new Date().toISOString()
      })
      .catch(err => console.error('[CREDITS] Failed to log deduction:', err));
  }
}

// Helper to log successful/failed requests
export async function logRequest(
  supabase: SupabaseClient,
  log: {
    userId: string | null;
    endpoint: string;
    ip: string;
    userAgent: string;
    creditsCharged: number;
    success: boolean;
    errorMessage?: string;
    requestDurationMs: number;
  }
) {
  try {
    // Use service role client for logging (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceClient.from('api_request_log').insert({
      user_id: log.userId,
      endpoint: log.endpoint,
      ip_address: log.ip,
      user_agent: log.userAgent,
      credits_charged: log.creditsCharged,
      success: log.success,
      error_message: log.errorMessage || null,
      request_duration_ms: log.requestDurationMs
    });
  } catch (e) {
    console.error('Failed to log request:', e);
  }
}

// CORS headers helper
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};
