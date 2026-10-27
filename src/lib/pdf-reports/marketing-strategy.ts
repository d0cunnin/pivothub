import type jsPDF from 'jspdf';
import { PdfWriter, asText, toList, ACCENT, MUTED } from '../pdfWriter';
import { mdBullets, safeHeader } from './helpers';

export interface MarketingPhasePDF {
  phase: string;
  timeline: string;
  objectives: string[];
  tactics: string[];
  budget: string;
  metrics: string[];
}

export interface MarketingStrategyPDFInput {
  businessType: string;
  targetMarket: string;
  budget: string;
  goals: string;
  currentStage: string;
  strategy: MarketingPhasePDF[];
}

export const MARKETING_DISCLAIMER =
  'This marketing strategy is provided for educational and planning purposes only. PivotHub does not guarantee specific results, revenue, or ROI. Success depends on proper implementation, market conditions, budget allocation, and external factors beyond our control. All projections are hypothetical. Individual results may vary.';

export function generateMarketingStrategyPDF(input: MarketingStrategyPDFInput): jsPDF {
  const w = new PdfWriter();
  const business = asText(input.businessType);
  safeHeader(w, 'Marketing Strategy', business || 'Your marketing plan');

  w.section('Your Business at a Glance');
  w.facts([
    ['Business', business],
    ['Target market', asText(input.targetMarket)],
    ['Budget', asText(input.budget)],
    ['Current stage', asText(input.currentStage)],
    ['Primary goals', asText(input.goals)],
  ]);
  w.y += 4;

  const phases = Array.isArray(input.strategy) ? input.strategy : [];
  phases.forEach((phase, index) => {
    const name = asText(phase?.phase).replace(/^\s*phase\s*\d+\s*[:.-]?\s*/i, '').trim();
    w.ensureSpace(60); // keep the phase title with its first list
    w.section(`Phase ${index + 1}${name ? `: ${name}` : ''}`);
    w.facts([
      ['Timeline', asText(phase?.timeline)],
      ['Budget allocation', asText(phase?.budget)],
    ]);

    const groups: [string, any][] = [
      ['Objectives', phase?.objectives],
      ['Marketing tactics', phase?.tactics],
      ['How to measure success', phase?.metrics],
    ];
    groups.forEach(([title, value]) => {
      const items = toList(value);
      if (!items.length) return;
      w.subHeading(title, ACCENT, 10.5);
      mdBullets(w, items);
      w.y += 3;
    });

    if (index < phases.length - 1) w.divider();
  });

  w.y += 4;
  w.text('Please note', { size: 9.5, color: MUTED, style: 'bold', after: 1 });
  w.text(MARKETING_DISCLAIMER, { size: 8.5, color: MUTED });

  w.footer('For educational and planning purposes only. Results are not guaranteed.');
  return w.doc;
}
