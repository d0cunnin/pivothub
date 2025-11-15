import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimePickerFieldProps {
  label: string;
  value?: string; // e.g., "11:00 PM"
  onChange: (value: string) => void;
  defaultHour?: number;
  defaultMinute?: number;
  defaultPeriod?: 'AM' | 'PM';
}

export function TimePickerField({
  label,
  value = '',
  onChange,
  defaultHour = 9,
  defaultMinute = 0,
  defaultPeriod = 'AM'
}: TimePickerFieldProps) {
  // Parse existing value or use defaults
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: defaultHour, minute: defaultMinute, period: defaultPeriod };
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      return {
        hour: parseInt(match[1]),
        minute: parseInt(match[2]),
        period: match[3].toUpperCase() as 'AM' | 'PM'
      };
    }
    return { hour: defaultHour, minute: defaultMinute, period: defaultPeriod };
  };

  const { hour, minute, period } = parseTime(value);

  const updateTime = (newHour?: number, newMinute?: number, newPeriod?: string) => {
    const h = newHour ?? hour;
    const m = newMinute ?? minute;
    const p = newPeriod ?? period;
    
    const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${p}`;
    onChange(formatted);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={hour.toString()} onValueChange={(val) => updateTime(parseInt(val), undefined, undefined)}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {hours.map(h => (
              <SelectItem key={h} value={h.toString()}>
                {h.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-lg font-medium">:</span>

        <Select value={minute.toString()} onValueChange={(val) => updateTime(undefined, parseInt(val), undefined)}>
          <SelectTrigger className="w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            {minutes.map(m => (
              <SelectItem key={m} value={m.toString()}>
                {m.toString().padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={(val) => updateTime(undefined, undefined, val)}>
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
