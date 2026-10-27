import type jsPDF from 'jspdf';
import { PdfWriter, asText, toList, pdfSafe, ACCENT, HEADING, MUTED } from '../pdfWriter';
import { safeHeader, thinRule, fitOneLine } from './helpers';

export interface SocialPostPDF {
  day: number;
  date: string;
  platform: string;
  contentType: string;
  caption: string;
  hashtags: string[];
  visualSuggestion: string;
  bestTime: string;
}

export function generateSocialCalendarPDF(input: {
  businessName: string;
  businessNiche: string;
  platforms: string[];
  tone: string;
  posts: SocialPostPDF[];
}): jsPDF {
  const w = new PdfWriter();
  const business = asText(input.businessName);
  safeHeader(w, '30-Day Social Media Content Calendar', business || 'Your content calendar');
  w.facts([
    ['Business', business],
    ['Niche', asText(input.businessNiche)],
    ['Platforms', toList(input.platforms).join(', ')],
    ['Tone', asText(input.tone)],
  ]);
  w.y += 2;

  const posts = Array.isArray(input.posts) ? input.posts : [];
  let week = -1;
  posts.forEach((post, index) => {
    const dayNum = Number(post?.day);
    const day = Number.isFinite(dayNum) && dayNum > 0 ? dayNum : index + 1;
    const thisWeek = Math.floor((day - 1) / 7);
    if (thisWeek !== week) {
      week = thisWeek;
      w.y += 4;
      w.section(`Week ${week + 1}`, `Days ${week * 7 + 1}-${Math.min(week * 7 + 7, Math.max(30, posts.length))}`);
    } else {
      // Break first so a separator never sits alone at the bottom of a page.
      w.ensureSpace(38);
      thinRule(w, 1, 7);
    }

    // Day badge + date and platform
    w.ensureSpace(30);
    w.badge(`Day ${day}`, 18);
    const heading = [asText(post?.date), asText(post?.platform)].filter(Boolean).join('  |  ');
    w.setStyle(11, HEADING, 'bold');
    w.doc.text(fitOneLine(w, heading, 11, w.contentWidth - 23), w.margin + 23, w.y);
    w.y += 7;

    const meta = [asText(post?.contentType), post?.bestTime ? `Best time: ${asText(post.bestTime)}` : '']
      .filter(Boolean)
      .join('   |   ');
    if (meta) w.text(meta, { size: 9, color: MUTED, after: 3 });

    // Caption: drop "---" separators the AI puts inside captions.
    const caption = asText(post?.caption)
      .replace(/\\n/g, '\n')
      .split('\n')
      .filter((l) => !/^\s*([-*_])(\s*\1){2,}\s*$/.test(l))
      .join('\n')
      .trim();
    if (caption) {
      w.markdown(caption);
      w.y += 1;
    }

    const tags = toList(post?.hashtags)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));
    if (tags.length) w.text(pdfSafe(tags.join(' ')), { size: 9, color: ACCENT, after: 2.5 });

    const visual = asText(post?.visualSuggestion);
    if (visual) w.richParagraph(`**Visual idea:** ${visual}`, { size: 9.5, after: 2 });
  });

  w.footer('Your 30-day content calendar from PivotHub');
  return w.doc;
}
