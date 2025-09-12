import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Settings, Zap, User, Briefcase, MessageSquare } from 'lucide-react';
import { UserPreferences, useUserPreferences } from '@/hooks/useUserPreferences';

interface PreferencesPanelProps {
  toolName: string;
  onPreferencesChange?: (preferences: UserPreferences) => void;
  compact?: boolean;
}

export const PreferencesPanel = ({ toolName, onPreferencesChange, compact = false }: PreferencesPanelProps) => {
  const { preferences, savePreferences, isLoading } = useUserPreferences(toolName);

  const handlePreferenceChange = (key: keyof UserPreferences, value: string) => {
    const newPreferences = { [key]: value };
    savePreferences(newPreferences);
    onPreferencesChange?.({ ...preferences, ...newPreferences });
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-muted rounded mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Settings</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Detail Level</Label>
            <Select value={preferences.detailLevel} onValueChange={(value) => handlePreferenceChange('detailLevel', value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs">Tone</Label>
            <Select value={preferences.tone} onValueChange={(value) => handlePreferenceChange('tone', value)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Customize Your Results</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <Label>Detail Level</Label>
          </div>
          <Select value={preferences.detailLevel} onValueChange={(value) => handlePreferenceChange('detailLevel', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="concise">Concise (Quick overview)</SelectItem>
              <SelectItem value="balanced">Balanced (Standard detail)</SelectItem>
              <SelectItem value="detailed">Detailed (Comprehensive analysis)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Label>Tone</Label>
          </div>
          <Select value={preferences.tone} onValueChange={(value) => handlePreferenceChange('tone', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly & Approachable</SelectItem>
              <SelectItem value="creative">Creative & Inspiring</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <Label>Industry (Optional)</Label>
          </div>
          <Input
            placeholder="e.g., Technology, Healthcare, Marketing"
            value={preferences.industry}
            onChange={(e) => handlePreferenceChange('industry', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <Label>Experience Level</Label>
          </div>
          <Select value={preferences.experienceLevel} onValueChange={(value) => handlePreferenceChange('experienceLevel', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner (New to this area)</SelectItem>
              <SelectItem value="intermediate">Intermediate (Some experience)</SelectItem>
              <SelectItem value="advanced">Advanced (Experienced professional)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          💡 These preferences are saved and will be applied to future results from this tool.
        </p>
      </div>
    </Card>
  );
};