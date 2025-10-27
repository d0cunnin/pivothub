import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

interface EventPlanData {
  platformRecommendations: PlatformRecommendation[];
  eventTitles: string[];
  eventDescription: string;
  colorPalette: ColorPalette[];
  marketingTimeline: MarketingTimeline;
}

export function generateEventPlanPDF(
  eventPlan: EventPlanData,
  eventCategory: string,
  eventFormat: string,
  eventName?: string,
  eventDate?: string
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let yPos = margin;

  // Helper to check page break
  const checkPageBreak = (spaceNeeded: number) => {
    if (yPos + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Header
  doc.setFillColor(41, 55, 72);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(eventName || 'Event Plan', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${eventCategory} | ${eventFormat}`, margin, 25);
  if (eventDate) {
    doc.text(`Event Date: ${eventDate}`, margin, 32);
  }
  
  doc.setTextColor(0, 0, 0);
  yPos = 50;

  // Platform Recommendations
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPos, maxWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Platform Recommendations', margin + 3, yPos + 5.5);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  eventPlan.platformRecommendations.forEach((platform) => {
    checkPageBreak(30);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${platform.name}`, margin + 3, yPos);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Best For: ${platform.bestFor}`, margin + 6, yPos);
    yPos += 4;
    doc.text(`Pricing: ${platform.pricing}`, margin + 6, yPos);
    yPos += 4;
    doc.text(`URL: ${platform.url}`, margin + 6, yPos);
    yPos += 6;
  });
  yPos += 5;

  // Event Titles
  checkPageBreak(30);
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPos, maxWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Title Options', margin + 3, yPos + 5.5);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  eventPlan.eventTitles.forEach((title, index) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${index + 1}. ${title}`, margin + 3, yPos);
    yPos += 6;
  });
  yPos += 5;

  // Event Description
  checkPageBreak(40);
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPos, maxWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Description', margin + 3, yPos + 5.5);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(eventPlan.eventDescription, maxWidth - 6);
  descLines.forEach((line: string) => {
    checkPageBreak(5);
    doc.text(line, margin + 3, yPos);
    yPos += 5;
  });
  yPos += 5;

  // Color Palette
  checkPageBreak(50);
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPos, maxWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Color Palette', margin + 3, yPos + 5.5);
  doc.setTextColor(0, 0, 0);
  yPos += 12;

  eventPlan.colorPalette.forEach((color) => {
    checkPageBreak(15);
    
    // Draw color swatch
    const hexColor = color.hex.replace('#', '');
    const r = parseInt(hexColor.substring(0, 2), 16);
    const g = parseInt(hexColor.substring(2, 4), 16);
    const b = parseInt(hexColor.substring(4, 6), 16);
    
    doc.setFillColor(r, g, b);
    doc.rect(margin + 3, yPos - 4, 10, 10, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin + 3, yPos - 4, 10, 10, 'S');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${color.name} (${color.hex})`, margin + 18, yPos + 2);
    yPos += 12;
  });
  yPos += 5;

  // Marketing Timeline
  checkPageBreak(50);
  doc.addPage();
  yPos = margin;
  
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPos, maxWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('6-Week Marketing Timeline', margin + 3, yPos + 5.5);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  Object.entries(eventPlan.marketingTimeline).forEach(([week, data]) => {
    checkPageBreak(40);
    
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, maxWidth, 8, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${week.toUpperCase()}: ${data.phase}`, margin + 3, yPos + 5.5);
    yPos += 10;

    data.actions.forEach((action: string) => {
      checkPageBreak(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      // Draw checkbox
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin + 3, yPos - 3, 4, 4, 'S');
      
      const actionLines = doc.splitTextToSize(action, maxWidth - 15);
      actionLines.forEach((line: string, idx: number) => {
        if (idx > 0) checkPageBreak(5);
        doc.text(line, margin + 10, yPos);
        yPos += 5;
      });
    });
    yPos += 5;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      'This event plan is not stored in PivotHub. Please save this PDF for your records.',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  return doc;
}
