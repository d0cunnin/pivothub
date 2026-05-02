import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface SideIncomeReportPDF {
  executive_summary: string;
  skills_analysis: any;
  recommended_paths: Array<{
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
  immediate_actions: string[];
  quickWinOpportunities?: string[];
  resources: any;
  ninety_day_plan: any;
}

export function generateSideIncomeReportPDF(report: SideIncomeReportPDF): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // HEADER
  doc.setFontSize(24);
  doc.setTextColor(45, 55, 72);
  doc.text('Your Earn It Blueprint', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Personalized Side Income Strategy', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition += 15;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // EXECUTIVE SUMMARY
  checkPageBreak(40);
  doc.setFontSize(16);
  doc.setTextColor(45, 55, 72);
  doc.text('Executive Summary', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  const summaryLines = doc.splitTextToSize(report.executive_summary, pageWidth - 2 * margin);
  doc.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 10;

  // SKILLS ANALYSIS
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setTextColor(45, 55, 72);
  doc.text('Skills Analysis', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  const sa = report.skills_analysis;
  const writeSkillsBlock = (label: string, value: any) => {
    if (!value) return;
    const items = Array.isArray(value) ? value : [String(value)];
    if (items.length === 0) return;
    checkPageBreak(15);
    doc.setFontSize(11);
    doc.setTextColor(45, 55, 72);
    doc.text(label, margin, yPosition);
    yPosition += 6;
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    items.forEach((it: any) => {
      const text = typeof it === 'string' ? it : JSON.stringify(it);
      const lines = doc.splitTextToSize(`• ${text}`, pageWidth - 2 * margin - 5);
      checkPageBreak(lines.length * 5 + 2);
      doc.text(lines, margin + 5, yPosition);
      yPosition += lines.length * 5 + 2;
    });
    yPosition += 4;
  };

  if (typeof sa === 'string') {
    const skillsLines = doc.splitTextToSize(sa, pageWidth - 2 * margin);
    doc.text(skillsLines, margin, yPosition);
    yPosition += skillsLines.length * 5 + 15;
  } else if (sa && typeof sa === 'object') {
    writeSkillsBlock('Marketable Skills', sa.marketableSkills);
    writeSkillsBlock('Undervalued Skills', sa.undervaluedSkills);
    writeSkillsBlock('Quick Monetization', sa.quickMonetization);
    writeSkillsBlock('Skill Gaps to Develop', sa.skillGaps);
    writeSkillsBlock('Learning Priority', sa.learningPriority);
    yPosition += 5;
  }

  // RECOMMENDED PATHS
  report.recommended_paths.forEach((path, index) => {
    checkPageBreak(80);

    // Path Header
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(margin, yPosition - 5, 20, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`#${index + 1}`, margin + 5, yPosition);

    doc.setFontSize(14);
    doc.setTextColor(45, 55, 72);
    doc.text(path.title, margin + 25, yPosition);
    yPosition += 10;

    // Description
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    const descLines = doc.splitTextToSize(path.description, pageWidth - 2 * margin);
    doc.text(descLines, margin, yPosition);
    yPosition += descLines.length * 5 + 8;

    // Key Metrics Table
    const incomeText = typeof path.income_potential === 'string' 
      ? path.income_potential 
      : path.income_potential?.year1 || path.income_potential?.month1 || 'Varies';

    autoTable(doc, {
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Startup Cost', path.startup_cost],
        ['Time Commitment', path.time_commitment],
        ['Income Potential', incomeText]
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [241, 245, 249], textColor: [45, 55, 72], fontStyle: 'bold' },
      margin: { left: margin, right: margin }
    });
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Getting Started Steps
    if (path.steps?.length > 0) {
      checkPageBreak(40);
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text('Getting Started:', margin, yPosition);
      yPosition += 7;

      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      path.steps.forEach((step, stepIndex) => {
        checkPageBreak(10);
        const stepLines = doc.splitTextToSize(`${stepIndex + 1}. ${step}`, pageWidth - 2 * margin - 10);
        doc.text(stepLines, margin + 5, yPosition);
        yPosition += stepLines.length * 5 + 3;
      });
      yPosition += 10;
    }

    // Separator before next path
    if (index < report.recommended_paths.length - 1) {
      checkPageBreak(10);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
    }
  });

  // IMMEDIATE ACTIONS
  doc.addPage();
  yPosition = margin;

  doc.setFontSize(16);
  doc.setTextColor(45, 55, 72);
  doc.text('Immediate Actions', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('Start these today to build momentum', margin, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  report.immediate_actions.forEach((action) => {
    checkPageBreak(15);
    doc.setDrawColor(59, 130, 246);
    doc.rect(margin, yPosition - 3, 4, 4);
    
    const actionLines = doc.splitTextToSize(action, pageWidth - 2 * margin - 10);
    doc.text(actionLines, margin + 8, yPosition);
    yPosition += actionLines.length * 5 + 5;
  });
  yPosition += 10;

  // 90-DAY PLAN
  checkPageBreak(60);
  doc.setFontSize(16);
  doc.setTextColor(45, 55, 72);
  doc.text('90-Day Implementation Plan', margin, yPosition);
  yPosition += 10;

  const months = [
    { key: 'month_1', label: 'Month 1: Foundation Building' },
    { key: 'month_2', label: 'Month 2: Growth & Optimization' },
    { key: 'month_3', label: 'Month 3: Scale & Expand' }
  ];

  months.forEach((month, monthIndex) => {
    const monthData = report.ninety_day_plan?.[month.key];
    if (!monthData) return;

    checkPageBreak(50);

    doc.setFillColor(59, 130, 246);
    doc.roundedRect(margin, yPosition - 5, 25, 8, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Month ${monthIndex + 1}`, margin + 3, yPosition);

    doc.setFontSize(12);
    doc.setTextColor(45, 55, 72);
    doc.text(month.label.split(': ')[1], margin + 30, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    
    if (Array.isArray(monthData)) {
      monthData.forEach((action: string) => {
        checkPageBreak(10);
        const actionLines = doc.splitTextToSize(`▸ ${action}`, pageWidth - 2 * margin - 5);
        doc.text(actionLines, margin + 5, yPosition);
        yPosition += actionLines.length * 5 + 3;
      });
    }
    yPosition += 8;
  });

  // RESOURCES
  if (report.resources) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setTextColor(45, 55, 72);
    doc.text('Resources & Tools', margin, yPosition);
    yPosition += 10;

    if (Array.isArray(report.resources)) {
      report.resources.forEach((category: any) => {
        checkPageBreak(20);
        
        doc.setFontSize(12);
        doc.setTextColor(59, 130, 246);
        doc.text(category.category, margin, yPosition);
        yPosition += 6;

        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        if (Array.isArray(category.items)) {
          category.items.forEach((item: string) => {
            checkPageBreak(7);
            doc.text(`• ${item}`, margin + 5, yPosition);
            yPosition += 5;
          });
        }
        yPosition += 5;
      });
    }
  }

  // FOOTER on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Generated by PivotHub | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
}
