import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Download, X } from "lucide-react";

interface TeachingMaterialsData {
  fullName: string;
  skills: string[];
  otherSkill?: string;
  experience: string;
  educationLevel: string;
  major: string;
  otherMajor?: string;
  certifications: string;
  teachingFormat: string;
  targetAudience: string[];
  otherAudience?: string;
  duration: string;
  additionalNotes?: string;
}

interface GeneratedMaterials {
  webinarConcepts: string;
  courseOutline: string;
  handouts: string;
  lessonScript: string;
}

const skillOptions = [
  "Coding",
  "Public Speaking",
  "Mental Health",
  "STEM",
  "Entrepreneurship",
  "Art",
  "Music",
  "Cooking",
  "Fitness",
  "Other"
];

const audienceOptions = [
  "Kids",
  "Teens",
  "Adults",
  "Professionals",
  "Other"
];

const educationLevels = [
  "High School",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate (PhD)",
  "Professional Degree",
  "Other"
];

const majorOptions = [
  "Business Administration",
  "Computer Science",
  "Engineering",
  "Education",
  "Healthcare/Nursing",
  "Psychology",
  "Marketing",
  "Communications",
  "Art & Design",
  "Music",
  "Mathematics",
  "Biology/Life Sciences",
  "Social Sciences",
  "Liberal Arts/Humanities",
  "Finance/Accounting",
  "Other"
];

const TeachingMaterialsGenerator = () => {
  const [formData, setFormData] = useState<TeachingMaterialsData>({
    fullName: "",
    skills: [],
    experience: "",
    educationLevel: "",
    major: "",
    certifications: "",
    teachingFormat: "Self-Paced Course",
    targetAudience: [],
    duration: "1 hour",
    additionalNotes: ""
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMaterials, setGeneratedMaterials] = useState<GeneratedMaterials | null>(null);

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAudienceToggle = (audience: string) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter(a => a !== audience)
        : [...prev.targetAudience, audience]
    }));
  };

  const generateMaterials = async () => {
    if (!formData.fullName.trim() || formData.skills.length === 0 || !formData.experience.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in your name, select at least one skill, and describe your experience.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-teaching-content", {
        body: {
          type: "all-materials",
          data: formData
        }
      });

      if (error) throw error;

      setGeneratedMaterials(data);
      toast({
        title: "Success!",
        description: "All teaching materials have been generated."
      });
    } catch (error) {
      console.error("Error generating materials:", error);
      toast({
        title: "Error",
        description: "Failed to generate teaching materials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMaterial = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllMaterials = () => {
    if (!generatedMaterials) return;

    const allContent = `
TEACHING MATERIALS FOR ${formData.fullName}
Generated on ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════
WEBINAR / COURSE CONCEPTS
═══════════════════════════════════════════════════════════

${generatedMaterials.webinarConcepts}

═══════════════════════════════════════════════════════════
COURSE OUTLINE / MODULES
═══════════════════════════════════════════════════════════

${generatedMaterials.courseOutline}

═══════════════════════════════════════════════════════════
HANDOUTS & RESOURCES
═══════════════════════════════════════════════════════════

${generatedMaterials.handouts}

═══════════════════════════════════════════════════════════
LESSON SCRIPTS & TALKING POINTS
═══════════════════════════════════════════════════════════

${generatedMaterials.lessonScript}
    `.trim();

    const filename = `teaching-materials-${formData.fullName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`;
    downloadMaterial(allContent, filename);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
        <h3 className="text-2xl font-bold mb-6 text-foreground">Turn Your Skills into a Course</h3>
        
        <div className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          {/* Skills / Expertise */}
          <div className="space-y-2">
            <Label>Skills / Expertise Areas</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {skillOptions.map((skill) => (
                <div key={skill} className="flex items-center space-x-2">
                  <Checkbox
                    id={`skill-${skill}`}
                    checked={formData.skills.includes(skill)}
                    onCheckedChange={() => handleSkillToggle(skill)}
                  />
                  <label htmlFor={`skill-${skill}`} className="text-sm cursor-pointer">
                    {skill}
                  </label>
                </div>
              ))}
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleSkillToggle(skill)}
                    />
                  </Badge>
                ))}
              </div>
            )}
            {formData.skills.includes("Other") && (
              <Input
                placeholder="Specify other skill"
                value={formData.otherSkill || ""}
                onChange={(e) => setFormData({ ...formData, otherSkill: e.target.value })}
                className="mt-2"
              />
            )}
          </div>

          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experience</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Describe your relevant work, volunteer, or personal projects"
              rows={4}
            />
          </div>

          {/* Education Level */}
          <div className="space-y-2">
            <Label htmlFor="educationLevel">Highest Level of Education</Label>
            <select
              id="educationLevel"
              value={formData.educationLevel}
              onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value, major: "" })}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="">Select education level</option>
              {educationLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Major - Only show if education level is selected and not "High School" or "Other" */}
          {formData.educationLevel && formData.educationLevel !== "High School" && formData.educationLevel !== "Other" && (
            <div className="space-y-2">
              <Label htmlFor="major">Major / Field of Study</Label>
              <select
                id="major"
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="">Select major</option>
                {majorOptions.map((major) => (
                  <option key={major} value={major}>
                    {major}
                  </option>
                ))}
              </select>
              {formData.major === "Other" && (
                <Input
                  placeholder="Specify your major"
                  value={formData.otherMajor || ""}
                  onChange={(e) => setFormData({ ...formData, otherMajor: e.target.value })}
                  className="mt-2"
                />
              )}
            </div>
          )}

          {/* Other Education - Show text field if "Other" is selected */}
          {formData.educationLevel === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="otherEducation">Specify Your Education</Label>
              <Input
                id="otherEducation"
                placeholder="Describe your education background"
                value={formData.otherMajor || ""}
                onChange={(e) => setFormData({ ...formData, otherMajor: e.target.value })}
              />
            </div>
          )}

          {/* Certifications */}
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications / Credentials</Label>
            <Input
              id="certifications"
              value={formData.certifications}
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
              placeholder="Any relevant certifications"
            />
          </div>

          {/* Teaching Format */}
          <div className="space-y-2">
            <Label>Preferred Teaching Format</Label>
            <RadioGroup
              value={formData.teachingFormat}
              onValueChange={(value) => setFormData({ ...formData, teachingFormat: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Webinar / Live Workshop" id="format-webinar" />
                <Label htmlFor="format-webinar" className="cursor-pointer font-normal">Webinar / Live Workshop</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Self-Paced Course" id="format-self" />
                <Label htmlFor="format-self" className="cursor-pointer font-normal">Self-Paced Course</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="One-on-One Coaching" id="format-coaching" />
                <Label htmlFor="format-coaching" className="cursor-pointer font-normal">One-on-One Coaching</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Hybrid" id="format-hybrid" />
                <Label htmlFor="format-hybrid" className="cursor-pointer font-normal">Hybrid</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {audienceOptions.map((audience) => (
                <div key={audience} className="flex items-center space-x-2">
                  <Checkbox
                    id={`audience-${audience}`}
                    checked={formData.targetAudience.includes(audience)}
                    onCheckedChange={() => handleAudienceToggle(audience)}
                  />
                  <label htmlFor={`audience-${audience}`} className="text-sm cursor-pointer">
                    {audience}
                  </label>
                </div>
              ))}
            </div>
            {formData.targetAudience.includes("Other") && (
              <Input
                placeholder="Specify other audience"
                value={formData.otherAudience || ""}
                onChange={(e) => setFormData({ ...formData, otherAudience: e.target.value })}
                className="mt-2"
              />
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration</Label>
            <select
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="30 min">30 minutes</option>
              <option value="1 hour">1 hour</option>
              <option value="2 hours">2 hours</option>
              <option value="Half-day">Half-day</option>
              <option value="Multi-session">Multi-session</option>
            </select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes / Goals (Optional)</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              placeholder="Specific outcomes you want your teaching materials to achieve"
              rows={3}
            />
          </div>

          <Button
            onClick={generateMaterials}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating All Materials...
              </>
            ) : (
              "Generate All Teaching Materials"
            )}
          </Button>
        </div>
      </Card>

      {generatedMaterials && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-foreground">Your Teaching Materials</h3>
            <Button onClick={downloadAllMaterials} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download All
            </Button>
          </div>

          <Tabs defaultValue="concepts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="concepts">Concepts</TabsTrigger>
              <TabsTrigger value="outline">Outline</TabsTrigger>
              <TabsTrigger value="handouts">Handouts</TabsTrigger>
              <TabsTrigger value="script">Script</TabsTrigger>
            </TabsList>

            <TabsContent value="concepts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Webinar / Course Concepts</h4>
                <Button
                  onClick={() => downloadMaterial(generatedMaterials.webinarConcepts, "course-concepts.txt")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{generatedMaterials.webinarConcepts}</pre>
              </div>
            </TabsContent>

            <TabsContent value="outline" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Course Outline / Modules</h4>
                <Button
                  onClick={() => downloadMaterial(generatedMaterials.courseOutline, "course-outline.txt")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{generatedMaterials.courseOutline}</pre>
              </div>
            </TabsContent>

            <TabsContent value="handouts" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Handouts & Resources</h4>
                <Button
                  onClick={() => downloadMaterial(generatedMaterials.handouts, "handouts-resources.txt")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{generatedMaterials.handouts}</pre>
              </div>
            </TabsContent>

            <TabsContent value="script" className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold">Lesson Scripts & Talking Points</h4>
                <Button
                  onClick={() => downloadMaterial(generatedMaterials.lessonScript, "lesson-script.txt")}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{generatedMaterials.lessonScript}</pre>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
};

export default TeachingMaterialsGenerator;
