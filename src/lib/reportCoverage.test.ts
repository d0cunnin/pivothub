import { describe, it, expect } from 'vitest';
import { itemCovered, missingItems } from '../../supabase/functions/_shared/reportCoverage';

describe('report coverage check', () => {
  const report = `## Our Understanding of You
...
## Getting Your First Sales
How to win your first clients...
## Social Media and Content
A weekly posting plan...`;

  it('finds selections the report addresses, even reworded', () => {
    expect(itemCovered('Generate first sales or clients', report)).toBe(true);
    expect(itemCovered('Social media and content plan', report)).toBe(true);
  });

  it('lists selections the report skipped', () => {
    expect(missingItems(report, ['Generate first sales or clients', 'Funding or grant opportunities', '', null])).toEqual(['Funding or grant opportunities']);
  });

  it('ignores items with no meaningful words', () => {
    expect(itemCovered('6-12', 'anything')).toBe(true);
  });
});
