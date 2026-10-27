import type jsPDF from 'jspdf';
import { PdfWriter, asText, toList, pdfSafe, ACCENT, BODY, HEADING, MUTED, DIVIDER } from '../pdfWriter';

interface PlatformRecommendation {
  name: string;
  bestFor: string;
  pricing: string;
  features: string[];
  url: string;
}

interface ColorPalette {
  hex: string;
  name: string;
}

interface WeeklyActions {
  phase: string;
  actions: string[];
}

interface MarketingTimeline {
  [key: string]: WeeklyActions;
}

interface SponsorshipTier {
  name: string;
  amount: string;
  benefits: string[];
}

interface SponsorshipPacket {
  introLetter: string;
  tiers: SponsorshipTier[];
}

interface EventPlanData {
  platformRecommendations: PlatformRecommendation[];
  eventTitles: string[];
  eventDescription: string;
  colorPalette: ColorPalette[];
  marketingTimeline: MarketingTimeline;
  eventItinerary?: Array<{ time: string; activity: string; duration: string }>;
  sponsorshipPacket?: SponsorshipPacket;
}

/** "2026-11-01" -> "November 1, 2026"; anything else is returned as-is. */
function formatEventDate(date: string): string {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return date;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function hexToRgb(hex: string): [number, number, number] | null {
  const m = asText(hex).replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

/** "week1-2" -> "Week 1-2", "event-week" -> "Event Week", "post-event" -> "Post-Event". */
function weekLabel(key: string): string {
  const week = key.match(/^week\s*[-_]?\s*(.+)$/i);
  if (week) return `Week ${week[1]}`;
  if (/^event[-_\s]?week$/i.test(key)) return 'Event Week';
  return key.split('-').map((part) => capitalize(part.replace(/_/g, ' '))).join('-');
}

/** A to-do line with an empty checkbox, wrapped under the text. */
function checklistItem(w: PdfWriter, text: string) {
  const size = 10;
  const lineHeight = size * 0.5;
  const textX = w.margin + 11;
  w.setStyle(size, BODY);
  const lines: string[] = w.doc.splitTextToSize(pdfSafe(text), w.contentWidth - 11);
  w.ensureSpace(lineHeight * Math.min(2, lines.length));
  w.doc.setDrawColor(...MUTED);
  w.doc.setLineWidth(0.3);
  w.doc.rect(w.margin + 4, w.y - 3.2, 3.6, 3.6, 'S');
  w.setStyle(size, BODY);
  lines.forEach((line, i) => {
    if (i > 0) w.ensureSpace(lineHeight);
    w.doc.text(line, textX, w.y);
    w.y += lineHeight;
  });
  w.y += 2;
}

export function generateEventPlanPDF(
  eventPlan: EventPlanData,
  eventCategory: string,
  eventFormat: string,
  eventName?: string,
  eventDate?: string
): jsPDF {
  const w = new PdfWriter();
  const subtitle = [capitalize(asText(eventCategory)), capitalize(asText(eventFormat)), eventDate ? formatEventDate(eventDate) : '']
    .filter(Boolean)
    .join('  |  ');
  w.header(asText(eventName) || 'Your Event Plan', subtitle || 'Your event plan');

  const titles = toList(eventPlan.eventTitles);
  if (titles.length) {
    w.section('Event Title Ideas', 'Pick one, or mix and match');
    w.bullets(titles, { numbered: true });
    w.y += 4;
  }

  const description = asText(eventPlan.eventDescription);
  if (description) {
    w.section('Event Description', 'Ready to paste into your event page or flyer');
    description.split(/\n\s*\n/).forEach((para) => w.text(para.trim(), { after: 4 }));
    w.y += 2;
  }

  const itinerary = Array.isArray(eventPlan.eventItinerary) ? eventPlan.eventItinerary : [];
  if (itinerary.length) {
    w.section('Event Day Schedule');
    const timeWidth = 26;
    itinerary.forEach((item) => {
      const time = asText(item?.time);
      const activity = asText(item?.activity);
      const duration = asText(item?.duration);
      w.setStyle(10, HEADING, 'bold');
      const lines: string[] = w.doc.splitTextToSize(pdfSafe(activity), w.contentWidth - timeWidth);
      w.ensureSpace(lines.length * 5 + (duration ? 5 : 0) + 3);
      w.setStyle(10, ACCENT, 'bold');
      w.doc.text(pdfSafe(time), w.margin, w.y);
      w.setStyle(10, HEADING, 'bold');
      lines.forEach((line, i) => w.doc.text(line, w.margin + timeWidth, w.y + i * 5));
      w.y += lines.length * 5;
      if (duration) {
        w.setStyle(9, MUTED);
        w.doc.text(pdfSafe(duration), w.margin + timeWidth, w.y);
        w.y += 5;
      }
      w.y += 2.5;
    });
    w.y += 4;
  }

  const platforms = Array.isArray(eventPlan.platformRecommendations) ? eventPlan.platformRecommendations : [];
  if (platforms.length) {
    w.section('Where to Host Registration', 'Platforms that fit this event');
    platforms.forEach((platform, i) => {
      w.subHeading(asText(platform?.name), HEADING, 12);
      w.facts([
        ['Best for', asText(platform?.bestFor)],
        ['Cost', asText(platform?.pricing)],
        ['Website', asText(platform?.url)],
      ]);
      const features = toList(platform?.features);
      if (features.length) w.bullets(features, { size: 9.5 });
      if (i < platforms.length - 1) w.y += 3;
    });
    w.y += 4;
  }

  const colors = Array.isArray(eventPlan.colorPalette) ? eventPlan.colorPalette : [];
  if (colors.length) {
    w.section('Color Palette', 'Use these on flyers, slides and signs');
    colors.forEach((color) => {
      w.ensureSpace(12);
      const rgb = hexToRgb(color?.hex);
      if (rgb) {
        w.doc.setFillColor(...rgb);
        w.doc.setDrawColor(...DIVIDER);
        w.doc.roundedRect(w.margin, w.y - 5, 14, 9, 1.5, 1.5, 'FD');
      }
      w.setStyle(10, HEADING, 'bold');
      w.doc.text(pdfSafe(asText(color?.name)), w.margin + 19, w.y - 0.5);
      w.setStyle(9, MUTED);
      w.doc.text(pdfSafe(asText(color?.hex).toUpperCase()), w.margin + 19, w.y + 3.5);
      w.y += 12;
    });
    w.y += 2;
  }

  const timeline = eventPlan.marketingTimeline && typeof eventPlan.marketingTimeline === 'object'
    ? Object.entries(eventPlan.marketingTimeline)
    : [];
  if (timeline.length) {
    w.section('Marketing Timeline', 'Check off each step as you go');
    timeline.forEach(([week, data]) => {
      const label = weekLabel(week);
      const phase = asText(data?.phase);
      w.subHeading(phase ? `${label}: ${phase}` : label, ACCENT, 11);
      toList(data?.actions).forEach((action) => checklistItem(w, action));
      w.y += 3;
    });
  }

  const packet = eventPlan.sponsorshipPacket;
  if (packet && (asText(packet.introLetter) || (Array.isArray(packet.tiers) && packet.tiers.length))) {
    w.section('Sponsorship Packet');
    const letter = asText(packet.introLetter);
    if (letter) {
      w.subHeading('Letter to Potential Sponsors');
      letter.split(/\n\s*\n/).forEach((para) => w.text(para.trim(), { after: 4 }));
      w.y += 2;
    }
    const tiers = Array.isArray(packet.tiers) ? packet.tiers : [];
    if (tiers.length) {
      w.subHeading('Sponsorship Levels');
      tiers.forEach((tier) => {
        const amount = asText(tier?.amount);
        w.subHeading(amount ? `${asText(tier?.name)}  -  ${amount}` : asText(tier?.name), ACCENT, 10.5);
        w.bullets(toList(tier?.benefits), { size: 9.5 });
        w.y += 2;
      });
    }
  }

  w.footer('This event plan is not stored in PivotHub. Save this PDF for your records.');
  return w.doc;
}
