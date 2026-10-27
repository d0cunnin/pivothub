import type jsPDF from 'jspdf';
import { PdfWriter, asText, pdfSafe, cleanInline, ACCENT, HEADING, BODY, MUTED, PRO, CON, type RGB } from '../pdfWriter';
import { drawBrandFooter } from '../pdfBrand';
import { labeledRows, thinRule, stripMarker, note } from './helpers';

export interface ResumeAnalysisPDF {
  overallScore: number;
  issues: {
    category: string;
    severity: string;
    description: string;
    suggestion: string;
    location: string;
  }[];
  improvedBulletPoints: { original: string; improved: string; explanation: string }[];
  improvedSummary?: { original: string; improved: string; explanation: string } | null;
}

const AMBER: RGB = [217, 119, 6];
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function severityStyle(severity: string): { label: string; color: RGB } {
  const s = asText(severity).toLowerCase();
  if (s === 'high') return { label: 'High priority', color: CON };
  if (s === 'medium') return { label: 'Medium priority', color: AMBER };
  if (s === 'low') return { label: 'Low priority', color: ACCENT };
  return { label: capitalize(s), color: MUTED };
}

/** The "Download PDF Guide" report built from the resume analysis. */
export function generateResumeGuidePDF(analysis: ResumeAnalysisPDF): jsPDF {
  const w = new PdfWriter();
  w.header('Resume Optimization Guide', 'PivotHub Professional Career Services');

  // Score
  const score = Number(analysis?.overallScore);
  w.section('Your Resume Score');
  w.ensureSpace(14);
  const scoreText = Number.isFinite(score) ? `${score}/100` : asText(analysis?.overallScore);
  w.badge(scoreText, 26);
  const verdict = !Number.isFinite(score) ? ''
    : score >= 85 ? 'Strong resume. A few finishing touches below.'
    : score >= 70 ? 'Good foundation. The changes below will make it stand out.'
    : 'Room to grow. Start with the high-priority fixes below.';
  w.setStyle(10, BODY);
  w.doc.text(pdfSafe(verdict || 'Overall score'), w.margin + 31, w.y);
  w.y += 12;

  // Issues
  const issues = Array.isArray(analysis?.issues) ? analysis.issues : [];
  if (issues.length) {
    w.section('What to Fix', 'Issues found in your resume');
    issues.forEach((issue, i) => {
      const sev = severityStyle(issue?.severity);
      w.ensureSpace(26);
      w.setStyle(11, HEADING, 'bold');
      const title = `${i + 1}. ${capitalize(asText(issue?.category))}`;
      w.doc.text(pdfSafe(title), w.margin, w.y);
      const tw = w.doc.getTextWidth(pdfSafe(title));
      if (sev.label) {
        w.setStyle(9, sev.color, 'bold');
        w.doc.text(pdfSafe(sev.label), w.margin + tw + 4, w.y);
      }
      w.y += 6;
      labeledRows(w, [
        { label: 'Issue', value: asText(issue?.description) },
        { label: 'How to fix', value: asText(issue?.suggestion) },
        { label: 'Where', value: asText(issue?.location), valueColor: MUTED },
      ]);
      if (i < issues.length - 1) thinRule(w, 1, 6);
    });
    w.y += 6;
  }

  // Bullet point rewrites
  const bullets = Array.isArray(analysis?.improvedBulletPoints) ? analysis.improvedBulletPoints : [];
  if (bullets.length) {
    w.ensureSpace(70);
    w.section('Stronger Bullet Points', 'Before and after examples');
    bullets.forEach((item, i) => {
      w.ensureSpace(40); // keep each before/after pair together
      w.subHeading(`Example ${i + 1}`, ACCENT, 10.5);
      labeledRows(w, [
        { label: 'Before', value: asText(item?.original), labelColor: MUTED, valueColor: MUTED },
        { label: 'After', value: asText(item?.improved), labelColor: PRO, valueColor: HEADING, bold: true },
        { label: 'Why', value: asText(item?.explanation) },
      ]);
      if (i < bullets.length - 1) thinRule(w, 1, 6);
    });
    w.y += 6;
  }

  // Summary
  const summary = analysis?.improvedSummary;
  if (summary && (summary.original || summary.improved || summary.explanation)) {
    w.ensureSpace(50);
    w.section('Professional Summary Upgrade');
    labeledRows(w, [
      { label: 'Before', value: asText(summary.original), labelColor: MUTED, valueColor: MUTED },
      { label: 'After', value: asText(summary.improved), labelColor: PRO, valueColor: HEADING, bold: true },
      { label: 'Why', value: asText(summary.explanation) },
    ]);
  }

  w.footer('Resume Optimization Guide - PivotHub Professional Career Services');
  return w.doc;
}

/** A cover letter laid out as a clean business letter. */
export function generateCoverLetterPDF(opts: {
  letter: string;
  yourName?: string;
  jobTitle?: string;
  companyName?: string;
}): jsPDF {
  const w = new PdfWriter();
  w.y = 25;
  w.logo();
  const name = asText(opts.yourName).trim();
  if (name) {
    w.text(name, { size: 18, color: HEADING, style: 'bold', after: 1 });
    w.doc.setDrawColor(...ACCENT);
    w.doc.setLineWidth(0.6);
    w.doc.line(w.margin, w.y, w.margin + 24, w.y);
    w.doc.setLineWidth(0.2);
    w.y += 10;
  }

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  w.text(date, { size: 10.5, after: 6 });

  const company = asText(opts.companyName).trim();
  if (company) {
    w.text('Hiring Manager', { size: 10.5, after: 0.5 });
    w.text(company, { size: 10.5, after: 6 });
  }
  const job = asText(opts.jobTitle).trim();
  if (job) w.text(`Re: ${job} position`, { size: 10.5, color: HEADING, style: 'bold', after: 6 });

  asText(opts.letter)
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+$/gm, '').trim())
    .filter(Boolean)
    .forEach((para) => w.text(para, { size: 10.5, after: 4.5 }));

  drawBrandFooter(w.doc, { margin: w.margin });
  return w.doc;
}

const isHeadingLine = (line: string) => {
  const t = line.trim();
  if (/^#{1,6}\s+/.test(t)) return true;
  if (t.length > 45 || t.length < 3) return false;
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 3 && letters === letters.toUpperCase() && !/[.,;]$/.test(t)) return true;
  return /^[A-Za-z][A-Za-z &/-]{1,40}:$/.test(t) && t.split(/\s+/).length <= 5;
};

const isContactLine = (line: string) =>
  line.length <= 120 && (/@|\||linkedin|github|https?:|www\./i.test(line) || /\d{3}[\s.)-]*\d{3}[\s.-]*\d{4}/.test(line));

/** The resume text as a clean document: name, contact line, headings, bullets. */
export function generateResumePDF(resumeText: string): jsPDF {
  const w = new PdfWriter();
  w.y = 22;
  w.logo();
  const lines = asText(resumeText).replace(/\r/g, '').split('\n');
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;

  // Name and contact block at the top.
  const first = lines[i]?.trim() ?? '';
  if (first && first.length <= 60 && !/^\s*(?:[•*-]|\d+[.)])\s/.test(first) && !isContactLine(first)) {
    w.text(cleanInline(first.replace(/^#+\s*/, '')), { size: 18, color: HEADING, style: 'bold', after: 1.5 });
    i++;
    while (i < lines.length && lines[i].trim() && isContactLine(lines[i].trim())) {
      w.text(cleanInline(lines[i].trim()), { size: 9.5, color: MUTED, after: 0.5 });
      i++;
    }
    w.y += 3;
  }

  let blank = false;
  for (; i < lines.length; i++) {
    const line = lines[i].replace(/\s+$/, '');
    if (!line.trim()) { blank = true; continue; }
    const gap = blank ? 1.5 : 0;
    blank = false;

    if (isHeadingLine(line)) {
      w.y += 3;
      w.ensureSpace(16);
      const title = cleanInline(line.trim().replace(/^#+\s*/, '').replace(/:$/, '')).toUpperCase();
      w.setStyle(10.5, ACCENT, 'bold');
      w.doc.text(title, w.margin, w.y);
      w.y += 1.8;
      thinRule(w, 0, 5);
      continue;
    }

    const item = line.match(/^(\s*)([•*+-]|\d+[.)])\s+(.*)$/);
    if (item) {
      const depth = Math.min(2, Math.floor(item[1].length / 2));
      w.y += gap;
      w.richParagraph(stripMarker(item[3]), { indent: 3 + depth * 5, marker: depth ? '-' : '•', after: 1.2 });
      continue;
    }

    w.y += gap;
    w.richParagraph(line.trim(), { after: 1.5 });
  }

  if (w.y === 22) note(w, 'No resume text was provided.');
  drawBrandFooter(w.doc, { margin: w.margin });
  return w.doc;
}
