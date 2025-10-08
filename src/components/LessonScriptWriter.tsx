import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LessonData {
  lessonTitle: string;
  topic: string;
  skills: string;
  industry: string;
  experience: string;
  education: string;
  certifications: string;
  duration: string;
  learningObjectives: string;
  keyTopics: string;
}

export const LessonScriptWriter = () => {
  const [formData, setFormData] = useState<LessonData>({
    lessonTitle: "",
    topic: "",
    skills: "",
    industry: "",
    experience: "",
    education: "",
    certifications: "",
    duration: "30",
    learningObjectives: "",
    keyTopics: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");

  const handleInputChange = (field: keyof LessonData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateScript = async () => {
    if (!formData.lessonTitle || !formData.topic || !formData.skills) {
      toast.error("Please fill in Lesson Title, Topic, and Skills fields");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-teaching-content', {
        body: {
          type: 'lesson-script',
          data: formData
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedScript(data.content);
      toast.success("Lesson script generated successfully!");
    } catch (error) {
      console.error('Error generating lesson script:', error);
      toast.error("Failed to generate lesson script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadScript = () => {
    const blob = new Blob([generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-script-${formData.lessonTitle.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Lesson Script Writer</h3>
      </div>
      <p className="text-muted-foreground mb-6">
        Create engaging lesson scripts with explanations, examples, and interactive elements
      </p>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lessonTitle">Lesson Title *</Label>
            <Input
              id="lessonTitle"
              placeholder="e.g., Introduction to Email Marketing"
              value={formData.lessonTitle}
              onChange={(e) => handleInputChange("lessonTitle", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Lesson Duration (minutes)</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Main Topic *</Label>
          <Input
            id="topic"
            placeholder="e.g., Email Marketing Fundamentals"
            value={formData.topic}
            onChange={(e) => handleInputChange("topic", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Your Skills & Expertise *</Label>
          <Textarea
            id="skills"
            placeholder="List your relevant skills and expertise for this lesson"
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
          <Label htmlFor="learningObjectives">Learning Objectives</Label>
          <Textarea
            id="learningObjectives"
            placeholder="What should students learn from this lesson?"
            value={formData.learningObjectives}
            onChange={(e) => handleInputChange("learningObjectives", e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="keyTopics">Key Topics to Cover</Label>
          <Textarea
            id="keyTopics"
            placeholder="List the main topics or points to cover in this lesson"
            value={formData.keyTopics}
            onChange={(e) => handleInputChange("keyTopics", e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={generateScript}
          disabled={isGenerating || !formData.lessonTitle || !formData.topic || !formData.skills}
          size="lg"
          className="w-full"
          variant="hero"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isGenerating ? "Generating Lesson Script..." : "Generate Lesson Script"}
        </Button>

        {generatedScript && (
          <div className="space-y-4 mt-8 pt-8 border-t">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-foreground">Your Lesson Script</h4>
              <Button variant="outline" size="sm" onClick={downloadScript}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <Card className="p-6 bg-muted/30 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground">{generatedScript}</pre>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};
