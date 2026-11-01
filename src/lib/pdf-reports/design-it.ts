import type jsPDF from 'jspdf';
import { PdfWriter, MUTED } from '../pdfWriter';
import { wrappedHeader } from './toolReportBlocks';
import { richMarkdown } from './markdownBlocks';
import { categoryById } from '../designIt/categories';
import { latestOf, userSpecifications, type DesignProject, type DesignVersion } from '../designIt/logic';

export interface PdfImage { label: string; dataUrl: string; format: string }

const list = (title: string, items?: string[]) => (items?.length ? `### ${title}\n\n${items.map((x) => `- ${x}`).join('\n')}` : '');
const cell = (s: string) => s.replace(/\|/g, '/').replace(/\n+/g, ' ');

/**
 * Design summary PDF built only from saved content (no AI call, no credits).
 * User-provided specifications and AI suggestions are kept in separate sections.
 */
export function generateDesignItPDF(p: DesignProject, versions: DesignVersion[], images: PdfImage[]): jsPDF {
  const w = new PdfWriter();
  wrappedHeader(w, 'Design Summary', `${p.project_name} · ${categoryById(p.brief.category).name}`);

  const summary = latestOf(versions, ['summary']);
  const concept = latestOf(versions, ['concept', 'refinement']);
  const directions = versions.filter((v) => v.kind === 'directions');
  const sel = p.selected_direction;
  const direction = sel ? directions.find((v) => v.id === sel.versionId)?.content?.directions?.[sel.index] : null;
  const md: string[] = [];

  const notice = summary?.content?.notice || concept?.content?.notice;
  if (notice) md.push(`**Important:** ${notice}`);

  md.push(`## Your Specifications (from your brief)\n\n| Item | You said |\n|---|---|\n${userSpecifications(p.brief).map(([k, v]) => `| ${k} | ${cell(v)} |`).join('\n')}`);

  if (direction) md.push(`## Selected Creative Direction: ${direction.name}\n\n${direction.concept}\n\n${list('Distinguishing features', direction.features)}`);

  if (summary) {
    const s = summary.content;
    md.push(`## AI Design Suggestions (summary, based on version ${s.basedOn ?? ''})\n\n${s.finalConcept}`);
    md.push(list('Design objectives', s.objectives));
    if (s.palette?.length) md.push(`### Suggested color palette\n\n| Color | HEX | Use |\n|---|---|---|\n${s.palette.map((c: any) => `| ${cell(c.name)} | ${c.hex || 'to choose'} | ${cell(c.use)} |`).join('\n')}`);
    md.push(list('Suggested materials and components', s.materials));
    md.push(list('Suggested specifications to confirm', s.specifications));
    md.push(list('Functional considerations', s.functional));
    md.push(list('Outstanding design questions', s.outstandingQuestions));
    md.push(list('Suggested next steps', s.nextSteps));
  } else if (concept) {
    const c = concept.content;
    md.push(`## AI Design Concept (version ${concept.version_number})\n\n${c.overview}\n\n${c.creativeDirection ?? ''}`);
    md.push(list('Design objectives', c.objectives));
    md.push(list('Key design elements', c.keyElements));
    md.push(list('Suggested materials or components', c.materials));
    md.push(list('Functional considerations', c.functional));
    md.push(list('Potential challenges', c.challenges));
  }

  richMarkdown(w, md.filter(Boolean).join('\n\n'));

  if (images.length) {
    w.section('Visual References', 'AI-generated concept visuals. Not to scale; confirm details before production.');
    images.forEach((img) => {
      try {
        const props = w.doc.getImageProperties(img.dataUrl);
        const width = Math.min(w.contentWidth, 150);
        const height = (props.height / props.width) * width;
        w.ensureSpace(height + 10);
        w.doc.addImage(img.dataUrl, img.format, w.margin, w.y, width, height);
        w.y += height + 3;
        w.text(img.label, { size: 9, color: MUTED, after: 6 });
      } catch {
        w.text(`${img.label} (could not be added to the PDF; download it from Design It)`, { size: 9, color: MUTED });
      }
    });
  }

  w.footer('Generated with Design It on pivothub.io. AI suggestions are a starting point; verify before you build or produce.');
  return w.doc;
}
