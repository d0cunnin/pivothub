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
  'https://fkvjsgqjgissolpdqbdh.supabase.co'
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
    origin.startsWith(allowed) || origin.includes('lovable.app')
  );

  if (origin && !isAllowedOrigin) {
    throw new Response('Origin not allowed', { status: 403 });
  }

  // Content-Type check
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Response('Content-Type must be application/json', { status: 415 });
    }

    // Body size limit (prevent DoS)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > maxBodySize) {
      throw new Response('Request body too large', { status: 413 });
    }
  }

  // Initialize Supabase client with caller's JWT
  const authHeader = req.headers.get('Authorization') || '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader }
      }
    }
  );

  // Authentication check
  let userId: string | null = null;
  if (requireAuth) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (!user || userError) {
      await logRequest(supabase, {
        userId: null,
        endpoint,
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'Unauthorized',
        requestDurationMs: Date.now() - startTime
      });
      throw new Response('Unauthorized - Please sign in', { status: 401 });
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
      throw new Response('CAPTCHA verification required', { status: 400 });
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
        throw new Response('CAPTCHA verification failed', { status: 403 });
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
      throw new Response('Rate limit exceeded - Please try again later', { status: 429 });
    }
  } catch (e) {
    if (e instanceof Response) throw e;
    // If throttle check fails, continue but log it
    console.error('Throttle check failed:', e);
  }

  // Credit deduction (if cost > 0 and user is authenticated)
  if (cost > 0 && userId) {
    const { data, error: creditError } = await supabase.rpc(
      'check_and_increment_ai_usage',
      {
        p_user_id: userId,
        p_tool_name: endpoint,
        p_credits_to_use: cost
      }
    );

    if (creditError || !data?.can_use) {
      await logRequest(supabase, {
        userId,
        endpoint,
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: data?.reason || 'Insufficient credits',
        requestDurationMs: Date.now() - startTime
      });
      
      const message = data?.reason === 'limit_exceeded' 
        ? 'Credit limit exceeded - Please upgrade your plan'
        : 'Insufficient credits';
      throw new Response(message, { status: 402 });
    }
  }

  return { supabase, userId, ip, startTime };
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
