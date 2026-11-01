import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { buildPublishPackage, chaptersFromParts, groupByPart, progressPercent, EMPTY_INPUTS, type WriteItProject } from './writeIt';
import { missingRequired } from '@/components/write-it/BookForm';

const parts = [
  { name: 'Part One: Roots', chapters: [{ title: 'Where It Began', summary: 'Early life' }, { title: 'The Turning Point', summary: '' }] },
  { name: '', chapters: [{ title: 'Conclusion', summary: 'Wrap up' }] },
];

describe('Write It helpers', () => {
  it('turns the AI table of contents into editable chapters with parts', () => {
    const { chapters, partNames } = chaptersFromParts(parts);
    expect(chapters.map((c) => c.title)).toEqual(['Where It Began', 'The Turning Point', 'Conclusion']);
    expect(chapters[0]).toMatchObject({ part: 'Part One: Roots', status: 'Not Started', outline: '' });
    expect(partNames).toEqual(['Part One: Roots', '']);
    expect(new Set(chapters.map((c) => c.id)).size).toBe(3);
  });

  it('groups chapters by part in order and tracks progress', () => {
    const { chapters, partNames } = chaptersFromParts(parts);
    expect(groupByPart(chapters, partNames).map((g) => g.chapters.length)).toEqual([2, 1]);
    chapters[0].status = 'Completed';
    expect(progressPercent(chapters)).toBe(33);
    expect(progressPercent([])).toBe(0);
  });

  it('builds a Publish It package marked as an outline, not a manuscript', () => {
    const { chapters } = chaptersFromParts(parts);
    const project = {
      id: 'x', project_name: 'My Book', status: 'Planning', inputs: { ...EMPTY_INPUTS, category: 'Memoir/Autobiography', audience: 'Adults', idea: 'My story' },
      plan: { selectedTitle: 'Rooted', selectedSubtitle: 'A Memoir', concept: { refinedConcept: 'A memoir about roots.', intendedAudience: 'Adult readers' } },
      chapters, roadmap: {}, publish_package: null, sent_to_publish_at: null, created_at: '', updated_at: '',
    } as WriteItProject;
    const pkg = buildPublishPackage(project, 'Dana Lee');
    expect(pkg).toMatchObject({ title: 'Rooted', subtitle: 'A Memoir', authorName: 'Dana Lee', category: 'Memoir/Autobiography', audience: 'Adult readers', manuscriptStatus: 'outline only' });
    expect(pkg.tableOfContents).toHaveLength(3);
  });

  it('requires the six required answers and nothing else', () => {
    expect(missingRequired(EMPTY_INPUTS)).toMatch(/what your book is about/);
    const filled = { ...EMPTY_INPUTS, idea: 'x', category: 'Fiction', purposes: ['Entertain'], audience: 'Teens', message: 'Hope', devStatus: 'I have several ideas and notes.' };
    expect(missingRequired(filled)).toBeNull();
  });
});
