import jsPDF from 'jspdf';
import { drawLogo as drawPivotHubLogo, BRAND_URL } from '../pdfBrand';
import { asText, pdfSafe, cleanInline, HEADING, BODY, MUTED, ACCENT, DIVIDER, type RGB } from '../pdfWriter';

export interface PitchSlidePDF {
  title: string;
  content: string;
}

function hexToRgb(hex: string): RGB | null {
  const m = asText(hex).replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function imageFormat(dataUrl: string): string {
  const m = dataUrl.match(/^data:image\/(png|jpe?g|webp|gif)/i);
  if (!m) return 'PNG';
  const f = m[1].toLowerCase();
  return f === 'jpg' || f === 'jpeg' ? 'JPEG' : f.toUpperCase();
}

const slideLines = (content: string): string[] =>
  asText(content)
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => cleanInline(l.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*(?:[•*+-]|\d+[.)])\s*/, '')))
    .filter((l) => l && !/^[-_=]{3,}$/.test(l));

/**
 * Landscape investor deck: one slide per page. Slides with more text than
 * fits continue on an extra "(continued)" page instead of being cut off.
 */
export function generatePitchDeckPDF(input: {
  companyName: string;
  slides: PitchSlidePDF[];
  logo?: string;
  primaryColor?: string;
}): jsPDF {
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 22;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 24;
  const brand = hexToRgb(input.primaryColor ?? '') ?? ACCENT;
  const company = pdfSafe(asText(input.companyName)) || 'Company Name';
  const slides = Array.isArray(input.slides) ? input.slides : [];
  const date = new Date().toLocaleDateString();
  let firstPage = true;

  const style = (size: number, color: RGB, weight: 'normal' | 'bold' = 'normal') => {
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.setFont('helvetica', weight);
  };

  const drawLogo = (x: number, y: number, maxH: number) => {
    if (!input.logo) return 0;
    try {
      const props = pdf.getImageProperties(input.logo);
      const h = maxH;
      const wdt = Math.min(40, (props.width / props.height) * h);
      pdf.addImage(input.logo, imageFormat(input.logo), x, y, wdt, h);
      return wdt;
    } catch (e) {
      console.error('Error adding logo:', e);
      return 0;
    }
  };

  const newPage = (index: number, cover = false) => {
    if (!firstPage) pdf.addPage();
    firstPage = false;
    pdf.setFillColor(...brand);
    pdf.rect(0, 0, pageWidth, 3, 'F');
    if (cover) {
      // Slides have a white background, so use the black-text PivotHub logo.
      drawPivotHubLogo(pdf, margin, 10, 7, 'light');
    } else {
      drawLogo(margin, 9, 12);
      style(10, MUTED);
      pdf.text(company, pageWidth - margin, 16, { align: 'right' });
    }
    // Footer
    pdf.setDrawColor(...DIVIDER);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    style(9, [148, 163, 184]);
    pdf.text(`${index + 1} / ${slides.length}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(37, 99, 235);
    pdf.text(BRAND_URL, margin, pageHeight - 10);
    style(9, [148, 163, 184]);
    pdf.text(date, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  const drawTitle = (title: string): number => {
    style(26, HEADING, 'bold');
    const lines: string[] = pdf.splitTextToSize(title, contentWidth);
    let y = 40;
    lines.forEach((line) => { pdf.text(line, margin, y); y += 11; });
    pdf.setFillColor(...brand);
    pdf.rect(margin, y - 6, 28, 1.4, 'F');
    return y + 8;
  };

  const renderCover = (slide: PitchSlidePDF): boolean => {
    const lines = slideLines(slide.content).filter((l) => l.toLowerCase() !== company.toLowerCase());
    style(16, BODY);
    const wrapped = lines.map((l) => pdf.splitTextToSize(l, contentWidth - 40) as string[]);
    const textHeight = wrapped.reduce((n, l) => n + l.length * 8 + 3, 0);
    style(40, HEADING, 'bold');
    const nameLines: string[] = pdf.splitTextToSize(company, contentWidth);
    const total = nameLines.length * 16 + 14 + textHeight;
    if (total > bottomLimit - 40) return false;

    newPage(0, true);
    let y = Math.max(52, (pageHeight - total) / 2 + 6);
    if (input.logo) {
      const props = (() => { try { return pdf.getImageProperties(input.logo); } catch { return null; } })();
      if (props) {
        const h = 22;
        const wdt = Math.min(60, (props.width / props.height) * h);
        try { pdf.addImage(input.logo, imageFormat(input.logo), (pageWidth - wdt) / 2, y - 34, wdt, h); } catch { /* ignore */ }
      }
    }
    style(40, HEADING, 'bold');
    nameLines.forEach((line) => { pdf.text(line, pageWidth / 2, y, { align: 'center' }); y += 16; });
    pdf.setFillColor(...brand);
    pdf.rect(pageWidth / 2 - 20, y - 8, 40, 1.6, 'F');
    y += 8;
    style(16, BODY);
    wrapped.forEach((l) => {
      l.forEach((line) => { pdf.text(line, pageWidth / 2, y, { align: 'center' }); y += 8; });
      y += 3;
    });
    return true;
  };

  slides.forEach((slide, index) => {
    const title = pdfSafe(cleanInline(asText(slide?.title))) || `Slide ${index + 1}`;
    if (index === 0 && /cover|^title/i.test(title) && renderCover(slide)) return;

    newPage(index);
    let y = drawTitle(title);
    const size = 15;
    const lh = 7.4;
    slideLines(slide?.content).forEach((item) => {
      style(size, BODY);
      const wrapped: string[] = pdf.splitTextToSize(item, contentWidth - 10);
      wrapped.forEach((line, i) => {
        if (y > bottomLimit) {
          newPage(index);
          y = drawTitle(`${title} (continued)`);
        }
        if (i === 0) {
          pdf.setFillColor(...brand);
          pdf.circle(margin + 2, y - 1.8, 1.3, 'F');
        }
        style(size, BODY);
        pdf.text(line, margin + 9, y);
        y += lh;
      });
      y += 4.5;
    });
  });

  if (firstPage) {
    // No slides: still return a valid one-page document.
    newPage(0);
    drawTitle(company);
  }
  return pdf;
}
