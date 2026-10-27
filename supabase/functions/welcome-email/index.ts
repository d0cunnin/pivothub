import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { db, json } from '../_shared/paymentHttp.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Called by the profiles INSERT trigger via pg_net when a new user signs up.
// Protected by a shared secret header — the endpoint is not public.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const secret = Deno.env.get('EMAIL_TRIGGER_SECRET')
  if (!secret || req.headers.get('x-email-trigger-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let userId: string | undefined
  try {
    const body = await req.json()
    userId = typeof body?.userId === 'string' ? body.userId : undefined
  } catch {
    return json({ error: 'Invalid body' }, 400)
  }
  if (!userId) return json({ error: 'userId required' }, 400)

  try {
    const { data, error } = await db().auth.admin.getUserById(userId)
    if (error || !data.user?.email) return json({ error: 'User not found' }, 404)

    const name =
      (data.user.user_metadata?.display_name as string | undefined) ??
      (data.user.user_metadata?.full_name as string | undefined) ??
      undefined

    const result = await sendTemplateEmail('welcome', data.user.email, {
      templateData: { name },
      idempotencyKey: `welcome-${userId}`,
    })
    return json(result)
  } catch (error) {
    console.error('Welcome email failed', error instanceof Error ? error.message : error)
    return json({ error: 'Send failed' }, 500)
  }
})
