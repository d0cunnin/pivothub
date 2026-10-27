export const paymentCatalog = {
  starter_monthly: { name: 'Starter', credits: 40, amount: 1200, recurring: true, plan: 'starter' },
  pro_monthly: { name: 'Pro', credits: 100, amount: 2400, recurring: true, plan: 'pro' },
  all_access_monthly: { name: 'All-Access', credits: 250, amount: 4900, recurring: true, plan: 'all-access' },
  small_pack: { name: 'Small Pack', credits: 25, amount: 500, recurring: false, plan: null },
  boost_pack: { name: 'Boost Pack', credits: 70, amount: 1000, recurring: false, plan: null },
  power_pack: { name: 'Power Pack', credits: 150, amount: 2000, recurring: false, plan: null },
} as const;
export type PaymentPriceId = keyof typeof paymentCatalog;
export function isPaymentPriceId(id: string): id is PaymentPriceId { return Object.prototype.hasOwnProperty.call(paymentCatalog, id); }
