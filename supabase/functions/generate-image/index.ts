
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const REPLICATE_API_TOKEN = Deno.env.get('REPLICATE_API_TOKEN')
    if (!REPLICATE_API_TOKEN) {
      console.error("Error: REPLICATE_API_TOKEN is not set")
      throw new Error('REPLICATE_API_TOKEN environment variable is not set')
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_TOKEN,
    })

    const { prompt } = await req.json()
    
    if (!prompt) {
      console.error("Error: Missing prompt in request payload")
      return new Response(
        JSON.stringify({ error: "Missing required field: prompt" }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Generating image with prompt: "${prompt}"`)
    
    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {
        input: {
          prompt: prompt,
          image_dimensions: "512x512",
          num_outputs: 1,
          num_inference_steps: 50,
          guidance_scale: 7.5,
          scheduler: "K_EULER",
        },
      }
    )

    console.log("Image generation successful:", output)

    // Stable Diffusion returns an array of image URLs
    const imageUrl = Array.isArray(output) && output.length > 0 ? output[0] : null
    
    if (!imageUrl) {
      console.error("Error: No image URL in Replicate response", output)
      throw new Error('Failed to generate image: No image URL in response')
    }

    return new Response(
      JSON.stringify({ imageUrl }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error("Error in generate-image function:", error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to generate image", 
        details: error.message 
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
