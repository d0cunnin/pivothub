import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WebinarData {
  topic: string;
  skills: string;
  industry: string;
  experience: string;
  education: string;
  certifications: string;
  targetAudience: string;
  duration: string;
  objectives: string;
}

export const WebinarPlanner = () => {
  const [formData, setFormData] = useState<WebinarData>({
    topic: "",
    skills: "",
    industry: "",
    experience: "",
    education: "",
    certifications: "",
    targetAudience: "",
    duration: "60",
    objectives: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState("");

  const handleInputChange = (field: keyof WebinarData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generatePlan = async () => {
    if (!formData.topic || !formData.skills) {
      toast.error("Please fill in Topic and Skills fields");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-teaching-content', {
        body: {
          type: 'webinar-plan',
          data: formData
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedPlan(data.content);
      toast.success("Webinar plan generated successfully!");
    } catch (error) {
      console.error('Error generating webinar plan:', error);
      toast.error("Failed to generate webinar plan. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPlan = () => {
    const blob = new Blob([generatedPlan], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `webinar-plan-${formData.topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Video className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Webinar Planner</h3>
      </div>
      <p className="text-muted-foreground mb-6">
        Create a structured webinar outline with timing, talking points, and engagement activities
      </p>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Webinar Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., Introduction to Digital Marketing"
              value={formData.topic}
              onChange={(e) => handleInputChange("topic", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Your Skills & Expertise *</Label>
          <Textarea
            id="skills"
            placeholder="List the skills and areas of expertise you'll be teaching"
            value={formData.skills}
            onChange={(e) => handleInputChange("skills", e.target.value)}
            rows={2}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry (Optional)</Label>
            <Input
              id="industry"
              placeholder="e.g., Technology, Healthcare"
              value={formData.industry}
              onChange={(e) => handleInputChange("industry", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Years of Professional Experience</Label>
            <Input
              id="experience"
              type="number"
              placeholder="e.g., 5"
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="education">Education Background</Label>
            <Input
              id="education"
              placeholder="e.g., MBA in Business Administration"
              value={formData.education}
              onChange={(e) => handleInputChange("education", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications</Label>
            <Input
              id="certifications"
              placeholder="e.g., Google Analytics Certified"
              value={formData.certifications}
              onChange={(e) => handleInputChange("certifications", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Textarea
            id="targetAudience"
            placeholder="Describe who will benefit most from this webinar"
            value={formData.targetAudience}
            onChange={(e) => handleInputChange("targetAudience", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objectives">Learning Objectives</Label>
          <Textarea
            id="objectives"
            placeholder="What will participants learn or be able to do after the webinar?"
            value={formData.objectives}
            onChange={(e) => handleInputChange("objectives", e.target.value)}
            rows={2}
          />
        </div>

        <Button 
          onClick={generatePlan}
          disabled={isGenerating || !formData.topic || !formData.skills}
          size="lg"
          className="w-full"
          variant="hero"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isGenerating ? "Generating Webinar Plan..." : "Generate Webinar Plan"}
        </Button>

        {generatedPlan && (
          <div className="space-y-4 mt-8 pt-8 border-t">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-foreground">Your Webinar Plan</h4>
              <Button variant="outline" size="sm" onClick={downloadPlan}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <Card className="p-6 bg-muted/30 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground">{generatedPlan}</pre>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};
