import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { skillCategories, commonLanguages } from "@/lib/skillsData";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SideIncomeAssessmentProps {
  onComplete: (data: any) => void;
  loading?: boolean;
}

const CONSTRAINT_OPTIONS = [
  "Limited internet/computer access",
  "No car/transportation",
  "Childcare responsibilities (need flexible schedule)",
  "Physical limitations (need desk/remote work)",
  "Language barriers (English not first language)",
  "No constraints"
];

export default function SideIncomeAssessment({ onComplete, loading = false }: SideIncomeAssessmentProps) {
  const [formData, setFormData] = useState({
    employmentStatus: "",
    currentIncome: "",
    timeAvailable: "",
    incomeGoal: "",
    timeframe: "",
    workEnvironment: "",
    clientInteraction: "",
    constraints: [] as string[],
    riskTolerance: "",
    skills: [] as string[],
    languages: [] as string[],
    customLanguage: "",
    goals: "",
    startupBudget: "",
    experience: "",
    dealBreakers: ""
  });
  
  const [openCategories, setOpenCategories] = useState<string[]>([]);

  const handleSkillToggle = (skill: string) => {
    if (formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.filter(s => s !== skill)
      }));
    } else {
      if (formData.skills.length >= 30) {
        return; // Max 30 skills
      }
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSelectAllCategory = (categorySkills: string[]) => {
    const availableSlots = 30 - formData.skills.length;
    const skillsToAdd = categorySkills.filter(s => !formData.skills.includes(s)).slice(0, availableSlots);
    
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, ...skillsToAdd]
    }));
  };

  const handleDeselectAllCategory = (categorySkills: string[]) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => !categorySkills.includes(s))
    }));
  };

  const getCategorySelectedCount = (categorySkills: string[]) => {
    return categorySkills.filter(s => formData.skills.includes(s)).length;
  };

  const handleConstraintToggle = (constraint: string) => {
    setFormData(prev => ({
      ...prev,
      constraints: prev.constraints.includes(constraint)
        ? prev.constraints.filter(c => c !== constraint)
        : [...prev.constraints, constraint]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine skills and languages for submission
    const allSkills = [
      ...formData.skills,
      ...formData.languages.map(l => `Language: ${l}`),
      ...(formData.customLanguage ? [`Language: ${formData.customLanguage}`] : [])
    ];
    
    onComplete({
      ...formData,
      skills: allSkills
    });
  };

  const totalSkillsSelected = formData.skills.length;
  const isFormValid = 
    formData.employmentStatus &&
    formData.currentIncome &&
    formData.timeAvailable &&
    formData.incomeGoal &&
    formData.timeframe &&
    formData.workEnvironment &&
    formData.clientInteraction &&
    formData.constraints.length > 0 &&
    formData.riskTolerance &&
    totalSkillsSelected >= 3 &&
    totalSkillsSelected <= 30 &&
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
              <SelectContent className="bg-background z-50">
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
              <SelectContent className="bg-background z-50">
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
              <SelectContent className="bg-background z-50">
                <SelectItem value="5-10">5-10 hours</SelectItem>
                <SelectItem value="10-20">10-20 hours</SelectItem>
                <SelectItem value="20-30">20-30 hours</SelectItem>
                <SelectItem value="30+">30+ hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="incomeGoal">How much extra money do you want to earn per month?</Label>
            <Select 
              value={formData.incomeGoal}
              onValueChange={(value) => setFormData(prev => ({ ...prev, incomeGoal: value }))}
            >
              <SelectTrigger id="incomeGoal">
                <SelectValue placeholder="Select your income goal" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="500-1000">$500-$1,000 (supplemental income)</SelectItem>
                <SelectItem value="1000-2000">$1,000-$2,000 (meaningful side income)</SelectItem>
                <SelectItem value="2000-3500">$2,000-$3,500 (substantial second income)</SelectItem>
                <SelectItem value="3500-5000">$3,500-$5,000 (near full-time income)</SelectItem>
                <SelectItem value="5000+">$5,000+ (replacement income)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">How quickly do you need to start making money?</Label>
            <Select 
              value={formData.timeframe}
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeframe: value }))}
            >
              <SelectTrigger id="timeframe">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="urgent">This week (emergency/urgent)</SelectItem>
                <SelectItem value="30-days">Within 30 days (soon but not desperate)</SelectItem>
                <SelectItem value="60-90-days">Within 60-90 days (can build slowly)</SelectItem>
                <SelectItem value="exploring">No rush, just exploring options</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workEnvironment">What type of work environment do you prefer?</Label>
            <p className="text-sm text-muted-foreground">This affects what opportunities fit your lifestyle</p>
            <Select 
              value={formData.workEnvironment}
              onValueChange={(value) => setFormData(prev => ({ ...prev, workEnvironment: value }))}
            >
              <SelectTrigger id="workEnvironment">
                <SelectValue placeholder="Select work environment" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="remote-only">Work from home/remote only</SelectItem>
                <SelectItem value="local-in-person">Willing to meet clients in person locally</SelectItem>
                <SelectItem value="travel">Willing to travel to client locations</SelectItem>
                <SelectItem value="hybrid">Mix of remote and in-person</SelectItem>
                <SelectItem value="no-preference">No preference</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientInteraction">Are you willing to work with clients/customers directly?</Label>
            <Select 
              value={formData.clientInteraction}
              onValueChange={(value) => setFormData(prev => ({ ...prev, clientInteraction: value }))}
            >
              <SelectTrigger id="clientInteraction">
                <SelectValue placeholder="Select preference" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="yes-enjoy">Yes, I enjoy working with people</SelectItem>
                <SelectItem value="yes-virtual">Yes, but only virtually (no in-person)</SelectItem>
                <SelectItem value="prefer-minimal">Prefer minimal client interaction</SelectItem>
                <SelectItem value="no-passive">No, I want passive/automated income only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Do you have any of these constraints?</Label>
            <p className="text-sm text-muted-foreground">Select all that apply</p>
            <div className="grid grid-cols-1 gap-3">
              {CONSTRAINT_OPTIONS.map(constraint => (
                <div key={constraint} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`constraint-${constraint}`}
                    checked={formData.constraints.includes(constraint)}
                    onCheckedChange={() => handleConstraintToggle(constraint)}
                  />
                  <label htmlFor={`constraint-${constraint}`} className="text-sm cursor-pointer">
                    {constraint}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskTolerance">What's your risk tolerance?</Label>
            <Select 
              value={formData.riskTolerance}
              onValueChange={(value) => setFormData(prev => ({ ...prev, riskTolerance: value }))}
            >
              <SelectTrigger id="riskTolerance">
                <SelectValue placeholder="Select risk tolerance" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="very-low">Very low (need guaranteed payment for work done)</SelectItem>
                <SelectItem value="low">Low (prefer predictable hourly/project-based work)</SelectItem>
                <SelectItem value="moderate">Moderate (okay with some income variability)</SelectItem>
                <SelectItem value="high">High (willing to build something that pays off later)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Your Skills</Label>
              <div className="text-sm text-muted-foreground">
                {totalSkillsSelected} selected
                {totalSkillsSelected < 3 && (
                  <span className="text-destructive ml-2">(min 3 required)</span>
                )}
                {totalSkillsSelected >= 30 && (
                  <span className="text-warning ml-2">(max 30 reached)</span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Select 3-30 skills that best represent your abilities
            </p>
            
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <Accordion type="multiple" value={openCategories} onValueChange={setOpenCategories} className="w-full">
                {skillCategories.map((category) => {
                  const selectedCount = getCategorySelectedCount(category.skills);
                  const allSelected = selectedCount === category.skills.length;
                  
                  return (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-medium">{category.name}</span>
                          {selectedCount > 0 && (
                            <span className="text-sm text-primary font-semibold">
                              {selectedCount} selected
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pt-2">
                          <div className="flex gap-2 mb-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAllCategory(category.skills)}
                              disabled={totalSkillsSelected >= 30}
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeselectAllCategory(category.skills)}
                              disabled={selectedCount === 0}
                            >
                              Deselect All
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {category.skills.map((skill) => (
                              <div key={skill} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`skill-${skill}`}
                                  checked={formData.skills.includes(skill)}
                                  onCheckedChange={() => handleSkillToggle(skill)}
                                  disabled={totalSkillsSelected >= 30 && !formData.skills.includes(skill)}
                                />
                                <label
                                  htmlFor={`skill-${skill}`}
                                  className="text-sm cursor-pointer leading-tight"
                                >
                                  {skill}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              
              {/* Language Skills Section */}
              <div className="mt-6 pt-6 border-t space-y-4">
                <div>
                  <Label className="text-base font-semibold">Language Skills</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select all languages you're fluent in
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {commonLanguages.map((language) => (
                    <div key={language} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${language}`}
                        checked={formData.languages.includes(language)}
                        onCheckedChange={() => handleLanguageToggle(language)}
                      />
                      <label
                        htmlFor={`lang-${language}`}
                        className="text-sm cursor-pointer"
                      >
                        {language}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="customLanguage">Other Language</Label>
                  <Input
                    id="customLanguage"
                    placeholder="Enter another language you speak"
                    value={formData.customLanguage}
                    onChange={(e) => setFormData(prev => ({ ...prev, customLanguage: e.target.value }))}
                  />
                </div>
              </div>
            </ScrollArea>
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
              <SelectContent className="bg-background z-50">
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

          <div className="space-y-2">
            <Label htmlFor="dealBreakers">Any specific deal-breakers? (optional)</Label>
            <p className="text-sm text-muted-foreground">
              Things you absolutely won't do (e.g., won't do cold calling/sales, won't work nights/weekends, 
              won't do physical labor, won't handle food/cooking, won't work with children, won't do commission-only work)
            </p>
            <Textarea 
              id="dealBreakers"
              placeholder="List any activities or work conditions you want to avoid..."
              value={formData.dealBreakers}
              onChange={(e) => setFormData(prev => ({ ...prev, dealBreakers: e.target.value }))}
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