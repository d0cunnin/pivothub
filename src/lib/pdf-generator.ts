import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { asText, toList, type RGB, HEADING, BODY, MUTED, ACCENT, DIVIDER, PRO, CON } from './pdfWriter';

export interface SideIncomeReportPDF {
  executive_summary?: string;
  skills_analysis?: any;
  recommended_paths?: Array<{
    rank?: number;
    title: string;
    description: string;
    whyRecommended?: string;
    startup_cost: string;
    time_commitment: string;
    income_potential: any;
    timeToFirstDollar?: string;
    steps: string[];
    pros?: string[];
    cons?: string[];
  }>;
  immediate_actions?: string[];
  quickWinOpportunities?: string[];
  resources?: any;
  ninety_day_plan?: any;
}


export function generateSideIncomeReportPDF(report: SideIncomeReportPDF): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  // Leave room for the page footer.
  const bottomLimit = pageHeight - margin - 5;
  let y = 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > bottomLimit) {
      doc.addPage();
      y = margin;
    }
  };

  const setStyle = (size: number, color: RGB, style: 'normal' | 'bold' = 'normal') => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont('helvetica', style);
  };

  // Writes wrapped text line by line so long blocks break cleanly across pages.
  const writeText = (
    text: string,
    opts: { x?: number; width?: number; size?: number; color?: RGB; style?: 'normal' | 'bold'; after?: number } = {},
  ) => {
    if (!text) return;
    const x = opts.x ?? margin;
    const size = opts.size ?? 10;
    const lineHeight = size * 0.5;
    setStyle(size, opts.color ?? BODY, opts.style);
    const lines: string[] = doc.splitTextToSize(text, opts.width ?? contentWidth - (x - margin));
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, x, y);
      y += lineHeight;
    });
    y += opts.after ?? 2;
  };

  const sectionHeading = (title: string, subtitle?: string) => {
    ensureSpace(subtitle ? 30 : 24);
    setStyle(16, HEADING);
    doc.text(title, margin, y);
    y += 8;
    if (subtitle) {
      setStyle(10, MUTED);
      doc.text(subtitle, margin, y);
      y += 8;
    }
  };

  const subHeading = (title: string, color: RGB = HEADING, size = 11) => {
    ensureSpace(14);
    setStyle(size, color, 'bold');
    doc.text(title, margin, y);
    y += 6;
  };

  const bulletList = (items: string[], indent = 5, size = 10) => {
    items.forEach((item) => {
      // The AI sometimes prefixes items with its own bullet; avoid "• •".
      const text = item.replace(/^\s*(?:[•*]|-(?=\s))\s*/, '');
      writeText(`• ${text}`, { x: margin + indent, size, after: 2 });
    });
  };

  const badge = (label: string, x: number, width: number) => {
    doc.setFillColor(...ACCENT);
    doc.roundedRect(x, y - 5, width, 8, 2, 2, 'F');
    setStyle(10, [255, 255, 255], 'bold');
    doc.text(label, x + width / 2, y, { align: 'center' });
  };

  // HEADER
  setStyle(24, HEADING);
  doc.text('Your Earn It Blueprint', margin, y);
  y += 10;
  setStyle(10, MUTED);
  doc.text('Personalized Side Income Strategy', margin, y);
  y += 5;
  setStyle(8, MUTED);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, y);
  y += 10;
  doc.setDrawColor(...DIVIDER);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // EXECUTIVE SUMMARY
  const summary = asText(report.executive_summary);
  if (summary) {
    sectionHeading('Executive Summary');
    writeText(summary, { after: 8 });
  }

  // SKILLS ANALYSIS
  const sa = report.skills_analysis;
  if (sa) {
    sectionHeading('Skills Analysis');
    if (typeof sa === 'string') {
      writeText(asText(sa), { after: 8 });
    } else if (typeof sa === 'object') {
      const blocks: [string, any][] = [
        ['Marketable Skills', sa.marketableSkills],
        ['Undervalued Skills', sa.undervaluedSkills],
        ['Quick Monetization', sa.quickMonetization],
        ['Skill Gaps to Develop', sa.skillGaps],
        ['Learning Priority', sa.learningPriority],
      ];
      blocks.forEach(([label, value]) => {
        const items = toList(value);
        if (items.length === 0) return;
        subHeading(label);
        bulletList(items);
        y += 2;
      });
      y += 4;
    }
  }

  // RECOMMENDED PATHS
  const paths = Array.isArray(report.recommended_paths) ? report.recommended_paths : [];
  if (paths.length > 0) {
    sectionHeading('Recommended Income Paths');
  }
  paths.forEach((path, index) => {
    // Keep the title with at least the start of its description.
    ensureSpace(30);

    setStyle(14, HEADING, 'bold');
    const titleLines: string[] = doc.splitTextToSize(asText(path.title) || `Path ${index + 1}`, contentWidth - 24);
    badge(`#${asText(path.rank) || index + 1}`, margin, 18);
    setStyle(14, HEADING, 'bold');
    titleLines.forEach((line, i) => doc.text(line, margin + 24, y + i * 6));
    y += titleLines.length * 6 + 3;

    writeText(asText(path.description), { after: 4 });

    if (path.whyRecommended) {
      subHeading('Why this fits you', ACCENT, 10);
      writeText(asText(path.whyRecommended), { after: 4 });
    }

    const rows: string[][] = [
      ['Startup Cost', asText(path.startup_cost)],
      ['Time Commitment', asText(path.time_commitment)],
    ];
    const income = path.income_potential;
    if (income && typeof income === 'object' && !Array.isArray(income)) {
      const timeline: [string, any][] = [
        ['Income - Month 1', income.month1],
        ['Income - Month 3', income.month3],
        ['Income - Month 6', income.month6],
        ['Income - Year 1', income.year1],
      ];
      timeline.forEach(([label, v]) => {
        if (v) rows.push([label, asText(v)]);
      });
    } else if (income) {
      rows.push(['Income Potential', asText(income)]);
    }
    if (path.timeToFirstDollar) rows.push(['Time to First Dollar', asText(path.timeToFirstDollar)]);

    ensureSpace(20);
    autoTable(doc, {
      startY: y,
      body: rows.filter(([, v]) => v),
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2.5, textColor: BODY, font: 'helvetica' },
      columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold', textColor: HEADING } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: margin, right: margin, bottom: margin + 5 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    const steps = toList(path.steps);
    if (steps.length > 0) {
      subHeading('Getting Started', ACCENT, 11);
      steps.forEach((step, i) => writeText(`${i + 1}. ${step}`, { x: margin + 5, size: 9.5, after: 1.5 }));
      y += 3;
    }

    const pros = toList(path.pros);
    if (pros.length > 0) {
      subHeading('Pros', PRO, 10);
      bulletList(pros, 5, 9.5);
      y += 2;
    }
    const cons = toList(path.cons);
    if (cons.length > 0) {
      subHeading('Cons', CON, 10);
      bulletList(cons, 5, 9.5);
      y += 2;
    }

    if (index < paths.length - 1) {
      ensureSpace(12);
      doc.setDrawColor(...DIVIDER);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
    } else {
      y += 6;
    }
  });

  // IMMEDIATE ACTIONS
  const actions = toList(report.immediate_actions);
  if (actions.length > 0) {
    sectionHeading('Immediate Actions', 'Start these today to build momentum');
    actions.forEach((action) => {
      ensureSpace(10);
      doc.setDrawColor(...ACCENT);
      doc.rect(margin, y - 3, 4, 4);
      writeText(action, { x: margin + 8, after: 4 });
    });
    y += 6;
  }

  // QUICK WINS
  const quickWins = toList(report.quickWinOpportunities);
  if (quickWins.length > 0) {
    sectionHeading('Quick Win Opportunities', 'Fastest paths to your first dollar');
    bulletList(quickWins);
    y += 8;
  }

  // 90-DAY PLAN
  const plan = report.ninety_day_plan;
  const months = [
    { key: 'month_1', title: 'Foundation Building' },
    { key: 'month_2', title: 'Growth & Optimization' },
    { key: 'month_3', title: 'Scale & Expand' },
  ];
  if (plan && months.some((m) => plan[m.key])) {
    sectionHeading('90-Day Implementation Plan');
    months.forEach((month, monthIndex) => {
      const monthData = plan[month.key];
      if (!monthData) return;

      ensureSpace(30);
      badge(`Month ${monthIndex + 1}`, margin, 24);
      setStyle(12, HEADING, 'bold');
      doc.text(month.title, margin + 30, y);
      y += 9;

      let weekly: string[] = [];
      if (Array.isArray(monthData)) {
        weekly = toList(monthData);
      } else if (typeof monthData === 'object') {
        if (monthData.goal) {
          writeText(`Goal: ${asText(monthData.goal)}`, { x: margin + 5, size: 9.5, color: HEADING, style: 'bold', after: 3 });
        }
        weekly = toList(monthData.weeklyActions ?? monthData.actions);
      } else {
        weekly = toList(monthData);
      }
      bulletList(weekly, 5, 9.5);
      y += 6;
    });
  }

  // RESOURCES
  const resources = report.resources;
  if (resources) {
    const categories: [string, any][] = Array.isArray(resources)
      ? resources.map((c: any) => [asText(c?.category) || 'Resources', c?.items])
      : typeof resources === 'object'
        ? [
            ['Platforms', resources.platforms],
            ['Learning Resources', resources.learningResources],
            ['Tools', resources.tools],
            ['Communities', resources.communities],
          ]
        : [['Resources', resources]];
    const nonEmpty = categories.filter(([, items]) => toList(items).length > 0);
    if (nonEmpty.length > 0) {
      sectionHeading('Resources & Tools');
      nonEmpty.forEach(([label, items]) => {
        subHeading(label, ACCENT, 12);
        bulletList(toList(items), 5, 9.5);
        y += 3;
      });
    }
  }

  // FOOTER on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setStyle(8, [156, 163, 175]);
    doc.text(`Generated by PivotHub | Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  return doc;
}
