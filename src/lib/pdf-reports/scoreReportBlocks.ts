import autoTable, { type CellHookData, type Styles } from 'jspdf-autotable';
import { PdfWriter, cleanInline, pdfSafe, ACCENT, BODY, DIVIDER, HEADING, MUTED, type RGB } from '../pdfWriter';

/** Light tints used behind tables and notices. */
export const HEAD_FILL: RGB = [241, 245, 249];
export const ZEBRA_FILL: RGB = [248, 250, 252];

/** Numeric value from AI/number-ish input, or null. */
export const toNumber = (v: any): number | null => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
};

/**
 * A grid table in the PdfWriter style, drawn at the writer's current
 * position. Cells wrap and the table breaks across pages (repeating the
 * header row); the writer's y is moved below it.
 */
export function table(
  w: PdfWriter,
  head: string[] | null,
  body: string[][],
  opts: {
    fontSize?: number;
    columnStyles?: Record<number, Partial<Styles>>;
    firstColumnBold?: boolean;
    didParseCell?: (data: CellHookData) => void;
  } = {},
) {
  if (!body.length) return;
  w.ensureSpace(head ? 26 : 18);
  const clean = (s: string) => cleanInline(String(s ?? ''));
  autoTable(w.doc, {
    startY: w.y - 3,
    head: head ? [head.map(clean)] : undefined,
    body: body.map((row) => row.map(clean)),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: opts.fontSize ?? 9,
      cellPadding: 2.5,
      textColor: BODY,
      lineColor: DIVIDER,
      lineWidth: 0.2,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: { fillColor: HEAD_FILL, textColor: HEADING, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: ZEBRA_FILL },
    columnStyles: {
      ...(opts.firstColumnBold ? { 0: { fontStyle: 'bold', textColor: HEADING } } : {}),
      ...(opts.columnStyles ?? {}),
    },
    rowPageBreak: 'avoid',
    margin: { left: w.margin, right: w.margin, top: w.margin, bottom: w.margin + 8 },
    didParseCell: opts.didParseCell,
  });
  w.y = (w.doc as any).lastAutoTable.finalY + 8;
}

/**
 * A labelled horizontal score bar: label on the left, value on the right,
 * and a filled track underneath.
 */
export function scoreBar(w: PdfWriter, label: string, value: number, max: number, valueText: string, color: RGB = ACCENT) {
  w.ensureSpace(14);
  const right = w.pageWidth - w.margin;
  w.setStyle(10, MUTED);
  const valueWidth = w.doc.getTextWidth(pdfSafe(valueText));
  w.setStyle(10, HEADING, 'bold');
  const labelLines: string[] = w.doc.splitTextToSize(pdfSafe(label), w.contentWidth - valueWidth - 6);
  w.ensureSpace(labelLines.length * 5 + 9);
  labelLines.forEach((line, i) => w.doc.text(line, w.margin, w.y + i * 5));
  w.setStyle(10, MUTED);
  w.doc.text(pdfSafe(valueText), right, w.y, { align: 'right' });
  w.y += (labelLines.length - 1) * 5 + 2.5;
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  w.doc.setFillColor(...DIVIDER);
  w.doc.roundedRect(w.margin, w.y, w.contentWidth, 2.6, 1.3, 1.3, 'F');
  if (ratio > 0) {
    w.doc.setFillColor(...color);
    w.doc.roundedRect(w.margin, w.y, Math.max(2.6, w.contentWidth * ratio), 2.6, 1.3, 1.3, 'F');
  }
  w.y += 9;
}

/** A tinted box with a coloured left edge holding a short message. */
export function notice(w: PdfWriter, text: string, color: RGB = ACCENT, opts: { bold?: boolean } = {}) {
  const size = 10;
  w.setStyle(size, color, opts.bold ? 'bold' : 'normal');
  const lines: string[] = w.doc.splitTextToSize(pdfSafe(text), w.contentWidth - 12);
  const height = lines.length * 5 + 6;
  w.ensureSpace(height + 4);
  const tint = color.map((c) => Math.round(c + (255 - c) * 0.92)) as RGB;
  w.doc.setFillColor(...tint);
  w.doc.rect(w.margin, w.y - 4, w.contentWidth, height, 'F');
  w.doc.setFillColor(...color);
  w.doc.rect(w.margin, w.y - 4, 1.2, height, 'F');
  w.setStyle(size, color, opts.bold ? 'bold' : 'normal');
  lines.forEach((line, i) => w.doc.text(line, w.margin + 6, w.y + 1.5 + i * 5));
  w.y += height + 4;
}

/** An extra footer line drawn just above PdfWriter's page footer. Call after w.footer(). */
export function footerNote(w: PdfWriter, text: string, color: RGB = [156, 163, 175]) {
  const total = w.doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    w.doc.setPage(i);
    w.setStyle(8, color);
    w.doc.text(pdfSafe(text), w.pageWidth / 2, w.pageHeight - 17, { align: 'center' });
  }
}

/** Action plan that may be an object of phases ({immediate: [...]}) or plain text/list. */
export function actionPlan(w: PdfWriter, plan: any, title = 'Your Action Plan') {
  if (!plan) return;
  const phases: [string, string][] = [
    ['immediate', 'Right away'],
    ['shortTerm', 'In the next few months'],
    ['longTerm', 'Longer term'],
  ];
  if (typeof plan === 'string') {
    w.section(title);
    w.markdown(plan);
    w.y += 4;
    return;
  }
  if (Array.isArray(plan)) {
    const items = plan.map((p) => cleanInline(String(p ?? ''))).filter(Boolean);
    if (!items.length) return;
    w.section(title);
    w.bullets(items);
    w.y += 4;
    return;
  }
  if (typeof plan !== 'object') return;
  const known = new Set(phases.map(([k]) => k));
  const entries: [string, any][] = [
    ...phases.filter(([k]) => plan[k]).map(([k, label]) => [label, plan[k]] as [string, any]),
    ...Object.entries(plan).filter(([k]) => !known.has(k)).map(([k, v]) => [humanize(k), v] as [string, any]),
  ];
  const withItems = entries.filter(([, v]) => (Array.isArray(v) ? v.length : v));
  if (!withItems.length) return;
  w.section(title);
  withItems.forEach(([label, v]) => {
    w.subHeading(label, ACCENT, 10.5);
    const items = Array.isArray(v) ? v.map((x) => cleanInline(typeof x === 'string' ? x : JSON.stringify(x))) : [cleanInline(String(v))];
    w.bullets(items.filter(Boolean), { size: 9.5 });
    w.y += 2;
  });
  w.y += 2;
}

/** "shortTerm" -> "Short term", "next_steps" -> "Next steps". */
export function humanize(key: string): string {
  const s = key.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const isTableLine = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isSeparatorRow = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);
const splitRow = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

/** Like w.markdown(), but renders GitHub-style pipe tables as real tables. */
export function markdownWithTables(w: PdfWriter, md: string) {
  const lines = md.replace(/\r/g, '').split('\n');
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length) w.markdown(buffer.join('\n'));
    buffer = [];
  };
  for (let i = 0; i < lines.length; i++) {
    if (isTableLine(lines[i]) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      flush();
      const head = splitRow(lines[i]);
      const body: string[][] = [];
      i += 2;
      while (i < lines.length && isTableLine(lines[i])) {
        const row = splitRow(lines[i]);
        while (row.length < head.length) row.push('');
        body.push(row.slice(0, head.length));
        i++;
      }
      i--;
      w.y += 2;
      table(w, head, body, { firstColumnBold: true });
      continue;
    }
    buffer.push(lines[i]);
  }
  flush();
}

/**
 * PdfWriter.header() does not wrap its 24pt title, so a long title (often
 * AI-written) goes under a short fallback title as a wrapped section heading.
 */
export function headerWithTitle(w: PdfWriter, title: string, fallback: string, subtitle: string) {
  w.setStyle(24, HEADING);
  if (title && w.doc.getTextWidth(pdfSafe(title)) <= w.contentWidth) {
    w.header(title, subtitle);
    return;
  }
  w.header(fallback, subtitle);
  if (title) w.section(title);
}
