import type jsPDF from 'jspdf';
import { PdfWriter, asText, toList, ACCENT, PRO, CON, HEADING } from './pdfWriter';

export interface CareerInterestArea {
  title: string;
  percentage: number;
  level: string;
}

/**
 * Builds the Career Assessment PDF from the AI analysis returned by the
 * career-assessment edge function. `analysis` may be null when the AI step
 * failed; the report then contains only the interest-area scores.
 */
export function generateCareerReportPDF(analysis: any | null, topAreas: CareerInterestArea[]): jsPDF {
  const w = new PdfWriter();
  w.header('Your Career Assessment Results', 'Personalized career recommendations');

  const summary = asText(analysis?.summary);
  if (summary) {
    w.section('Summary');
    w.text(summary, { after: 6 });
  }

  if (topAreas.length > 0) {
    w.section('Your Top Interest Areas', 'Based on your answers');
    w.facts(topAreas.map((a, i) => [`#${i + 1} ${asText(a.title)}`, `${Math.round(a.percentage)}% - ${asText(a.level)}`]));
    w.y += 2;
  }

  const careers: any[] = Array.isArray(analysis?.recommendations) ? analysis.recommendations.slice(0, 5) : [];
  if (careers.length > 0) {
    w.section('Recommended Careers', 'Ranked by how well each fits you');
    careers.forEach((career, index) => {
      w.ensureSpace(30);
      w.badge(`#${index + 1}`, 18);
      w.setStyle(13, HEADING, 'bold');
      const fit = typeof career?.fitScore === 'number' ? `  (${career.fitScore}% fit)` : '';
      const titleLines: string[] = w.doc.splitTextToSize(asText(career?.title) + fit, w.contentWidth - 24);
      titleLines.forEach((line, i) => w.doc.text(line, w.margin + 24, w.y + i * 6));
      w.y += titleLines.length * 6 + 3;

      w.text(asText(career?.description), { after: 3 });
      if (career?.whyGoodFit) {
        w.subHeading('Why it fits you', ACCENT, 10);
        w.text(asText(career.whyGoodFit), { after: 3 });
      }

      w.facts([
        ['Salary range', asText(career?.salaryRange)],
        ['Job outlook', asText(career?.marketOutlook)],
        ['Time to switch', asText(career?.transitionTime)],
        ['Remote work', asText(career?.remoteWorkPotential)],
        ['Education', asText(career?.education)],
      ]);

      const have = toList(career?.skillsTheyHave);
      if (have.length) {
        w.subHeading('Skills you already have', PRO, 10);
        w.bullets(have, { size: 9.5 });
      }
      const gaps = toList(career?.skillGaps);
      if (gaps.length) {
        w.subHeading('Skills to build', CON, 10);
        w.bullets(gaps, { size: 9.5 });
      }
      const path = toList(career?.transitionPath);
      if (path.length) {
        w.subHeading('How to get there', ACCENT, 10);
        w.bullets(path, { size: 9.5, numbered: true });
      }
      const steps = toList(career?.nextSteps);
      if (steps.length) {
        w.subHeading('Next steps', ACCENT, 10);
        w.bullets(steps, { size: 9.5 });
      }

      if (index < careers.length - 1) w.divider();
      else w.y += 4;
    });
  }

  const readiness = analysis?.careerChangeReadiness;
  if (readiness && typeof readiness === 'object') {
    w.section('Are You Ready to Switch Careers?');
    w.facts([
      ['Readiness score', typeof readiness.score === 'number' ? `${readiness.score}/100` : asText(readiness.score)],
      ['Recommendation', asText(readiness.recommendation)],
      ['Timeline', asText(readiness.timeline)],
    ]);
    const strengths = toList(readiness.strengths);
    if (strengths.length) {
      w.subHeading('What is working for you', PRO, 10);
      w.bullets(strengths, { size: 9.5 });
    }
    const concerns = toList(readiness.concerns);
    if (concerns.length) {
      w.subHeading('What to prepare for', CON, 10);
      w.bullets(concerns, { size: 9.5 });
    }
    w.y += 4;
  }

  const lists: [string, any][] = [
    ['Your Key Strengths', analysis?.keyStrengths],
    ['Areas to Develop', analysis?.developmentAreas],
    ['Opportunities You May Not Have Considered', analysis?.hiddenOpportunities],
  ];
  lists.forEach(([title, value]) => {
    const items = toList(value);
    if (!items.length) return;
    w.section(title);
    w.bullets(items);
    w.y += 4;
  });

  const advice = asText(analysis?.generalAdvice);
  if (advice) {
    w.section('Advice for Your Next Step');
    w.text(advice, { after: 6 });
  }

  if (!analysis) {
    w.section('Next Steps');
    w.bullets([
      'Research job roles in your top interest areas.',
      'Take the Skills Assessment to see your current skill levels.',
      'Take the Personality Assessment to see which work styles suit you.',
    ]);
  }

  w.footer('');
  return w.doc;
}
