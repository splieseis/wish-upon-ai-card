
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://brkuujubpgctyrdizysu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya3V1anVicGdjdHlyZGl6eXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMTIzMjcsImV4cCI6MjA2MDc4ODMyN30.1oBKMiXzRk163ZbjvVWzoYStIi6S7Apvu7Ulv_5guiQ";

// This creates the Supabase client using the project URL and anon key.
// Export as "supabase" for use in other modules.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
