
import { supabase } from "./client";

/**
 * Uploads an image (File or Blob) to the 'ecards' Supabase storage bucket.
 * Names the file ecard-${timestamp}.png and returns the public URL.
 * Throws if upload fails.
 *
 * @param file File or Blob to upload
 * @returns public URL string
 */
export async function uploadEcardImage(file: File | Blob): Promise<string> {
  const timestamp = Date.now();
  const fileName = `ecard-${timestamp}.png`;

  // Upload image to 'ecards' bucket
  const { data, error } = await supabase.storage
    .from("ecards")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (error) {
    throw new Error("Failed to upload file: " + error.message);
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("ecards")
    .getPublicUrl(fileName);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Failed to retrieve public URL for uploaded file.");
  }

  return publicUrlData.publicUrl;
}
