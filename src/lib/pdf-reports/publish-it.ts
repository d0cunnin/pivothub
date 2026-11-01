import type jsPDF from 'jspdf';
import { PdfWriter } from '../pdfWriter';
import { wrappedHeader } from './toolReportBlocks';
import { richMarkdown } from './markdownBlocks';
import {
  AUDIOBOOK_CHECKLIST, BOTH_PLATFORMS_GUIDANCE, COPYRIGHT_CHECKLIST, COST_CATEGORIES, EBOOK_PLATFORMS, INGRAM_STEPS, KDP_STEPS,
  SOURCES, VERIFIED_FEES, VERIFIED_ON, type GuideStep, type SourceKey,
} from '../publishIt/content';
import { buildRoadmap, evaluateReadiness, hasPrint, type PublishProject } from '../publishIt/logic';

export type PublishItExport = 'plan' | 'checklist';

const link = (k: SourceKey) => `${SOURCES[k].label}: ${SOURCES[k].url}`;
const cell = (s: string) => s.replace(/\|/g, '/');

function steps(name: string, list: GuideStep[]): string {
  return `## ${name}\n\n` + list.map((s, i) =>
    `### Step ${i + 1}: ${s.title}\n\n${s.summary}\n\n${s.points.map((p) => `- ${p}`).join('\n')}\n\nOfficial resources: ${s.sources.map(link).join('; ')}`,
  ).join('\n\n');
}

/** Publishing plan and checklist PDFs (guidance only; no manuscript content). */
export function generatePublishItPDF(p: PublishProject, kind: PublishItExport): jsPDF {
  const a = p.assessment;
  const w = new PdfWriter();
  wrappedHeader(w, kind === 'plan' ? 'Publishing Plan' : 'Publishing Checklist',
    [a.book.title, a.book.author && `by ${a.book.author}`].filter(Boolean).join(' ') || 'Your book');

  const readiness = evaluateReadiness(a, p.progress.readiness);
  const tasks = buildRoadmap(a);
  const status = (id: string) => p.progress.tasks?.[id] ?? 'Not Started';
  const md: string[] = [];

  if (kind === 'checklist') {
    let stage = '';
    tasks.forEach((t) => {
      if (t.stage !== stage) { stage = t.stage; md.push(`## ${stage}`); }
      md.push(`- **${t.task}:** ${status(t.id)}${t.source ? `. ${link(t.source)}` : ''}`);
    });
    if (a.formats.includes('Audiobook')) md.push(`## Audiobook\n\n${AUDIOBOOK_CHECKLIST.map((c) => `- **${c}:** ${p.progress.audiobook?.[c] ? 'Done' : 'To do'}`).join('\n')}`);
    md.push(`## Copyright\n\n${COPYRIGHT_CHECKLIST.map((c) => `- **${c}:** ${p.progress.copyright?.[c] ? 'Done' : 'To do'}`).join('\n')}`);
  } else {
    md.push(`## Book Information\n\n| Item | Details |\n|---|---|\n${[
      ['Title', a.book.title], ['Subtitle', a.book.subtitle], ['Author', a.book.author], ['Category', a.book.category],
      ['Audience', a.book.audience], ['Imprint', a.book.imprint], ['Language', a.book.language],
      ['Formats', a.formats.join(', ')], ['Print platform', a.printPlatform === 'both' ? 'IngramSpark and KDP' : a.printPlatform === 'kdp' ? 'Amazon KDP' : a.printPlatform === 'ingramspark' ? 'IngramSpark' : ''],
      ['Goals', a.goals.join(', ')], ['ISBN status', a.isbnStatus], ['Copyright status', a.copyrightStatus],
      ['Budget', a.budgetUndetermined ? 'Not yet determined' : a.budget],
    ].filter(([, v]) => v).map(([k, v]) => `| ${k} | ${cell(String(v))} |`).join('\n')}`);
    if (a.book.description) md.push(`**Description:** ${a.book.description}`);
    md.push(`## Publishing Readiness\n\n| Item | Status | Why it matters |\n|---|---|---|\n${readiness.map((r) => `| ${r.label} | ${r.status} | ${cell(r.help)} |`).join('\n')}`);
    if (p.ai_summary) md.push(p.ai_summary);
    md.push(`## Your Publishing Roadmap\n\n${tasks.map((t) => `### ${t.stage}: ${t.task}\n\n**Status:** ${status(t.id)}\n\n${t.explanation} ${t.why}\n\n**How:** ${t.instructions}${t.source ? `\n\n**Official resource:** ${link(t.source)}` : ''}`).join('\n\n')}`);
    if (hasPrint(a)) {
      if (a.printPlatform === 'ingramspark' || a.printPlatform === 'both') md.push(steps('Print Publishing with IngramSpark', INGRAM_STEPS));
      if (a.printPlatform === 'kdp' || a.printPlatform === 'both') md.push(steps('Print Publishing with Amazon KDP', KDP_STEPS));
      if (a.printPlatform === 'both') md.push(`## Using IngramSpark and KDP Together\n\n${BOTH_PLATFORMS_GUIDANCE.map((g) => `- ${g}`).join('\n')}\n\nOfficial resource: ${link('ingramAndKdp')}`);
    }
    if (a.formats.includes('E-book')) {
      md.push(`## E-book Publishing\n\n${EBOOK_PLATFORMS.map((e) => `### ${e.name}\n\n${e.summary}\n\n${e.points.map((x) => `- ${x}`).join('\n')}\n\nOfficial resources: ${e.sources.map(link).join('; ')}`).join('\n\n')}`);
    }
    if (a.formats.includes('Audiobook')) md.push(`## Audiobook Checklist\n\n${AUDIOBOOK_CHECKLIST.map((c) => `- ${c}`).join('\n')}\n\nOfficial resources: ${link('acx')}; ${link('acxAudio')}`);
    if (p.isbn_records.length) {
      md.push(`## Your ISBN Records\n\n| ISBN | Title | Format | Imprint | Obtained | Status |\n|---|---|---|---|---|---|\n${p.isbn_records.map((r) => `| ${cell(r.isbn)} | ${cell(r.title)} | ${cell(r.format)} | ${cell(r.imprint)} | ${cell(r.obtained)} | ${cell(r.status)} |`).join('\n')}`);
    }
    const costs = COST_CATEGORIES.filter((c) => p.costs[c.key]);
    if (costs.length) {
      const total = costs.reduce((s, c) => s + (parseFloat(p.costs[c.key]) || 0), 0);
      md.push(`## Your Cost Estimate\n\n| Item | Type | Your estimate |\n|---|---|---|\n${costs.map((c) => `| ${c.label} | ${c.type} | $${cell(p.costs[c.key])} |`).join('\n')}\n| **Total** | | **$${total.toFixed(2)}** |\n\nThese are your own estimates, not quotes.`);
    }
    md.push(`## Official Fees Checked on ${VERIFIED_ON}\n\n${VERIFIED_FEES.map((f) => `- ${f.item}: ${f.amount} (${link(f.source)})`).join('\n')}\n\nFees and platform requirements change. Always confirm on the official pages before you pay or submit.`);
  }

  richMarkdown(w, md.join('\n\n'));
  w.footer(`Platform information last verified ${VERIFIED_ON}. Check official sites before submitting.`);
  return w.doc;
}
