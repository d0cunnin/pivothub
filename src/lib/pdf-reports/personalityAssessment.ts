import type jsPDF from 'jspdf';
import { PdfWriter, asText, toList, ACCENT, CON, HEADING, PRO } from '../pdfWriter';
import { actionPlan, scoreBar, toNumber } from './scoreReportBlocks';

const levelColor = (level: string) =>
  /strong/i.test(level) ? PRO : /moderate/i.test(level) ? ACCENT : /develop/i.test(level) ? CON : ACCENT;

const fmt = (n: number) => n.toFixed(1);

/**
 * Builds the Personality Assessment PDF. `results` is either the local
 * calculation ({traitScores, topStrengths}) or the AI analysis from
 * enhanced-assessment-analyzer; both shapes are rendered.
 */
export function generatePersonalityAssessmentPDF(results: any): jsPDF {
  const w = new PdfWriter();
  w.header('Personality Assessment Results', 'Your work style, strengths, and the roles that may suit you');

  const type = asText(results?.personalityType);
  const overall = toNumber(results?.overallScore);
  if (type || overall !== null) {
    w.section('Your Personality Type');
    if (type) w.text(type, { size: 13, color: HEADING, style: 'bold', after: 4 });
    if (overall !== null) scoreBar(w, 'Overall score', overall, 10, `${overall}/10`);
    w.y += 2;
  }

  const interpretation = asText(results?.interpretation);
  if (interpretation) {
    w.section('What Your Results Say');
    w.markdown(interpretation);
    w.y += 4;
  }

  const topStrengths: any[] = Array.isArray(results?.topStrengths) ? results.topStrengths : [];
  if (topStrengths.length) {
    w.section('Your Top Personality Strengths');
    topStrengths.forEach((s, index) => {
      const score = toNumber(s?.score);
      const level = asText(s?.level);
      w.ensureSpace(24);
      w.badge(`#${index + 1}`, 14);
      w.setStyle(12, HEADING, 'bold');
      const titleLines: string[] = w.doc.splitTextToSize(asText(s?.trait), w.contentWidth - 60);
      titleLines.forEach((line, i) => w.doc.text(line, w.margin + 19, w.y + i * 6));
      w.setStyle(10, levelColor(level));
      w.doc.text([level, score !== null ? `(${fmt(score)}/5.0)` : ''].filter(Boolean).join(' '), w.pageWidth - w.margin, w.y, { align: 'right' });
      w.y += titleLines.length * 6 + 2;
      w.text(asText(s?.interpretation), { after: 6 });
    });
    w.y += 2;
  }

  const traits: any[] = Array.isArray(results?.traitScores) ? results.traitScores : [];
  if (traits.length) {
    w.section('Your Complete Personality Profile', 'Scores are out of 5.0');
    traits.forEach((t) => {
      const score = toNumber(t?.score);
      const level = asText(t?.level);
      if (score !== null) scoreBar(w, asText(t?.trait), score, 5, `${fmt(score)}/5.0  -  ${level}`, levelColor(level));
      else w.subHeading([asText(t?.trait), level].filter(Boolean).join('  -  '));
      w.text(asText(t?.interpretation), { size: 9.5, after: 5 });
    });
    w.y += 2;
  }

  const keyTraits: any[] = Array.isArray(results?.keyTraits) ? results.keyTraits : [];
  if (keyTraits.length) {
    w.section('Your Key Traits', 'Scores are out of 5');
    keyTraits.forEach((t) => {
      const score = toNumber(t?.score);
      if (score !== null) scoreBar(w, asText(t?.trait), score, 5, `${score}/5`);
      else w.subHeading(asText(t?.trait));
      w.text(asText(t?.description), { size: 9.5, after: 2 });
      const relevance = asText(t?.careerRelevance);
      if (relevance) w.richParagraph(`**At work:** ${relevance}`, { size: 9.5, after: 5 });
    });
    w.y += 2;
  }

  const strengths = toList(results?.strengths);
  if (strengths.length) {
    w.section('Your Strengths');
    w.bullets(strengths);
    w.y += 4;
  }

  const workStyle = asText(results?.workStyle);
  const relationshipStyle = asText(results?.relationshipStyle);
  if (workStyle || relationshipStyle) {
    w.section('How You Like to Work');
    if (workStyle) {
      w.subHeading('Your ideal work style', ACCENT, 10.5);
      w.markdown(workStyle);
      w.y += 2;
    }
    if (relationshipStyle) {
      w.subHeading('How you work with others', ACCENT, 10.5);
      w.markdown(relationshipStyle);
    }
    w.y += 4;
  }

  const careerFit: any[] = Array.isArray(results?.careerFit) ? results.careerFit : [];
  if (careerFit.length) {
    w.section('Career Fields That Match You', 'Match scores are out of 10');
    careerFit.forEach((c) => {
      const match = toNumber(c?.match);
      if (match !== null) scoreBar(w, asText(c?.field), match, 10, `${match}/10 match`);
      else w.subHeading(asText(c?.field));
      w.text(asText(c?.reasoning), { size: 9.5, after: 5 });
    });
    w.y += 2;
  }

  const devAreas = toList(results?.developmentAreas);
  if (devAreas.length) {
    w.section('Areas to Grow');
    w.bullets(devAreas);
    w.y += 4;
  }

  const tips = toList(results?.workEnvironmentTips);
  if (tips.length) {
    w.section('Tips for Your Work Environment');
    w.bullets(tips);
    w.y += 4;
  }

  actionPlan(w, results?.actionPlan);

  w.section('Next Steps');
  w.bullets(
    [
      'Complete the Career Interest Assessment for a full career profile',
      'Explore learning paths that match your personality and work style',
      'Consider roles that align with your top personality strengths',
      'Focus on developing areas marked as "Developing" for growth opportunities',
    ],
    { numbered: true },
  );

  w.footer('Generated by PivotHub');
  return w.doc;
}
