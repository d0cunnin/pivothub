import {describe,it,expect} from 'vitest';
import {creditExpiry,planChange,validatePrice,canOwnCustomer,shouldGrantInvoice} from '../../../supabase/functions/_shared/billingPolicy';
describe('Billing lifecycle rules',()=>{
 it('paid credits expire three calendar months after issue',()=>expect(creditExpiry(new Date('2026-10-27T05:00:00Z')).toISOString()).toBe('2027-01-27T05:00:00.000Z'));
 it('three month expiry clamps month-end dates',()=>expect(creditExpiry(new Date('2026-01-31T00:00:00Z')).toISOString()).toBe('2026-04-30T00:00:00.000Z'));
 it('Starter to Pro grants 60 additional credits only after payment',()=>expect(planChange('starter_monthly','pro_monthly')).toEqual({upgrade:true,creditDelta:60,effective:'after_payment'}));
 it('Pro to Starter preserves paid access until period end',()=>expect(planChange('pro_monthly','starter_monthly')).toEqual({upgrade:false,creditDelta:0,effective:'period_end'}));
 it('never transfers a customer owned by another account',()=>expect(canOwnCustomer({userId:'other'},'current')).toBe(false));
 it('rejects yearly billing for the monthly Starter price',()=>expect(()=>validatePrice({unit_amount:1200,currency:'usd',billing_scheme:'per_unit',type:'recurring',recurring:{interval:'year',interval_count:1,usage_type:'licensed'}},'starter_monthly')).toThrow());
 it('does not grant monthly allowances on manual invoices',()=>expect(shouldGrantInvoice('manual')).toBe(false));
});