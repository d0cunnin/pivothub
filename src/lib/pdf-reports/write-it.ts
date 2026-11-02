import type jsPDF from 'jspdf';
import { PdfWriter } from '../pdfWriter';
import { wrappedHeader } from './toolReportBlocks';
import { richMarkdown } from './markdownBlocks';
import { groupByPart, type WriteItProject } from '../writeIt';

export type WriteItExport = 'plan' | 'toc' | 'outlines' | 'roadmap';

const TITLES: Record<WriteItExport, string> = {
  plan: 'Book Development Plan',
  toc: 'Table of Contents',
  outlines: 'Chapter Outlines',
  roadmap: 'Writing Roadmap',
};

const bulletList = (items?: string[]) => (items ?? []).filter(Boolean).map((i) => `- ${i}`).join('\n');

function conceptMarkdown(p: WriteItProject): string {
  const c = p.plan.concept ?? {};
  return [
    p.plan.understanding && `## Our Understanding of Your Book\n\n${p.plan.understanding}`,
    `## Book Concept`,
    c.refinedConcept && `**Refined concept:** ${c.refinedConcept}`,
    c.centralTheme && `**Central theme:** ${c.centralTheme}`,
    c.purposeStatement && `**Purpose:** ${c.purposeStatement}`,
    c.intendedAudience && `**Intended audience:** ${c.intendedAudience}`,
    c.readerNeeds?.length && `**What readers need**\n\n${bulletList(c.readerNeeds)}`,
    c.mainMessage && `**Main message:** ${c.mainMessage}`,
    c.readerOutcomes?.length && `**What readers will take away**\n\n${bulletList(c.readerOutcomes)}`,
    c.organizingApproach && `**How to organize the subject:** ${c.organizingApproach}`,
    p.plan.structure?.type && `## Recommended Structure\n\n**${p.plan.structure.type}**\n\n${p.plan.structure.explanation ?? ''}`,
    p.plan.gaps?.length && `**To strengthen the plan, consider clarifying:**\n\n${bulletList(p.plan.gaps)}`,
  ].filter(Boolean).join('\n\n');
}

function tocMarkdown(p: WriteItProject): string {
  let n = 0;
  return groupByPart(p.chapters, p.plan.parts).map((g) => {
    const lines = g.chapters.map((c) => { n += 1; return `${n}. **${c.title}**${c.summary ? ` - ${c.summary}` : ''}`; });
    return `${g.part ? `### ${g.part}\n\n` : ''}${lines.join('\n')}`;
  }).join('\n\n');
}

function outlinesMarkdown(p: WriteItProject): string {
  return p.chapters.map((c, i) =>
    `## Chapter ${i + 1}: ${c.title}\n\n${c.part ? `*${c.part}*\n\n` : ''}${c.outline || '_Outline not created yet._'}`,
  ).join('\n\n');
}

/** PDF exports of Write It planning materials (never manuscript text). */
export function generateWriteItPDF(p: WriteItProject, kind: WriteItExport): jsPDF {
  const w = new PdfWriter();
  const title = p.plan.selectedTitle || p.inputs.title || p.project_name;
  const subtitle = [p.plan.selectedSubtitle || p.inputs.subtitle, p.inputs.author && `by ${p.inputs.author}`, p.inputs.category].filter(Boolean).join('  |  ');
  wrappedHeader(w, TITLES[kind], [title, subtitle].filter(Boolean).join('  -  ') || 'Your book');

  const parts: string[] = [];
  if (kind === 'plan') {
    parts.push(conceptMarkdown(p));
    if (p.chapters.length) parts.push(`## Table of Contents\n\n${tocMarkdown(p)}`);
    if (p.chapters.some((c) => c.outline)) parts.push(outlinesMarkdown(p));
    if (p.roadmap.text) parts.push(`## Writing Roadmap\n\n${p.roadmap.text}`);
  } else if (kind === 'toc') {
    parts.push(tocMarkdown(p) || '_No chapters yet._');
  } else if (kind === 'outlines') {
    parts.push(outlinesMarkdown(p));
  } else {
    parts.push(p.roadmap.text || '_No roadmap yet._');
  }
  richMarkdown(w, parts.join('\n\n'));
  w.footer('Planning materials from PivotHub Write It. You write the book.');
  return w.doc;
}
