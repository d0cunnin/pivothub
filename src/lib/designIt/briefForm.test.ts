import { describe, it, expect, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BriefForm, CategoryPicker } from '@/components/design-it/BriefForm';
import { ConceptView } from '@/components/design-it/VersionViews';
import { DESIGN_CATEGORIES } from './categories';
import { emptyBrief } from './logic';

describe('Design It forms render', () => {
  it('shows all nine categories to pick from', () => {
    const html = renderToStaticMarkup(createElement(CategoryPicker, { value: null, onChange: () => {} }));
    DESIGN_CATEGORIES.forEach((c) => expect(html).toContain(c.name));
  });

  it('shows only the chosen category questions', () => {
    for (const c of DESIGN_CATEGORIES) {
      const html = renderToStaticMarkup(createElement(BriefForm, { value: emptyBrief(c.id), onChange: () => {} }));
      c.details.forEach((d) => expect(html).toContain(d.label));
      DESIGN_CATEGORIES.filter((o) => o.id !== c.id).flatMap((o) => o.details)
        .filter((d) => !c.details.some((x) => x.label === d.label))
        .forEach((d) => expect(html).not.toContain(`>${d.label}<`));
      expect(html).toContain('Design concept or idea');
      expect(html).toContain('Choose a ready-made palette');
      expect(html).toContain('type="color"');
    }
  });

  it('shows the architecture notice on concept versions', () => {
    const html = renderToStaticMarkup(createElement(ConceptView, { v: { content: { overview: 'x', notice: 'Conceptual design assistance only.' } } as any }));
    expect(html).toContain('Conceptual design assistance only.');
  });
});
