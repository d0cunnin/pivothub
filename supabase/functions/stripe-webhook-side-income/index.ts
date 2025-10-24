import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * DEPRECATED: This webhook is no longer used.
 * Side Income Blueprint now uses the credit system instead of separate payments.
 * 
 * This function is kept for backwards compatibility with any in-flight payments
 * but should not receive new checkout sessions.
 */

serve(async (req) => {
  console.warn('[DEPRECATED] stripe-webhook-side-income is deprecated. Side Income now uses credit system.');
  
  // Return success for any webhook calls to prevent errors,
  // but log that this endpoint should no longer be receiving events
  return new Response(JSON.stringify({ 
    received: true, 
    deprecated: true,
    message: 'Side Income Blueprint now uses credit system. This webhook is no longer active.'
  }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});