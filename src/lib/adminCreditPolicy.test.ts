import { describe, expect, it } from 'vitest';
import { monthlyAdminCredits, validAdminDuration } from '../../supabase/functions/_shared/adminCreditPolicy';

describe('complimentary Tool Credits', () => {
  it('gives Starter 40 monthly credits', () => expect(monthlyAdminCredits('starter')).toBe(40));
  it('gives Pro 100 monthly credits', () => expect(monthlyAdminCredits('pro')).toBe(100));
  it('gives All-Access 250 monthly credits', () => expect(monthlyAdminCredits('all-access')).toBe(250));
  it('accepts custom monthly credits', () => expect(monthlyAdminCredits('custom', 73)).toBe(73));
  it('supports only 1, 3, 6 and 12 months', () => {
    expect([1, 3, 6, 12].map(validAdminDuration)).toEqual([true, true, true, true]);
    expect([0, 2, 4, 24].map(validAdminDuration)).toEqual([false, false, false, false]);
  });
  it('rejects invalid custom allowances', () => {
    for (const credits of [undefined, 0, -1, 1.5, 100001]) expect(() => monthlyAdminCredits('custom', credits)).toThrow();
  });
});