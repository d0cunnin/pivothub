import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";
import { sanitizeAIContent } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from "@/lib/invokeFunction";
import { PreferencesPanel } from './PreferencesPanel';
import { ResultActions } from './ResultActions';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useModelSelection } from '@/hooks/useModelSelection';
import { v4 as uuidv4 } from 'uuid';

export const BusinessIdeaGenerator = () => {
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [budget, setBudget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<string[]>([]);
  const [resultId] = useState(() => uuidv4());
  const [showPreferences, setShowPreferences] = useState(false);

  const { preferences } = useUserPreferences('business-idea-generator');
  const { trackUsage } = useAnalytics();
  const { getOptimalModel, getSystemPromptModifiers } = useModelSelection();

  const generateIdeas = async (focus?: string) => {
    setIsGenerating(true);
    const startTime = Date.now();
    
    try {
      // Get user session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Please sign in to use this tool");
      }

      // Track analytics
      const inputData = { skills, interests, budget };
      const inputQuality = calculateInputQuality();
      
      const { data, error } = await invokeFunction('generate-business-content', {
        body: {
          type: 'business-ideas',
          data: { 
            skills, 
            interests, 
            budget,
            preferences,
            focus,
            systemModifiers: getSystemPromptModifiers(preferences, focus)
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse and sanitize the AI response
      const sanitizedContent = sanitizeAIContent(data.content);
      const ideaLines = sanitizedContent
        .split('\n')
        .filter((line: string) => {
          const trimmed = line.trim();
          return trimmed && 
                 trimmed.length > 20 && // Ensure substantial content
                 (trimmed.match(/^\d+\./) || trimmed.includes(':') || trimmed.length > 30);
        })
        .map((line: string) => {
          // Clean up numbered lists and formatting
          return line.replace(/^\d+\.\s*/, '').trim();
        })
        .filter((idea: string) => idea.length > 15);
      
      const finalIdeas = ideaLines.slice(0, 5);
      setIdeas(finalIdeas);
      
      // Track successful usage
      await trackUsage({
        toolName: 'business-idea-generator',
        inputData,
        inputQualityScore: inputQuality,
        responseData: { ideas: finalIdeas },
        responseTimeMs: Date.now() - startTime,
        sessionId: resultId
      });
    } catch (error) {
      console.error('Error generating ideas:', error);
      
      // Track failed usage
      await trackUsage({
        toolName: 'business-idea-generator',
        inputData: { skills, interests, budget },
        inputQualityScore: calculateInputQuality(),
        responseTimeMs: Date.now() - startTime,
        sessionId: resultId
      });
      // Enhanced fallback based on user input
      const fallbackIdeas = [
        `${skills ? `Consulting service specializing in ${skills}` : 'Professional consulting service'} - Leverage your expertise to help businesses solve problems in your area of specialization.`,
        `${interests ? `${interests}-focused` : 'Niche'} e-commerce store - Create an online store selling products that align with your interests and target a passionate community.`,
        `Digital course platform teaching ${skills || 'professional skills'} - Create and sell online courses sharing your knowledge and experience.`,
        `${budget && budget.includes('low') || budget.includes('500') ? 'Service-based' : 'Product'} business in ${interests || 'your field'} - Start with minimal upfront investment and scale based on demand.`,
        `Content creation and monetization around ${interests || 'your expertise'} - Build an audience through blogging, YouTube, or social media and monetize through various channels.`
      ];
      setIdeas(fallbackIdeas);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateInputQuality = () => {
    let score = 1;
    if (skills.length >= 10) score++;
    if (interests.length >= 10) score++;
    if (budget.length > 5) score++;
    if (skills.includes(',') || skills.includes(' and ')) score++; // Multiple skills
    return Math.min(score, 5);
  };

  const handleDownload = () => {
    const content = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'business-ideas.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-8 shadow-soft">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Lightbulb className="h-8 w-8 text-accent" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Business Idea Generator
            </h2>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Let AI help you discover business opportunities based on your skills and interests
          </p>
          <p className="text-sm text-muted-foreground">
            Answer a few questions about your background and interests. Get 3 personalized business ideas with detailed descriptions and next steps.
          </p>
        </div>

        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreferences(!showPreferences)}
          >
            Customize Results
          </Button>
        </div>

        {showPreferences && (
          <div className="mb-6">
            <PreferencesPanel toolName="business-idea-generator" />
          </div>
        )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="space-y-2">
          <Label htmlFor="skills">Your Skills *</Label>
          <Input
            id="skills"
            placeholder="List 3-5 specific skills: e.g., Digital marketing, Python programming, Graphic design, Project management"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className={skills.length < 10 ? "border-orange-300" : "border-green-300"}
          />
          <p className="text-xs text-muted-foreground">
            {skills.length < 10 ? `Add ${10 - skills.length} more characters for better results` : "Good input quality ✓"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="interests">Your Interests *</Label>
          <Input
            id="interests"
            placeholder="Describe 2-3 passion areas: e.g., Sustainable living, AI technology, Fitness coaching, Financial planning"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            className={interests.length < 10 ? "border-orange-300" : "border-green-300"}
          />
          <p className="text-xs text-muted-foreground">
            {interests.length < 10 ? `Add ${10 - interests.length} more characters for better results` : "Good input quality ✓"}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Starting Budget</Label>
          <Input
            id="budget"
            placeholder="e.g., $500-$1,000, $5,000-$10,000, or 'bootstrap with minimal investment'"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Optional: Helps tailor business suggestions to your financial capacity
          </p>
        </div>
      </div>

        <Button 
          onClick={() => generateIdeas()}
          disabled={isGenerating || skills.length < 10 || interests.length < 10}
          size="lg"
          className="w-full"
          variant="hero"
        >
        {isGenerating ? (
          <>
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            Generating Ideas...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Business Ideas (2 Credits)
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
            
            <ResultActions
              toolName="business-idea-generator"
              resultContent={ideas.join('\n\n')}
              onRegenerate={(focus?: string) => generateIdeas(focus)}
              onDownload={handleDownload}
              isGenerating={isGenerating}
            />
          </div>
        )}
      </Card>
    </div>
  );
};