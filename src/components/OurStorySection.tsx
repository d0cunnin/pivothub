import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RunwareService } from "@/lib/runware";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const OurStorySection = () => {
  const [apiKey, setApiKey] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateStoryImage = async () => {
    if (!apiKey.trim()) {
      toast.error("Please enter your Runware API key");
      return;
    }

    setIsGenerating(true);
    try {
      const runware = new RunwareService(apiKey);
      const result = await runware.generateImage({
        positivePrompt: "A diverse group of happy smiling professional adults celebrating success, business people of different ethnicities laughing and high-fiving in a modern office setting, bright natural lighting, professional photography style, uplifting and inspiring atmosphere",
        model: "runware:100@1",
        numberResults: 1,
        outputFormat: "WEBP",
        width: 800,
        height: 600
      });
      
      setGeneratedImage(result.imageURL);
      toast.success("Image generated successfully!");
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section id="about" className="py-24 px-4 bg-gradient-to-br from-background to-muted/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-accent"></div>
      <div className="container mx-auto animate-fade-in">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gradient-to-r from-secondary/10 to-accent/10 rounded-2xl mb-8 shadow-soft">
              <h2 className="text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent">Our Story</h2>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Story Content */}
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-lg text-foreground space-y-6 leading-relaxed text-left">
                <p>
                  ReLaunch was born out of necessity during a critical period in our economy. Between January and July 2025, 
                  hundreds of thousands of people found themselves unemployed or underemployed, facing an unprecedented challenge 
                  in securing meaningful work.
                </p>
                <p>
                  As we witnessed this crisis unfold, it became clear that traditional approaches to career development were 
                  no longer sufficient. The accelerated pace of technological advancement was reshaping entire industries, 
                  creating both challenges and opportunities for the workforce.
                </p>
                <p>
                  We realized that people needed more than just job search assistance. They needed comprehensive tools to either 
                  upskill for the evolving job market or forge their own path through entrepreneurship. ReLaunch was created 
                  to provide exactly that: a platform where individuals can either reskill to become more marketable for employment 
                  or launch their own businesses with the tools and guidance they need to succeed.
                </p>
                <p>
                  Today, we're proud to be part of the solution, helping thousands of people relaunch their vocations and 
                  build sustainable futures that create positive economic impact in our rapidly changing world.
                </p>
              </div>
            </div>

            {/* Image Generation Section */}
            <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft">
                {!generatedImage ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-semibold mb-2">Add Your Story Image</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate an inspiring image of successful professionals to accompany our story
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Label htmlFor="apiKey">Runware API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Enter your Runware API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your API key from{" "}
                        <a 
                          href="https://runware.ai/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          runware.ai
                        </a>
                      </p>
                    </div>
                    
                    <Button 
                      onClick={generateStoryImage}
                      disabled={isGenerating || !apiKey.trim()}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Image...
                        </>
                      ) : (
                        "Generate Story Image"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <img 
                      src={generatedImage} 
                      alt="Happy successful professionals celebrating" 
                      className="w-full h-auto rounded-lg shadow-soft"
                    />
                    <Button 
                      onClick={() => setGeneratedImage(null)}
                      variant="outline"
                      className="w-full"
                    >
                      Generate New Image
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};