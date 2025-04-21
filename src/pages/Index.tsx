
import { useState, useEffect } from "react";
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
import { render } from "@react-email/render";
import { EcardEmail } from "@/email/EcardEmail";

const LOCALSTORAGE_IMAGE_KEY = "lastGeneratedEcardImageUrl";

// Define the step type as a single type with all possible values
type Step = "idle" | "generating" | "uploading" | "saving" | "sending" | "complete";

const Index = () => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [fieldError, setFieldError] = useState<{prompt?: string; message?: string; email?: string}>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { toast } = useToast();

  // Restore last image after reload, if present
  useEffect(() => {
    const last = localStorage.getItem(LOCALSTORAGE_IMAGE_KEY);
    if (last) {
      setGeneratedImage(last);
    }
  }, []);

  // Save generated image URL to localStorage
  useEffect(() => {
    if (generatedImage) {
      localStorage.setItem(LOCALSTORAGE_IMAGE_KEY, generatedImage);
    }
  }, [generatedImage]);

  const validate = () => {
    const errors: typeof fieldError = {};
    if (!imagePrompt) errors.prompt = "Image prompt required";
    if (!personalMessage) errors.message = "Personal message required";
    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) errors.email = "Valid email required";
    return errors;
  };

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
    setGeneratedImage(""); // Remove preview while loading new image

    let publicImageUrl = "";
    try {
      publicImageUrl = await generateAndStoreEcardImage(imagePrompt, personalMessage, recipientEmail);
      setGeneratedImage(publicImageUrl);
      // Save to localStorage handled in useEffect
      setStep("saving");
      toast({ title: "Image saved", description: "eCard image and details stored." });
      setStep("idle");
    } catch (error: any) {
      setGlobalError(error?.message || "Error generating/sending eCard");
      setStep("idle");
      toast({ variant: "destructive", title: "Error", description: error?.message || "Error occurred" });
    }
  };

  // Send email, separated for proper loading state
  const handleSendEmail = async () => {
    setStep("sending");
    setGlobalError(null);
    setSuccessMsg(null);

    try {
      const html = render(
        <EcardEmail imageUrl={generatedImage} message={personalMessage.replace(/</g, "&lt;").replace(/>/g, "&gt;")} />
      );

      // Use the correct Supabase URL from the client configuration
      const SUPABASE_URL = "https://brkuujubpgctyrdizysu.supabase.co";
      
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-ecard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya3V1anVicGdjdHlyZGl6eXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMTIzMjcsImV4cCI6MjA2MDc4ODMyN30.1oBKMiXzRk163ZbjvVWzoYStIi6S7Apvu7Ulv_5guiQ",
        },
        body: JSON.stringify({
          html,
          recipient_email: recipientEmail,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to send email: ${res.status} ${res.statusText}`);
      }
      
      const out = await res.json();
      setStep("complete");
      setSuccessMsg(`✅ eCard sent to ${recipientEmail}!`);
      toast({ title: "Success", description: `eCard sent to ${recipientEmail}!` });
    } catch (error: any) {
      console.error("Send email error:", error);
      setGlobalError(error?.message || "Error sending eCard");
      setStep("idle");
      toast({ variant: "destructive", title: "Error", description: error?.message || "Error occurred" });
    }
  };

  const handleReset = () => {
    setStep("idle");
    setGeneratedImage("");
    setPersonalMessage("");
    setRecipientEmail("");
    setImagePrompt("");
    setGlobalError(null);
    setFieldError({});
    setSuccessMsg(null);
    localStorage.removeItem(LOCALSTORAGE_IMAGE_KEY);
  };

  // Refined disabling logic: disable GENERATE if missing fields, SEND if missing image/message
  const canGenerate =
    !!imagePrompt && !!personalMessage && !!recipientEmail && step === "idle";
  const canSend =
    !!generatedImage && !!personalMessage && !!recipientEmail && step === "idle";

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
                {fieldError.prompt && (
                  <p className="text-sm font-medium text-red-700 bg-red-100 rounded px-2 py-1">{fieldError.prompt}</p>
                )}
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
                {fieldError.message && (
                  <p className="text-sm font-medium text-red-700 bg-red-100 rounded px-2 py-1">{fieldError.message}</p>
                )}
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
                {fieldError.email && (
                  <p className="text-sm font-medium text-red-700 bg-red-100 rounded px-2 py-1">{fieldError.email}</p>
                )}
              </div>
              {globalError && (
                <div className="bg-red-200 border border-red-500 text-red-900 font-bold text-center rounded-md px-3 py-2 mt-2 animate-pulse">
                  {globalError}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-200 border border-green-500 text-green-900 font-bold text-center rounded-md px-3 py-2 mt-2 animate-fade-in">
                  {successMsg}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={handleReset}
                  variant="secondary"
                  className="w-1/2"
                  disabled={step !== "idle" && step !== "complete"}
                  type="button"
                >
                  Reset
                </Button>
                <Button
                  className="w-1/2 bg-purple-600 hover:bg-purple-700"
                  onClick={handleGenerateEcard}
                  disabled={!canGenerate}
                  type="button"
                >
                  {step === "generating" ? (
                    <>
                      <Image className="mr-2 h-4 w-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Image className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
              {/* Send eCard as separate button for clearer intent and loading */}
              <Button
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
                onClick={handleSendEmail}
                disabled={!canSend}
                type="button"
              >
                {step === "sending" ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-spin" /> Sending eCard...
                  </>
                ) : (
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
