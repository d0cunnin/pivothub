export const ADMIN_CREDIT_PLANS = { starter: 40, pro: 100, 'all-access': 250 } as const;
export const ADMIN_CREDIT_DURATIONS = [1, 3, 6, 12] as const;
export const MAX_CUSTOM_CREDITS = 100000;

export function monthlyAdminCredits(plan: string, customCredits?: number): number {
  if (plan === 'custom' && Number.isInteger(customCredits) && (customCredits ?? 0) > 0 && (customCredits ?? 0) <= MAX_CUSTOM_CREDITS) return customCredits ?? 0;
  if (plan in ADMIN_CREDIT_PLANS) return ADMIN_CREDIT_PLANS[plan as keyof typeof ADMIN_CREDIT_PLANS];
  throw new Error('Choose a valid plan or a whole-number custom credit amount.');
}

export function validAdminDuration(months: number): boolean {
  return ADMIN_CREDIT_DURATIONS.some(value => value === months);
}