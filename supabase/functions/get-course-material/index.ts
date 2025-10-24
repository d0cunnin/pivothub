import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";

const getMaterialSchema = z.object({
  courseId: z.string().uuid(),
  fileName: z.string().min(1).max(500).regex(/^[a-zA-Z0-9\-_./]+$/, "Invalid file name"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let startTime = Date.now();
  let ip = 'unknown';
  let userId: string | null = null;

  try {
    console.log('Get course material called');

    const requestData = await req.json();
    const validation = getMaterialSchema.safeParse(requestData);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { courseId, fileName } = validation.data;

    // Apply security guard (no credit cost for accessing purchased content)
    const guardResult = await guard(req, {
      endpoint: 'get-course-material',
      cost: 0,
      requireAuth: true,
      requireCaptcha: false,
      maxReqsPerMinute: 60
    });

    startTime = guardResult.startTime;
    ip = guardResult.ip;
    userId = guardResult.userId;

    // Verify enrollment in the course
    const { data: enrolled, error: enrollError } = await guardResult.supabase
      .from('course_enrollments')
      .select('course_id')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (enrollError) {
      console.error('Error checking enrollment:', enrollError);
      await logRequest(guardResult.supabase, {
        userId,
        endpoint: 'get-course-material',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'Error checking enrollment',
        requestDurationMs: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ error: 'Error verifying enrollment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin (admins can access all materials)
    const { data: isAdmin } = await guardResult.supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (!enrolled && !isAdmin) {
      console.log('User not enrolled in course:', userId, courseId);
      await logRequest(guardResult.supabase, {
        userId,
        endpoint: 'get-course-material',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'Not enrolled in course',
        requestDurationMs: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ error: 'Not enrolled in this course' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate signed URL using service role (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const filePath = `${courseId}/${fileName}`;
    const { data, error } = await adminClient.storage
      .from('course-materials')
      .createSignedUrl(filePath, 600); // 10 minutes expiry

    if (error || !data) {
      console.error('Error creating signed URL:', error);
      await logRequest(guardResult.supabase, {
        userId,
        endpoint: 'get-course-material',
        ip,
        userAgent: req.headers.get('user-agent') || 'unknown',
        creditsCharged: 0,
        success: false,
        errorMessage: 'File not found',
        requestDurationMs: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful request
    await logRequest(guardResult.supabase, {
      userId,
      endpoint: 'get-course-material',
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      creditsCharged: 0,
      success: true,
      requestDurationMs: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({ 
        url: data.signedUrl,
        expiresIn: 600 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in get-course-material:', error);
    
    // Handle guard errors (Response objects)
    if (error instanceof Response) {
      return error;
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
