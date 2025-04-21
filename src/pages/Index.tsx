
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Send, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { generateAndStoreEcardImage } from "@/integrations/supabase/generateAndStoreEcardImage";
import { supabase } from "@/integrations/supabase/supabaseClient";

// For rendering the email template to HTML
import { render } from "@react-email/render";
import { EcardEmail } from "@/email/EcardEmail"; // Changed from default to named import

const Index = () => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [step, setStep] = useState<"idle" | "generating" | "uploading" | "saving" | "sending" | "complete">("idle");
  const [fieldError, setFieldError] = useState<{prompt?: string; message?: string; email?: string}>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { toast } = useToast();

  // Input validation
  const validate = () => {
    const errors: typeof fieldError = {};
    if (!imagePrompt) errors.prompt = "Image prompt required";
    if (!personalMessage) errors.message = "Personal message required";
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) errors.email = "Valid email required";
    return errors;
  };

  // Step 1–4: Full eCard workflow
  const handleGenerateEcard = async () => {
    setStep("idle");
    setFieldError({});
    setGlobalError(null);
    setSuccessMsg(null);

    const errors = validate();
    if (Object.keys(errors).length) {
      setFieldError(errors);
      return;
    }

    setStep("generating");
    setGeneratedImage(""); // Remove preview while new image loads

    let publicImageUrl = "";
    try {
      // Will do all: generate image, upload, save metadata
      publicImageUrl = await generateAndStoreEcardImage(imagePrompt, personalMessage, recipientEmail);
      setGeneratedImage(publicImageUrl);
      setStep("saving");
      toast({ title: "Image saved", description: "eCard image and details stored." });
      // Step: send the email
      setStep("sending");

      // 🛡️ Sanitize: treat message as plain text for the email template.
      // Only pass trusted content to "html"
      const html = render(
        <EcardEmail imageUrl={publicImageUrl} message={personalMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")} />
      );

      // Call Supabase Edge Function to send email
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-ecard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If Supabase JWT is needed: "Authorization": `Bearer ${supabase.auth.session()?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          html,
          recipient_email: recipientEmail,
        }),
      });
      const out = await res.json();
      if (!res.ok) {
        throw new Error(out?.error || "Failed to send email");
      }

      setStep("complete");
      setSuccessMsg(`eCard sent to ${recipientEmail}!`);
      toast({ title: "Success", description: `eCard sent to ${recipientEmail}!` });
    } catch (error: any) {
      setGlobalError(error?.message || "Error generating/sending eCard");
      setStep("idle");
      toast({ variant: "destructive", title: "Error", description: error?.message || "Error occurred" });
    }
  };

  // Reset UI for another eCard
  const handleReset = () => {
    setStep("idle");
    setGeneratedImage("");
    setPersonalMessage("");
    setRecipientEmail("");
    setImagePrompt("");
    setGlobalError(null);
    setFieldError({});
    setSuccessMsg(null);
  };

  const buttonDisabled =
    !!fieldError.prompt || !!fieldError.message || !!fieldError.email ||
    !imagePrompt || !personalMessage || !recipientEmail ||
    step === "generating" || step === "uploading" || step === "saving" || step === "sending";

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">AI eCard Generator</h1>
          <p className="text-gray-600">Create beautiful personalized cards with AI</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Create Your eCard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imagePrompt">Image Prompt</Label>
                <Input
                  id="imagePrompt"
                  placeholder="E.g. A cat in space"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  disabled={step !== "idle"}
                />
                {fieldError.prompt && <p className="text-sm text-red-500">{fieldError.prompt}</p>}
                <p className="text-xs text-gray-500">Describe the image you want to generate</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your personal message here..."
                  className="min-h-[100px]"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  disabled={step !== "idle"}
                />
                {fieldError.message && <p className="text-sm text-red-500">{fieldError.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  disabled={step !== "idle"}
                />
                {fieldError.email && <p className="text-sm text-red-500">{fieldError.email}</p>}
              </div>
              {globalError && (
                <div className="bg-red-100 text-red-600 rounded-md px-3 py-2 mt-2">
                  {globalError}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-100 text-green-600 rounded-md px-3 py-2 mt-2">
                  {successMsg}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              {step !== "idle" && (
                <Button onClick={handleReset} variant="secondary" className="w-1/2">
                  Reset
                </Button>
              )}
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleGenerateEcard}
                disabled={buttonDisabled}
              >
                {step === "generating" && (
                  <>
                    <Image className="mr-2 h-4 w-4 animate-spin" />Generating...
                  </>
                )}
                {step === "saving" && (
                  <>
                    <Image className="mr-2 h-4 w-4 animate-spin" />Saving...
                  </>
                )}
                {step === "sending" && (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-spin" />Sending...
                  </>
                )}
                {step === "complete" && "Sent"}
                {step === "idle" && (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send eCard
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Preview Area */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Card Preview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-full aspect-[3/2] bg-gray-100 rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                {generatedImage ? (
                  <img
                    src={generatedImage}
                    alt="Generated eCard"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 flex flex-col items-center p-4 text-center">
                    <Image className="h-12 w-12 mb-2 opacity-30" />
                    <p>Image will appear here after generation</p>
                  </div>
                )}
              </div>
              {generatedImage && (
                <div className="w-full p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {personalMessage || "Your message will appear here..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
