import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Upload, Plus, X, DollarSign, Clock, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const skillCategories = {
  "Web Development": ["React", "Vue.js", "Angular", "Node.js", "PHP", "Python", "Ruby", "JavaScript", "TypeScript", "HTML/CSS"],
  "Mobile Development": ["React Native", "Flutter", "Swift", "Kotlin", "Ionic", "Xamarin"],
  "AI & Data Science": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Data Analysis", "R", "SQL"],
  "UI/UX Design": ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator", "User Research", "Prototyping"],
  "DevOps & Cloud": ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "CI/CD", "Terraform"],
  "Digital Marketing": ["SEO", "PPC", "Social Media", "Content Marketing", "Email Marketing", "Analytics"]
};

const experienceLevels = [
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "intermediate", label: "Intermediate (2-5 years)" },
  { value: "expert", label: "Expert (5+ years)" }
];

export default function FreelancerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: "",
    title: "",
    bio: "",
    skills: [] as string[],
    experience: "",
    hourlyRate: "",
    availability: "",
    portfolio: [] as string[],
    languages: [] as string[],
    education: "",
    certifications: ""
  });

  const [selectedCategory, setSelectedCategory] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const handleSkillAdd = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleSkillRemove = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleCustomSkillAdd = () => {
    if (customSkill.trim() && !formData.skills.includes(customSkill.trim())) {
      handleSkillAdd(customSkill.trim());
      setCustomSkill("");
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create your freelancer profile.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Here you would typically save to your database
    toast({
      title: "Profile Created!",
      description: "Your freelancer profile has been created successfully.",
    });
    
    navigate("/freelancer-dashboard");
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="section-spacing">
        <div className="page-container">
          <div className="content-width-sm">
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i}
                    </div>
                    {i < 4 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        i < step ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Basic Info</span>
                <span>Skills</span>
                <span>Pricing</span>
                <span>Portfolio</span>
              </div>
            </div>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {step === 1 && "Tell us about yourself"}
                  {step === 2 && "What are your skills?"}
                  {step === 3 && "Set your rates"}
                  {step === 4 && "Showcase your work"}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Let's start with the basics to create your freelancer profile"}
                  {step === 2 && "Select your top skills to help clients find you"}
                  {step === 3 && "Set competitive rates for your services"}
                  {step === 4 && "Add portfolio items and complete your profile"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <Label htmlFor="displayName">Full Name *</Label>
                      <Input
                        id="displayName"
                        value={formData.displayName}
                        onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                        placeholder="e.g., John Doe"
                      />
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="title">Professional Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Full-Stack Developer, UI/UX Designer"
                      />
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="bio">Professional Bio *</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Describe your experience, specialties, and what makes you unique..."
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        This will be the first thing clients see. Make it compelling!
                      </p>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="experience">Experience Level *</Label>
                      <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          {experienceLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 2: Skills */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="form-group">
                      <Label>Select Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a skill category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(skillCategories).map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedCategory && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          Available Skills in {selectedCategory}
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {skillCategories[selectedCategory as keyof typeof skillCategories].map((skill) => (
                            <Button
                              key={skill}
                              variant={formData.skills.includes(skill) ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleSkillAdd(skill)}
                              disabled={formData.skills.includes(skill)}
                            >
                              {formData.skills.includes(skill) ? "Added" : skill}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <Label>Add Custom Skill</Label>
                      <div className="flex gap-2">
                        <Input
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                          placeholder="Enter a custom skill"
                          onKeyPress={(e) => e.key === 'Enter' && handleCustomSkillAdd()}
                        />
                        <Button onClick={handleCustomSkillAdd} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Your Selected Skills ({formData.skills.length})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="pr-1">
                            {skill}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => handleSkillRemove(skill)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Pricing */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <Label htmlFor="hourlyRate">Hourly Rate (USD) *</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                          placeholder="75"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Research market rates for your skills to stay competitive
                      </p>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="availability">Weekly Availability *</Label>
                      <Select value={formData.availability} onValueChange={(value) => setFormData(prev => ({ ...prev, availability: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="How many hours per week?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="part-time">Part-time (10-20 hours)</SelectItem>
                          <SelectItem value="half-time">Half-time (20-30 hours)</SelectItem>
                          <SelectItem value="full-time">Full-time (30+ hours)</SelectItem>
                          <SelectItem value="flexible">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Pricing Tips
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Research similar freelancers in your field</li>
                        <li>• Consider your experience level and expertise</li>
                        <li>• Factor in your location and target market</li>
                        <li>• You can always adjust your rates later</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Step 4: Portfolio */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <Label>Portfolio URLs</Label>
                      <div className="space-y-2">
                        <Input
                          placeholder="https://github.com/yourprofile"
                          value={formData.portfolio[0] || ""}
                          onChange={(e) => {
                            const newPortfolio = [...formData.portfolio];
                            newPortfolio[0] = e.target.value;
                            setFormData(prev => ({ ...prev, portfolio: newPortfolio }));
                          }}
                        />
                        <Input
                          placeholder="https://yourwebsite.com"
                          value={formData.portfolio[1] || ""}
                          onChange={(e) => {
                            const newPortfolio = [...formData.portfolio];
                            newPortfolio[1] = e.target.value;
                            setFormData(prev => ({ ...prev, portfolio: newPortfolio }));
                          }}
                        />
                        <Input
                          placeholder="https://dribbble.com/yourprofile"
                          value={formData.portfolio[2] || ""}
                          onChange={(e) => {
                            const newPortfolio = [...formData.portfolio];
                            newPortfolio[2] = e.target.value;
                            setFormData(prev => ({ ...prev, portfolio: newPortfolio }));
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="education">Education</Label>
                      <Input
                        id="education"
                        value={formData.education}
                        onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                        placeholder="e.g., BS Computer Science, Stanford University"
                      />
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="certifications">Certifications</Label>
                      <Textarea
                        id="certifications"
                        value={formData.certifications}
                        onChange={(e) => setFormData(prev => ({ ...prev, certifications: e.target.value }))}
                        placeholder="List any relevant certifications, awards, or achievements..."
                        rows={3}
                      />
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <h4 className="font-medium text-primary mb-2">Ready to Launch!</h4>
                      <p className="text-sm text-muted-foreground">
                        Your freelancer profile is almost complete. Once submitted, you can start receiving project invitations and connecting with clients.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t">
                  <div>
                    {step > 1 && (
                      <Button variant="outline" onClick={prevStep}>
                        Previous
                      </Button>
                    )}
                    {step === 1 && (
                      <Link to="/freelancer-marketplace">
                        <Button variant="outline">Back to Marketplace</Button>
                      </Link>
                    )}
                  </div>
                  
                  <div>
                    {step < 4 ? (
                      <Button onClick={nextStep} disabled={
                        (step === 1 && (!formData.displayName || !formData.title || !formData.bio || !formData.experience)) ||
                        (step === 2 && formData.skills.length === 0) ||
                        (step === 3 && (!formData.hourlyRate || !formData.availability))
                      }>
                        Next Step
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} className="bg-gradient-hero">
                        Create Profile
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}