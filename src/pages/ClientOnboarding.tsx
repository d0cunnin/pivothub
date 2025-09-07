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
import { DollarSign, Calendar, Target, FileText, Briefcase } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const projectCategories = [
  "Web Development",
  "Mobile Development", 
  "AI & Data Science",
  "UI/UX Design",
  "DevOps & Cloud",
  "Digital Marketing"
];

const budgetRanges = [
  { value: "under-1k", label: "Under $1,000" },
  { value: "1k-5k", label: "$1,000 - $5,000" },
  { value: "5k-10k", label: "$5,000 - $10,000" },
  { value: "10k-25k", label: "$10,000 - $25,000" },
  { value: "25k-plus", label: "$25,000+" }
];

const timelineOptions = [
  { value: "asap", label: "ASAP (Rush job)" },
  { value: "1-week", label: "Within 1 week" },
  { value: "2-4-weeks", label: "2-4 weeks" },
  { value: "1-3-months", label: "1-3 months" },
  { value: "3-months-plus", label: "3+ months" }
];

const projectTypes = [
  { value: "one-time", label: "One-time project" },
  { value: "ongoing", label: "Ongoing work" },
  { value: "contract", label: "Contract position" },
  { value: "part-time", label: "Part-time role" }
];

export default function ClientOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectTitle: "",
    projectDescription: "",
    category: "",
    budget: "",
    timeline: "",
    projectType: "",
    skillsNeeded: [] as string[],
    experienceLevel: "",
    companyName: "",
    contactInfo: "",
    additionalRequirements: ""
  });

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post your project.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Here you would typically save to your database
    toast({
      title: "Project Posted!",
      description: "Your project has been posted successfully. Freelancers will start applying soon.",
    });
    
    navigate("/client-dashboard");
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
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
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      i <= step ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i}
                    </div>
                    {i < 3 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        i < step ? 'bg-secondary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Project Details</span>
                <span>Budget & Timeline</span>
                <span>Requirements</span>
              </div>
            </div>

            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {step === 1 && "Describe your project"}
                  {step === 2 && "Budget and timeline"}
                  {step === 3 && "Specific requirements"}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Tell us what you need built and we'll help you find the right freelancer"}
                  {step === 2 && "Set your budget and timeline to attract the right proposals"}
                  {step === 3 && "Add any specific requirements to help freelancers understand your needs"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Step 1: Project Details */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <Label htmlFor="projectTitle">Project Title *</Label>
                      <Input
                        id="projectTitle"
                        value={formData.projectTitle}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectTitle: e.target.value }))}
                        placeholder="e.g., Build a responsive e-commerce website"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Make it clear and specific to attract the right freelancers
                      </p>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="category">Project Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the main category" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="projectDescription">Project Description *</Label>
                      <Textarea
                        id="projectDescription"
                        value={formData.projectDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                        placeholder="Describe your project in detail. Include features, functionality, design preferences, and any specific requirements..."
                        rows={6}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        The more details you provide, the better proposals you'll receive
                      </p>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="projectType">Project Type *</Label>
                      <Select value={formData.projectType} onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="What type of engagement?" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 2: Budget & Timeline */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <Label htmlFor="budget">Project Budget *</Label>
                      <Select value={formData.budget} onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">
                        This helps freelancers understand if the project fits their rates
                      </p>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="timeline">Project Timeline *</Label>
                      <Select value={formData.timeline} onValueChange={(value) => setFormData(prev => ({ ...prev, timeline: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="When do you need this completed?" />
                        </SelectTrigger>
                        <SelectContent>
                          {timelineOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                      <h4 className="font-medium text-secondary mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Budget Guidelines
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Be realistic about your budget expectations</li>
                        <li>• Quality work requires appropriate compensation</li>
                        <li>• Consider the complexity and time required</li>
                        <li>• You can negotiate with freelancers during the proposal process</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Step 3: Requirements */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="form-group">
                      <Label htmlFor="experienceLevel">Required Experience Level *</Label>
                      <Select value={formData.experienceLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, experienceLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="What level of experience do you need?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="entry">Entry Level (0-2 years)</SelectItem>
                          <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                          <SelectItem value="expert">Expert (5+ years)</SelectItem>
                          <SelectItem value="any">Any level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="companyName">Company/Organization Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your company or organization name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="contactInfo">Preferred Contact Method</Label>
                      <Input
                        id="contactInfo"
                        value={formData.contactInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                        placeholder="Email, phone, or other preferred contact method"
                      />
                    </div>
                    
                    <div className="form-group">
                      <Label htmlFor="additionalRequirements">Additional Requirements</Label>
                      <Textarea
                        id="additionalRequirements"
                        value={formData.additionalRequirements}
                        onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
                        placeholder="Any specific technologies, design requirements, or other important details..."
                        rows={4}
                      />
                    </div>

                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
                      <h4 className="font-medium text-accent mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Ready to Find Your Freelancer!
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Once you post your project, qualified freelancers will start submitting proposals. You can review their profiles, portfolios, and proposals to choose the best fit for your project.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="terms" />
                        <Label htmlFor="terms" className="text-sm">
                          I agree to PivotHub's Terms of Service and Privacy Policy
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="communication" />
                        <Label htmlFor="communication" className="text-sm">
                          I agree to communicate with freelancers through the platform initially
                        </Label>
                      </div>
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
                    {step < 3 ? (
                      <Button onClick={nextStep} disabled={
                        (step === 1 && (!formData.projectTitle || !formData.category || !formData.projectDescription || !formData.projectType)) ||
                        (step === 2 && (!formData.budget || !formData.timeline))
                      }>
                        Next Step
                      </Button>
                    ) : (
                      <Button onClick={handleSubmit} className="bg-gradient-hero">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Post Project
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