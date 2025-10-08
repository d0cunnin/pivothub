import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HandoutData {
  title: string;
  topic: string;
  skills: string;
  industry: string;
  experience: string;
  education: string;
  certifications: string;
  handoutType: string;
  keyPoints: string;
}

export const HandoutCreator = () => {
  const [formData, setFormData] = useState<HandoutData>({
    title: "",
    topic: "",
    skills: "",
    industry: "",
    experience: "",
    education: "",
    certifications: "",
    handoutType: "reference",
    keyPoints: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHandout, setGeneratedHandout] = useState("");

  const handleInputChange = (field: keyof HandoutData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateHandout = async () => {
    if (!formData.title || !formData.topic || !formData.skills) {
      toast.error("Please fill in Title, Topic, and Skills fields");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-teaching-content', {
        body: {
          type: 'handout',
          data: formData
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedHandout(data.content);
      toast.success("Handout generated successfully!");
    } catch (error) {
      console.error('Error generating handout:', error);
      toast.error("Failed to generate handout. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadHandout = () => {
    const blob = new Blob([generatedHandout], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `handout-${formData.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Handout Creator</h3>
      </div>
      <p className="text-muted-foreground mb-6">
        Generate professional handouts, worksheets, and reference materials for your students
      </p>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Handout Title *</Label>
            <Input
              id="title"
              placeholder="e.g., SEO Best Practices Checklist"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="handoutType">Handout Type</Label>
            <Select value={formData.handoutType} onValueChange={(value) => handleInputChange("handoutType", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="reference">Reference Guide</SelectItem>
                <SelectItem value="worksheet">Worksheet</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="cheatsheet">Cheat Sheet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Topic/Lesson *</Label>
          <Input
            id="topic"
            placeholder="e.g., Search Engine Optimization Fundamentals"
            value={formData.topic}
            onChange={(e) => handleInputChange("topic", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Your Skills & Expertise *</Label>
          <Textarea
            id="skills"
            placeholder="List your relevant skills for this handout"
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
          <Label htmlFor="keyPoints">Key Points to Include</Label>
          <Textarea
            id="keyPoints"
            placeholder="List the main points or sections you want in this handout"
            value={formData.keyPoints}
            onChange={(e) => handleInputChange("keyPoints", e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={generateHandout}
          disabled={isGenerating || !formData.title || !formData.topic || !formData.skills}
          size="lg"
          className="w-full"
          variant="hero"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isGenerating ? "Generating Handout..." : "Generate Handout"}
        </Button>

        {generatedHandout && (
          <div className="space-y-4 mt-8 pt-8 border-t">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-foreground">Your Handout</h4>
              <Button variant="outline" size="sm" onClick={downloadHandout}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <Card className="p-6 bg-muted/30 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground">{generatedHandout}</pre>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};
