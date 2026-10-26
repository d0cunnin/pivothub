import jsPDF from 'jspdf';

// jsPDF's built-in Helvetica only covers Windows-1252. Any other character
// (arrows, check marks, emoji, non-breaking hyphens) prints as garbage such
// as "%¸", so map the common ones to plain equivalents and drop the rest.
const CP1252_EXTRAS = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const REPLACEMENTS: Record<string, string> = {
  '→': '->', '←': '<-', '⇒': '=>', '↑': '^', '↓': 'v',
  '▸': '•', '▶': '•', '►': '•', '◆': '•', '●': '•', '▪': '•',
  '✓': '', '✔': '', '✅': '', '☐': '', '★': '*', '☆': '*',
  '≈': '~', '≥': '>=', '≤': '<=', '≠': '!=', '−': '-',
  '‐': '-', '‑': '-', '‒': '-',
  ' ': ' ', ' ': ' ', '​': '',
};

export const pdfSafe = (s: string): string =>
  Array.from(s.normalize('NFC'))
    .map((ch) => {
      if (ch in REPLACEMENTS) return REPLACEMENTS[ch];
      const c = ch.codePointAt(0)!;
      if (ch === '\n' || (c >= 0x20 && c <= 0x7e) || (c >= 0xa0 && c <= 0xff) || CP1252_EXTRAS.has(ch)) return ch;
      return '';
    })
    .join('')
    .replace(/[ \t]{2,}/g, ' ')
    // A dropped symbol can leave a space before punctuation ("job ✓." -> "job .").
    .replace(/ ([.,;:!?])(?=\s|$)/g, '$1');

export const asText = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return pdfSafe(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(asText).filter(Boolean).join(', ');
  if (typeof v === 'object') {
    return Object.entries(v)
      .map(([k, val]) => `${k}: ${asText(val)}`)
      .join('; ');
  }
  return pdfSafe(String(v));
};

export const toList = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(asText).filter(Boolean);
  if (typeof v === 'string') return [asText(v)];
  if (typeof v === 'object') return Object.values(v).map(asText).filter(Boolean);
  return [asText(v)];
};

export type RGB = [number, number, number];
export const HEADING: RGB = [45, 55, 72];
export const BODY: RGB = [75, 85, 99];
export const MUTED: RGB = [107, 114, 128];
export const ACCENT: RGB = [59, 130, 246];
export const DIVIDER: RGB = [226, 232, 240];
export const PRO: RGB = [5, 150, 105];
export const CON: RGB = [225, 29, 72];

/**
 * Small flowing-layout helper for A4 PDF reports: wraps text, breaks pages
 * line by line, and draws the standard PivotHub header, headings and footer.
 */
export class PdfWriter {
  readonly doc = new jsPDF();
  readonly margin = 20;
  readonly pageWidth = this.doc.internal.pageSize.getWidth();
  readonly pageHeight = this.doc.internal.pageSize.getHeight();
  readonly contentWidth = this.pageWidth - 2 * this.margin;
  // Leave room for the page footer.
  private readonly bottomLimit = this.pageHeight - this.margin - 5;
  y = this.margin;

  ensureSpace(needed: number) {
    if (this.y + needed > this.bottomLimit) {
      this.doc.addPage();
      this.y = this.margin;
    }
  }

  setStyle(size: number, color: RGB, style: 'normal' | 'bold' = 'normal') {
    this.doc.setFontSize(size);
    this.doc.setTextColor(...color);
    this.doc.setFont('helvetica', style);
  }

  text(
    text: string,
    opts: { x?: number; size?: number; color?: RGB; style?: 'normal' | 'bold'; after?: number } = {},
  ) {
    if (!text) return;
    const x = opts.x ?? this.margin;
    const size = opts.size ?? 10;
    const lineHeight = size * 0.5;
    this.setStyle(size, opts.color ?? BODY, opts.style);
    const lines: string[] = this.doc.splitTextToSize(text, this.contentWidth - (x - this.margin));
    lines.forEach((line) => {
      this.ensureSpace(lineHeight);
      this.doc.text(line, x, this.y);
      this.y += lineHeight;
    });
    this.y += opts.after ?? 2;
  }

  header(title: string, subtitle: string) {
    this.setStyle(24, HEADING);
    this.doc.text(pdfSafe(title), this.margin, this.y);
    this.y += 10;
    this.setStyle(10, MUTED);
    this.doc.text(pdfSafe(subtitle), this.margin, this.y);
    this.y += 5;
    this.setStyle(8, MUTED);
    this.doc.text(`Generated: ${new Date().toLocaleDateString()}`, this.margin, this.y);
    this.y += 10;
    this.divider();
    this.y += 2;
  }

  divider() {
    this.ensureSpace(12);
    this.doc.setDrawColor(...DIVIDER);
    this.doc.line(this.margin, this.y, this.pageWidth - this.margin, this.y);
    this.y += 10;
  }

  section(title: string, subtitle?: string) {
    this.ensureSpace(subtitle ? 30 : 24);
    this.setStyle(16, HEADING);
    this.doc.text(pdfSafe(title), this.margin, this.y);
    this.y += 8;
    if (subtitle) {
      this.setStyle(10, MUTED);
      this.doc.text(pdfSafe(subtitle), this.margin, this.y);
      this.y += 8;
    }
  }

  subHeading(title: string, color: RGB = HEADING, size = 11) {
    this.ensureSpace(14);
    this.setStyle(size, color, 'bold');
    this.doc.text(pdfSafe(title), this.margin, this.y);
    this.y += 6;
  }

  bullets(items: string[], opts: { indent?: number; size?: number; numbered?: boolean } = {}) {
    const indent = opts.indent ?? 5;
    items.forEach((item, i) => {
      // The AI sometimes prefixes items with its own bullet or number.
      const clean = item.replace(/^\s*(?:[•*]|-(?=\s)|\d+[.)](?=\s))\s*/, '');
      const prefix = opts.numbered ? `${i + 1}. ` : '• ';
      this.text(prefix + clean, { x: this.margin + indent, size: opts.size ?? 10, after: 2 });
    });
  }

  badge(label: string, width: number) {
    this.doc.setFillColor(...ACCENT);
    this.doc.roundedRect(this.margin, this.y - 5, width, 8, 2, 2, 'F');
    this.setStyle(10, [255, 255, 255], 'bold');
    this.doc.text(pdfSafe(label), this.margin + width / 2, this.y, { align: 'center' });
  }

  /** "Label: value" rows with a bold label column. */
  facts(rows: [string, string][]) {
    rows.filter(([, v]) => v).forEach(([label, value]) => {
      const labelWidth = 42;
      this.setStyle(9.5, HEADING, 'bold');
      const valueLines: string[] = (() => {
        this.setStyle(9.5, BODY);
        return this.doc.splitTextToSize(value, this.contentWidth - labelWidth);
      })();
      this.ensureSpace(valueLines.length * 4.75 + 1.5);
      this.setStyle(9.5, HEADING, 'bold');
      this.doc.text(pdfSafe(label), this.margin, this.y);
      this.setStyle(9.5, BODY);
      valueLines.forEach((line, i) => this.doc.text(line, this.margin + labelWidth, this.y + i * 4.75));
      this.y += valueLines.length * 4.75 + 1.5;
    });
    this.y += 2;
  }

  footer(text: string) {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.setStyle(8, [156, 163, 175]);
      this.doc.text(`${pdfSafe(text)} | Page ${i} of ${totalPages}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });
    }
  }
}
