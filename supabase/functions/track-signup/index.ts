import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get real IP address
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || null;

    // The request only names the new account. Everything recorded is checked
    // against the real account, so nobody can create or alter audit entries
    // for another person.
    let body: any = null;
    try { body = await req.json(); } catch { /* handled below */ }
    const claimedId = typeof body?.userId === 'string' ? body.userId : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(claimedId)) {
      return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: account } = await supabase.auth.admin.getUserById(claimedId);
    const user = account?.user;
    const ageMs = user?.created_at ? Date.now() - new Date(user.created_at).getTime() : Infinity;
    const claimedEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    // Only a genuine account created in the last 15 minutes, with the matching email.
    if (!user?.email || ageMs > 15 * 60 * 1000 || (claimedEmail && claimedEmail !== user.email.toLowerCase())) {
      return new Response(JSON.stringify({ error: 'Signup not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = user.id;
    const email = user.email;

    // Record each signup once.
    const { data: already } = await supabase.from('signup_audit').select('user_id').eq('user_id', userId).limit(1);
    if (already?.length) {
      return new Response(JSON.stringify({ success: true, alreadyTracked: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check for existing signups from this IP
    const { data: existingSignups, error: checkError } = await supabase
      .from('signup_audit')
      .select('user_id')
      .eq('ip_address', ip);

    if (checkError) {
      console.error('Error checking existing signups:', checkError);
    }

    const accountsFromIp = (existingSignups?.length || 0) + 1;
    const isSuspicious = accountsFromIp > 3; // Flag if more than 3 accounts from same IP
    const fraudReason = isSuspicious ? `Multiple accounts detected: ${accountsFromIp} from same IP` : null;

    // Insert signup audit record
    const { error: insertError } = await supabase
      .from('signup_audit')
      .insert({
        user_id: userId,
        email,
        ip_address: ip,
        user_agent: userAgent,
        flagged_as_suspicious: isSuspicious,
        fraud_reason: fraudReason,
        accounts_from_ip: accountsFromIp,
      });

    if (insertError) {
      console.error('Error inserting signup audit:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to track signup' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Signup tracked - User: ${email}, IP: ${ip}, Suspicious: ${isSuspicious}, Accounts from IP: ${accountsFromIp}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        flagged: isSuspicious,
        accountsFromIp 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in track-signup function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
