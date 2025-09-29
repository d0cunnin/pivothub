import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { businessName, industry, style } = await req.json()
    
    const runwareApiKey = Deno.env.get('relaunch-runwarekey-correct')
    if (!runwareApiKey) {
      throw new Error('relaunch-runwarekey-correct not found in environment variables')
    }

    // Create a descriptive prompt for logo generation
    const prompt = `Professional logo for "${businessName}", ${industry} industry, ${style} style. Clean, modern, high-quality business logo design. Vector style, minimal background.`

    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          taskType: "authentication",
          apiKey: runwareApiKey
        },
        {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          positivePrompt: prompt,
          width: 512,
          height: 512,
          model: "runware:100@1",
          numberResults: 3,
          outputFormat: "WEBP",
          CFGScale: 1,
          scheduler: "FlowMatchEulerDiscreteScheduler",
          strength: 0.8
        }
      ])
    })

    const data = await response.json()
    
    if (data.error || data.errors) {
      throw new Error(data.errorMessage || data.errors?.[0]?.message || 'Failed to generate logo')
    }

    // Extract logo URLs from response
    const logos = data.data
      .filter((item: any) => item.taskType === "imageInference")
      .map((item: any) => ({
        imageURL: item.imageURL,
        style: style,
        concept: `${style} logo design for ${businessName}`
      }))

    return new Response(
      JSON.stringify({ logos }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error generating logo:', error)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})