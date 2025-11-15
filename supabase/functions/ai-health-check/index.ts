import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from "../_shared/guard.ts";

/**
 * AI Service Health Check
 * Makes a minimal test call to AI gateway every 30 seconds
 * Stores results in ai_service_status table for monitoring
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    // Initialize Supabase client (service role for writing)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Make minimal test call to AI gateway
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    let status: 'operational' | 'paused' | 'degraded' = 'operational';
    let errorMessage: string | null = null;
    let workspacePaused = false;

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'user', content: 'Test' }
          ],
          max_completion_tokens: 10
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.status === 402) {
        status = 'paused';
        errorMessage = 'AI credits exhausted';
        workspacePaused = true;
      } else if (response.status === 429) {
        status = 'degraded';
        errorMessage = 'Rate limit exceeded';
      } else if (!response.ok) {
        status = 'degraded';
        errorMessage = `HTTP ${response.status}`;
      }

      // Store health check result
      const { error: insertError } = await supabaseClient
        .from('ai_service_status')
        .insert({
          status,
          response_time_ms: responseTime,
          error_message: errorMessage,
          workspace_paused: workspacePaused
        });

      if (insertError) {
        console.error('Failed to store health check:', insertError);
      }

      // Cleanup old records
      await supabaseClient.rpc('cleanup_old_health_checks');

      return new Response(
        JSON.stringify({
          status,
          response_time_ms: responseTime,
          workspace_paused: workspacePaused,
          checked_at: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        status = 'degraded';
        errorMessage = 'Request timeout (5s)';
      } else {
        status = 'degraded';
        errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      }

      const responseTime = Date.now() - startTime;

      // Store failed health check
      await supabaseClient
        .from('ai_service_status')
        .insert({
          status,
          response_time_ms: responseTime,
          error_message: errorMessage,
          workspace_paused: false
        });

      return new Response(
        JSON.stringify({
          status,
          error_message: errorMessage,
          response_time_ms: responseTime,
          checked_at: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'degraded',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        checked_at: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
