import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";

export const BusinessIdeaGenerator = () => {
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [budget, setBudget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);

  const generateIdeas = () => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      const sampleIdeas = [
        "Online consulting service leveraging your professional expertise",
        "E-commerce store selling products related to your interests",
        "Digital course creation and online education platform", 
        "Freelance service marketplace for your specific skills",
        "Local service business addressing community needs"
      ];
      setIdeas(sampleIdeas);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Lightbulb className="h-8 w-8 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Business Idea Generator
              </h2>
            </div>
            <p className="text-xl text-muted-foreground">
              Let AI help you discover business opportunities based on your skills and interests
            </p>
          </div>

          <Card className="p-8 shadow-soft">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="skills">Your Skills</Label>
                <Input
                  id="skills"
                  placeholder="e.g., Marketing, Coding, Design"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="interests">Your Interests</Label>
                <Input
                  id="interests"
                  placeholder="e.g., Health, Technology, Arts"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Starting Budget</Label>
                <Input
                  id="budget"
                  placeholder="e.g., $1,000 - $5,000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={generateIdeas}
              disabled={isGenerating}
              size="lg"
              className="w-full"
              variant="default"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Business Ideas
                </>
              )}
            </Button>

            {ideas.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Your Personalized Business Ideas:
                </h3>
                <div className="grid gap-4">
                  {ideas.map((idea, index) => (
                    <Card key={index} className="p-4 border-l-4 border-l-accent bg-accent/5">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-accent font-semibold">{index + 1}</span>
                        </div>
                        <p className="text-foreground flex-1">{idea}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};