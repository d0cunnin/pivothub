import { generateText, systemUser } from '../_shared/aiGenerate.ts';

/**
 * Builds an individualized Speaker Development & Launch Strategy.
 *
 * Each section is written by its own AI call (run in parallel) so the report
 * can be thorough without hitting length or time limits. Every call gets the
 * same profile and accuracy rules, so nothing is invented and every selected
 * topic, speaking goal and venue is addressed.
 */

export interface SpeakerInput {
  fullName: string;
  businessName?: string;
  niche: string;
  targetAudience: string;
  brandTone: string;
  socialHandles?: string;
  website?: string;
  brandColors: string[];
  hasProfessionalPhotos: boolean;
  qualifications: string;
  speakingGoals: string[];
  speakingTopics: Array<{ title: string; description: string }>;
  targetVenues: string[];
  pricingLevel: string;
  availability?: string;
}

const PRICING_LABELS: Record<string, string> = {
  free: 'Free (building experience; no speaking fee yet)',
  starter: 'Starter ($500-$2,000 per engagement)',
  standard: 'Standard ($2,000-$5,000 per engagement)',
  premium: 'Premium ($5,000+ per engagement)',
};

const val = (v: string | undefined | null) => (v && v.trim() ? v.trim() : 'NOT PROVIDED');

function profileBlock(p: SpeakerInput, today: string): string {
  const topics = p.speakingTopics.filter((t) => t.title?.trim());
  return `=== SPEAKER PROFILE (the ONLY source of facts about this person) ===
Today's date: ${today}
Full name: ${val(p.fullName)}
Business name: ${val(p.businessName)}
Niche / focus area: ${val(p.niche)}
Target audience: ${val(p.targetAudience)}
Brand tone: ${val(p.brandTone)}
Social media handles: ${val(p.socialHandles)}
Website: ${val(p.website)}
Brand colors: ${p.brandColors.filter(Boolean).join(', ') || 'NOT PROVIDED'}
Has professional photos: ${p.hasProfessionalPhotos ? 'Yes' : 'No'}
Qualifications and background (exactly as written by the person):
"""${val(p.qualifications)}"""
Selected speaking services: ${p.speakingGoals.join(', ') || 'NONE SELECTED'}
Speaking topics submitted:
${topics.length ? topics.map((t, i) => `  ${i + 1}. "${t.title.trim()}"${t.description?.trim() ? ` - ${t.description.trim()}` : ' (no description provided)'}`).join('\n') : '  NONE PROVIDED'}
Target venues selected: ${p.targetVenues.join(', ') || 'NONE SELECTED'}
Pricing level: ${PRICING_LABELS[p.pricingLevel] ?? val(p.pricingLevel)}
Availability: ${val(p.availability)}`;
}

const RULES = `=== ACCURACY RULES (most important; never break these) ===
- Treat only the SPEAKER PROFILE as fact. Never invent degrees, certifications, licenses, job titles, years of experience, employers, awards, media features, speaking history, past clients, testimonials, follower counts, or results.
- Do not turn personal, lived, volunteer or practical experience into professional credentials. Never describe the person as a therapist, counselor, clinician, psychologist, social worker, doctor, licensed professional, certified coach, "expert" or "specialist" unless their qualifications explicitly say so. Describe what they actually did instead (for example "speaks from lived experience as..." or "has X years of experience as..." only when stated).
- Keep formal qualifications (degrees, licenses, certifications) separate from experience. If a topic would normally need a credential the person has not listed, say so plainly and suggest how to frame it honestly (for example sharing personal experience, not giving clinical advice) or partner with a qualified professional.
- Do not assume they have professional photos (unless the profile says Yes), a website or social accounts (unless provided), testimonials, a speaking track record, an email list or an established client base.
- Label all suggested wording (bios, statements, titles, messages, captions) as a draft for them to edit, and only use facts from the profile in it. Where a useful fact is missing, write a bracketed placeholder like [add your years of experience] instead of inventing it.
- When you infer something (it is not stated in the profile), mark it with "(inferred)" and give the reason.
- Do not invent statistics, market figures, named contacts or claims that a specific organization books speakers or pays a certain amount. You may name common types of organizations, roles and well-known public resources.
- Do not set arbitrary numbers (for example "book 10 talks"). Any target must say why it fits this person's starting point and availability, and that they can adjust it.
- Make every recommendation specific to this person: tie it to their background, niche, audience, topics, goals, venues, pricing level or availability, and briefly explain why it fits. Do not just repeat their form answers back.
- No generic motivational filler.

=== WRITING STYLE ===
- Clear, plain language a first-time speaker can follow; explain any industry terms in a few words.
- Markdown: use ### for subsections and #### for smaller headings, short paragraphs, bullet lists, and tables where they make comparisons easier.
- Do NOT write the section's main title (it is added for you) and do not add an introduction about yourself.`;

interface Section {
  title: string;
  maxTokens: number;
  task: (p: SpeakerInput) => string;
}

const SECTIONS: Section[] = [
  {
    title: '1. Your Starting Point & Positioning',
    maxTokens: 4500,
    task: () => `Write the profile review and positioning section, with these subsections in order:
### What You Bring
Group the person's actual background into strengths that matter for speaking (not a list of their form answers). Facts only.
### What We Are Inferring
2-5 reasonable inferences, each marked "(inferred)" with the reason.
### Missing Information That Would Strengthen This Plan
Only gaps that change the recommendations (for example no website, no photos, no topic descriptions, no availability, credentials a topic would normally need). Say why each matters and what to add.
### Credibility Check
How well their stated qualifications support their niche and each topic. Where they should avoid certain claims or titles, and safe, honest ways to describe themselves.
### Recommended Positioning (suggested)
One recommended positioning plus one alternative, each with why it fits their background, audience and goals.
### Speaker Brand Statement (draft)
### Mission and Purpose Statement (draft)
### Unique Value Proposition (draft)
### Professional Bio (drafts)
A 50-word, a 100-word and a 250-word bio in third person, using only profile facts and bracketed placeholders for anything missing. If the facts are thin, keep them shorter rather than padding.
### Differentiation Strategy
What can realistically set them apart from other speakers on these topics, based on their real background.
### Audience Segments
Primary and secondary audiences (from their target audience and venues), what each group needs, and which topics fit each.
### Recommended Website Structure
Pages and what goes on each. If they gave a website, suggest how to adapt it; if not, suggest a simple low-cost way to start.`,
  },
  {
    title: '2. Your Speaking Programs',
    maxTokens: 6000,
    task: (p) => {
      const topics = p.speakingTopics.filter((t) => t.title?.trim());
      return `Develop EVERY submitted topic (${topics.length || 0}) into a speaking program, in the order submitted. If no topics were submitted, propose 2-3 topics that fit their background (clearly marked "suggested topic") instead.
For each program use a #### heading with the program title (you may suggest a refined title but show their original title too), then:
- **Description:** 3-4 sentences.
- **Intended audience:** who it is for, based on their target audience and venues.
- **Learning objectives:** 3-5, starting with "Participants will be able to...".
- **Key discussion areas:** 4-6.
- **Audience takeaways:** 3-5 concrete things people leave with.
- **Interactive activities:** 1-3 suited to the audience (or say why the format suits little interaction).
- **Presentation lengths and formats:** how it works as a keynote (time), a workshop (time) and a training (time), only for formats that make sense for this topic.
- **Adaptations:** where their venues serve very different groups (for example youth vs adults, schools vs correctional settings, faith-based vs corporate), how to adjust content, examples and tone, including anything that must be avoided in that setting.
- **Credibility note:** only if this topic would normally need a credential they have not listed; how to present it honestly.`;
    },
  },
  {
    title: '3. Your Speaking Services',
    maxTokens: 4000,
    task: (p) => `Address EACH selected speaking service separately: ${p.speakingGoals.join(', ') || 'none selected'}. Do not skip any, including services (such as Emcee) that do not match their topic list. If none were selected, explain which services fit them and why.
For each service use a #### heading and cover:
- What this service would look like for this person specifically, and which of their topics or strengths it uses.
- How to package it: name, format, length, what is included (for example prep call, handout, Q&A, follow-up resources), and what they need from the host.
- Who typically books it among their target venues.
- How to present it on their website or one-page speaker sheet (a short draft description).
- What to prepare before offering it.
End with a short table comparing the services (service, best-fit venues, typical length, preparation needed).`,
  },
  {
    title: '4. Where to Speak: Venues, Pricing & Booking',
    maxTokens: 6000,
    task: (p) => `Write three parts.

### Venue-by-Venue Plan
Address EACH selected venue separately, in priority order for this person: ${p.targetVenues.join(', ') || 'none selected'}. For each venue use a #### heading and cover:
- Speaking opportunities that typically exist there.
- Which of their topics fit best and why.
- Recommended formats (keynote, workshop, training, emcee) for that setting.
- Who decides: the roles or departments to approach (titles, not invented names).
- Outreach strategy, including a short draft outreach message that reflects their availability.
- Considerations and requirements (for example background checks or volunteer clearance for schools, youth and correctional facilities; approval processes; content restrictions; whether credentials or continuing-education approval are usually expected).
Start with a short "Priority Order" list explaining why each venue ranks where it does for this person.

### Pricing & Business Development
Start from their pricing level: ${PRICING_LABELS[p.pricingLevel] ?? p.pricingLevel}.
- If Free: how to build a speaking portfolio; which introductory engagements are most strategic and why; how to ask for testimonials and referrals (include a short draft request); how to document measurable outcomes (attendance, feedback forms, follow-up requests); a clear framework for moving to paid engagements, with the signs that show they are ready and the reasoning; and the real costs to plan for (travel, preparation time, materials, printing, insurance where relevant).
- If paid: how to structure packages within their level, what to include, basics of a simple speaker agreement (deposit, cancellation, travel, recording rights), when and why to adjust rates, and costs to plan for.
Do not invent market rates beyond their selected level; any range you mention must say it should be checked locally.

### Availability & Booking Strategy
Use their availability (${val(p.availability)}). Explain how many engagements are realistic for them and why, how far ahead to book for each venue type, a simple booking process from inquiry to follow-up, and a short draft reply to a booking inquiry that states their availability. If availability was not provided, explain why it matters and what to decide.`,
  },
  {
    title: '5. Brand & Marketing Strategy',
    maxTokens: 6000,
    task: (p) => `Write these subsections:
### Brand Positioning
How their brand tone (${val(p.brandTone)}) and colors (${p.brandColors.filter(Boolean).join(', ') || 'not provided'}) should show up in their materials, with specific guidance on using each color. If colors were not provided, suggest how to choose them.
### Website Content Recommendations
Key messages, calls to action and what to put on the speaker page.
### Social Media
Use their handles (${val(p.socialHandles)}). Which platforms to focus on and why, given their audience and venues. If no handles were provided, recommend 1-2 platforms to start with and why. Do not assume follower counts.
### Content Pillars
3-5 pillars tied to their topics and audience, each with why it matters.
### Video Topics
8-10 short video ideas based on their topics.
### Speaker Introduction (draft)
A 60-90 second introduction an event host can read, using only profile facts and placeholders for anything missing.
### Promotional Messaging (drafts)
A short event description an organizer could use, and a one-page speaker sheet summary.
### ${p.hasProfessionalPhotos ? 'Using Your Professional Photos' : 'Photography Preparation Checklist'}
${p.hasProfessionalPhotos ? 'How to use and organize their existing photos across website, speaker sheet and social media, and which extra shots would help.' : 'They do not have professional photos. Give a practical checklist: shot list (headshot, speaking/action shots, branded shots), what to wear given their brand colors and tone, low-cost options, and how to get photos at their first engagements.'}

### Eight-Week Content Calendar
Starting the week of today's date, a table with columns: Week (with dates) | Theme | Platform | Post or video idea | Draft caption or description | Call to action. One or two rows per week for all 8 weeks, tied to their pillars and topics, on the platforms that fit them.`,
  },
  {
    title: '6. Your 30-, 60- and 90-Day Action Plan',
    maxTokens: 5000,
    task: () => `Create a realistic plan that starts from where this person is today (consider their pricing level, whether they have a website, photos, social accounts, topic descriptions and stated availability). Use real date ranges from today's date.
For each phase (Days 1-30, Days 31-60, Days 61-90) use a ### heading, one sentence on the phase's focus, then a table with columns: Task | Why it matters for you | Expected outcome | Complete by | How you'll measure progress.
Each phase should have 4-7 tasks. Measures should be concrete (for example "speaker sheet finished and reviewed by 2 people") rather than arbitrary booking numbers; if you include a number, say why it fits their availability.
Then add:
### Your First Three Steps This Week
Three specific actions to take in the next 7 days.`,
  },
];

/**
 * Generates every section in parallel. Throws if any section fails, so the
 * caller does not charge for an incomplete report.
 */
export async function generateSpeakerPlan(apiKey: string, input: SpeakerInput, today: string): Promise<string> {
  const system = `You are an experienced public speaking coach and small-business advisor. You are writing ONE section of a personalized Speaker Development & Launch Strategy for the person below. Other sections are written separately, so stay within your section.

${profileBlock(input, today)}

${RULES}`;

  const results = await Promise.all(
    SECTIONS.map((section) =>
      generateText(apiKey, systemUser(system, section.task(input)), { maxTokens: section.maxTokens }),
    ),
  );

  const name = input.businessName?.trim() ? `${input.fullName} (${input.businessName.trim()})` : input.fullName;
  const intro = `# Speaker Development & Launch Strategy for ${name}

Prepared ${today}. This plan is based only on what you entered. Anything marked **draft** is suggested wording for you to edit, anything marked **(inferred)** is our reasoning rather than something you told us, and items in [brackets] are details for you to fill in.`;

  return [intro, ...SECTIONS.map((s, i) => `## ${s.title}\n\n${stripLeadingTitle(results[i], s.title)}`)].join('\n\n');
}

/** Removes a repeated section title if the AI added one anyway. */
function stripLeadingTitle(text: string, title: string): string {
  const plain = title.replace(/^\d+\.\s*/, '').toLowerCase();
  const lines = text.trim().split('\n');
  if (lines.length && /^#{1,3}\s/.test(lines[0]) && lines[0].toLowerCase().includes(plain.slice(0, 20))) lines.shift();
  return lines.join('\n').trim();
}
