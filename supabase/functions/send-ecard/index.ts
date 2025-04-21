
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Get the Resend API key from Supabase secrets
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// CORS headers for preflight and regular responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!RESEND_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Resend API key not configured." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { html, recipient_email } = await req.json();

    if (!html || !recipient_email) {
      return new Response(
        JSON.stringify({ error: "Both 'html' and 'recipient_email' are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(RESEND_API_KEY);

    const emailResult = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: [recipient_email],
      subject: "You've received an eCard!",
      html: html,
    });

    // Log sending result for debugging
    console.log("Resend response:", emailResult);

    if (emailResult.error) {
      throw new Error(emailResult.error?.message || "Unknown send error");
    }

    return new Response(
      JSON.stringify({ success: true, result: emailResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Send eCard error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
