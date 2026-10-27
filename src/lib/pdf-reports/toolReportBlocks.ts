import { PdfWriter, asText, pdfSafe, cleanInline, BODY, DIVIDER, HEADING, MUTED } from '../pdfWriter';

const CODE_BG: [number, number, number] = [243, 244, 246];
const CODE_TEXT: [number, number, number] = [31, 41, 55];
const BOX_BG: [number, number, number] = [248, 250, 252];

// Mirrors PdfWriter's bottom limit (page height minus margin and footer room).
const bottomLimit = (w: PdfWriter) => w.pageHeight - w.margin - 5;

/** Splits one line of monospace text into chunks of at most `max` characters, preferring spaces. */
function wrapMono(line: string, max: number): string[] {
  if (line.length <= max) return [line];
  const indent = (line.match(/^\s*/)?.[0] ?? '').slice(0, Math.floor(max / 2));
  const out: string[] = [];
  let rest = line;
  let first = true;
  while (rest.length) {
    const prefix = first ? '' : `${indent}  `;
    const room = Math.max(8, max - prefix.length);
    if (rest.length <= room) { out.push(prefix + rest); break; }
    let cut = rest.lastIndexOf(' ', room);
    if (cut <= room * 0.4) cut = room;
    out.push(prefix + rest.slice(0, cut).replace(/\s+$/, ''));
    rest = rest.slice(cut).replace(/^\s+/, '');
    first = false;
  }
  return out;
}

/**
 * Draws pre-formatted lines inside a tinted box. The box continues on the
 * next page when the text does not fit, so long blocks never run off a page.
 */
type BoxLine = { text: string; bold?: boolean };

function drawBox(
  w: PdfWriter,
  lines: BoxLine[],
  opts: { font: 'courier' | 'helvetica'; size: number; bg: [number, number, number]; color: [number, number, number]; border?: boolean },
) {
  const pad = 3.5;
  const lineHeight = opts.size * 0.48;
  const setFont = (bold?: boolean) => {
    w.doc.setFont(opts.font, bold ? 'bold' : 'normal');
    w.doc.setFontSize(opts.size);
    w.doc.setTextColor(...opts.color);
  };
  w.y += 1;
  let i = 0;
  while (i < lines.length) {
    // Start a new page when not even two lines (or the whole short box) fit.
    const minLines = Math.min(2, lines.length - i);
    if (w.y + pad * 2 + lineHeight * minLines > bottomLimit(w)) {
      w.doc.addPage();
      w.y = w.margin;
    }
    const fit = Math.max(1, Math.floor((bottomLimit(w) - w.y - pad * 2 + 1) / lineHeight));
    const chunk = lines.slice(i, i + fit);
    const top = w.y - 1;
    const height = chunk.length * lineHeight + pad * 2 - 1.5;
    w.doc.setFillColor(...opts.bg);
    if (opts.border) {
      w.doc.setDrawColor(...DIVIDER);
      w.doc.setLineWidth(0.3);
      w.doc.roundedRect(w.margin, top, w.contentWidth, height, 1.5, 1.5, 'FD');
    } else {
      w.doc.roundedRect(w.margin, top, w.contentWidth, height, 1.5, 1.5, 'F');
    }
    let ty = top + pad + opts.size * 0.35;
    chunk.forEach((line) => {
      setFont(line.bold);
      if (line.text) w.doc.text(line.text, w.margin + pad, ty);
      ty += lineHeight;
    });
    w.y = top + height + 1;
    i += chunk.length;
  }
  w.doc.setFont('helvetica', 'normal');
  // Room for the next line's ascenders (the box ends at the bottom edge).
  w.y += 6;
}

/** A light gray box with code in Courier, wrapped to the page width. */
export function codeBlock(w: PdfWriter, code: string, opts: { size?: number } = {}) {
  const size = opts.size ?? 8.5;
  const text = keepSpacesSafe(code.replace(/\r/g, '').replace(/\t/g, '  ')).replace(/^\n+|\s+$/g, '');
  if (!text) return;
  w.doc.setFont('courier', 'normal');
  w.doc.setFontSize(size);
  const charWidth = w.doc.getTextWidth('M');
  const maxChars = Math.max(20, Math.floor((w.contentWidth - 7) / charWidth));
  const lines = text.split('\n').flatMap((line) => wrapMono(line, maxChars)).map((t) => ({ text: t }));
  drawBox(w, lines, { font: 'courier', size, bg: CODE_BG, color: CODE_TEXT });
}

/**
 * Text the reader may copy as-is (e.g. a prompt), shown in a soft bordered box.
 * Markdown markers are removed but line structure is kept.
 */
export function quoteBlock(w: PdfWriter, text: string, opts: { size?: number } = {}) {
  const size = opts.size ?? 10;
  const source = text.replace(/\r/g, '').replace(/^\n+|\s+$/g, '');
  if (!source) return;
  w.doc.setFont('helvetica', 'normal');
  w.doc.setFontSize(size);
  const lines: BoxLine[] = [];
  const blank = () => !lines.length || lines[lines.length - 1].text === '';
  source.split('\n').forEach((raw) => {
    if (/^\s*```/.test(raw)) return;
    const bold = /^\s*#{1,6}\s+/.test(raw) || /^\s*\*\*[^*]+\*\*:?\s*$/.test(raw);
    let line = raw
      .replace(/^\s*#{1,6}\s+/, '')
      .replace(/^(\s*)[*+-]\s+/, '$1• ')
      .replace(/^\s*>\s?/, '');
    line = line.trim() ? cleanInline(line) : '';
    if (!line) { if (!blank()) lines.push({ text: '' }); return; }
    w.doc.setFont('helvetica', bold ? 'bold' : 'normal');
    (w.doc.splitTextToSize(line, w.contentWidth - 7) as string[]).forEach((t) => lines.push({ text: t, bold }));
  });
  while (lines.length && lines[lines.length - 1].text === '') lines.pop();
  drawBox(w, lines, { font: 'helvetica', size, bg: BOX_BG, color: HEADING, border: true });
}

const isAllCaps = (s: string) => /[A-Z]/.test(s) && !/[a-z]/.test(s);

const KEEP_UPPER = new Set(['MVP', 'PR', 'SEO', 'ROI', 'KPI', 'MRR', 'ARR', 'CAC', 'LTV', 'PMF', 'GMV', 'AI', 'API', 'B2B', 'B2C', 'FAQ', 'USP', 'CTA', 'UX', 'UI', 'LLC', 'EIN', 'US', 'USA', 'CRM', 'GTM', 'Q1', 'Q2', 'Q3', 'Q4']);
const SMALL_WORDS = new Set(['and', 'or', 'of', 'the', 'to', 'for', 'in', 'on', 'a', 'an', 'with', 'by', 'vs']);

function titleCaseCaps(s: string, first: boolean): string {
  return s
    .toLowerCase()
    .split(/(\s+)/)
    .map((word, i) => {
      const bare = word.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (KEEP_UPPER.has(bare)) return word.toUpperCase();
      if (bare === 'KPIS') return word.replace(/kpis/i, 'KPIs');
      if (bare === 'SAAS') return word.replace(/saas/i, 'SaaS');
      if ((i > 0 || !first) && SMALL_WORDS.has(word)) return word;
      return word.replace(/[a-z]/, (c) => c.toUpperCase());
    })
    .join('');
}

/**
 * "3. MARKETING & CUSTOMER ACQUISITION" -> "3. Marketing & Customer Acquisition".
 * Only ALL-CAPS text outside parentheses is changed; acronyms stay upper case.
 */
export function friendlyCase(s: string): string {
  if (!isAllCaps(s.replace(/\([^)]*\)/g, ''))) return s;
  return s
    .split(/(\([^)]*\))/)
    .map((part, i) => (part.startsWith('(') && !isAllCaps(part) ? part : titleCaseCaps(part, i === 0)))
    .join('');
}

/**
 * Turns the loosely formatted text AI tools return (markdown mixed with
 * "=====" banners, "•" / "□" bullets, ALL-CAPS headings, "Label:" lines,
 * blockquotes and tables) into the markdown subset PdfWriter.markdown() renders.
 */
export function normalizeAiMarkdown(input: string): string {
  const src = input.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  const isBanner = (l: string | undefined) => !!l && /^\s*[=_~]{3,}\s*$/.test(l);
  for (let i = 0; i < src.length; i++) {
    let line = src[i].replace(/\s+$/, '');

    if (isBanner(line)) continue;
    // A title framed by "=====" lines above and below.
    if (isBanner(src[i - 1]) && isBanner(src[i + 1]) && line.trim()) {
      out.push('', `## ${friendlyCase(cleanInline(line.trim()))}`, '');
      continue;
    }

    // Markdown table rows.
    if (/^\s*\|.*\|\s*$/.test(line)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue;
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()).filter(Boolean);
      if (!cells.length) continue;
      const header = /^\s*\|[\s:|-]+\|\s*$/.test(src[i + 1] ?? '');
      if (header) out.push(`**${cells.map((c) => cleanInline(c)).join('  |  ')}**`);
      else out.push(cells.length > 1 ? `- **${cleanInline(cells[0])}:** ${cells.slice(1).join('  |  ')}` : `- ${cells[0]}`);
      continue;
    }

    // Blockquotes become plain paragraphs.
    line = line.replace(/^(\s*)>\s?/, '$1');
    // Unicode bullets and check boxes become list items.
    line = line.replace(/^(\s*)[•●▪◦▸►□☐☑✓✔]\s*/, '$1- ');
    // GitHub task list boxes ("- [ ] Do it") print as plain list items.
    line = line.replace(/^(\s*(?:[*+-]|\d+[.)])\s+)\[[ xX]\]\s*/, '$1');

    const trimmed = line.trim();
    if (!trimmed) { out.push(''); continue; }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      out.push(`${heading[1]} ${friendlyCase(heading[2].replace(/\*\*/g, '').replace(/:\s*$/, ''))}`);
      continue;
    }

    // ALL-CAPS standalone lines are headings ("3. MARKETING STRATEGY", "FOUNDATION PHASE (...)").
    const plain = trimmed.replace(/\*\*/g, '');
    if (isAllCaps(plain.replace(/\([^)]*\)/g, '')) && plain.length <= 90 && !/^[-*+]\s/.test(plain) && /[A-Z]{3,}/.test(plain)) {
      const level = /^\d+[.)]\s/.test(plain) ? '##' : '###';
      out.push('', `${level} ${friendlyCase(plain.replace(/:\s*$/, ''))}`);
      continue;
    }

    // A short "Something:" line on its own introduces the lines below it.
    if (/^[A-Z][^.!?]{1,60}:$/.test(plain) && !/https?:/.test(plain) && plain.split(' ').length <= 8) {
      out.push(`**${plain.replace(/:$/, '')}**`);
      continue;
    }

    out.push(line);
  }
  return out.join('\n');
}

/**
 * Numbered list item whose number is 10 or more: PdfWriter leaves only 5mm for
 * a list marker, so "10." would overlap the text. Draw the number right-aligned
 * in the marker column instead and let richParagraph place the text.
 */
function wideNumberedItem(w: PdfWriter, depthIndent: number, marker: string, text: string) {
  const x = w.margin + depthIndent;
  w.ensureSpace(10);
  w.setStyle(10, BODY);
  w.doc.text(marker, x + 3.4, w.y, { align: 'right' });
  w.richParagraph(text, { indent: depthIndent + 5, after: 1.5 });
}

/** Renders normalized markdown, handling two-digit list numbers itself. */
function renderMarkdown(w: PdfWriter, md: string) {
  const buffer: string[] = [];
  const flush = () => {
    if (buffer.some((l) => l.trim())) w.markdown(buffer.join('\n'));
    buffer.length = 0;
  };
  md.split('\n').forEach((line) => {
    const item = line.match(/^(\s*)(\d{2,})[.)]\s+(.*)$/);
    if (!item) { buffer.push(line); return; }
    const blankBefore = buffer.length > 0 && !buffer[buffer.length - 1].trim();
    flush();
    if (blankBefore) w.y += 1.5;
    const depth = Math.min(3, Math.floor(item[1].replace(/\t/g, '    ').length / 2));
    wideNumberedItem(w, 4 + depth * 6, `${item[2]}.`, item[3]);
  });
  flush();
}

/**
 * Renders AI text: fenced code blocks become code boxes, everything else goes
 * through PdfWriter.markdown() so no markdown symbols are printed. With
 * `demote`, "#" and "##" headings become sub-headings, for text that sits
 * under a section heading of its own.
 */
export function renderAiText(w: PdfWriter, text: string, opts: { demote?: boolean } = {}) {
  const parts = text.replace(/\r/g, '').split(/^[ \t]*```[^\n]*$/m);
  parts.forEach((part, i) => {
    if (i % 2 === 1) { codeBlock(w, part); return; }
    if (!part.trim()) return;
    let md = normalizeAiMarkdown(part);
    if (opts.demote) md = md.replace(/^(\s*)#{1,2}(?=\s)/gm, '$1###');
    renderMarkdown(w, keepSpacesSafe(md));
  });
}

/** pdfSafe that keeps newlines and runs of spaces (indentation matters for code and nested lists). */
export const keepSpacesSafe = (s: string) =>
  s.split(/(\s+)/).map((part) => (/^\s+$/.test(part) ? part : pdfSafe(part))).join('');

/** Small grey note under the header, e.g. "This file is not stored". */
export function note(w: PdfWriter, text: string) {
  w.text(pdfSafe(text), { size: 8.5, color: MUTED, after: 6 });
}

/**
 * Like asText, but leaves strings untouched so indentation (nested lists,
 * code) survives until rendering; renderAiText/codeBlock make it PDF-safe.
 */
export const rawText = (v: unknown): string => (typeof v === 'string' ? v : asText(v));

/**
 * PdfWriter.header() with wrapping: user-supplied titles and subtitles can be
 * long, and header() draws them on a single line.
 */
export function wrappedHeader(w: PdfWriter, title: string, subtitle: string) {
  w.setStyle(24, HEADING);
  const titleLines: string[] = w.doc.splitTextToSize(pdfSafe(title), w.contentWidth);
  w.setStyle(10, MUTED);
  const subLines: string[] = w.doc.splitTextToSize(pdfSafe(subtitle), w.contentWidth);
  if (titleLines.length === 1 && subLines.length === 1) {
    w.header(title, subtitle);
    return;
  }
  w.logo();
  w.setStyle(24, HEADING);
  titleLines.forEach((line, i) => w.doc.text(line, w.margin, w.y + i * 10));
  w.y += titleLines.length * 10;
  w.setStyle(10, MUTED);
  subLines.forEach((line, i) => w.doc.text(line, w.margin, w.y + i * 5));
  w.y += subLines.length * 5;
  w.setStyle(8, MUTED);
  w.doc.text(`Generated: ${new Date().toLocaleDateString()}`, w.margin, w.y);
  w.y += 10;
  w.divider();
  w.y += 2;
}
