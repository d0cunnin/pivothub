import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header to extract user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Supabase automatically validates JWT when verify_jwt = true
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { videoPath } = await req.json();
    
    if (!videoPath) {
      return new Response(
        JSON.stringify({ error: 'Video path is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log access attempt
    await supabaseAdmin
      .from('storage_access_audit')
      .insert({
        user_id: user.id,
        bucket_id: 'course-media',
        object_name: videoPath,
        access_granted: true
      });

    // Generate signed URL for the video (expires in 1 hour)
    const { data: signedUrl, error: urlError } = await supabaseAdmin.storage
      .from('course-media')
      .createSignedUrl(videoPath, 3600); // 1 hour expiry

    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      
      // Update audit log
      await supabaseAdmin
        .from('storage_access_audit')
        .update({ access_granted: false })
        .eq('user_id', user.id)
        .eq('object_name', videoPath)
        .order('attempted_at', { ascending: false })
        .limit(1);
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate video URL' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        signedUrl: signedUrl.signedUrl,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});