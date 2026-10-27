import type jsPDF from 'jspdf';
import { PdfWriter, asText, ACCENT } from '../pdfWriter';
import { callout } from './markdownBlocks';

export interface BusinessFoundationResults {
  vision: string;
  mission: string;
  values: string;
  pillars: string;
  goals: string;
  objectives: string;
  problemStatement: string;
  solution: string;
  targetAudience: string;
  idealCustomerProfile: string;
  marketSize: string;
  businessModel: string;
  goToMarketStrategy: string;
}

type Key = keyof BusinessFoundationResults;

const GROUPS: { title: string; subtitle: string; items: { key: Key; title: string; highlight?: boolean }[] }[] = [
  {
    title: 'Who You Are',
    subtitle: 'The purpose and principles behind your business',
    items: [
      { key: 'vision', title: 'Vision Statement', highlight: true },
      { key: 'mission', title: 'Mission Statement', highlight: true },
      { key: 'values', title: 'Core Values' },
      { key: 'pillars', title: 'Strategic Pillars' },
    ],
  },
  {
    title: "Where You're Going",
    subtitle: 'What you want to achieve',
    items: [
      { key: 'goals', title: 'Business Goals' },
      { key: 'objectives', title: 'Key Objectives' },
    ],
  },
  {
    title: 'The Opportunity',
    subtitle: 'The problem you solve and the market for it',
    items: [
      { key: 'problemStatement', title: 'Problem Statement' },
      { key: 'solution', title: 'Solution' },
      { key: 'marketSize', title: 'Market Size' },
    ],
  },
  {
    title: 'Your Customers',
    subtitle: 'Who you serve',
    items: [
      { key: 'targetAudience', title: 'Target Audience' },
      { key: 'idealCustomerProfile', title: 'Ideal Customer Profile' },
    ],
  },
  {
    title: "How You'll Grow",
    subtitle: 'How you make money and reach customers',
    items: [
      { key: 'businessModel', title: 'Business Model' },
      { key: 'goToMarketStrategy', title: 'Go-to-Market Strategy' },
    ],
  },
];

/** "Integrity: We do..." -> "**Integrity:** We do..." so the label prints bold. */
const labelize = (s: string) => {
  const m = s.match(/^([A-Z][^:.!?]{1,40}):\s+(\S.*)$/);
  return m ? `**${m[1]}:** ${m[2]}` : s;
};

/**
 * Foundation text is plain prose that may contain "•" or "1." items, sometimes
 * run together on one line. Several short standalone lines (the sanitizer strips
 * list numbers) read best as a list.
 */
function foundationToMarkdown(text: string): string {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .flatMap((line) => line.split(/\s+(?=•\s)/))
    .map((line) => line.trim())
    .filter(Boolean);
  const asList = lines.length >= 2 && lines.every((l) => l.length <= 200 && !/^\*\*/.test(l));
  return lines
    .map((line, i) => {
      const item = line.match(/^(?:[•*]|-(?=\s))\s*(.*)$/);
      if (item) return `- ${labelize(item[1])}`;
      const num = line.match(/^(\d+[.)])\s+(.*)$/);
      if (num) return `${num[1]} ${labelize(num[2])}`;
      if (asList) return `- ${labelize(line)}`;
      return `${i > 0 ? '\n' : ''}${labelize(line)}`;
    })
    .join('\n');
}

export function generateBusinessFoundationPDF(results: BusinessFoundationResults, businessName: string): jsPDF {
  const w = new PdfWriter();
  w.header(asText(businessName) || 'Your Business', 'Business Foundation');

  GROUPS.forEach((group) => {
    const items = group.items.filter(({ key }) => asText(results?.[key]).trim());
    if (!items.length) return;
    w.section(group.title, group.subtitle);
    items.forEach(({ key, title, highlight }) => {
      const content = asText(results[key]).trim();
      if (highlight && !/\n|•/.test(content)) {
        callout(w, content, { title, size: 11 });
        return;
      }
      w.subHeading(title, ACCENT, 11);
      w.markdown(foundationToMarkdown(content));
      w.y += 4;
    });
    w.y += 4;
  });

  w.footer('');
  return w.doc;
}
