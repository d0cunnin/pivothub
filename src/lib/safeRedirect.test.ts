import { describe, it, expect } from 'vitest';
import { safeRedirect } from './safeRedirect';

describe('safeRedirect', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirect('/dashboard')).toBe('/dashboard');
    expect(safeRedirect('/earnit?assessment=1#top')).toBe('/earnit?assessment=1#top');
  });
  it('falls back for missing or relative values', () => {
    expect(safeRedirect(null, '/dashboard')).toBe('/dashboard');
    expect(safeRedirect('dashboard')).toBe('/');
  });
  it('blocks off-site redirects', () => {
    for (const bad of ['//evil.com', '/\\evil.com', '/\\/evil.com', 'https://evil.com', 'javascript:alert(1)', '/\tevil', ' //evil.com']) {
      expect(safeRedirect(bad, '/')).toBe('/');
    }
  });
});
