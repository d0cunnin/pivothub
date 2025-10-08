import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Download, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourseData {
  courseName: string;
  skills: string;
  industry: string;
  experience: string;
  education: string;
  certifications: string;
  targetLevel: string;
  duration: string;
  objectives: string;
}

export const CourseOutlineGenerator = () => {
  const [formData, setFormData] = useState<CourseData>({
    courseName: "",
    skills: "",
    industry: "",
    experience: "",
    education: "",
    certifications: "",
    targetLevel: "beginner",
    duration: "4",
    objectives: ""
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutline, setGeneratedOutline] = useState("");

  const handleInputChange = (field: keyof CourseData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateOutline = async () => {
    if (!formData.courseName || !formData.skills) {
      toast.error("Please fill in Course Name and Skills fields");
      return;
    }

    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-teaching-content', {
        body: {
          type: 'course-outline',
          data: formData
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedOutline(data.content);
      toast.success("Course outline generated successfully!");
    } catch (error) {
      console.error('Error generating course outline:', error);
      toast.error("Failed to generate course outline. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadOutline = () => {
    const blob = new Blob([generatedOutline], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `course-outline-${formData.courseName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-8">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold text-foreground">Course Outline Generator</h3>
      </div>
      <p className="text-muted-foreground mb-6">
        Build comprehensive course structures with modules, lessons, and learning objectives
      </p>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name *</Label>
            <Input
              id="courseName"
              placeholder="e.g., Complete Digital Marketing Mastery"
              value={formData.courseName}
              onChange={(e) => handleInputChange("courseName", e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targetLevel">Target Level</Label>
            <Select value={formData.targetLevel} onValueChange={(value) => handleInputChange("targetLevel", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="all-levels">All Levels</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="skills">Your Skills & Expertise *</Label>
          <Textarea
            id="skills"
            placeholder="List the skills and topics you'll cover in this course"
            value={formData.skills}
            onChange={(e) => handleInputChange("skills", e.target.value)}
            rows={3}
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
            <Label htmlFor="duration">Course Duration (weeks)</Label>
            <Select value={formData.duration} onValueChange={(value) => handleInputChange("duration", value)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="2">2 weeks</SelectItem>
                <SelectItem value="4">4 weeks</SelectItem>
                <SelectItem value="6">6 weeks</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
                <SelectItem value="12">12 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
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

          <div className="space-y-2">
            <Label htmlFor="education">Education Background</Label>
            <Input
              id="education"
              placeholder="e.g., MBA in Business Administration"
              value={formData.education}
              onChange={(e) => handleInputChange("education", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="certifications">Certifications</Label>
          <Input
            id="certifications"
            placeholder="e.g., Google Analytics Certified, PMP"
            value={formData.certifications}
            onChange={(e) => handleInputChange("certifications", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="objectives">Course Objectives</Label>
          <Textarea
            id="objectives"
            placeholder="What will students be able to do after completing this course?"
            value={formData.objectives}
            onChange={(e) => handleInputChange("objectives", e.target.value)}
            rows={3}
          />
        </div>

        <Button 
          onClick={generateOutline}
          disabled={isGenerating || !formData.courseName || !formData.skills}
          size="lg"
          className="w-full"
          variant="hero"
        >
          <Sparkles className="h-5 w-5 mr-2" />
          {isGenerating ? "Generating Course Outline..." : "Generate Course Outline"}
        </Button>

        {generatedOutline && (
          <div className="space-y-4 mt-8 pt-8 border-t">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-foreground">Your Course Outline</h4>
              <Button variant="outline" size="sm" onClick={downloadOutline}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
            <Card className="p-6 bg-muted/30 max-h-96 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-foreground">{generatedOutline}</pre>
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
};
