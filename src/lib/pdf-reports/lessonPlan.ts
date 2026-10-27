import type jsPDF from 'jspdf';
import { PdfWriter, asText, cleanInline } from '../pdfWriter';
import { headerWithTitle, markdownWithTables } from './scoreReportBlocks';

export interface LessonPlanInfo {
  subject?: string;
  gradeLevel?: string;
  duration?: string;
}

/** Builds the lesson plan PDF from the AI's markdown. */
export function generateLessonPlanPDF(content: string, info: LessonPlanInfo = {}): jsPDF {
  const w = new PdfWriter();
  // Raw string, not asText(): asText collapses the indentation of nested lists.
  let md = (typeof content === 'string' ? content : asText(content)).replace(/^\s*```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/, '');

  // Use the AI's own "# Title" as the page title when it gives one.
  let title = '';
  const titleMatch = md.match(/^\s*#\s+(.+)\n/);
  if (titleMatch) {
    title = cleanInline(titleMatch[1]);
    md = md.slice(titleMatch[0].length);
  }
  const subject = asText(info.subject);
  const subtitle = [subject, asText(info.gradeLevel), asText(info.duration)].filter(Boolean).join('  |  ');
  headerWithTitle(w, title || (subject ? `${subject} Lesson Plan` : ''), 'Lesson Plan', subtitle || 'Lesson plan');

  markdownWithTables(w, md.trim());

  w.footer(subject ? `${subject} lesson plan` : 'Lesson plan');
  return w.doc;
}
