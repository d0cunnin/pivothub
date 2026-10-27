import { PdfWriter, pdfSafe, cleanInline, ACCENT, BODY, DIVIDER, HEADING, MUTED, type RGB } from '../pdfWriter';

/**
 * Shared building blocks for the Schedule It, Fund It, Contract It and
 * Teach It PDFs. Everything flows through PdfWriter so pages break cleanly.
 */

const bottomLimit = (w: PdfWriter) => w.pageHeight - w.margin - 5;

/** Same look as PdfWriter.header, but long titles and subtitles wrap instead of running off the page. */
export function reportHeader(w: PdfWriter, title: string, subtitle: string) {
  w.setStyle(24, HEADING);
  const titleLines: string[] = w.doc.splitTextToSize(pdfSafe(title), w.contentWidth);
  titleLines.forEach((line, i) => w.doc.text(line, w.margin, w.y + i * 10));
  w.y += titleLines.length * 10;
  if (subtitle) {
    w.setStyle(10, MUTED);
    const subLines: string[] = w.doc.splitTextToSize(pdfSafe(subtitle), w.contentWidth);
    subLines.forEach((line, i) => w.doc.text(line, w.margin, w.y + i * 5));
    w.y += subLines.length * 5;
  }
  w.setStyle(8, MUTED);
  w.doc.text(`Generated: ${new Date().toLocaleDateString()}`, w.margin, w.y);
  w.y += 10;
  w.divider();
  w.y += 2;
}

const SMALL_WORDS = new Set(['and', 'or', 'of', 'the', 'a', 'an', 'to', 'in', 'for', 'on', 'at', 'by', 'with', 'vs']);
const COMMON_SHORT = new Set(['our', 'you', 'how', 'why', 'new', 'key', 'use', 'all', 'one', 'two', 'who', 'get', 'day', 'top', 'its', 'are', 'and', 'the', 'for', 'tips', 'plan', 'need', 'cost', 'goal', 'step', 'tool', 'your', 'week']);

/** "EXECUTIVE SUMMARY & KPIS" -> "Executive Summary & KPIs"-ish title case; keeps short acronyms. */
export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((word, i) => {
      if (/^\s+$/.test(word) || !word) return word;
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      // Keep likely acronyms (LMS, ROI, Q&A, K-12) upper case.
      const original = s.split(/(\s+)/)[i] ?? word;
      const core = original.replace(/[():,]/g, '');
      if (/^[A-Z0-9&/-]{2,5}$/.test(core) && core.replace(/[^A-Z]/g, '').length <= 3 && !COMMON_SHORT.has(word.replace(/[():,]/g, ''))) return original;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

export interface PlainTextOptions {
  /** Numbered lines like "3. Program Design" whose text matches this become headings. */
  numberedHeadings?: RegExp;
  /** Short standalone Title Case lines ("Executive Summary") become headings. */
  titleLineHeadings?: boolean;
}

/**
 * Turns AI output that is either plain text (ALL CAPS headings, "Label:" lines,
 * "•" bullets, separator rules) or markdown into markdown that PdfWriter.markdown
 * renders with headings no larger than a sub-heading, so it nests under a section.
 */
export function plainToMarkdown(text: string, opts: PlainTextOptions = {}): string {
  const out: string[] = [];
  let inFence = false;
  const all = text.replace(/\r/g, '').split('\n');
  for (let idx = 0; idx < all.length; idx++) {
    let line = all[idx].replace(/\s+$/, '');
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) { out.push(line); continue; }
    // Separator rules made of box-drawing or punctuation characters.
    // (Markdown "---" rules are kept; PdfWriter draws them as dividers.)
    if (/^\s*[═─━=~·•.]{3,}\s*$/.test(line)) continue;
    // Unicode bullets and check marks -> markdown bullets, keeping indentation.
    line = line.replace(/^(\s*)[•◦▪▸►‣○●■□✓✔☐➢➤→]\s*(?=\S)/, '$1- ');
    const trimmed = line.trim();
    if (!trimmed) { out.push(''); continue; }

    const md = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (md) {
      out.push(`${md[1].length <= 2 ? '###' : '####'} ${md[2]}`);
      continue;
    }

    const letters = trimmed.replace(/[^A-Za-z]/g, '');
    const isAllCaps =
      letters.length >= 3 &&
      trimmed.length <= 80 &&
      letters === letters.toUpperCase() &&
      !/^[-*+]\s/.test(trimmed) &&
      !/[.!?]$/.test(trimmed);
    if (isAllCaps) {
      const body = trimmed.replace(/^\d+[.)]\s*/, '').replace(/:\s*$/, '');
      out.push(`### ${titleCase(body)}`);
      continue;
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.+?):?$/);
    if (numbered && opts.numberedHeadings && opts.numberedHeadings.test(numbered[1]) && numbered[1].length <= 70 && !/[.!?]$/.test(numbered[1])) {
      out.push(`### ${cleanInline(numbered[1]).replace(/:$/, '')}`);
      continue;
    }

    if (opts.titleLineHeadings && !/^\s/.test(line)) {
      const words = trimmed.split(/\s+/);
      const prevBlank = idx === 0 || !all[idx - 1].trim();
      const next = all[idx + 1]?.trim() ?? '';
      if (
        prevBlank && next && !/^[-*+•]\s/.test(next) &&
        words.length <= 6 && !/[\d.,;!?]/.test(trimmed) &&
        words.every((wd) => /^[A-Z&(]/.test(wd) || SMALL_WORDS.has(wd.toLowerCase()))
      ) {
        out.push(`#### ${trimmed.replace(/:$/, '')}`);
        continue;
      }
    }

    // A short standalone "Something:" line acts as a small heading.
    if (
      !/^\s/.test(line) &&
      /^[A-Z][^:]{1,60}:$/.test(trimmed) &&
      trimmed.split(/\s+/).length <= 9 &&
      !/^(dear|to whom|hello|hi|greetings)\b/i.test(trimmed) &&
      !/^[-*+]\s/.test(trimmed)
    ) {
      out.push(`**${trimmed.replace(/\*\*/g, '').replace(/:$/, '')}**`);
      continue;
    }

    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export interface TableRow {
  cells: string[];
  bold?: boolean;
  muted?: boolean;
  shade?: RGB;
}

/**
 * A simple bordered table. Columns are given as width fractions; any column
 * listed in `rightAlign` is right aligned. Rows wrap and move to the next page
 * whole (with the header repeated) when they do not fit.
 */
export function drawTable(
  w: PdfWriter,
  header: string[],
  rows: TableRow[],
  opts: { widths?: number[]; rightAlign?: number[]; size?: number } = {},
) {
  const cols = Math.max(header.length, ...rows.map((r) => r.cells.length));
  if (!cols || !rows.length) return;
  const widths = (opts.widths && opts.widths.length === cols ? opts.widths : Array(cols).fill(1 / cols)).map((f) => f * w.contentWidth);
  const size = opts.size ?? 9.5;
  const lineHeight = size * 0.48;
  const padX = 2.5;
  const padY = 2.2;
  const right = new Set(opts.rightAlign ?? []);

  const layout = (cells: string[], bold: boolean) => {
    w.setStyle(size, BODY, bold ? 'bold' : 'normal');
    const wrapped = widths.map((cw, i) => w.doc.splitTextToSize(cleanInline(cells[i] ?? ''), cw - 2 * padX) as string[]);
    const height = Math.max(1, ...wrapped.map((l) => l.length)) * lineHeight + 2 * padY;
    return { wrapped, height };
  };

  const drawRow = (cells: string[], style: { bold: boolean; color: RGB; fill?: RGB }) => {
    const { wrapped, height } = layout(cells, style.bold);
    let x = w.margin;
    if (style.fill) {
      w.doc.setFillColor(...style.fill);
      w.doc.rect(w.margin, w.y, w.contentWidth, height, 'F');
    }
    w.doc.setDrawColor(...DIVIDER);
    w.doc.setLineWidth(0.25);
    w.doc.line(w.margin, w.y + height, w.margin + w.contentWidth, w.y + height);
    w.setStyle(size, style.color, style.bold ? 'bold' : 'normal');
    widths.forEach((cw, i) => {
      wrapped[i].forEach((line, li) => {
        const ty = w.y + padY + lineHeight * (li + 1) - lineHeight * 0.25;
        if (right.has(i)) w.doc.text(line, x + cw - padX, ty, { align: 'right' });
        else w.doc.text(line, x + padX, ty);
      });
      x += cw;
    });
    w.y += height;
  };

  const headerRow = () => {
    drawRow(header, { bold: true, color: [255, 255, 255], fill: ACCENT });
  };

  const firstHeight = layout(header, true).height + layout(rows[0].cells, !!rows[0].bold).height;
  w.ensureSpace(firstHeight + 2);
  if (header.length) headerRow();
  rows.forEach((row, i) => {
    const { height } = layout(row.cells, !!row.bold);
    if (w.y + height > bottomLimit(w)) {
      w.doc.addPage();
      w.y = w.margin;
      if (header.length) headerRow();
    }
    drawRow(row.cells, {
      bold: !!row.bold,
      color: row.muted ? MUTED : row.bold ? HEADING : BODY,
      fill: row.shade ?? (i % 2 === 1 ? [248, 250, 252] : undefined),
    });
  });
  w.y += 6;
}

/** Splits a markdown pipe-table row into trimmed cells. */
const pipeCells = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

const isPipeRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isPipeSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

const looksLikeAmount = (s: string) => /^\s*[-(]?\s*\$?\s*[\d,]+(\.\d+)?\s*%?\)?\s*$/.test(s.replace(/\*\*/g, ''));

/** Renders a markdown pipe table found in AI text. */
function renderPipeTable(w: PdfWriter, lines: string[]) {
  const body = lines.filter((l) => !isPipeSeparator(l));
  const hasHeader = lines.length > 1 && isPipeSeparator(lines[1]);
  const header = hasHeader ? pipeCells(body[0]) : [];
  const dataLines = hasHeader ? body.slice(1) : body;
  const rows: TableRow[] = dataLines.map((l) => {
    const cells = pipeCells(l);
    const total = /\b(total|amount requested)\b/i.test(cells[0] ?? '') || /^\s*\*\*.*\*\*\s*$/.test(cells[0] ?? '');
    return { cells, bold: total, shade: total ? [237, 242, 247] : undefined };
  });
  const cols = Math.max(header.length, ...rows.map((r) => r.cells.length));
  const rightAlign = Array.from({ length: cols }, (_, i) => i).filter(
    (i) => i > 0 && rows.length > 0 && rows.every((r) => !r.cells[i] || looksLikeAmount(r.cells[i])),
  );
  // Give text-heavy columns more room.
  const weights = Array.from({ length: cols }, (_, i) =>
    Math.max(10, (header[i] ?? '').length + 4, ...rows.map((r) => Math.min(60, (r.cells[i] ?? '').length))),
  );
  const sum = weights.reduce((a, b) => a + b, 0);
  drawTable(w, header, rows, { widths: weights.map((v) => v / sum), rightAlign });
}

/** Legacy "BUDGET SUMMARY ═══ ... AMOUNT REQUESTED: $X" block in grant text. */
function extractBudgetBlock(text: string): { before: string; rows: TableRow[]; after: string } | null {
  const start = text.match(/BUDGET SUMMARY\s*[\n\r]+[═─]+/i);
  if (!start || start.index === undefined) return null;
  const fromBudget = text.substring(start.index);
  const end = fromBudget.match(/AMOUNT REQUESTED:\s*\$[\d,]+/);
  if (!end || end.index === undefined) return null;
  const endIndex = start.index + end.index + end[0].length;
  const rows: TableRow[] = [];
  for (const line of text.substring(start.index, endIndex).split('\n')) {
    const t = line.trim();
    if (!t || /^[═─\s]+$/.test(t) || /BUDGET SUMMARY/.test(t) || (t.includes('Category') && t.includes('Amount'))) continue;
    const m =
      t.match(/^([A-Za-z\s()&/\-,]+?)\s{2,}(\$[\d,]+)$/) ||
      t.match(/^([A-Za-z\s()&/\-,]+?):\s*(\$[\d,]+)$/) ||
      t.match(/^([A-Za-z\s()&/\-,]+?)\s+(\$[\d,]+)$/);
    if (!m) continue;
    const category = m[1].trim();
    const isTotal = /TOTAL|AMOUNT REQUESTED/i.test(category);
    const isMatching = /Matching Funds|Less Matching/i.test(category);
    rows.push({ cells: [category, m[2]], bold: isTotal, muted: isMatching, shade: isTotal ? [237, 242, 247] : undefined });
  }
  if (!rows.length) return null;
  return { before: text.substring(0, start.index), rows, after: text.substring(endIndex) };
}

/**
 * Renders AI text (plain or markdown) under the current section: headings,
 * lists, paragraphs, markdown pipe tables and the legacy grant budget block.
 */
export function renderAiText(w: PdfWriter, text: string, opts: PlainTextOptions = {}) {
  if (!text || !text.trim()) return;
  const budget = extractBudgetBlock(text);
  if (budget) {
    renderAiText(w, budget.before, opts);
    w.subHeading('Budget Summary', HEADING, 12);
    drawTable(w, ['Category', 'Amount'], budget.rows, { widths: [0.65, 0.35], rightAlign: [1] });
    renderAiText(w, budget.after, opts);
    return;
  }

  const lines = text.replace(/\r/g, '').split('\n');
  let buffer: string[] = [];
  const flush = () => {
    const md = plainToMarkdown(buffer.join('\n'), opts);
    if (md) w.markdown(md);
    buffer = [];
  };
  for (let i = 0; i < lines.length; i++) {
    if (isPipeRow(lines[i]) && i + 1 < lines.length && (isPipeRow(lines[i + 1]) || isPipeSeparator(lines[i + 1]))) {
      const table: string[] = [];
      while (i < lines.length && (isPipeRow(lines[i]) || isPipeSeparator(lines[i]))) table.push(lines[i++]);
      i--;
      flush();
      w.y += 1;
      renderPipeTable(w, table);
      continue;
    }
    buffer.push(lines[i]);
  }
  flush();
}

/** A row of summary number tiles (value over label). */
export function statTiles(w: PdfWriter, tiles: { value: string; label: string; color?: RGB }[]) {
  if (!tiles.length) return;
  const gap = 4;
  const tileW = (w.contentWidth - gap * (tiles.length - 1)) / tiles.length;
  w.setStyle(8.5, MUTED);
  const labelLines = tiles.map((t) => w.doc.splitTextToSize(pdfSafe(t.label), tileW - 6) as string[]);
  const tileH = 13 + Math.max(...labelLines.map((l) => l.length)) * 4 + 2;
  w.ensureSpace(tileH + 4);
  tiles.forEach((t, i) => {
    const x = w.margin + i * (tileW + gap);
    w.doc.setFillColor(248, 250, 252);
    w.doc.setDrawColor(...DIVIDER);
    w.doc.setLineWidth(0.3);
    w.doc.roundedRect(x, w.y, tileW, tileH, 2, 2, 'FD');
    w.doc.setFillColor(...(t.color ?? ACCENT));
    w.doc.rect(x, w.y + 2, 1.2, tileH - 4, 'F');
    w.setStyle(17, t.color ?? HEADING, 'bold');
    w.doc.text(pdfSafe(t.value), x + 5, w.y + 10);
    w.setStyle(8.5, MUTED);
    labelLines[i].forEach((line, li) => w.doc.text(line, x + 5, w.y + 15.5 + li * 4));
  });
  w.y += tileH + 8;
}
