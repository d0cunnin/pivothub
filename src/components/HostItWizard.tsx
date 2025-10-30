import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Download, ExternalLink, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateEventPlanPDF } from '@/lib/pdf-templates/event-template';
import { generateGoogleCalendarUrl, generateOutlookUrl, downloadICSFile } from '@/lib/calendar-utils';

const EVENT_CATEGORIES = [
  'Business Events',
  'Author Events / Book Signings / Book Tours',
  'Workshops',
  'Masterclasses',
  'Conferences',
  'Youth Events (Camps, Conferences, VBS, Tournaments)',
  'Church / Ministry Events',
  'Fundraisers / Galas / Banquets',
  'Creative Arts (Concerts, Live Recordings, Artist Showcases)',
  'Brunches / Networking Events',
  'Marriage Events',
  'Parenting Events',
  'Women\'s Events',
  'Men\'s Events',
  'Retreats',
  'Education / Training',
  'Mental Health & Wellness',
  'Sports',
  'Nonprofit',
];

interface EventFormData {
  // Step 1
  eventCategory: string;
  
  // Step 2
  eventFormat: string;
  venueCapacity: string;
  location: string;
  expectedAttendees: string;
  timeZones: string;
  
  // Step 3
  eventName: string;
  startDate: string;
  endDate: string;
  budget: string;
  targetAudience: string;
  
  // Step 4
  primaryGoals: string[];
  eventDetails: string;
  numberOfSpeakers: string;
  speakerTopics: string;
  registrationType: string;
  eventCost: string;
  tierDetails: string;
  
  // Step 5
  existingChannels: string;
  emailListSize: string;
  marketingBudget: string;
  timelineToEvent: string;
  needsSponsorshipPacket: boolean;
  sponsorshipMission: string;
  sponsorshipGoals: string;
  targetSponsorTypes: string;
  includeItinerary: boolean;
}

export function HostItWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<EventFormData>({
    eventCategory: '',
    eventFormat: '',
    venueCapacity: '',
    location: '',
    expectedAttendees: '',
    timeZones: '',
    eventName: '',
    startDate: '',
    endDate: '',
    budget: '',
    targetAudience: '',
    primaryGoals: [],
    eventDetails: '',
    numberOfSpeakers: '',
    speakerTopics: '',
    registrationType: '',
    eventCost: '',
    tierDetails: '',
    existingChannels: '',
    emailListSize: '',
    marketingBudget: '',
    timelineToEvent: '',
    needsSponsorshipPacket: false,
    sponsorshipMission: '',
    sponsorshipGoals: '',
    targetSponsorTypes: '',
    includeItinerary: false,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEventPlan, setGeneratedEventPlan] = useState<any>(null);
  const [understoodDisclaimer, setUnderstoodDisclaimer] = useState(false);

  const totalSteps = 6;

  const handleInputChange = (field: keyof EventFormData, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalsToggle = (goal: string) => {
    const currentGoals = formData.primaryGoals;
    if (currentGoals.includes(goal)) {
      handleInputChange('primaryGoals', currentGoals.filter(g => g !== goal));
    } else {
      handleInputChange('primaryGoals', [...currentGoals, goal]);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateEventPlan = async () => {
    // Validation
    if (!formData.eventCategory || !formData.eventFormat) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-event-plan', {
        body: formData
      });

      if (error) throw error;

      setGeneratedEventPlan(data);
      toast.success('Event plan generated successfully!');
    } catch (error: any) {
      console.error('Error generating event plan:', error);
      toast.error(error.message || 'Failed to generate event plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (!generatedEventPlan) return;

    try {
      const pdf = generateEventPlanPDF(
        generatedEventPlan,
        formData.eventCategory,
        formData.eventFormat,
        formData.eventName,
        formData.startDate
      );
      pdf.save('pivothub-event-plan.pdf');
      toast.success('Event plan PDF downloaded!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const getEventCalendarLinks = () => {
    if (!formData.startDate) return null;

    const startDate = new Date(formData.startDate);
    const endDate = formData.endDate ? new Date(formData.endDate) : new Date(startDate.getTime() + 3 * 60 * 60 * 1000);

    const calendarEvent = {
      title: formData.eventName || 'Event',
      description: `${formData.eventCategory} - ${formData.eventFormat}\n\n${formData.targetAudience}`,
      startDate,
      endDate,
      location: formData.location || '',
    };

    return {
      googleUrl: generateGoogleCalendarUrl(calendarEvent),
      outlookUrl: generateOutlookUrl(calendarEvent),
      icsDownload: () => downloadICSFile(calendarEvent, 'event.ics'),
    };
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Event Category</h3>
            
            <div>
              <Label htmlFor="eventCategory">Select Event Category *</Label>
              <Select value={formData.eventCategory} onValueChange={(val) => handleInputChange('eventCategory', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose event category" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Event Format</h3>
            
            <div>
              <Label htmlFor="eventFormat">Select Format *</Label>
              <Select value={formData.eventFormat} onValueChange={(val) => handleInputChange('eventFormat', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose event format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(formData.eventFormat === 'in-person' || formData.eventFormat === 'hybrid') && (
              <>
                <div>
                  <Label htmlFor="venueCapacity">Venue Capacity</Label>
                  <Input
                    id="venueCapacity"
                    type="number"
                    value={formData.venueCapacity}
                    onChange={(e) => handleInputChange('venueCapacity', e.target.value)}
                    placeholder="e.g., 200"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="City, State or Address"
                  />
                </div>
              </>
            )}

            {(formData.eventFormat === 'virtual' || formData.eventFormat === 'hybrid') && (
              <>
                <div>
                  <Label htmlFor="expectedAttendees">Expected Virtual Attendees</Label>
                  <Input
                    id="expectedAttendees"
                    type="number"
                    value={formData.expectedAttendees}
                    onChange={(e) => handleInputChange('expectedAttendees', e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>

                <div>
                  <Label htmlFor="timeZones">Primary Time Zones</Label>
                  <Input
                    id="timeZones"
                    value={formData.timeZones}
                    onChange={(e) => handleInputChange('timeZones', e.target.value)}
                    placeholder="e.g., EST, PST, GMT"
                  />
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Event Details</h3>
            
            <div>
              <Label htmlFor="eventName">Event Name (optional - AI can generate)</Label>
              <Input
                id="eventName"
                value={formData.eventName}
                onChange={(e) => handleInputChange('eventName', e.target.value)}
                placeholder="Leave blank for AI-generated titles"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="budget">Budget Range</Label>
              <Select value={formData.budget} onValueChange={(val) => handleInputChange('budget', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-5k">Under $5,000</SelectItem>
                  <SelectItem value="5k-10k">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10k-25k">$10,000 - $25,000</SelectItem>
                  <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
                  <SelectItem value="50k+">$50,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="targetAudience">Target Audience Description</Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                placeholder="Who is this event for?"
                rows={3}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Goals & Requirements</h3>
            
            <div>
              <Label>Primary Event Goals (select all that apply)</Label>
              <div className="space-y-2 mt-2">
                {['Education', 'Networking', 'Fundraising', 'Celebration', 'Training', 'Community Building'].map(goal => (
                  <div key={goal} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.primaryGoals.includes(goal)}
                      onCheckedChange={() => handleGoalsToggle(goal)}
                    />
                    <label className="text-sm">{goal}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="eventDetails">Event Details</Label>
              <Textarea
                id="eventDetails"
                value={formData.eventDetails}
                onChange={(e) => handleInputChange('eventDetails', e.target.value)}
                placeholder="General event details, vendors, entertainment, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="numberOfSpeakers">Number of Speakers</Label>
              <Input
                id="numberOfSpeakers"
                type="number"
                value={formData.numberOfSpeakers}
                onChange={(e) => handleInputChange('numberOfSpeakers', e.target.value)}
                placeholder="e.g., 3"
              />
            </div>

            <div>
              <Label htmlFor="speakerTopics">Speaker Topics</Label>
              <Textarea
                id="speakerTopics"
                value={formData.speakerTopics}
                onChange={(e) => handleInputChange('speakerTopics', e.target.value)}
                placeholder="What topics will speakers cover?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="registrationType">Registration Type</Label>
              <Select value={formData.registrationType} onValueChange={(val) => handleInputChange('registrationType', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select registration type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="tiered">Tiered (multiple ticket types)</SelectItem>
                  <SelectItem value="donation">Donation-based</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.registrationType === 'paid' && (
              <div>
                <Label htmlFor="eventCost">Event Cost</Label>
                <Input
                  id="eventCost"
                  value={formData.eventCost}
                  onChange={(e) => handleInputChange('eventCost', e.target.value)}
                  placeholder="e.g., $50 per person"
                />
              </div>
            )}

            {formData.registrationType === 'tiered' && (
              <div>
                <Label htmlFor="tierDetails">Tier Details</Label>
                <Textarea
                  id="tierDetails"
                  value={formData.tierDetails}
                  onChange={(e) => handleInputChange('tierDetails', e.target.value)}
                  placeholder="Describe each tier: name, price, and what makes it different"
                  rows={4}
                />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Marketing Preferences</h3>
            
            <div>
              <Label htmlFor="existingChannels">Existing Marketing Channels</Label>
              <Textarea
                id="existingChannels"
                value={formData.existingChannels}
                onChange={(e) => handleInputChange('existingChannels', e.target.value)}
                placeholder="Social media platforms, website, etc."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="emailListSize">Email List Size</Label>
              <Input
                id="emailListSize"
                value={formData.emailListSize}
                onChange={(e) => handleInputChange('emailListSize', e.target.value)}
                placeholder="e.g., 5,000 subscribers"
              />
            </div>

            <div>
              <Label htmlFor="marketingBudget">Marketing Budget</Label>
              <Select value={formData.marketingBudget} onValueChange={(val) => handleInputChange('marketingBudget', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No budget</SelectItem>
                  <SelectItem value="under-1k">Under $1,000</SelectItem>
                  <SelectItem value="1k-5k">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5k+">$5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timelineToEvent">Timeline to Event</Label>
              <Select value={formData.timelineToEvent} onValueChange={(val) => handleInputChange('timelineToEvent', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="How far out is the event?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                  <SelectItem value="3-4-weeks">3-4 weeks</SelectItem>
                  <SelectItem value="5-8-weeks">5-8 weeks</SelectItem>
                  <SelectItem value="2-3-months">2-3 months</SelectItem>
                  <SelectItem value="3-6-months">3-6 months</SelectItem>
                  <SelectItem value="6-months+">6+ months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="needsSponsorshipPacket"
                  checked={formData.needsSponsorshipPacket}
                  onCheckedChange={(checked) => handleInputChange('needsSponsorshipPacket', checked === true)}
                />
                <Label htmlFor="needsSponsorshipPacket" className="cursor-pointer">
                  I need a sponsorship packet
                </Label>
              </div>

              {formData.needsSponsorshipPacket && (
                <div className="space-y-3 ml-6">
                  <div>
                    <Label htmlFor="sponsorshipMission">Event Mission/Purpose</Label>
                    <Textarea
                      id="sponsorshipMission"
                      value={formData.sponsorshipMission}
                      onChange={(e) => handleInputChange('sponsorshipMission', e.target.value)}
                      placeholder="Why are you hosting this event? What impact will it have?"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sponsorshipGoals">Sponsorship Goals</Label>
                    <Textarea
                      id="sponsorshipGoals"
                      value={formData.sponsorshipGoals}
                      onChange={(e) => handleInputChange('sponsorshipGoals', e.target.value)}
                      placeholder="e.g., Raise $50,000 for youth programs"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetSponsorTypes">Target Sponsor Types</Label>
                    <Input
                      id="targetSponsorTypes"
                      value={formData.targetSponsorTypes}
                      onChange={(e) => handleInputChange('targetSponsorTypes', e.target.value)}
                      placeholder="e.g., Local businesses, corporations, faith-based organizations"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="includeItinerary"
                checked={formData.includeItinerary}
                onCheckedChange={(checked) => handleInputChange('includeItinerary', checked === true)}
              />
              <Label htmlFor="includeItinerary" className="text-sm cursor-pointer">
                Include detailed event itinerary in the plan
              </Label>
            </div>
            <p className="text-xs text-muted-foreground ml-6">
              Add a time-by-time event schedule (adds 1-2 pages to PDF)
            </p>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review & Generate</h3>
            
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p><strong>Category:</strong> {formData.eventCategory}</p>
              <p><strong>Format:</strong> {formData.eventFormat}</p>
              <p><strong>Date:</strong> {formData.startDate || 'Not specified'}</p>
              <p><strong>Budget:</strong> {formData.budget || 'Not specified'}</p>
              {formData.numberOfSpeakers && <p><strong>Speakers:</strong> {formData.numberOfSpeakers}</p>}
              {formData.registrationType === 'paid' && formData.eventCost && (
                <p><strong>Cost:</strong> {formData.eventCost}</p>
              )}
              {formData.needsSponsorshipPacket && (
                <p><strong>Sponsorship Packet:</strong> Included</p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will use 4 credits to generate your comprehensive event plan using AI.
              </AlertDescription>
            </Alert>

            <Button
              data-toolguard-trigger="true"
              onClick={generateEventPlan}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? 'Generating Event Plan...' : 'Generate My Event Plan'}
            </Button>
          </div>
        );
    }
  };

  if (generatedEventPlan) {
    const calendarLinks = getEventCalendarLinks();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Event Plan</CardTitle>
          <CardDescription>Comprehensive event planning guide generated by AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform Recommendations Preview */}
          {generatedEventPlan.platformRecommendations && (
            <div>
              <h4 className="font-semibold mb-2">Recommended Platforms</h4>
              <div className="space-y-2">
                {generatedEventPlan.platformRecommendations.slice(0, 3).map((platform: any, idx: number) => (
                  <div key={idx} className="text-sm bg-muted p-2 rounded">
                    <strong>{platform.name}</strong> - {platform.bestFor}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Titles Preview */}
          {generatedEventPlan.eventTitles && (
            <div>
              <h4 className="font-semibold mb-2">Suggested Event Titles</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {generatedEventPlan.eventTitles.slice(0, 3).map((title: string, idx: number) => (
                  <li key={idx}>{title}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Your event plan will not be stored inside PivotHub. Please download the PDF now to retain a copy.
            </AlertDescription>
          </Alert>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={understoodDisclaimer}
              onCheckedChange={(checked) => setUnderstoodDisclaimer(checked === true)}
            />
            <label className="text-sm">
              I understand this event plan will not be saved
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
              Download Event Plan PDF
            </Button>

            {calendarLinks && formData.startDate && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Add Event Date to Calendar:</p>
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
                setGeneratedEventPlan(null);
                setStep(1);
                setUnderstoodDisclaimer(false);
              }}
              variant="outline"
              className="w-full"
            >
              Create New Event Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Your Event - Step {step} of {totalSteps}</CardTitle>
        <CardDescription>
          {step === 1 && 'Select your event category'}
          {step === 2 && 'Choose event format and details'}
          {step === 3 && 'Basic event information'}
          {step === 4 && 'Event goals and requirements'}
          {step === 5 && 'Marketing preferences'}
          {step === 6 && 'Review and generate your event plan'}
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
        {step < 6 && (
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
