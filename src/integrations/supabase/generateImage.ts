
import { supabase } from "./client";

/**
 * Generates an image using Replicate's Stable Diffusion model via Supabase Edge Function.
 * @param prompt The text prompt to generate an image from
 * @returns Promise containing the URL of the generated image
 */
export async function generateImage(prompt: string): Promise<string> {
  if (!prompt || prompt.trim() === "") {
    throw new Error("Image prompt cannot be empty");
  }
  
  const { data, error } = await supabase.functions.invoke("generate-image", {
    body: { prompt },
  });

  if (error) {
    console.error("Error calling generate-image function:", error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }

  if (!data || !data.imageUrl) {
    throw new Error("Failed to generate image: No image URL returned");
  }

  return data.imageUrl;
}
