import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { EMPTY_ASSESSMENT, buildRoadmap, evaluateReadiness, bookFromWriteIt, missingAssessment, type Assessment } from './logic';
import { SOURCES, INGRAM_STEPS, KDP_STEPS, EBOOK_PLATFORMS, BOTH_PLATFORMS_GUIDANCE } from './content';
import { generatePublishItPDF } from '../pdf-reports/publish-it';

const allYes = Object.fromEntries(Object.keys(EMPTY_ASSESSMENT.readiness).map((k) => [k, 'Yes'])) as Assessment['readiness'];
const base = (over: Partial<Assessment> = {}): Assessment => ({
  ...EMPTY_ASSESSMENT,
  book: { ...EMPTY_ASSESSMENT.book, title: 'Rooted', author: 'Dana Lee' },
  readiness: allYes, formats: ['Paperback'], printPlatform: 'kdp',
  isbnStatus: 'I already have an ISBN.', copyrightStatus: 'I have registered my copyright.',
  ...over,
});
const ids = (a: Assessment) => buildRoadmap(a).map((t) => t.id);

describe('Publish It scenarios', () => {
  it('1-3: IngramSpark paperback, KDP paperback and KDP hardcover get the right platform tasks', () => {
    expect(ids(base({ printPlatform: 'ingramspark' }))).toEqual(expect.arrayContaining(['acct-ingram', 'submit-ingram']));
    expect(ids(base({ printPlatform: 'ingramspark' }))).not.toContain('submit-kdp');
    expect(ids(base())).toEqual(expect.arrayContaining(['acct-kdp', 'submit-kdp']));
    expect(ids(base({ formats: ['Hardcover'] }))).toContain('submit-kdp');
  });

  it('4: both platforms add both submissions and the combined guidance', () => {
    const r = ids(base({ printPlatform: 'both', isbnStatus: 'I want to explore a free platform-provided ISBN.' }));
    expect(r).toEqual(expect.arrayContaining(['submit-ingram', 'submit-kdp', 'both', 'isbn-buy']));
    expect(BOTH_PLATFORMS_GUIDANCE.join(' ')).toMatch(/do not turn on Expanded Distribution by default/i);
  });

  it('5-6: buying an ISBN vs choosing a free KDP ISBN', () => {
    expect(ids(base({ isbnStatus: 'I need to purchase an ISBN.' }))).toContain('isbn-buy');
    const free = buildRoadmap(base({ isbnStatus: 'I want to explore a free platform-provided ISBN.' })).find((t) => t.id === 'isbn-free');
    expect(free?.source).toBe('kdpIsbn');
    expect(KDP_STEPS[2].points.join(' ')).toMatch(/Independently published/);
  });

  it('7: copyright guidance adds a copyright task and needs-attention status', () => {
    const a = base({ copyrightStatus: 'I need copyright registration guidance.' });
    expect(ids(a)).toContain('copyright');
    expect(evaluateReadiness(a).find((r) => r.key === 'copyright')?.status).toBe('Needs Attention');
  });

  it('8-10: e-book, audiobook and all formats', () => {
    expect(ids(base({ formats: ['E-book'], printPlatform: '' }))).toEqual(expect.arrayContaining(['epub', 'submit-ebook']));
    expect(ids(base({ formats: ['Audiobook'], printPlatform: '' }))).toEqual(expect.arrayContaining(['audio', 'acct-acx', 'submit-audio']));
    const all = ids(base({ formats: ['Paperback', 'Hardcover', 'E-book', 'Audiobook'], printPlatform: 'both' }));
    expect(all).toEqual(expect.arrayContaining(['submit-ingram', 'submit-kdp', 'submit-ebook', 'submit-audio']));
    expect(EBOOK_PLATFORMS.find((e) => e.name.includes('KDP'))?.points.join(' ')).toMatch(/KDP Select.*not a requirement/);
  });

  it('11-12: unfinished manuscript or cover are never marked complete', () => {
    const a = base({ readiness: { ...allYes, manuscriptComplete: 'No', coverDone: 'In Progress' } });
    const r = evaluateReadiness(a);
    expect(r.find((x) => x.key === 'manuscript')?.status).toBe('Not Started');
    expect(r.find((x) => x.key === 'cover')?.status).toBe('In Progress');
    expect(ids(a)).toEqual(expect.arrayContaining(['finish-manuscript', 'print-cover']));
  });

  it('13: importing Write It fills book details but never readiness', () => {
    const book = bookFromWriteIt({ project_name: 'P', publish_package: { title: 'Rooted', subtitle: 'A Memoir', authorName: 'Dana', category: 'Memoir/Autobiography', audience: 'Adults', description: 'D', concept: 'C', tableOfContents: [{ part: '', title: 'Ch 1' }] } });
    expect(book).toMatchObject({ title: 'Rooted', author: 'Dana', category: 'Memoir/Autobiography' });
    const a = { ...EMPTY_ASSESSMENT, book };
    expect(missingAssessment(a)).toMatch(/readiness/);
  });

  it('only a Yes answer marks readiness complete; platform tasks are never pre-completed', () => {
    const r = evaluateReadiness(base());
    expect(r.filter((x) => x.status === 'Complete').map((x) => x.key)).toEqual(['manuscript', 'editing', 'proofreading', 'formatting', 'cover', 'isbn', 'copyright']);
    expect(r.find((x) => x.key === 'accounts')?.status).toBe('Not Started');
  });

  it('15: exports a publishing plan and checklist PDF', () => {
    const project = { id: 'x', project_name: 'Rooted', assessment: base({ formats: ['Paperback', 'E-book', 'Audiobook'], printPlatform: 'both' }), progress: {}, isbn_records: [{ isbn: '978-0-00-000000-0', title: 'Rooted', format: 'Paperback', imprint: 'Lee Press', obtained: '2026-11-01', status: 'Purchased' }], costs: { editing: '800' }, ai_summary: null, write_it_project_id: null, created_at: '', updated_at: '' };
    expect(generatePublishItPDF(project, 'plan').getNumberOfPages()).toBeGreaterThan(3);
    expect(generatePublishItPDF(project, 'checklist').getNumberOfPages()).toBeGreaterThan(0);
  });

  it('16-17: every link is an https official link used by the guides', () => {
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\/[a-z0-9.-]+\.(com|gov)\//);
    for (const step of [...INGRAM_STEPS, ...KDP_STEPS]) expect(step.sources.length).toBeGreaterThan(0);
  });
});
