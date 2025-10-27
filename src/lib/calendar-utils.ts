interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  recurrence?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  recurrenceEnd?: Date;
}

/**
 * Formats a date for calendar URLs (YYYYMMDDTHHMMSSZ)
 */
function formatDateForCalendar(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Formats a date for ICS files (YYYYMMDDTHHMMSSZ)
 */
function formatDateForICS(date: Date): string {
  return formatDateForCalendar(date);
}

/**
 * Generates a Google Calendar URL for an event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateForCalendar(event.startDate)}/${formatDateForCalendar(event.endDate)}`,
    details: event.description || '',
    location: event.location || '',
  });

  if (event.recurrence) {
    params.append('recur', `RRULE:FREQ=${event.recurrence}`);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates an Outlook Calendar URL for an event
 */
export function generateOutlookUrl(event: CalendarEvent): string {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
  const params = new URLSearchParams({
    subject: event.title,
    body: event.description || '',
    startdt: event.startDate.toISOString(),
    enddt: event.endDate.toISOString(),
    location: event.location || '',
    path: '/calendar/action/compose',
    rru: 'addevent',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generates an ICS file content for an event that can be downloaded
 */
export function generateICSFile(event: CalendarEvent): string {
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PivotHub//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDateForICS(event.startDate)}`,
    `DTEND:${formatDateForICS(event.endDate)}`,
    `DTSTAMP:${formatDateForICS(new Date())}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || ''}`,
    `UID:${Date.now()}@pivothub.io`,
  ];

  if (event.recurrence && event.recurrenceEnd) {
    icsLines.push(`RRULE:FREQ=${event.recurrence};UNTIL=${formatDateForICS(event.recurrenceEnd)}`);
  }

  icsLines.push('END:VEVENT');
  icsLines.push('END:VCALENDAR');

  return icsLines.join('\r\n');
}

/**
 * Downloads an ICS file
 */
export function downloadICSFile(event: CalendarEvent, filename: string = 'event.ics'): void {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates calendar links for multiple recurring events (e.g., weekly schedule)
 */
export function generateRecurringScheduleLinks(
  events: Array<{
    day: string;
    time: string;
    activity: string;
    category: string;
  }>,
  startDate: Date = new Date()
): {
  googleUrl: string;
  outlookUrl: string;
  icsDownload: () => void;
} {
  // Create a single recurring event for the first schedule item
  // Users can customize individual events after import
  const firstEvent = events[0];
  if (!firstEvent) {
    throw new Error('No events provided');
  }

  // Calculate start time based on time string (e.g., "6:00 AM - 8:00 AM")
  const [startTime] = firstEvent.time.split('-');
  const [hours, minutesPeriod] = startTime.trim().split(':');
  const [minutes, period] = minutesPeriod.trim().split(' ');
  
  let hour = parseInt(hours);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  const eventStart = new Date(startDate);
  eventStart.setHours(hour, parseInt(minutes), 0, 0);
  
  const eventEnd = new Date(eventStart);
  eventEnd.setHours(eventStart.getHours() + 2); // Default 2-hour duration

  const recurrenceEnd = new Date(startDate);
  recurrenceEnd.setMonth(recurrenceEnd.getMonth() + 3); // 3 months recurrence

  const calendarEvent: CalendarEvent = {
    title: `${firstEvent.activity}`,
    description: `Category: ${firstEvent.category}\n\nThis is a recurring schedule item. View your PivotHub schedule PDF for the complete weekly schedule.`,
    startDate: eventStart,
    endDate: eventEnd,
    recurrence: 'WEEKLY',
    recurrenceEnd: recurrenceEnd,
  };

  return {
    googleUrl: generateGoogleCalendarUrl(calendarEvent),
    outlookUrl: generateOutlookUrl(calendarEvent),
    icsDownload: () => downloadICSFile(calendarEvent, 'pivothub-schedule.ics'),
  };
}
