import autoTable from 'jspdf-autotable';
import { PdfWriter, cleanInline, pdfSafe, ACCENT, BODY, DIVIDER, HEADING, RGB } from '../pdfWriter';

/**
 * Extra building blocks on top of PdfWriter for AI markdown that contains
 * tables, fenced code and file trees (which w.markdown() would otherwise
 * print as raw pipes, backticks and dropped box-drawing characters).
 */

const CODE_BG: RGB = [246, 248, 250];
const CODE_TEXT: RGB = [51, 65, 85];
const CALLOUT_BG: RGB = [239, 246, 255];
const TABLE_HEAD_BG: RGB = [241, 245, 249];
const TABLE_STRIPE: RGB = [250, 251, 252];

/** Box-drawing characters (file trees, diagrams) are outside the PDF font; map them to ASCII. */
export const asciiDiagram = (s: string): string =>
  s
    .replace(/[├┣╠]/g, '|')
    .replace(/[└┗╚]/g, '`')
    .replace(/[│┃║]/g, '|')
    .replace(/[─━═]/g, '-')
    .replace(/[┌┐┘┬┴┼┏┓┛╔╗╝]/g, '+');

const bottomOf = (w: PdfWriter) => w.pageHeight - w.margin - 5;

/** Markdown links become "text (url)"; images and stray HTML are dropped. */
const inlineCleanup = (s: string): string =>
  asciiDiagram(s)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) =>
      text.trim() === url.trim() ? url : `${text} (${url})`)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, '');

/** Monospace box that wraps long lines and continues cleanly across pages. */
export function codeBox(w: PdfWriter, code: string, label?: string) {
  const size = 8.5;
  const lh = 4.1;
  const pad = 3;
  const innerWidth = w.contentWidth - pad * 2;
  w.doc.setFont('courier', 'normal');
  w.doc.setFontSize(size);
  const lines: string[] = [];
  // pdfSafe collapses runs of spaces, so apply it only between them.
  asciiDiagram(code.replace(/\t/g, '  '))
    .split(/( +)/)
    .map((part) => (part.startsWith(' ') ? part : pdfSafe(part)))
    .join('')
    .replace(/\s+$/, '')
    .split('\n')
    .forEach((raw) => {
      if (!raw.trim()) { lines.push(''); return; }
      const indent = raw.match(/^ */)![0];
      const wrapped: string[] = w.doc.splitTextToSize(raw, innerWidth);
      wrapped.forEach((l, i) => lines.push(i === 0 ? l : indent + '  ' + l.trimStart()));
    });
  if (!lines.length) return;

  if (label) {
    w.ensureSpace(lh * 3 + pad * 2 + 6);
    w.setStyle(8, ACCENT, 'bold');
    w.doc.text(pdfSafe(label).toUpperCase(), w.margin, w.y);
    w.y += 3;
  }

  let i = 0;
  while (i < lines.length) {
    w.ensureSpace(pad * 2 + lh * Math.min(3, lines.length - i));
    const top = w.y - 3.5;
    const fit = Math.max(1, Math.floor((bottomOf(w) - top - pad * 2) / lh));
    const chunk = lines.slice(i, i + fit);
    const height = pad * 2 + chunk.length * lh - 1;
    w.doc.setFillColor(...CODE_BG);
    w.doc.setDrawColor(...DIVIDER);
    w.doc.setLineWidth(0.2);
    w.doc.roundedRect(w.margin, top, w.contentWidth, height, 1.5, 1.5, 'FD');
    w.doc.setFont('courier', 'normal');
    w.doc.setFontSize(size);
    w.doc.setTextColor(...CODE_TEXT);
    chunk.forEach((l, j) => w.doc.text(l, w.margin + pad, top + pad + 2.8 + j * lh));
    i += chunk.length;
    w.y = top + height + 3.5;
    if (i < lines.length) { w.doc.addPage(); w.y = w.margin; }
  }
  w.y += 4;
}

/** A styled grid table that matches the PdfWriter palette. */
export function markdownTable(w: PdfWriter, rows: string[][]) {
  if (!rows.length) return;
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill('')];
  const [head, ...body] = rows.map(pad);
  w.ensureSpace(24);
  autoTable(w.doc, {
    startY: w.y - 3,
    head: [head],
    body,
    theme: 'grid',
    margin: { left: w.margin, right: w.margin, top: w.margin, bottom: w.margin + 6 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      textColor: BODY,
      cellPadding: 2,
      lineColor: DIVIDER,
      lineWidth: 0.2,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: { fillColor: TABLE_HEAD_BG, textColor: HEADING, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: TABLE_STRIPE },
  });
  const finalY = (w.doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  w.y = (finalY ?? w.y) + 8;
}

/** Tinted box with an accent bar, for short highlighted statements. */
export function callout(
  w: PdfWriter,
  text: string,
  opts: { size?: number; style?: 'normal' | 'bold'; color?: RGB; title?: string } = {},
) {
  const body = pdfSafe(cleanInline(text));
  if (!body) return;
  const size = opts.size ?? 10.5;
  const lh = size * 0.5;
  const pad = 4;
  const innerX = w.margin + pad + 2;
  const innerWidth = w.contentWidth - pad * 2 - 2;
  w.setStyle(size, opts.color ?? HEADING, opts.style);
  const lines: string[] = w.doc.splitTextToSize(body, innerWidth);
  const titleHeight = opts.title ? 5.5 : 0;
  const height = pad * 2 + titleHeight + lines.length * lh;
  if (height > bottomOf(w) - w.margin) {
    // Too tall for one page: fall back to plain flowing text.
    if (opts.title) w.subHeading(opts.title, ACCENT, 10);
    w.text(body, { size, color: opts.color ?? HEADING, style: opts.style, after: 4 });
    return;
  }
  w.ensureSpace(height + 2);
  const top = w.y - 3.5;
  w.doc.setFillColor(...CALLOUT_BG);
  w.doc.roundedRect(w.margin, top, w.contentWidth, height, 1.5, 1.5, 'F');
  w.doc.setFillColor(...ACCENT);
  w.doc.rect(w.margin, top, 1.4, height, 'F');
  let y = top + pad + 3.2;
  if (opts.title) {
    w.setStyle(8, ACCENT, 'bold');
    w.doc.text(pdfSafe(opts.title).toUpperCase(), innerX, y);
    y += titleHeight;
  }
  w.setStyle(size, opts.color ?? HEADING, opts.style);
  lines.forEach((l, i) => w.doc.text(l, innerX, y + i * lh));
  w.y = top + height + 7;
}

const isTableLine = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isTableSeparator = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const splitRow = (l: string) =>
  l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => cleanInline(inlineCleanup(c.trim())));

export interface RichMarkdownOptions {
  /** Shift headings down so "#"/"##" render below the caller's own section titles. */
  demoteHeadings?: boolean;
  /** Drop a leading heading that just repeats this title. */
  dropTitle?: string;
}

/**
 * w.markdown() plus fenced code blocks, pipe tables, links and file trees.
 */
export function richMarkdown(w: PdfWriter, md: string, opts: RichMarkdownOptions = {}) {
  const src = (md || '').replace(/\r/g, '').split('\n');
  let buffer: string[] = [];
  let sawContent = false;
  const norm = (s: string) => cleanInline(s).toLowerCase().replace(/[^a-z0-9]/g, '');

  const flush = () => {
    if (buffer.some((l) => l.trim())) w.markdown(buffer.join('\n'));
    buffer = [];
  };

  for (let i = 0; i < src.length; i++) {
    const line = src[i];

    const fence = line.match(/^\s*(```|~~~)\s*([\w+#.-]*)/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < src.length && !src[i].trim().startsWith(fence[1])) code.push(src[i++]);
      flush();
      codeBox(w, code.join('\n'));
      sawContent = true;
      continue;
    }

    if (isTableLine(line) && i + 1 < src.length && isTableSeparator(src[i + 1])) {
      const rows = [splitRow(line)];
      i += 2;
      while (i < src.length && isTableLine(src[i])) rows.push(splitRow(src[i++]));
      i--;
      flush();
      w.y += 1;
      markdownTable(w, rows);
      sawContent = true;
      continue;
    }

    let out = inlineCleanup(line).replace(/^\s*>\s?/, '');
    const heading = out.match(/^\s*(#{1,6})\s+(.*)$/);
    if (heading) {
      if (!sawContent && opts.dropTitle && norm(heading[2]) === norm(opts.dropTitle)) continue;
      if (opts.demoteHeadings) {
        const level = heading[1].length <= 2 ? 3 : 4;
        out = `${'#'.repeat(level)} ${heading[2]}`;
      }
    }
    if (out.trim()) sawContent = true;
    buffer.push(out);
  }
  flush();
}
