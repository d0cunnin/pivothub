import { paymentCatalog, isPaymentPriceId } from './paymentCatalog.ts';
export function creditExpiry(issued: Date): Date {
 const result=new Date(issued); const day=result.getUTCDate(); result.setUTCDate(1); result.setUTCMonth(result.getUTCMonth()+3);
 result.setUTCDate(Math.min(day,new Date(Date.UTC(result.getUTCFullYear(),result.getUTCMonth()+1,0)).getUTCDate())); return result;
}
export function planChange(current: string,next: string) {
 if(!isPaymentPriceId(current)||!isPaymentPriceId(next)||!paymentCatalog[current].recurring||!paymentCatalog[next].recurring)throw new Error('Invalid subscription plan');
 const delta=paymentCatalog[next].credits-paymentCatalog[current].credits;
 return {upgrade:delta>0,creditDelta:Math.max(0,delta),effective:delta>0?'after_payment':'period_end'} as const;
}
export function validatePrice(price: any,id: string) {
 if(!isPaymentPriceId(id))throw new Error('Unknown purchase'); const item=paymentCatalog[id];
 if(price.unit_amount!==item.amount||price.currency!=='usd'||price.billing_scheme!=='per_unit'||price.type!==(item.recurring?'recurring':'one_time')||price.transform_quantity||item.recurring&&(price.recurring?.interval!=='month'||price.recurring?.interval_count!==1||price.recurring?.usage_type!=='licensed'))throw new Error('Purchase pricing or billing interval is unavailable. Please contact support.');
 return item;
}
export function canOwnCustomer(metadata: {userId?:string},userId:string) { return !metadata.userId||metadata.userId===userId; }
export function shouldGrantInvoice(reason:string) { return ['subscription_create','subscription_cycle','subscription_update'].includes(reason); }