import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { guard, logRequest, corsHeaders } from "../_shared/guard.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Validation schema
const logoGeneratorSchema = z.object({
  businessName: z.string().min(1).max(200),
  industry: z.string().min(1).max(200),
  style: z.string().min(1).max(100),
  colors: z.string().max(200).optional(),
  fonts: z.string().max(200).optional(),
  textDesired: z.string().max(100).optional(),
  additionalPrompt: z.string().max(500).optional()
});

serve(async (req) => {
  const startTime = Date.now();
  let userId = 'unknown';
  let ip = 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Apply guard for auth, rate limit, and credit deduction
    const guardResult = await guard(req, {
      endpoint: "generate-logo",
      cost: 2,
      requireAuth: true,
      maxReqsPerMinute: 20
    });
    
    userId = guardResult.userId;
    ip = guardResult.ip;
    
    const rawBody = await req.json();
    
    // Validate input
    const validation = logoGeneratorSchema.safeParse(rawBody);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.format() }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { businessName, industry, style, colors, fonts, textDesired, additionalPrompt } = validation.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('Lovable API key is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating logo for:', { businessName, industry, style, colors, fonts, textDesired });

    // Build additional context from optional fields
    let additionalContext = '';
    if (colors) additionalContext += ` Use color palette: ${colors}.`;
    if (fonts) additionalContext += ` Font style: ${fonts}.`;
    if (textDesired) additionalContext += ` Text to include: ${textDesired}.`;
    if (additionalPrompt) additionalContext += ` ${additionalPrompt}`;

    // Generate 3 logo concepts (DALL-E 3 optimized prompts)
    const logoPrompts = [
      `Professional ${style} logo design for "${businessName}", a ${industry} business.${additionalContext} Clean, modern, suitable for business branding. Vector style, simple shapes, high contrast.`,
      `${style} emblem badge for "${businessName}" ${industry} company.${additionalContext} Memorable, professional, brand-focused. Circular or shield design, bold typography.`,
      `Minimalist ${style} icon for "${businessName}" in ${industry} sector.${additionalContext} Simple geometric shapes, elegant, scalable design.`
    ];

    const logos = await Promise.all(
      logoPrompts.map(async (prompt, index) => {
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              modalities: ['image', 'text']
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Lovable AI error for logo ${index + 1}:`, response.status, errorText);
            
            if (response.status === 429) {
              throw new Error('Rate limit exceeded. Please try again later.');
            }
            if (response.status === 402) {
              throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
            }
            if (response.status === 401) {
              throw new Error('Invalid API key. Please check your Lovable AI configuration.');
            }
            if (response.status === 400) {
              throw new Error('Invalid request. Please check your prompt.');
            }
            throw new Error('Failed to generate logo image');
          }

          const data = await response.json();
          const base64Image = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          const imageUrl = base64Image || null;

          if (!imageUrl) {
            console.error('No image URL in response:', data);
            throw new Error('No image generated');
          }

          const styleNames = ['Logo Design', 'Emblem Design', 'Icon Design'];

          return {
            style: `${style} ${styleNames[index]}`,
            concept: `Professional ${style} design for ${businessName} in the ${industry} industry`,
            imageURL: imageUrl
          };
        } catch (error) {
          console.error(`Error generating logo ${index + 1}:`, error);
          return {
            style: `${style} Design ${index + 1}`,
            concept: `${style} design for ${businessName} in the ${industry} industry`,
            imageURL: null,
            error: error instanceof Error ? error.message : 'Failed to generate'
          };
        }
      })
    );

    console.log('Generated logos:', logos.filter(l => l.imageURL).length, 'successful');

    await logRequest(guardResult.supabase, {
      endpoint: "generate-logo",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true,
      creditsCharged: 2,
      requestDurationMs: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({ logos }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating logo:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await logRequest(createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    ), {
      endpoint: "generate-logo",
      userId,
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: false,
      creditsCharged: 0,
      errorMessage,
      requestDurationMs: Date.now() - startTime
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});