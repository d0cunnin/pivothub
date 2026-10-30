import { describe, it, expect } from 'vitest';
import { checkSection, topicCovered, SECTION_POSITIONING, SECTION_PROGRAMS, SECTION_SERVICES, SECTION_VENUES } from '../../supabase/functions/speak-it/speakerChecks';

const input = {
  niche: 'Second chances and youth mentoring',
  qualifications: '10 years volunteering as a youth mentor; formerly incarcerated',
  speakingGoals: ['Keynotes', 'Emcee'],
  speakingTopics: [{ title: 'Rewriting Your Story After Prison' }, { title: 'Mentoring Youth Who Feel Unseen' }],
  targetVenues: ['Schools', 'Prisons', 'Juvenile Programs'],
};
const pad = (s: string) => s + '\n' + 'Detailed guidance that fits this person. '.repeat(10);

describe('speaker report quality check', () => {
  it('flags a submitted topic that was not developed', () => {
    const text = pad('#### Rewriting Your Story After Prison\nDescription...');
    expect(checkSection(SECTION_PROGRAMS, text, input)).toEqual(['The submitted topic "Mentoring Youth Who Feel Unseen" is not developed into a program.']);
  });

  it('accepts topics even when the title is lightly refined', () => {
    expect(topicCovered('Mentoring Youth Who Feel Unseen', 'Program: Mentoring Unseen Youth (original title kept)')).toBe(true);
  });

  it('flags a skipped service such as Emcee', () => {
    expect(checkSection(SECTION_SERVICES, pad('#### Keynotes\n...'), input)).toEqual(['The selected service "Emcee" is not addressed.']);
  });

  it('flags a skipped venue', () => {
    const issues = checkSection(SECTION_VENUES, pad('#### Schools\n...\n#### Correctional facilities\n...'), input);
    expect(issues).toEqual(['The selected venue "Juvenile Programs" is not addressed.']);
  });

  it('flags unsupported credentials in draft bios but not in advice', () => {
    const text = pad(`### Our Understanding of You
Dana is a youth mentor...
### Credibility Check
Avoid calling yourself a licensed counselor.
### Professional Bio (drafts)
Dana Lee is a licensed counselor and award-winning speaker.`);
    const issues = checkSection(SECTION_POSITIONING, text, input);
    expect(issues).toHaveLength(3);
    expect(issues.join(' ')).toMatch(/counsel/i);
    expect(issues.join(' ')).toMatch(/licensed|award/i);
  });

  it('requires the understanding summary first', () => {
    expect(checkSection(SECTION_POSITIONING, pad('### What You Bring\n...'), input)).toContain('The section does not start with "Our Understanding of You".');
  });

  it('passes a complete section', () => {
    expect(checkSection(SECTION_VENUES, pad('Schools... prison programs... juvenile programs...'), input)).toEqual([]);
  });
});
