
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Send, Image } from "lucide-react";

const Index = () => {
  const [imagePrompt, setImagePrompt] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleGenerateImage = () => {
    // This would connect to an AI image generation API
    // For now, we'll just simulate the process
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Use a placeholder image for now
      setGeneratedImage("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&h=350&fit=crop");
      setIsGenerating(false);
    }, 1500);
  };

  const handleSendCard = () => {
    // This would connect to an email sending API
    // For now, we'll just simulate the process
    setIsSending(true);
    
    // Simulate API call delay
    setTimeout(() => {
      alert("eCard sent successfully to " + recipientEmail);
      setIsSending(false);
    }, 1500);
  };

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
                />
                <p className="text-xs text-gray-500">Describe the image you want to generate</p>
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleGenerateImage}
                disabled={!imagePrompt || isGenerating}
              >
                <Image className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate Image"}
              </Button>
              
              <Separator className="my-2" />

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message</Label>
                <Textarea 
                  id="message"
                  placeholder="Write your personal message here..." 
                  className="min-h-[100px]"
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Recipient Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="recipient@example.com" 
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleSendCard}
                disabled={!generatedImage || !personalMessage || !recipientEmail || isSending}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSending ? "Sending..." : "Send eCard"}
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
