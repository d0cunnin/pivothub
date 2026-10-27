// Shared security guard for all Edge Functions
// Provides: authentication, rate limiting, credit deduction, CORS, audit logging

import { AsyncLocalStorage } from 'node:async_hooks';
const creditRequest = new AsyncLocalStorage<{holdId?: string; userId: string}>();
export function withCreditRequest(handler:(req:Request)=>Promise<Response>) {
 return (req:Request)=>creditRequest.run({userId:''},async()=>{
  try{return await handler(req);}finally{
   const current=creditRequest.getStore();if(current?.holdId)await serviceRoleClient().rpc('release_credit_reservation',{p_user_id:current.userId,p_hold_id:current.holdId});
  }
 });
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface GuardConfig {
  endpoint: string;
  cost?: number;
  requireAuth?: boolean;
  requireCaptcha?: boolean;
  maxReqsPerMinute?: number;
  maxBodySize?: number;
  bodyLimit?: number;
}

export interface GuardResult {
  // Loose client type: functions import supabase-js from different CDN pins,
  // and a strictly typed param rejects those structurally identical clients.
  // deno-lint-ignore no-explicit-any
  supabase: any;
  userId: string;
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
    maxBodySize = config.bodyLimit ?? 100_000 // 100KB default
  } = config;

  // Extract IP (check various headers for proxied requests)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || req.headers.get('x-real-ip') 
    || 'unknown';

  // CORS validation
  const origin = req.headers.get('origin') || '';
  const isAllowedOrigin = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || /^https:\/\/[a-z0-9-]+\.lovable\.app$/.test(origin)
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

  // Credits are only checked here; they are deducted after a successful
  // generation via deductCreditsOnSuccess(), so failed requests cost nothing.
  if (cost > 0 && userId) {
    await assertCredits(userId, cost);
  }

  return { supabase, userId: userId ?? 'unknown', ip, startTime };
}

function serviceRoleClient(): any {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function isAdminUser(serviceClient: any, userId: string): Promise<boolean> {
  const { data } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return !!data;
}

function creditRefusal(reason: string | undefined, cost: number, remaining: number): Response {
  if (reason === 'account_suspended') {
    return new Response(
      JSON.stringify({ error: 'Your account has been suspended. Please contact support.' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (reason === 'no_subscription') {
    return new Response(
      JSON.stringify({ error: 'No credit account was found for your profile. Please sign out and back in, or contact support.' }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  return new Response(
    JSON.stringify({
      error: `Not enough credits. This tool needs ${cost} credit${cost === 1 ? '' : 's'} and you have ${remaining} left.`,
      code: 'INSUFFICIENT_CREDITS',
    }),
    { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Verify the user can afford `cost` credits and place a short hold on them,
 * WITHOUT deducting anything. Throws a Response (402/403/503) when they can't,
 * so the AI is never called.
 *
 * The hold stops many simultaneous requests from all passing the check before
 * any of them is charged. deductCreditsOnSuccess() turns the hold into a real
 * charge; if the request fails the hold expires on its own (~5 minutes).
 */
export async function assertCredits(userId: string, cost: number): Promise<void> {
 if(cost<=0)return;const serviceClient=serviceRoleClient();
 if(await isAdminUser(serviceClient,userId))return;
 const current=creditRequest.getStore();if(current?.holdId)throw new Error('This request already has a credit reservation');
 const {data:hold,error}=await serviceClient.rpc('reserve_ai_credits',{p_user_id:userId,p_amount:cost,p_ttl_seconds:600});
 if(error)throw new Response(JSON.stringify({error:'Could not reserve Tool Credits. Please try again.'}),{status:503,headers:{...corsHeaders,'Content-Type':'application/json'}});
 if(!hold?.ok)throw creditRefusal(hold?.reason,cost,hold?.remaining??0);
 const request=creditRequest.getStore();if(!request)throw new Error('Credit request scope missing');request.userId=userId;request.holdId=hold.hold_id;
}
export async function deductCreditsOnSuccess(_supabase:any,userId:string,endpoint:string,cost:number,_requestHash?:string):Promise<void>{
 if(cost<=0)return;const serviceClient=serviceRoleClient();if(await isAdminUser(serviceClient,userId))return;
 const current=creditRequest.getStore();if(current?.userId!==userId||!current.holdId)throw new Error('Request credit reservation missing');
 const {data,error}=await serviceClient.rpc('consume_credit_reservation',{p_user_id:userId,p_hold_id:current.holdId,p_tool_name:endpoint});
 if(error||!data?.can_use)throw new Error('Could not finalize Tool Credits. Please retry.');
}

// Helper to log successful/failed requests
export interface RequestLogEntry {
  endpoint: string;
  userId?: string | null;
  ip?: string;
  userAgent?: string;
  creditsCharged?: number;
  success?: boolean;
  errorMessage?: string;
  requestDurationMs?: number;
  durationMs?: number;
}

// Accepts either logRequest(client, entry) or logRequest(entry) - both shapes
// are used across the functions and the client is never needed here.
export async function logRequest(
  supabaseOrEntry: any,
  maybeEntry?: RequestLogEntry
) {
  const log: RequestLogEntry = maybeEntry ?? (supabaseOrEntry as RequestLogEntry);
  try {
    // Use service role client for logging (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await serviceClient.from('api_request_log').insert({
      user_id: log.userId ?? null,
      endpoint: log.endpoint,
      ip_address: log.ip ?? 'unknown',
      user_agent: log.userAgent ?? 'unknown',
      credits_charged: log.creditsCharged ?? 0,
      success: log.success ?? false,
      error_message: log.errorMessage || null,
      request_duration_ms: log.requestDurationMs ?? log.durationMs ?? 0
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
