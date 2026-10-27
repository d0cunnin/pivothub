import { PdfWriter, pdfSafe, cleanInline, HEADING, BODY, MUTED, DIVIDER, type RGB } from '../pdfWriter';

/** Shortens text with an ellipsis so it fits on one line at the given size. */
export function fitOneLine(w: PdfWriter, text: string, size: number, maxWidth = w.contentWidth): string {
  const safe = pdfSafe(text).replace(/\s+/g, ' ').trim();
  w.doc.setFontSize(size);
  if (w.doc.getTextWidth(safe) <= maxWidth) return safe;
  let cut = safe;
  while (cut.length > 1 && w.doc.getTextWidth(`${cut}...`) > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}...`;
}

/** w.header() with the title and subtitle kept on the page (they do not wrap). */
export function safeHeader(w: PdfWriter, title: string, subtitle: string) {
  w.header(fitOneLine(w, title, 24), fitOneLine(w, subtitle, 10));
}

/** Drops a leading bullet/number the AI may have added itself. */
export const stripMarker = (s: string) => s.replace(/^\s*(?:[•*]|-(?=\s)|\d+[.)](?=\s))\s*/, '');

/** Bullet list whose items may contain markdown (bold labels, emphasis). */
export function mdBullets(w: PdfWriter, items: string[], opts: { numbered?: boolean; size?: number } = {}) {
  items.forEach((item, i) => {
    const text = stripMarker(item);
    if (!text.trim()) return;
    w.richParagraph(text, { indent: 4, marker: opts.numbered ? `${i + 1}.` : '•', size: opts.size, after: 1.5 });
  });
}

/**
 * Label/value rows like w.facts(), but the label can be colored and values
 * break across pages line by line (for long before/after text).
 */
export function labeledRows(
  w: PdfWriter,
  rows: { label: string; value: string; labelColor?: RGB; valueColor?: RGB; bold?: boolean }[],
  labelWidth = 26,
) {
  const size = 9.5;
  const lh = size * 0.5;
  rows.filter((r) => r.value).forEach((r) => {
    w.setStyle(size, BODY, r.bold ? 'bold' : 'normal');
    const lines: string[] = w.doc.splitTextToSize(cleanInline(r.value), w.contentWidth - labelWidth);
    w.ensureSpace(lh * Math.min(2, lines.length));
    w.setStyle(size, r.labelColor ?? HEADING, 'bold');
    w.doc.text(pdfSafe(r.label), w.margin, w.y);
    lines.forEach((line, i) => {
      if (i > 0) w.ensureSpace(lh);
      w.setStyle(size, r.valueColor ?? BODY, r.bold ? 'bold' : 'normal');
      w.doc.text(line, w.margin + labelWidth, w.y);
      w.y += lh;
    });
    w.y += 2;
  });
}

/** A light rule between items in a list, lighter than w.divider(). */
export function thinRule(w: PdfWriter, before = 2, after = 6) {
  w.y += before;
  if (w.y <= w.margin + 1) return;
  w.doc.setDrawColor(...DIVIDER);
  w.doc.setLineWidth(0.2);
  w.doc.line(w.margin, w.y, w.pageWidth - w.margin, w.y);
  w.y += after;
}

/** A short muted note line (wraps). */
export function note(w: PdfWriter, text: string, after = 3) {
  w.text(pdfSafe(text), { size: 9, color: MUTED, after });
}

/** Page numbers only (for letters and resumes, which should not carry branding). */
export function plainPageNumbers(w: PdfWriter) {
  const total = w.doc.getNumberOfPages();
  if (total < 2) return;
  for (let i = 1; i <= total; i++) {
    w.doc.setPage(i);
    w.setStyle(8, [156, 163, 175]);
    w.doc.text(`Page ${i} of ${total}`, w.pageWidth / 2, w.pageHeight - 10, { align: 'center' });
  }
}
