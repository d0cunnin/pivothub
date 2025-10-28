import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Calendar, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateSchedulePDF } from '@/lib/pdf-templates/schedule-template';
import { generateRecurringScheduleLinks } from '@/lib/calendar-utils';

interface ScheduleFormData {
  // Step 1: Current Commitments
  workHours: string;
  workSchedule: string;
  schoolCommitment: string;
  familyCommitments: string;
  recurringAppointments: string;
  commuteTime: string;

  // Step 2: Energy Patterns
  energyType: string;
  peakProductivity: string[];
  energyDips: string[];
  sleepSchedule: string;

  // Step 3: Business Goals
  businessType: string;
  weeklyHoursWanted: string;
  weeklyHoursRealistic: string;
  specificActivities: string;

  // Step 4: Constraints
  nonNegotiableBlocks: string;
  preferredEnvironment: string;
  schedulingStyle: string;
}

export function ScheduleItWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ScheduleFormData>({
    workHours: '',
    workSchedule: '',
    schoolCommitment: '',
    familyCommitments: '',
    recurringAppointments: '',
    commuteTime: '',
    energyType: '',
    peakProductivity: [],
    energyDips: [],
    sleepSchedule: '',
    businessType: '',
    weeklyHoursWanted: '',
    weeklyHoursRealistic: '',
    specificActivities: '',
    nonNegotiableBlocks: '',
    preferredEnvironment: '',
    schedulingStyle: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
  const [understoodDisclaimer, setUnderstoodDisclaimer] = useState(false);

  const totalSteps = 5;

  const handleInputChange = (field: keyof ScheduleFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'peakProductivity' | 'energyDips', value: string) => {
    const currentArray = formData[field];
    if (currentArray.includes(value)) {
      handleInputChange(field, currentArray.filter(item => item !== value));
    } else {
      handleInputChange(field, [...currentArray, value]);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateSchedule = async () => {
    // Validation
    if (!formData.workHours || !formData.energyType || !formData.businessType) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: formData
      });

      if (error) throw error;

      setGeneratedSchedule(data);
      toast.success('Schedule generated successfully!');
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      toast.error(error.message || 'Failed to generate schedule. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedSchedule) return;

    try {
      const pdf = generateSchedulePDF(generatedSchedule, 'User');
      pdf.save('pivothub-schedule.pdf');
      toast.success('Schedule PDF downloaded!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const getCalendarLinks = () => {
    if (!generatedSchedule?.weeklySchedule) return null;

    // Extract first event from schedule
    const firstDay = Object.keys(generatedSchedule.weeklySchedule)[0];
    const events = generatedSchedule.weeklySchedule[firstDay];
    
    if (!events || events.length === 0) return null;

    try {
      return generateRecurringScheduleLinks(
        Object.entries(generatedSchedule.weeklySchedule).flatMap(([day, blocks]: [string, any]) =>
          blocks.map((block: any) => ({ day, ...block }))
        )
      );
    } catch (error) {
      console.error('Error generating calendar links:', error);
      return null;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Commitments</h3>
            
            <div>
              <Label htmlFor="workHours">Work Hours per Week *</Label>
              <Input
                id="workHours"
                type="number"
                value={formData.workHours}
                onChange={(e) => handleInputChange('workHours', e.target.value)}
                placeholder="e.g., 40"
              />
            </div>

            <div>
              <Label htmlFor="workSchedule">Work Schedule Type</Label>
              <Select value={formData.workSchedule} onValueChange={(val) => handleInputChange('workSchedule', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed (9-5, specific hours)</SelectItem>
                  <SelectItem value="flexible">Flexible (work from anywhere)</SelectItem>
                  <SelectItem value="shift">Shift work (rotating schedule)</SelectItem>
                  <SelectItem value="none">No current job</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="schoolCommitment">School/Education Commitments</Label>
              <Textarea
                id="schoolCommitment"
                value={formData.schoolCommitment}
                onChange={(e) => handleInputChange('schoolCommitment', e.target.value)}
                placeholder="Classes, study time, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="familyCommitments">Family Commitments</Label>
              <Textarea
                id="familyCommitments"
                value={formData.familyCommitments}
                onChange={(e) => handleInputChange('familyCommitments', e.target.value)}
                placeholder="Childcare, eldercare, family time, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="recurringAppointments">Recurring Appointments</Label>
              <Input
                id="recurringAppointments"
                value={formData.recurringAppointments}
                onChange={(e) => handleInputChange('recurringAppointments', e.target.value)}
                placeholder="Medical, therapy, etc."
              />
            </div>

            <div>
              <Label htmlFor="commuteTime">Daily Commute Time (hours)</Label>
              <Input
                id="commuteTime"
                type="number"
                step="0.5"
                value={formData.commuteTime}
                onChange={(e) => handleInputChange('commuteTime', e.target.value)}
                placeholder="e.g., 1.5"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Energy Patterns</h3>
            
            <div>
              <Label htmlFor="energyType">Are you a morning person or night owl? *</Label>
              <Select value={formData.energyType} onValueChange={(val) => handleInputChange('energyType', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select energy type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning Person (peak energy AM)</SelectItem>
                  <SelectItem value="night">Night Owl (peak energy PM/evening)</SelectItem>
                  <SelectItem value="midday">Midday (peak energy afternoon)</SelectItem>
                  <SelectItem value="consistent">Consistent throughout day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Peak Productivity Times (select all that apply)</Label>
              <div className="space-y-2 mt-2">
                {['Early Morning (5-8 AM)', 'Morning (8-12 PM)', 'Afternoon (12-5 PM)', 'Evening (5-9 PM)', 'Night (9 PM-12 AM)'].map(time => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.peakProductivity.includes(time)}
                      onCheckedChange={() => handleArrayToggle('peakProductivity', time)}
                    />
                    <label className="text-sm">{time}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Energy Dips (when do you struggle most?)</Label>
              <div className="space-y-2 mt-2">
                {['Early Morning (5-8 AM)', 'Morning (8-12 PM)', 'Afternoon (12-5 PM)', 'Evening (5-9 PM)', 'Night (9 PM-12 AM)'].map(time => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.energyDips.includes(time)}
                      onCheckedChange={() => handleArrayToggle('energyDips', time)}
                    />
                    <label className="text-sm">{time}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="sleepSchedule">Sleep Schedule</Label>
              <Input
                id="sleepSchedule"
                value={formData.sleepSchedule}
                onChange={(e) => handleInputChange('sleepSchedule', e.target.value)}
                placeholder="e.g., 11 PM - 6 AM"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Business/Side Income Goals</h3>
            
            <div>
              <Label htmlFor="businessType">What are you building? *</Label>
              <Textarea
                id="businessType"
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                placeholder="Side business, new skills, freelancing, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="weeklyHoursWanted">Weekly Hours You WANT to Dedicate</Label>
              <Input
                id="weeklyHoursWanted"
                type="number"
                value={formData.weeklyHoursWanted}
                onChange={(e) => handleInputChange('weeklyHoursWanted', e.target.value)}
                placeholder="e.g., 20"
              />
            </div>

            <div>
              <Label htmlFor="weeklyHoursRealistic">Weekly Hours You CAN Realistically Dedicate</Label>
              <Input
                id="weeklyHoursRealistic"
                type="number"
                value={formData.weeklyHoursRealistic}
                onChange={(e) => handleInputChange('weeklyHoursRealistic', e.target.value)}
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <Label htmlFor="specificActivities">Specific Activities</Label>
              <Textarea
                id="specificActivities"
                value={formData.specificActivities}
                onChange={(e) => handleInputChange('specificActivities', e.target.value)}
                placeholder="Content creation, client work, learning, networking, etc."
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Constraints & Preferences</h3>
            
            <div>
              <Label htmlFor="nonNegotiableBlocks">Non-Negotiable Time Blocks</Label>
              <Textarea
                id="nonNegotiableBlocks"
                value={formData.nonNegotiableBlocks}
                onChange={(e) => handleInputChange('nonNegotiableBlocks', e.target.value)}
                placeholder="Family dinner, gym time, religious observances, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="preferredEnvironment">Preferred Work Environment</Label>
              <Input
                id="preferredEnvironment"
                value={formData.preferredEnvironment}
                onChange={(e) => handleInputChange('preferredEnvironment', e.target.value)}
                placeholder="Home office, coffee shop, library, etc."
              />
            </div>

            <div>
              <Label htmlFor="schedulingStyle">Preferred Scheduling Style</Label>
              <Select value={formData.schedulingStyle} onValueChange={(val) => handleInputChange('schedulingStyle', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scheduling style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time-blocking">Time Blocking (strict schedule)</SelectItem>
                  <SelectItem value="flexible">Flexible (general availability)</SelectItem>
                  <SelectItem value="hybrid">Hybrid (some fixed, some flexible)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Generate</h3>
            
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Work:</strong> {formData.workHours} hours/week ({formData.workSchedule})</p>
              <p><strong>Energy Type:</strong> {formData.energyType}</p>
              <p><strong>Building:</strong> {formData.businessType}</p>
              <p><strong>Target Hours:</strong> {formData.weeklyHoursWanted} wanted, {formData.weeklyHoursRealistic} realistic</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will use 3 credits to generate your personalized schedule using AI.
              </AlertDescription>
            </Alert>

            <Button
              onClick={generateSchedule}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? 'Generating Schedule...' : 'Generate My Schedule'}
            </Button>
          </div>
        );
    }
  };

  if (generatedSchedule) {
    const calendarLinks = getCalendarLinks();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Personalized Schedule</CardTitle>
          <CardDescription>Generated weekly schedule based on your commitments and goals</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Weekly Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Committed Hours</p>
                <p className="text-2xl font-bold">{generatedSchedule.summary.totalCommittedHours}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Side Business Hours</p>
                <p className="text-2xl font-bold">{generatedSchedule.summary.sideBusinessHours}</p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {generatedSchedule.summary.recommendations && generatedSchedule.summary.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {generatedSchedule.summary.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Your schedule will not be stored inside PivotHub. Please download the PDF now to retain a copy.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={understoodDisclaimer}
              onCheckedChange={(checked) => setUnderstoodDisclaimer(checked === true)}
            />
            <label className="text-sm">
              I understand this schedule will not be saved
            </label>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={downloadPDF}
              disabled={!understoodDisclaimer}
              className="w-full"
              variant="default"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Schedule PDF
            </Button>

            {calendarLinks && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Add to Calendar:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(calendarLinks.googleUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Google
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(calendarLinks.outlookUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Outlook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={calendarLinks.icsDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    ICS File
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setGeneratedSchedule(null);
                setStep(1);
                setUnderstoodDisclaimer(false);
              }}
              variant="outline"
              className="w-full"
            >
              Create New Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Schedule - Step {step} of {totalSteps}</CardTitle>
        <CardDescription>
          {step === 1 && 'Tell us about your current commitments'}
          {step === 2 && 'Share your energy patterns'}
          {step === 3 && 'Define your business goals'}
          {step === 4 && 'Set your constraints and preferences'}
          {step === 5 && 'Review and generate your schedule'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between pt-4">
            <Button
              onClick={prevStep}
              disabled={step === 1}
              variant="outline"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
