import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Calendar, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateSchedulePDF } from '@/lib/pdf-templates/schedule-template';
import { generateRecurringScheduleLinks } from '@/lib/calendar-utils';
import { TimePickerField } from '@/components/ui/time-picker';

interface ScheduleFormData {
  // Step 1: Current Commitments
  workHours: string;
  workSchedule: string;
  workScheduleDetails: string;
  workStartTime: string;
  workEndTime: string;
  workDays: string[];
  inSchool: string;
  schoolCommitment: string;
  hasFamilyCommitments: string;
  familyCommitments: string;
  commuteType: string;
  recurringAppointments: string;
  commuteTime: string;

  // Step 2: Energy Patterns
  energyType: string;
  peakProductivity: string[];
  energyDips: string[];
  bedtime: string;
  wakeTime: string;
  hasExerciseRoutine: string;
  exerciseHours: string;
  exercisePreferredTime: string;

  // Step 3: Business Goals
  businessType: string;
  weeklyHoursWanted: string;
  weeklyHoursRealistic: string;
  specificActivities: string;

  // Step 4: Constraints
  nonNegotiableBlocks: string;
  preferredEnvironment: string;
  schedulingStyle: string;
  downtimeHours: string;
}

export function ScheduleItWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ScheduleFormData>({
    workHours: '',
    workSchedule: '',
    workScheduleDetails: '',
    workStartTime: '09:00 AM',
    workEndTime: '05:00 PM',
    workDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    inSchool: '',
    schoolCommitment: '',
    hasFamilyCommitments: '',
    familyCommitments: '',
    commuteType: '',
    recurringAppointments: '',
    commuteTime: '',
    energyType: '',
    peakProductivity: [],
    energyDips: [],
    bedtime: '11:00 PM',
    wakeTime: '07:00 AM',
    hasExerciseRoutine: '',
    exerciseHours: '',
    exercisePreferredTime: '',
    businessType: '',
    weeklyHoursWanted: '',
    weeklyHoursRealistic: '',
    specificActivities: '',
    nonNegotiableBlocks: '',
    preferredEnvironment: '',
    schedulingStyle: '',
    downtimeHours: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
  const [understoodDisclaimer, setUnderstoodDisclaimer] = useState(false);

  const totalSteps = 5;

  const handleInputChange = (field: keyof ScheduleFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'peakProductivity' | 'energyDips' | 'workDays', value: string) => {
    const currentArray = formData[field];
    if (currentArray.includes(value)) {
      handleInputChange(field, currentArray.filter(item => item !== value));
    } else {
      handleInputChange(field, [...currentArray, value]);
    }
  };

  const validateTimeFormats = (): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Safe patterns that should NOT be flagged
    const safePatterns = [
      /\b\d{1,2}\s*(hours?|hrs?|minutes?|mins?)\b/gi,  // "10 hours", "5 hrs"
      /\b24\/7\b/gi,                                    // "24/7"
      /\ball\s+day\b/gi,                                // "all day"
      /\b\d{2}:\d{2}-\d{2}:\d{2}\b/g,                  // Military time "14:00-22:00"
      /\b\d+-\d+\s+(days?|times?|per|week)\b/gi        // "3-5 days per week"
    ];
    
    const fieldsToCheck = {
      'Work Schedule Details': formData.workScheduleDetails,
      'School Schedule': formData.schoolCommitment,
      'Family Commitments': formData.familyCommitments,
    };
    
    Object.entries(fieldsToCheck).forEach(([fieldName, value]) => {
      if (!value) return;
      
      // Check if value matches any safe pattern
      const isSafe = safePatterns.some(pattern => pattern.test(value));
      if (isSafe) return;
      
      // Pattern to detect times without AM/PM (e.g., "9-5", "2:30-6:30")
      const ambiguousTimePattern = /\b(\d{1,2})(:\d{2})?\s*[-–to]\s*(\d{1,2})(:\d{2})?\b(?!\s*(AM|PM|am|pm))/gi;
      
      // Pattern to detect single times without AM/PM (e.g., "at 3", "8", "3:30")
      const singleTimePattern = /\b(at\s+)?(\d{1,2})(:\d{2})?\b(?!\s*(AM|PM|am|pm|hours?|hrs?|minutes?|mins?))/gi;
      
      const hasAmbiguousRange = ambiguousTimePattern.test(value);
      const hasSingleTime = singleTimePattern.test(value);
      
      if (hasAmbiguousRange || hasSingleTime) {
        issues.push(`${fieldName}: Please specify AM/PM for all times`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateSchedule = async () => {
    // Validation
    if (!formData.workHours || !formData.inSchool || !formData.hasFamilyCommitments) {
      toast.error('Please fill in all required fields (marked with *)');
      return;
    }

    // If enrolled in school, require schedule details
    if (formData.inSchool === 'yes' && !formData.schoolCommitment) {
      toast.error('Please provide your school/training schedule');
      return;
    }

    // If work schedule selected, require details or structured fields
    if (formData.workSchedule && formData.workSchedule !== 'none') {
      if (formData.workSchedule === 'fixed' && (!formData.workStartTime || !formData.workEndTime || formData.workDays.length === 0)) {
        toast.error('Please specify your fixed work hours and days');
        return;
      }
      if ((formData.workSchedule === 'flexible' || formData.workSchedule === 'shift') && !formData.workScheduleDetails) {
        toast.error('Please specify your work schedule details');
        return;
      }
    }

    // Validate sleep schedule
    if (!formData.bedtime || !formData.wakeTime) {
      toast.error('Please specify your sleep schedule');
      return;
    }

    // If has family commitments, require details
    if (formData.hasFamilyCommitments === 'yes' && !formData.familyCommitments) {
      toast.error('Please provide your family commitment details');
      return;
    }

    // Validate time formats
    const timeValidation = validateTimeFormats();
    if (!timeValidation.isValid) {
      toast.error('⚠️ Please add AM/PM to your times:', {
        description: timeValidation.issues.join('\n'),
        duration: 8000,
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use this tool");
        setIsGenerating(false);
        return;
      }

      // Prepare data - combine structured fields into strings
      const preparedData: any = { ...formData };
      
      // Combine bedtime and wake time into sleepSchedule
      preparedData.sleepSchedule = `${formData.bedtime} - ${formData.wakeTime}`;
      
      // If fixed work schedule, combine structured fields into workScheduleDetails
      if (formData.workSchedule === 'fixed' && formData.workStartTime && formData.workEndTime && formData.workDays.length > 0) {
        const daysStr = formData.workDays.join('/');
        preparedData.workScheduleDetails = `${daysStr} ${formData.workStartTime} - ${formData.workEndTime}`;
      }

      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: preparedData,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      // Handle HTTP errors from edge function
      if (error) {
        console.error('Schedule error:', error);
        const status = (error as any).status;
        
        if (status === 408) {
          toast.error('Request Timed Out', {
            description: 'The AI service is taking longer than expected. Please try again in a few moments.',
            action: {
              label: 'Retry',
              onClick: () => generateSchedule()
            },
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
          toast.error('AI Service Unavailable', {
            description: 'Please add credits to continue using this feature.',
            duration: 6000,
          });
          return;
        }
        
        // Generic fallback
        toast.error('Generation Failed', {
          description: 'An unexpected error occurred. Please try again.',
          duration: 5000,
        });
        return;
      }
      
      // Handle payload errors (when function returns 200 but with error data)
      if (data?.error) {
        console.error('Schedule payload error:', data.error);
        
        if (data.error === 'credits_exhausted') {
          toast.error('AI Service Unavailable', {
            description: 'The AI service has run out of credits. Please add credits in Settings → Cloud & AI balance.',
            duration: 10000,
          });
          return;
        }
        
        if (data.error === 'timeout') {
          toast.error('Request Timed Out', {
            description: 'The AI service is experiencing issues. Please try again in a few moments.',
            action: {
              label: 'Retry',
              onClick: () => generateSchedule()
            },
            duration: 8000,
          });
          return;
        }
        
        if (data.error === 'rate_limit_exceeded') {
          toast.error('Rate Limit Exceeded', {
            description: 'Too many requests. Please wait a moment and try again.',
            duration: 6000,
          });
          return;
        }
        
        // Generic error fallback
        toast.error(data?.message || 'Failed to generate schedule');
        return;
      }

      if (!data?.ok || !data?.weeklySchedule) {
        toast.error(data?.message || 'Received incomplete schedule data. Please try again.');
        return;
      }

      // Validate schedule structure
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const missingDays = days.filter(day => !data.weeklySchedule[day] || !Array.isArray(data.weeklySchedule[day]));

      if (missingDays.length > 0) {
        toast.error(`Schedule is missing data for: ${missingDays.join(', ')}`);
        return;
      }

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

            {formData.workSchedule === 'fixed' && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                <Label className="text-base">Fixed Work Hours *</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <TimePickerField 
                    label="Start Time" 
                    value={formData.workStartTime}
                    onChange={(val) => handleInputChange('workStartTime', val)}
                    defaultHour={9}
                    defaultMinute={0}
                    defaultPeriod="AM"
                  />
                  <TimePickerField 
                    label="End Time" 
                    value={formData.workEndTime}
                    onChange={(val) => handleInputChange('workEndTime', val)}
                    defaultHour={5}
                    defaultMinute={0}
                    defaultPeriod="PM"
                  />
                </div>
                
                <div>
                  <Label className="text-base">Work Days</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.workDays.includes(day)}
                          onCheckedChange={() => handleArrayToggle('workDays', day)}
                        />
                        <label className="text-sm">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(formData.workSchedule === 'flexible' || formData.workSchedule === 'shift') && (
              <div className="pl-4 border-l-2 border-primary/30">
                <Label htmlFor="workScheduleDetails">Work Schedule Details *</Label>
                <Textarea
                  id="workScheduleDetails"
                  value={formData.workScheduleDetails}
                  onChange={(e) => handleInputChange('workScheduleDetails', e.target.value)}
                  placeholder="e.g., Rotating: Week 1 Mon-Fri 7 AM - 3 PM, Week 2 Mon-Fri 3 PM - 11 PM"
                  rows={3}
                />
                <p className="text-xs text-amber-600 mt-1">⚠️ Always include AM or PM for all times</p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-base">
                Are you currently enrolled in school or a training program? *
              </Label>
              <p className="text-sm text-muted-foreground">
                (e.g., college, university, cosmetology school, skilled trades, certification programs)
              </p>
              
              <RadioGroup 
                value={formData.inSchool} 
                onValueChange={(val) => {
                  handleInputChange('inSchool', val);
                  if (val === 'no') {
                    handleInputChange('schoolCommitment', '');
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="school-yes" />
                  <Label htmlFor="school-yes" className="font-normal cursor-pointer">
                    Yes, I am currently enrolled
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="school-no" />
                  <Label htmlFor="school-no" className="font-normal cursor-pointer">
                    No, not currently enrolled
                  </Label>
                </div>
              </RadioGroup>

              {formData.inSchool === 'yes' && (
                <div className="mt-3 pl-4 border-l-2 border-primary/30">
                  <Label htmlFor="schoolCommitment">School/Training Schedule</Label>
                  <Textarea
                    id="schoolCommitment"
                    value={formData.schoolCommitment}
                    onChange={(e) => handleInputChange('schoolCommitment', e.target.value)}
                    placeholder="e.g., Monday/Wednesday 6-9 PM, or self-paced online (10 hrs/week)"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include class times, study hours, or "self-paced" if no fixed schedule
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base">
                Do you have regular family commitments? *
              </Label>
              <p className="text-sm text-muted-foreground">
                (e.g., childcare, eldercare, spouse/partner time, family activities)
              </p>
              
              <RadioGroup 
                value={formData.hasFamilyCommitments} 
                onValueChange={(val) => {
                  handleInputChange('hasFamilyCommitments', val);
                  if (val === 'no') {
                    handleInputChange('familyCommitments', '');
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="family-yes" />
                  <Label htmlFor="family-yes" className="font-normal cursor-pointer">
                    Yes, I have regular family commitments
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="family-no" />
                  <Label htmlFor="family-no" className="font-normal cursor-pointer">
                    No family commitments to schedule around
                  </Label>
                </div>
              </RadioGroup>

              {formData.hasFamilyCommitments === 'yes' && (
                <div className="mt-3 pl-4 border-l-2 border-primary/30">
                  <Label htmlFor="familyCommitments">Family Commitment Details</Label>
                  <Textarea
                    id="familyCommitments"
                    value={formData.familyCommitments}
                    onChange={(e) => handleInputChange('familyCommitments', e.target.value)}
                    placeholder="e.g., Drop off kids at 8 AM, pick up at 3 PM. Evening family time 6-8 PM. Sunday family activities."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include specific times, days, and types of commitments
                  </p>
                </div>
              )}
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

            <div className="space-y-3">
              <Label className="text-base">Daily Commute Time</Label>
              <p className="text-sm text-muted-foreground">
                How long does it take you to commute to work/school each day?
              </p>
              
              <div>
                <Label htmlFor="commuteType">Commute Type</Label>
                <Select
                  value={formData.commuteType}
                  onValueChange={(value) => handleInputChange('commuteType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select commute type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-way">One-way (just to work/school)</SelectItem>
                    <SelectItem value="round-trip">Round-trip (to and from work/school)</SelectItem>
                    <SelectItem value="none">No commute (remote work/online school)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.commuteType && formData.commuteType !== 'none' && (
                <div>
                  <Label htmlFor="commuteTime">
                    Commute Duration (hours) - {formData.commuteType === 'one-way' ? 'One direction' : 'Total daily'}
                  </Label>
                  <Input
                    id="commuteTime"
                    type="number"
                    step="0.25"
                    min="0"
                    max="5"
                    value={formData.commuteTime}
                    onChange={(e) => handleInputChange('commuteTime', e.target.value)}
                    placeholder={formData.commuteType === 'one-way' ? "e.g., 0.75 (45 min)" : "e.g., 1.5 (total)"}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.commuteType === 'one-way' 
                      ? 'Enter time for one direction. We\'ll double this for your schedule.' 
                      : 'Enter total time for both to and from work/school.'}
                  </p>
                </div>
              )}
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

            <div className="space-y-3">
              <Label className="text-base">Sleep Schedule *</Label>
              <p className="text-sm text-muted-foreground">When do you typically sleep?</p>
              
              <div className="grid grid-cols-2 gap-4">
                <TimePickerField 
                  label="Bedtime" 
                  value={formData.bedtime}
                  onChange={(val) => handleInputChange('bedtime', val)}
                  defaultHour={11}
                  defaultMinute={0}
                  defaultPeriod="PM"
                />
                <TimePickerField 
                  label="Wake Time" 
                  value={formData.wakeTime}
                  onChange={(val) => handleInputChange('wakeTime', val)}
                  defaultHour={7}
                  defaultMinute={0}
                  defaultPeriod="AM"
                />
              </div>
            </div>

            {/* Exercise Routine */}
            <div className="space-y-3">
              <Label className="text-base">Do you exercise regularly?</Label>
              <RadioGroup 
                value={formData.hasExerciseRoutine} 
                onValueChange={(val) => {
                  handleInputChange('hasExerciseRoutine', val);
                  if (val === 'no') {
                    handleInputChange('exerciseHours', '');
                    handleInputChange('exercisePreferredTime', '');
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="exercise-yes" />
                  <Label htmlFor="exercise-yes" className="font-normal cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="exercise-no" />
                  <Label htmlFor="exercise-no" className="font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>

              {formData.hasExerciseRoutine === 'yes' && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                  <div>
                    <Label htmlFor="exerciseHours">Hours per week</Label>
                    <Input
                      id="exerciseHours"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.exerciseHours}
                      onChange={(e) => handleInputChange('exerciseHours', e.target.value)}
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="exercisePreferredTime">Preferred time</Label>
                    <Select 
                      value={formData.exercisePreferredTime} 
                      onValueChange={(val) => handleInputChange('exercisePreferredTime', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred time..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="early-morning">Early Morning (5-7 AM)</SelectItem>
                        <SelectItem value="morning">Morning (7-10 AM)</SelectItem>
                        <SelectItem value="lunch">Lunch (11 AM - 1 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (2-5 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5-8 PM)</SelectItem>
                        <SelectItem value="night">Night (8-10 PM)</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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

            <div>
              <Label htmlFor="downtimeHours">Desired Weekly Relaxation Time (hours)</Label>
              <Input
                id="downtimeHours"
                type="number"
                min="0"
                max="40"
                value={formData.downtimeHours}
                onChange={(e) => handleInputChange('downtimeHours', e.target.value)}
                placeholder="e.g., 10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Time for entertainment, hobbies, TV, gaming, reading, etc.
              </p>
              <p className="text-xs text-primary/70 mt-1">
                💡 Tip: Even busy schedules need 5-10 hours of guilt-free downtime weekly
              </p>
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
              data-toolguard-trigger="true"
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
                <p className="text-2xl font-bold">{generatedSchedule?.summary?.totalCommittedHours || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Side Business Hours</p>
                <p className="text-2xl font-bold">{generatedSchedule?.summary?.sideBusinessHours || 0}</p>
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
