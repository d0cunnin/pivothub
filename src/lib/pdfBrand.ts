import type jsPDF from 'jspdf';
import { LOGO_BLACK_TEXT, LOGO_WHITE_TEXT, LOGO_ASPECT } from './pdfLogos';

/**
 * PivotHub branding shared by every PDF: the logo in the header and
 * "pivothub.io" plus page numbers in the footer.
 */

export const BRAND_URL = 'pivothub.io';
const FOOTER_GRAY: [number, number, number] = [156, 163, 175];
const BRAND_BLUE: [number, number, number] = [37, 99, 235];

/** The header background the logo sits on. Light backgrounds get the black-text logo. */
export type HeaderTheme = 'light' | 'dark';

/** Draws the logo with its top-left corner at (x, top). Returns its width. */
export function drawLogo(doc: jsPDF, x: number, top: number, height: number, theme: HeaderTheme = 'light'): number {
  const width = height * LOGO_ASPECT;
  doc.addImage(theme === 'dark' ? LOGO_WHITE_TEXT : LOGO_BLACK_TEXT, 'PNG', x, top, width, height, undefined, 'FAST');
  return width;
}

/**
 * Footer on every page: an optional note centred above, then "pivothub.io"
 * on the left and "Page X of Y" on the right.
 */
export function drawBrandFooter(doc: jsPDF, opts: { note?: string; margin?: number } = {}) {
  const margin = opts.margin ?? 20;
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const lineY = height - 8;
    doc.setFont('helvetica', 'normal');
    if (opts.note) {
      doc.setFontSize(7.5);
      doc.setTextColor(...FOOTER_GRAY);
      const note = doc.splitTextToSize(opts.note, width - 2 * margin)[0] ?? '';
      doc.text(note, width / 2, lineY - 5, { align: 'center' });
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND_BLUE);
    doc.text(BRAND_URL, margin, lineY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...FOOTER_GRAY);
    doc.text(`Page ${i} of ${total}`, width - margin, lineY, { align: 'right' });
  }
}
