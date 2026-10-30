/**
 * Quality checks for the Speak It speaker report: compares each generated
 * section with the person's form answers before the report is delivered.
 * Pure functions (no Deno APIs) so they can be unit tested.
 */

export interface CheckInput {
  niche: string;
  qualifications: string;
  speakingGoals: string[];
  speakingTopics: Array<{ title: string; description?: string }>;
  targetVenues: string[];
}

/** Section order matches SECTIONS in speakerPlan.ts. */
export const SECTION_POSITIONING = 0;
export const SECTION_PROGRAMS = 1;
export const SECTION_SERVICES = 2;
export const SECTION_VENUES = 3;
export const SECTION_MARKETING = 4;

const STOP = new Set(['the', 'and', 'for', 'with', 'your', 'you', 'how', 'from', 'into', 'about', 'that', 'this', 'what', 'our', 'are']);

const words = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/** A topic counts as covered if most of its title's meaningful words appear. */
export function topicCovered(title: string, text: string): boolean {
  const ws = words(title);
  if (!ws.length) return true;
  const lower = text.toLowerCase();
  const found = ws.filter((w) => lower.includes(w.length > 5 ? w.slice(0, -1) : w)).length;
  return found / ws.length >= 0.6;
}

const SERVICE_PATTERNS: Record<string, RegExp> = {
  keynotes: /keynote/i,
  workshops: /workshop/i,
  trainings: /training/i,
  emcee: /emcee|\bmc\b|master of ceremonies|host(ing)? (the )?event/i,
};

const VENUE_PATTERNS: Record<string, RegExp> = {
  schools: /school/i,
  prisons: /prison|correctional|jail|incarcerat/i,
  'juvenile programs': /juvenile|youth detention|youth program/i,
  ministries: /ministr|church|faith|congregation/i,
  corporations: /corporat|compan(y|ies)|employer|business/i,
  universities: /universit|college|campus/i,
  associations: /association/i,
  conferences: /conference/i,
};

const patternFor = (map: Record<string, RegExp>, label: string) =>
  map[label.trim().toLowerCase()] ?? new RegExp(label.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/s$/i, ''), 'i');

/**
 * Titles and claims that must not appear in drafts (bios, statements,
 * introductions) unless the person's own qualifications mention them.
 */
const CREDENTIAL_CLAIMS: Array<[RegExp, RegExp]> = [
  [/\btherapist\b/i, /therap/i],
  [/\bcounsel(l)?or\b/i, /counsel/i],
  [/\bclinician\b|\bclinical\b/i, /clinic/i],
  [/\bpsychologist\b/i, /psycholog/i],
  [/\bsocial worker\b/i, /social work/i],
  [/\blicensed\b/i, /licens/i],
  [/\bcertified\b/i, /certif/i],
  [/\bDr\.\s|\bPh\.?D\b|\bdoctorate\b/i, /dr\.|ph\.?d|doctor/i],
  [/\baward[- ]winning\b/i, /award/i],
  [/\bbest[- ]?selling\b/i, /best[- ]?sell/i],
  [/\b(internationally|nationally) (recognized|renowned|known)\b|\brenowned\b|\bworld[- ]class\b/i, /renown|recogni/i],
  [/\b(sought[- ]after|in[- ]demand) speaker\b/i, /sought|demand/i],
];

/** Lines inside subsections that are suggested wording (drafts, bios, intros, statements). */
function draftLines(text: string): string[] {
  const out: string[] = [];
  let inDraft = false;
  for (const line of text.split('\n')) {
    const heading = line.match(/^#{2,4}\s+(.*)$/);
    if (heading) {
      inDraft = /draft|bio|introduction|statement|value proposition|promotional|messaging/i.test(heading[1]);
      continue;
    }
    if (inDraft && line.trim()) out.push(line);
  }
  return out;
}

/** Returns problems found in one section; empty when it passes. */
export function checkSection(index: number, text: string, input: CheckInput): string[] {
  const issues: string[] = [];
  if (!text || text.trim().length < 200) return ['The section is missing or far too short.'];

  if (index === SECTION_PROGRAMS) {
    for (const t of input.speakingTopics.filter((t) => t.title?.trim())) {
      if (!topicCovered(t.title, text)) issues.push(`The submitted topic "${t.title.trim()}" is not developed into a program.`);
    }
  }
  if (index === SECTION_SERVICES) {
    for (const g of input.speakingGoals) {
      if (!patternFor(SERVICE_PATTERNS, g).test(text)) issues.push(`The selected service "${g}" is not addressed.`);
    }
  }
  if (index === SECTION_VENUES) {
    for (const v of input.targetVenues) {
      if (!patternFor(VENUE_PATTERNS, v).test(text)) issues.push(`The selected venue "${v}" is not addressed.`);
    }
  }
  if (index === SECTION_POSITIONING && !/understanding of you/i.test(text)) {
    issues.push('The section does not start with "Our Understanding of You".');
  }
  if (index === SECTION_POSITIONING || index === SECTION_MARKETING) {
    const own = `${input.qualifications} ${input.niche}`;
    const drafts = draftLines(text).join('\n');
    for (const [claim, allowedIf] of CREDENTIAL_CLAIMS) {
      const m = drafts.match(claim);
      if (m && !allowedIf.test(own)) {
        issues.push(`Draft wording uses "${m[0].trim()}", which the person's qualifications do not support. Remove it or describe their actual experience.`);
      }
    }
  }
  if (/NOT PROVIDED/.test(text)) issues.push('The text shows "NOT PROVIDED"; say what is missing in plain words or use a [bracketed placeholder] instead.');
  return issues;
}
