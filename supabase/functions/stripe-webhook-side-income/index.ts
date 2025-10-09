import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_SIDE_INCOME');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log(`[WEBHOOK] Received event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const assessmentId = session.metadata?.assessmentId;
      const userId = session.metadata?.userId;

      if (assessmentId && userId) {
        console.log(`[WEBHOOK] Processing payment for assessment ${assessmentId}`);

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Update assessment payment status
        const { error } = await supabase
          .from('side_income_assessments')
          .update({
            payment_status: 'paid',
            stripe_session_id: session.id
          })
          .eq('id', assessmentId)
          .eq('user_id', userId);

        if (error) {
          console.error('[WEBHOOK] Error updating assessment:', error);
          throw error;
        }

        console.log(`[WEBHOOK] Successfully updated assessment ${assessmentId} to paid`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});