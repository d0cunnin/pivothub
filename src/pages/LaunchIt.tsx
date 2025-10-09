import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const LaunchIt = () => {
  const [formData, setFormData] = useState({
    ideaCategory: "",
    description: "",
    currentStage: "",
    targetAudience: "",
    availableResources: [] as string[],
    launchGoals: [] as string[],
    skillLevel: "",
    desiredSupport: [] as string[],
    additionalInfo: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState("");

  const ideaCategories = [
    "Book",
    "Audiobook",
    "Blog or Newsletter",
    "Podcast",
    "YouTube Channel",
    "Film or Documentary",
    "Course or Webinar",
    "Coaching or Consulting Program",
    "Tutoring Service",
    "Online Learning Platform",
    "Food Truck",
    "Restaurant or Café",
    "Catering Business",
    "Packaged Food or Beverage Product",
    "Handmade Product or Craft",
    "Clothing Line or Fashion Brand",
    "Beauty or Wellness Product",
    "Subscription Box",
    "Home or Lifestyle Product",
    "App or Software",
    "AI Tool or Automation Platform",
    "Hardware Product or Device",
    "Tech Startup",
    "Online Store",
    "Marketplace or Dropshipping Business",
    "Print-on-Demand Shop",
    "Fitness Program",
    "Holistic Health or Nutrition Brand",
    "Mental Health or Counseling Service",
    "Personal Training or Wellness Coaching",
    "Legal, Financial, or Real Estate Service",
    "Marketing or Creative Agency",
    "IT, Engineering, or Consulting Firm",
    "Nonprofit Organization",
    "Community Program or Youth Initiative",
    "Social Impact Venture",
    "Conference or Summit",
    "Retreat or Workshop Series",
    "Art, Fashion, or Music Event",
    "Other",
  ];

  const resourceOptions = [
    "Funding or investors",
    "Product or content prototype",
    "Branding or marketing materials",
    "Team or collaborators",
    "Website or social media accounts",
    "Legal or business registration",
    "None yet",
  ];

  const goalOptions = [
    "Validate the idea",
    "Build audience awareness",
    "Generate first sales or clients",
    "Get funding or sponsorship",
    "Build partnerships or visibility",
    "Scale an existing project",
  ];

  const supportOptions = [
    "Step-by-step launch roadmap",
    "Branding and marketing strategy",
    "Monetization plan",
    "Social media and content plan",
    "Funding or grant opportunities",
    "Tech setup or automation",
    "Legal, licensing, or compliance checklist",
    "Product development resources",
  ];

  const handleCheckboxChange = (field: 'availableResources' | 'launchGoals' | 'desiredSupport', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const generateStrategy = async () => {
    if (!formData.ideaCategory || !formData.description || !formData.currentStage || 
        !formData.targetAudience || !formData.skillLevel) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-launch-strategy', {
        body: formData
      });

      if (error) throw error;

      setStrategy(data.strategy);
      toast.success("Launch strategy generated!");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to generate strategy. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadStrategy = () => {
    const blob = new Blob([strategy], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `launch-strategy-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              Launch It 🚀
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Generate a complete, customized launch strategy for your project, product, or business idea
            </p>
          </div>

          {/* Form */}
          <Card className="p-8 mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
            <div className="space-y-6">
              {/* Idea Category */}
              <div className="space-y-2">
                <Label htmlFor="ideaCategory">What type of idea are you launching? *</Label>
                <Select value={formData.ideaCategory} onValueChange={(value) => setFormData(prev => ({ ...prev, ideaCategory: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ideaCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Describe your idea or concept *</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what you want to create or launch, including what makes it unique and who it helps."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Current Stage */}
              <div className="space-y-2">
                <Label>What stage are you currently in? *</Label>
                <RadioGroup value={formData.currentStage} onValueChange={(value) => setFormData(prev => ({ ...prev, currentStage: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="idea" id="idea" />
                    <Label htmlFor="idea" className="font-normal">Idea or concept stage</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="research" id="research" />
                    <Label htmlFor="research" className="font-normal">Research and planning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prototype" id="prototype" />
                    <Label htmlFor="prototype" className="font-normal">Prototype or sample ready</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prelaunch" id="prelaunch" />
                    <Label htmlFor="prelaunch" className="font-normal">Pre-launch (testing or audience building)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="launched" id="launched" />
                    <Label htmlFor="launched" className="font-normal">Recently launched (need scaling strategy)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Who is your target audience or ideal customer? *</Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Include demographics, interests, or problems your idea solves."
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Available Resources */}
              <div className="space-y-2">
                <Label>What resources do you already have?</Label>
                <div className="space-y-2">
                  {resourceOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`resource-${option}`}
                        checked={formData.availableResources.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('availableResources', option)}
                      />
                      <Label htmlFor={`resource-${option}`} className="font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Launch Goals */}
              <div className="space-y-2">
                <Label>What do you want to achieve with your launch?</Label>
                <div className="space-y-2">
                  {goalOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${option}`}
                        checked={formData.launchGoals.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('launchGoals', option)}
                      />
                      <Label htmlFor={`goal-${option}`} className="font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill Level */}
              <div className="space-y-2">
                <Label htmlFor="skillLevel">What is your experience level in launching or entrepreneurship? *</Label>
                <Select value={formData.skillLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, skillLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner (first-time creator or founder)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (have launched before)</SelectItem>
                    <SelectItem value="advanced">Advanced (experienced entrepreneur)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Desired Support */}
              <div className="space-y-2">
                <Label>What kind of help or guidance do you want most?</Label>
                <div className="space-y-2">
                  {supportOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`support-${option}`}
                        checked={formData.desiredSupport.includes(option)}
                        onCheckedChange={() => handleCheckboxChange('desiredSupport', option)}
                      />
                      <Label htmlFor={`support-${option}`} className="font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-2">
                <Label htmlFor="additionalInfo">Anything else you'd like to include?</Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Optional — include goals, challenges, or deadlines for your project."
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateStrategy}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Your Launch Strategy...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Generate Launch Strategy
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Generated Strategy */}
          {strategy && (
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Launch Strategy</h2>
                <Button onClick={downloadStrategy} variant="outline">
                  Download Strategy
                </Button>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                {strategy}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaunchIt;
