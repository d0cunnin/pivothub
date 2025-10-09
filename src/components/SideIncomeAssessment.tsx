import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface SideIncomeAssessmentProps {
  onComplete: (data: any) => void;
  loading?: boolean;
}

const SKILLS_OPTIONS = [
  "Writing", "Design", "Programming", "Marketing", "Sales", 
  "Teaching", "Consulting", "Photography", "Video Editing", 
  "Social Media", "Data Analysis", "Project Management"
];

const INTERESTS_OPTIONS = [
  "Technology", "Creative Arts", "Business", "Health & Wellness",
  "Education", "Real Estate", "Finance", "E-commerce", "Content Creation"
];

export default function SideIncomeAssessment({ onComplete, loading = false }: SideIncomeAssessmentProps) {
  const [formData, setFormData] = useState({
    employmentStatus: "",
    currentIncome: "",
    timeAvailable: "",
    skills: [] as string[],
    interests: [] as string[],
    goals: "",
    startupBudget: "",
    experience: ""
  });

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const isFormValid = 
    formData.employmentStatus &&
    formData.currentIncome &&
    formData.timeAvailable &&
    formData.skills.length > 0 &&
    formData.interests.length > 0 &&
    formData.goals &&
    formData.startupBudget;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Side Income Assessment</CardTitle>
        <CardDescription>
          Help us understand your situation so we can create a personalized blueprint
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employmentStatus">Current Employment Status</Label>
            <Select 
              value={formData.employmentStatus}
              onValueChange={(value) => setFormData(prev => ({ ...prev, employmentStatus: value }))}
            >
              <SelectTrigger id="employmentStatus">
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time Employed</SelectItem>
                <SelectItem value="part-time">Part-time Employed</SelectItem>
                <SelectItem value="freelance">Freelance/Self-employed</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentIncome">Current Monthly Income Range</Label>
            <Select 
              value={formData.currentIncome}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currentIncome: value }))}
            >
              <SelectTrigger id="currentIncome">
                <SelectValue placeholder="Select income range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-2000">$0 - $2,000</SelectItem>
                <SelectItem value="2000-4000">$2,000 - $4,000</SelectItem>
                <SelectItem value="4000-6000">$4,000 - $6,000</SelectItem>
                <SelectItem value="6000+">$6,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeAvailable">Hours Available Per Week</Label>
            <Select 
              value={formData.timeAvailable}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeAvailable: value }))}
            >
              <SelectTrigger id="timeAvailable">
                <SelectValue placeholder="Select available hours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5-10">5-10 hours</SelectItem>
                <SelectItem value="10-20">10-20 hours</SelectItem>
                <SelectItem value="20-30">20-30 hours</SelectItem>
                <SelectItem value="30+">30+ hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Your Skills (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3">
              {SKILLS_OPTIONS.map(skill => (
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
          </div>

          <div className="space-y-3">
            <Label>Areas of Interest (select all that apply)</Label>
            <div className="grid grid-cols-2 gap-3">
              {INTERESTS_OPTIONS.map(interest => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`interest-${interest}`}
                    checked={formData.interests.includes(interest)}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <label htmlFor={`interest-${interest}`} className="text-sm cursor-pointer">
                    {interest}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">What are your income goals?</Label>
            <Textarea 
              id="goals"
              placeholder="e.g., I want to earn an extra $1000/month to pay off debt and build savings..."
              value={formData.goals}
              onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startupBudget">Startup Budget Available</Label>
            <Select 
              value={formData.startupBudget}
              onValueChange={(value) => setFormData(prev => ({ ...prev, startupBudget: value }))}
            >
              <SelectTrigger id="startupBudget">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-100">$0 - $100</SelectItem>
                <SelectItem value="100-500">$100 - $500</SelectItem>
                <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                <SelectItem value="1000+">$1,000+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Previous Side Income Experience (optional)</Label>
            <Textarea 
              id="experience"
              placeholder="Have you tried any side hustles before? What worked or didn't work?"
              value={formData.experience}
              onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={!isFormValid || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Continue to Payment'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}