import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Sprout, Sun, Droplets, Calendar, ShoppingCart, Leaf, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { invokeFunction } from "@/lib/invokeFunction";

interface GardenFormData {
  // Step 1: Location
  zipCode: string;
  cityState: string;

  // Step 2: Garden Setup
  gardenType: string;
  gardenSize: string;
  dimensions: string;

  // Step 3: Environment
  sunExposure: string;
  wateringLimits: string;
  petsOrKids: string;

  // Step 4: Experience & Goals
  experienceLevel: string;
  whatToGrow: string[];
  priorities: string[];

  // Step 5: Soil Information (Optional)
  soilType: string;
  compostAccess: string;
  soilPH: string;
}

interface PlantCard {
  name: string;
  whyItFits: string;
  whenToPlant: string;
  sun: string;
  soil: string;
  water: string;
  spacing: string;
  daysToHarvest: string;
  commonIssues: string;
}

interface GardenPlan {
  locationSnapshot: {
    region: string;
    zone: string;
    currentSeason: string;
    plantingWindow: string;
    disclaimer: string;
  };
  plantNow: PlantCard[];
  plantNext: PlantCard[];
  fourWeekPlan: {
    week1: { title: string; tasks: string[] };
    week2: { title: string; tasks: string[] };
    week3: { title: string; tasks: string[] };
    week4: { title: string; tasks: string[] };
  };
  shoppingList: {
    seeds: string[];
    soil: string[];
    containers: string[];
    tools: string[];
  };
  nextSteps: string[];
}

export function GardenItWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<GardenFormData>({
    zipCode: '',
    cityState: '',
    gardenType: '',
    gardenSize: '',
    dimensions: '',
    sunExposure: '',
    wateringLimits: '',
    petsOrKids: '',
    experienceLevel: '',
    whatToGrow: [],
    priorities: [],
    soilType: '',
    compostAccess: '',
    soilPH: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GardenPlan | null>(null);

  const totalSteps = 5;

  const handleInputChange = (field: keyof GardenFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'whatToGrow' | 'priorities', value: string) => {
    const currentArray = formData[field];
    if (currentArray.includes(value)) {
      handleInputChange(field, currentArray.filter(item => item !== value));
    } else {
      handleInputChange(field, [...currentArray, value]);
    }
  };

  const validateZipCode = (zip: string): boolean => {
    return /^\d{5}$/.test(zip);
  };

  const nextStep = () => {
    // Validate ZIP code on step 1
    if (step === 1) {
      if (!formData.zipCode && !formData.cityState) {
        toast.error('Please enter a ZIP code or city/state');
        return;
      }
      if (formData.zipCode && !validateZipCode(formData.zipCode)) {
        toast.error('Please enter a valid 5-digit US ZIP code');
        return;
      }
    }

    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateGardenPlan = async () => {
    // Validation
    if (!formData.zipCode && !formData.cityState) {
      toast.error('Please provide your location (ZIP code or city/state)');
      return;
    }

    if (formData.zipCode && !validateZipCode(formData.zipCode)) {
      toast.error('Please enter a valid 5-digit US ZIP code');
      return;
    }

    if (!formData.gardenType) {
      toast.error('Please select your garden type');
      return;
    }

    if (!formData.sunExposure) {
      toast.error('Please select your sun exposure');
      return;
    }

    if (formData.whatToGrow.length === 0) {
      toast.error('Please select at least one thing you want to grow');
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use this tool");
        setIsGenerating(false);
        return;
      }

      const { data, error } = await invokeFunction('generate-garden-plan', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Garden plan error:', error);
        const status = (error as any).status;
        
        if (status === 408) {
          toast.error('Request Timed Out', {
            description: 'The AI service is taking longer than expected. Please try again.',
            duration: 8000,
          });
          return;
        }
        
        if (status === 429) {
          toast.error('Rate Limit Exceeded', {
            description: 'Too many requests. Please wait a moment and try again.',
            duration: 6000,
          });
          return;
        }
        
        if (status === 402) {
          toast.error('Insufficient Credits', {
            description: 'Please add credits to continue using this feature.',
            duration: 6000,
          });
          return;
        }
        
        toast.error('Generation Failed', {
          description: 'An unexpected error occurred. Please try again.',
          duration: 5000,
        });
        return;
      }
      
      if (data?.error) {
        console.error('Garden plan payload error:', data.error);
        
        if (data.error === 'credits_exhausted') {
          toast.error('Insufficient Credits', {
            description: 'This tool requires 3 credits. Please add credits to continue.',
            duration: 10000,
          });
          return;
        }
        
        toast.error(data?.message || 'Failed to generate garden plan');
        return;
      }

      if (!data?.ok) {
        toast.error(data?.message || 'Received incomplete data. Please try again.');
        return;
      }

      setGeneratedPlan(data);
      toast.success('Garden plan generated successfully!');
    } catch (error: any) {
      console.error('Error generating garden plan:', error);
      toast.error(error.message || 'Failed to generate garden plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              Location (United States Only)
            </h3>
            
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => handleInputChange('zipCode', e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="e.g., 30301"
                maxLength={5}
              />
              <p className="text-xs text-muted-foreground mt-1">Enter your 5-digit US ZIP code</p>
            </div>

            <div>
              <Label htmlFor="cityState">City/State (Backup)</Label>
              <Input
                id="cityState"
                value={formData.cityState}
                onChange={(e) => handleInputChange('cityState', e.target.value)}
                placeholder="e.g., Atlanta, GA"
              />
              <p className="text-xs text-muted-foreground mt-1">Use if ZIP code is unavailable</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Garden Setup
            </h3>
            
            <div>
              <Label>Garden Type *</Label>
              <RadioGroup 
                value={formData.gardenType} 
                onValueChange={(val) => handleInputChange('gardenType', val)}
                className="grid grid-cols-2 gap-3 mt-2"
              >
                {['In-ground', 'Raised bed', 'Containers', 'Mixed'].map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.toLowerCase().replace(' ', '-')} id={type} />
                    <Label htmlFor={type} className="cursor-pointer">{type}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>Garden Size</Label>
              <Select value={formData.gardenSize} onValueChange={(val) => handleInputChange('gardenSize', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (under 50 sq ft)</SelectItem>
                  <SelectItem value="medium">Medium (50-200 sq ft)</SelectItem>
                  <SelectItem value="large">Large (200+ sq ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dimensions">Dimensions (Optional)</Label>
              <Input
                id="dimensions"
                value={formData.dimensions}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                placeholder="e.g., 4x8 feet, or 10 containers"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sun className="w-5 h-5 text-yellow-500" />
              Environment
            </h3>
            
            <div>
              <Label>Sun Exposure *</Label>
              <RadioGroup 
                value={formData.sunExposure} 
                onValueChange={(val) => handleInputChange('sunExposure', val)}
                className="space-y-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-sun" id="full-sun" />
                  <Label htmlFor="full-sun" className="cursor-pointer">Full sun (6+ hours direct sunlight)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="partial-sun" id="partial-sun" />
                  <Label htmlFor="partial-sun" className="cursor-pointer">Partial sun (3-6 hours)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shade" id="shade" />
                  <Label htmlFor="shade" className="cursor-pointer">Shade (less than 3 hours)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Water Limitations?</Label>
              <RadioGroup 
                value={formData.wateringLimits} 
                onValueChange={(val) => handleInputChange('wateringLimits', val)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="water-yes" />
                  <Label htmlFor="water-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="water-no" />
                  <Label htmlFor="water-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Pets or Kids Present?</Label>
              <RadioGroup 
                value={formData.petsOrKids} 
                onValueChange={(val) => handleInputChange('petsOrKids', val)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="pets-yes" />
                  <Label htmlFor="pets-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="pets-no" />
                  <Label htmlFor="pets-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-1">We'll avoid recommending toxic plants</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sprout className="w-5 h-5 text-green-600" />
              Experience & Goals
            </h3>
            
            <div>
              <Label>Experience Level</Label>
              <RadioGroup 
                value={formData.experienceLevel} 
                onValueChange={(val) => handleInputChange('experienceLevel', val)}
                className="space-y-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="cursor-pointer">Beginner (new to gardening)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="cursor-pointer">Intermediate (some experience)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="cursor-pointer">Advanced (experienced gardener)</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-2 block">What do you want to grow? *</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Vegetables', 'Herbs', 'Flowers', 'Fruit', 'Mixed'].map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.whatToGrow.includes(item.toLowerCase())}
                      onCheckedChange={() => handleArrayToggle('whatToGrow', item.toLowerCase())}
                      id={`grow-${item}`}
                    />
                    <label htmlFor={`grow-${item}`} className="text-sm cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Priorities (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Low maintenance', 'High yield', 'Budget friendly', 'Fast harvest', 'Pollinator friendly'].map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.priorities.includes(item.toLowerCase().replace(' ', '-'))}
                      onCheckedChange={() => handleArrayToggle('priorities', item.toLowerCase().replace(' ', '-'))}
                      id={`priority-${item}`}
                    />
                    <label htmlFor={`priority-${item}`} className="text-sm cursor-pointer">{item}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-amber-600" />
              Soil Information (Optional)
            </h3>
            <p className="text-sm text-muted-foreground">This helps us give more accurate recommendations</p>
            
            <div>
              <Label>Soil Type</Label>
              <Select value={formData.soilType} onValueChange={(val) => handleInputChange('soilType', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select or Unknown" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="clay">Clay (heavy, sticky when wet)</SelectItem>
                  <SelectItem value="sandy">Sandy (drains quickly)</SelectItem>
                  <SelectItem value="loam">Loam (ideal, balanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Access to Compost?</Label>
              <RadioGroup 
                value={formData.compostAccess} 
                onValueChange={(val) => handleInputChange('compostAccess', val)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="compost-yes" />
                  <Label htmlFor="compost-yes" className="cursor-pointer">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="compost-no" />
                  <Label htmlFor="compost-no" className="cursor-pointer">No</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="soilPH">Soil pH (if known)</Label>
              <Input
                id="soilPH"
                value={formData.soilPH}
                onChange={(e) => handleInputChange('soilPH', e.target.value)}
                placeholder="e.g., 6.5"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPlantCard = (plant: PlantCard) => (
    <Card key={plant.name} className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-600" />
          {plant.name}
        </CardTitle>
        <CardDescription>{plant.whyItFits}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div><span className="font-medium">When to Plant:</span> {plant.whenToPlant}</div>
          <div><span className="font-medium">Sun:</span> {plant.sun}</div>
          <div><span className="font-medium">Soil:</span> {plant.soil}</div>
          <div><span className="font-medium">Water:</span> {plant.water}</div>
          <div><span className="font-medium">Spacing:</span> {plant.spacing}</div>
          <div><span className="font-medium">Harvest:</span> {plant.daysToHarvest}</div>
        </div>
        <div className="pt-2 border-t">
          <span className="font-medium text-amber-700">Common Issues:</span> {plant.commonIssues}
        </div>
      </CardContent>
    </Card>
  );

  if (generatedPlan) {
    return (
      <div className="space-y-8">
        {/* Location Snapshot */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-6 h-6 text-yellow-500" />
              Location & Season Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><span className="font-medium">Region:</span> {generatedPlan.locationSnapshot.region}</div>
            <div><span className="font-medium">Growing Zone:</span> {generatedPlan.locationSnapshot.zone}</div>
            <div><span className="font-medium">Current Season:</span> {generatedPlan.locationSnapshot.currentSeason}</div>
            <div><span className="font-medium">Planting Window:</span> {generatedPlan.locationSnapshot.plantingWindow}</div>
            <div className="md:col-span-2 text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {generatedPlan.locationSnapshot.disclaimer}
            </div>
          </CardContent>
        </Card>

        {/* Best Things to Plant Now */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sprout className="w-6 h-6 text-green-600" />
            Best Things to Plant Right Now
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {generatedPlan.plantNow.map(renderPlantCard)}
          </div>
        </div>

        {/* Plant Next */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Plant Next (Upcoming Window)
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {generatedPlan.plantNext.map(renderPlantCard)}
          </div>
        </div>

        {/* 4-Week Garden Plan */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            4-Week Garden Plan
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(generatedPlan.fourWeekPlan).map(([week, data]) => (
              <Card key={week} className="border-purple-200 bg-purple-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{data.title}</CardTitle>
                  <CardDescription className="capitalize">{week.replace('week', 'Week ')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {data.tasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600">•</span>
                        {task}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Shopping List */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-orange-600" />
            Shopping & Prep List
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Seeds / Seedlings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {generatedPlan.shoppingList.seeds.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Soil & Compost</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {generatedPlan.shoppingList.soil.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Containers & Beds</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {generatedPlan.shoppingList.containers.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  {generatedPlan.shoppingList.tools.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <Card className="border-accent bg-accent/10">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {generatedPlan.nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">{idx + 1}</Badge>
                  {step}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button 
          onClick={() => {
            setGeneratedPlan(null);
            setStep(1);
          }}
          variant="outline"
          className="w-full"
        >
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sprout className="w-6 h-6 text-green-600" />
          Garden Planning Wizard
        </CardTitle>
        <CardDescription>
          Step {step} of {totalSteps} — 
          {step === 1 && ' Location'}
          {step === 2 && ' Garden Setup'}
          {step === 3 && ' Environment'}
          {step === 4 && ' Experience & Goals'}
          {step === 5 && ' Soil Information'}
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mt-4">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {renderStepContent()}
        
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          {step < totalSteps ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={generateGardenPlan}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <Sprout className="w-4 h-4 mr-2" />
                  Generate Garden Plan (3 Credits)
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
