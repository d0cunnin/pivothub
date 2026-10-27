import type jsPDF from 'jspdf';
import { PdfWriter, asText, cleanInline, pdfSafe, toList, ACCENT, BODY, HEADING, MUTED, type RGB } from '../pdfWriter';
import { headerWithTitle } from './scoreReportBlocks';

export interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'short-answer' | 'true-false' | string;
  prompt: string;
  options?: string[];
  answer: string;
  explanation?: string;
}

export interface QuizData {
  title: string;
  instructions: string;
  questions: QuizQuestion[];
}

const LINE = 5;
const ANSWER_LINE: RGB = [203, 213, 225];
const NUM_W = 9;
const OPT_INDENT = NUM_W + 2;

/** Strips an option's own "A." / "(b)" / "C)" prefix; we print letters ourselves. */
const stripLetter = (s: string) => s.replace(/^\s*\(?[A-Ha-h][.)]\s+/, '');

const letterOf = (i: number) => String.fromCharCode(65 + i);

function questionLayout(w: PdfWriter, q: QuizQuestion) {
  w.setStyle(10.5, HEADING, 'bold');
  const prompt: string[] = w.doc.splitTextToSize(cleanInline(asText(q.prompt)), w.contentWidth - NUM_W);
  w.setStyle(10, BODY);
  const options = toList(q.options).map((o) => cleanInline(stripLetter(o)));
  const optionLines = options.map((o) => w.doc.splitTextToSize(`${o}`, w.contentWidth - OPT_INDENT - 10) as string[]);
  const kind = q.type === 'multiple-choice' && options.length ? 'mc' : q.type === 'true-false' ? 'tf' : 'short';
  const bodyHeight =
    kind === 'mc' ? optionLines.reduce((h, l) => h + l.length * LINE + 1.5, 0) : kind === 'tf' ? LINE + 2 : 3 * 9 + 1;
  return { prompt, optionLines, kind, height: prompt.length * 5.25 + 3 + bodyHeight };
}

/** Builds a printable student quiz with the answer key on its own page(s). */
export function generateQuizPDF(quiz: QuizData): jsPDF {
  const w = new PdfWriter();
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  headerWithTitle(w, cleanInline(asText(quiz?.title)), 'Quiz', `${questions.length} question${questions.length === 1 ? '' : 's'}`);

  // Name and date lines for students.
  w.ensureSpace(12);
  w.setStyle(10, HEADING, 'bold');
  w.doc.text('Name', w.margin, w.y);
  w.doc.text('Date', w.margin + 112, w.y);
  w.doc.setDrawColor(...MUTED);
  w.doc.setLineWidth(0.3);
  w.doc.line(w.margin + 12, w.y + 0.8, w.margin + 102, w.y + 0.8);
  w.doc.line(w.margin + 122, w.y + 0.8, w.pageWidth - w.margin, w.y + 0.8);
  w.y += 12;

  const instructions = asText(quiz?.instructions);
  if (instructions) {
    w.subHeading('Instructions', ACCENT, 10.5);
    w.markdown(instructions);
    w.y += 4;
  }

  questions.forEach((q, index) => {
    const num = `${asText(q?.id) || index + 1}.`;
    const layout = questionLayout(w, q);
    // Keep a question with its answer choices when it fits on one page.
    w.ensureSpace(Math.min(layout.height, 120));

    w.setStyle(10.5, HEADING, 'bold');
    w.doc.text(num, w.margin, w.y);
    layout.prompt.forEach((line, i) => {
      if (i > 0) w.ensureSpace(5.25);
      w.setStyle(10.5, HEADING, 'bold');
      w.doc.text(line, w.margin + NUM_W, w.y);
      w.y += 5.25;
    });
    w.y += 2;

    if (layout.kind === 'mc') {
      layout.optionLines.forEach((lines, i) => {
        w.ensureSpace(lines.length * LINE);
        w.doc.setDrawColor(...MUTED);
        w.doc.setLineWidth(0.3);
        w.doc.circle(w.margin + OPT_INDENT + 1.6, w.y - 1.3, 1.6, 'S');
        w.setStyle(10, HEADING, 'bold');
        w.doc.text(`${letterOf(i)}.`, w.margin + OPT_INDENT + 5, w.y);
        w.setStyle(10, BODY);
        lines.forEach((line, j) => {
          if (j > 0) w.ensureSpace(LINE);
          w.doc.text(line, w.margin + OPT_INDENT + 10, w.y);
          w.y += LINE;
        });
        w.y += 1.5;
      });
    } else if (layout.kind === 'tf') {
      w.ensureSpace(LINE);
      w.doc.setDrawColor(...MUTED);
      w.doc.setLineWidth(0.3);
      ['True', 'False'].forEach((label, i) => {
        const x = w.margin + OPT_INDENT + i * 30;
        w.doc.circle(x + 1.6, w.y - 1.3, 1.6, 'S');
        w.setStyle(10, BODY);
        w.doc.text(label, x + 5, w.y);
      });
      w.y += LINE + 2;
    } else {
      for (let i = 0; i < 3; i++) {
        w.ensureSpace(9);
        w.y += 6;
        w.doc.setDrawColor(...ANSWER_LINE);
        w.doc.setLineWidth(0.3);
        w.doc.line(w.margin + OPT_INDENT, w.y, w.pageWidth - w.margin, w.y);
        w.y += 3;
      }
      w.y += 1;
    }
    w.y += 5;
  });

  // Answer key on its own page so the quiz pages can be handed out alone.
  if (questions.length) {
    w.doc.addPage();
    w.y = w.margin;
    w.section('Answer Key', 'For the teacher');
    questions.forEach((q, index) => {
      const num = `${asText(q?.id) || index + 1}.`;
      let answer = cleanInline(asText(q?.answer));
      const options = toList(q?.options).map((o) => cleanInline(stripLetter(o)));
      const letter = answer.match(/^\(?([A-Ha-h])[.)]?$/);
      if (q?.type === 'multiple-choice' && letter) {
        const opt = options[letter[1].toUpperCase().charCodeAt(0) - 65];
        if (opt) answer = `${letter[1].toUpperCase()}. ${opt}`;
      }
      w.setStyle(10, HEADING, 'bold');
      const answerLines: string[] = w.doc.splitTextToSize(pdfSafe(answer), w.contentWidth - NUM_W);
      w.ensureSpace(answerLines.length * LINE + (q?.explanation ? LINE : 0));
      w.doc.text(num, w.margin, w.y);
      answerLines.forEach((line, i) => {
        if (i > 0) w.ensureSpace(LINE);
        w.setStyle(10, HEADING, 'bold');
        w.doc.text(line, w.margin + NUM_W, w.y);
        w.y += LINE;
      });
      const explanation = cleanInline(asText(q?.explanation));
      if (explanation) w.text(explanation, { x: w.margin + NUM_W, size: 9.5, color: MUTED, after: 0 });
      w.y += 3.5;
    });
  }

  const title = asText(quiz?.title) || 'Quiz';
  w.footer(title.length > 70 ? `${title.slice(0, 67)}...` : title);
  return w.doc;
}
