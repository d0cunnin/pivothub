import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { asText, cleanInline, pdfSafe, BODY, DIVIDER, HEADING, MUTED } from '../pdfWriter';
import { drawLogo, drawBrandFooter } from '../pdfBrand';
import { HEAD_FILL, ZEBRA_FILL, toNumber } from './scoreReportBlocks';

export interface RubricCriterion {
  name: string;
  weight: number;
  descriptors: Record<string, string>;
}

export interface RubricData {
  title: string;
  scale: string[];
  criteria: RubricCriterion[];
  totalPoints: number;
}

/**
 * Builds a landscape rubric grid. It mirrors PdfWriter's header, colors and
 * footer, but uses landscape pages so 3-5 score levels stay readable.
 */
export function generateRubricPDF(rubric: RubricData, opts: { gradeLevel?: string } = {}): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape' });
  const margin = 15;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  let y = margin + 4;

  const style = (size: number, color: [number, number, number], weight: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont('helvetica', weight);
  };

  // Header (same look as PdfWriter.header).
  drawLogo(doc, margin, y - 7, 7, 'light');
  y += 12;
  style(20, HEADING);
  const titleLines: string[] = doc.splitTextToSize(cleanInline(asText(rubric?.title)) || 'Scoring Rubric', contentW);
  titleLines.forEach((line, i) => doc.text(line, margin, y + i * 8.5));
  y += (titleLines.length - 1) * 8.5 + 7.5;
  const total = toNumber(rubric?.totalPoints);
  const criteria = Array.isArray(rubric?.criteria) ? rubric.criteria : [];
  const subtitle = [
    'Scoring rubric',
    asText(opts.gradeLevel),
    total !== null ? `Total: ${total} points` : '',
    `${criteria.length} criteria`,
  ].filter(Boolean).join('  |  ');
  style(10, MUTED);
  doc.text(pdfSafe(subtitle), margin, y);
  y += 5;
  style(8, MUTED);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 5;
  doc.setDrawColor(...DIVIDER);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const scale = Array.isArray(rubric?.scale) ? rubric.scale.map((s) => asText(s)) : [];
  const criterionW = scale.length >= 5 ? 40 : 46;
  const weightW = 18;
  const levelW = (contentW - criterionW - weightW) / Math.max(1, scale.length);

  autoTable(doc, {
    startY: y,
    head: [['Criterion', 'Weight', ...scale.map(pdfSafe)]],
    body: criteria.map((c) => {
      const weight = toNumber(c?.weight);
      const descriptors = c?.descriptors && typeof c.descriptors === 'object' ? c.descriptors : {};
      return [
        cleanInline(asText(c?.name)),
        weight !== null ? `${weight}%` : cleanInline(asText(c?.weight)),
        ...scale.map((s) => cleanInline(asText((descriptors as Record<string, string>)[s])) || '-'),
      ];
    }),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: scale.length >= 5 ? 8.5 : 9,
      cellPadding: 2.6,
      textColor: BODY,
      lineColor: DIVIDER,
      lineWidth: 0.25,
      valign: 'top',
      overflow: 'linebreak',
    },
    headStyles: { fillColor: HEAD_FILL, textColor: HEADING, fontStyle: 'bold', fontSize: 9.5 },
    alternateRowStyles: { fillColor: ZEBRA_FILL },
    columnStyles: {
      0: { cellWidth: criterionW, fontStyle: 'bold', textColor: HEADING },
      1: { cellWidth: weightW, halign: 'center', textColor: MUTED },
      ...Object.fromEntries(scale.map((_, i) => [i + 2, { cellWidth: levelW }])),
    },
    rowPageBreak: 'avoid',
    margin: { left: margin, right: margin, top: margin, bottom: 20 },
  });

  drawBrandFooter(doc, { note: pdfSafe(asText(rubric?.title) || 'Scoring rubric').slice(0, 120), margin });
  return doc;
}
