
import { supabase } from "./supabaseClient";
import { generateImage } from "./generateImage";
import { uploadEcardImage } from "./uploadEcardImage";

/**
 * Generates an image, uploads to Supabase Storage, and saves the record in ecards.
 * @param prompt The prompt for the AI image generator.
 * @param message The personal message to be saved with the eCard.
 * @param recipientEmail The recipient's email address.
 * @returns Promise<string> - Public URL of the uploaded image in Supabase storage.
 * @throws If image generation, upload, or database insertion fails.
 */
export async function generateAndStoreEcardImage(
  prompt: string,
  message: string,
  recipientEmail: string
): Promise<string> {
  // Step 1: Generate image via Replicate through the edge function
  let imageUrl: string;
  try {
    imageUrl = await generateImage(prompt);
    if (!imageUrl) {
      throw new Error("No image URL returned from image generation.");
    }
    console.log("Replicate image URL:", imageUrl);
  } catch (error: any) {
    console.error("Error during image generation:", error);
    throw new Error(`Failed to generate image: ${error.message || error}`);
  }

  // Step 2: Fetch the image from the URL and convert to Blob
  let blob: Blob;
  try {
    const resp = await fetch(imageUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch image from Replicate: ${resp.status} ${resp.statusText}`);
    }
    blob = await resp.blob();
    if (!blob || blob.size === 0) {
      throw new Error("Received empty image Blob.");
    }
    console.log("Fetched image blob, size:", blob.size);
  } catch (error: any) {
    console.error("Error fetching image from Replicate:", error);
    throw new Error(`Failed to download generated image: ${error.message || error}`);
  }

  // Step 3: Upload Blob to Supabase Storage using uploadEcardImage utility
  let storageUrl: string;
  try {
    storageUrl = await uploadEcardImage(blob);
    if (!storageUrl) {
      throw new Error("No public URL returned after upload.");
    }
    console.log("Supabase storage public URL:", storageUrl);
  } catch (error: any) {
    console.error("Error uploading image to Supabase Storage:", error);
    throw new Error(`Failed to upload image to storage: ${error.message || error}`);
  }

  // Step 4: Insert a row in the ecards table
  try {
    const { error } = await supabase.from("ecards").insert({
      image_url: storageUrl,
      message: message,
      recipient_email: recipientEmail,
    });
    if (error) {
      throw new Error(error.message);
    }
    console.log(
      "Inserted record into ecards table with image_url, message, and recipient_email"
    );
  } catch (error: any) {
    console.error("Error inserting record into ecards table:", error);
    throw new Error(`Failed to save eCard data: ${error.message || error}`);
  }

  // Finally, return the public image URL
  return storageUrl;
}
