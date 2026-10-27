import type jsPDF from 'jspdf';
import { PdfWriter, asText, ACCENT } from '../pdfWriter';
import { safeHeader, note } from './helpers';

export interface BiographyContentPDF {
  founderBio100: string;
  founderBio250: string;
  founderBio500: string;
  businessBio100: string;
  businessBio200: string;
  businessBio500: string;
  vision: string;
  mission: string;
}

export const BIOGRAPHY_DISCLAIMER =
  'Professional biographies provided for business and marketing purposes. Content is AI-generated and should be reviewed for accuracy.';

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** Bio text: drop a repeated "Founder Biography (100 words)" style heading the AI may echo. */
const bioBody = (s: any) =>
  asText(s)
    .replace(/^\s*(?:#+\s*)?\**\s*(?:founder|business)?\s*(?:bio(?:graphy)?|vision(?: statement)?|mission(?: statement)?)\s*(?:\(\s*\d+\s*words?\s*\))?\s*\**\s*:?\s*\**\s*\n/i, '')
    .trim();

export function generateBiographyPDF(input: {
  founderName: string;
  businessType: string;
  tone: string;
  content: BiographyContentPDF;
}): jsPDF {
  const w = new PdfWriter();
  // Sent to funders/agencies/clients under the user's name: no PivotHub branding.
  w.brand = false;
  const founder = asText(input.founderName);
  const business = asText(input.businessType);
  const tone = capitalize(asText(input.tone));
  safeHeader(
    w,
    founder || 'Biography Package',
    [founder ? 'Biography Package' : '', business, tone ? `${tone} tone` : ''].filter(Boolean).join('  |  '),
  );

  const c = input.content ?? ({} as BiographyContentPDF);
  const block = (title: string, use: string, text: any) => {
    const body = bioBody(text);
    if (!body) return;
    w.subHeading(title, ACCENT, 11);
    w.y -= 1.5;
    note(w, use, 3);
    w.markdown(body);
    w.y += 5;
  };

  w.section('About the Founder', 'Pick the length that fits where you are sharing it');
  block('Short Bio (about 100 words)', 'For social media profiles, event programs and quick introductions', c.founderBio100);
  block('Standard Bio (about 250 words)', 'For speaker bios, your website About page and podcast intros', c.founderBio250);
  block('Full Bio (about 500 words)', 'For investor materials, press releases and award submissions', c.founderBio500);

  w.y += 2;
  w.section('About the Business');
  block('Short Description (about 100 words)', 'For directory listings, social profiles and elevator pitches', c.businessBio100);
  block('Standard Description (about 200 words)', 'For your website, proposals and partner introductions', c.businessBio200);
  block('Full Description (about 500 words)', 'For press kits, grant applications and investor materials', c.businessBio500);

  w.y += 2;
  w.section('Vision and Mission');
  block('Vision Statement', 'Where the business is headed', c.vision);
  block('Mission Statement', 'What the business does every day and why', c.mission);

  w.footer(BIOGRAPHY_DISCLAIMER);
  return w.doc;
}
