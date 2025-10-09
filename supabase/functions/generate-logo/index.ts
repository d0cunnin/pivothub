import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, industry, style, colors, fonts, textDesired, additionalPrompt } = await req.json();
    
    if (!businessName || !industry || !style) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: businessName, industry, and style are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    return new Response(
      JSON.stringify({ logos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-logo function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});