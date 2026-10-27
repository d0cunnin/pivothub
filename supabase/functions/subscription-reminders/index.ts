import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { db, json } from '../_shared/paymentHttp.ts'
import { paymentCatalog, isPaymentPriceId } from '../_shared/paymentCatalog.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Runs daily via pg_cron. Emails a renewal reminder 4 days before a live
// subscription's current period ends. Idempotency keys prevent duplicates
// if the job runs more than once in the window.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const secret = Deno.env.get('EMAIL_TRIGGER_SECRET')
  if (!secret || req.headers.get('x-email-trigger-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  try {
    const now = Date.now()
    const windowStart = new Date(now + 4 * 24 * 60 * 60 * 1000).toISOString()
    const windowEnd = new Date(now + 5 * 24 * 60 * 60 * 1000).toISOString()

    const { data: subs, error } = await db()
      .from('payment_subscriptions')
      .select('user_id, stripe_subscription_id, price_id, current_period_end')
      .eq('environment', 'live')
      .eq('status', 'active')
      .eq('cancel_at_period_end', false)
      .gte('current_period_end', windowStart)
      .lt('current_period_end', windowEnd)
    if (error) throw error

    let sent = 0
    let skipped = 0
    for (const sub of subs ?? []) {
      try {
        if (!isPaymentPriceId(sub.price_id) || !paymentCatalog[sub.price_id].recurring) continue
        const plan = paymentCatalog[sub.price_id]
        const { data: userData, error: userError } = await db().auth.admin.getUserById(sub.user_id)
        if (userError || !userData.user?.email) {
          skipped++
          continue
        }
        const renewalDate = new Date(sub.current_period_end).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'UTC',
        })
        const result = await sendTemplateEmail('renewal-reminder', userData.user.email, {
          templateData: {
            name: (userData.user.user_metadata?.display_name as string | undefined) ?? undefined,
            planName: plan.name,
            amount: `$${(plan.amount / 100).toFixed(2)}`,
            renewalDate,
            credits: plan.credits,
          },
          idempotencyKey: `renewal-reminder-${sub.stripe_subscription_id}-${sub.current_period_end}`,
        })
        if (result.sent) sent++
        else skipped++
      } catch (error) {
        skipped++
        console.error('Reminder failed for subscription', sub.stripe_subscription_id, error instanceof Error ? error.message : error)
      }
    }
    return json({ sent, skipped, checked: subs?.length ?? 0 })
  } catch (error) {
    console.error('Reminder job failed', error instanceof Error ? error.message : error)
    return json({ error: 'Reminder job failed' }, 500)
  }
})
