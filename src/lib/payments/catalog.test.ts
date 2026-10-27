import { describe,it,expect } from 'vitest';
import { paymentCatalog, isPaymentPriceId } from '../../../supabase/functions/_shared/paymentCatalog';
describe('Purchase credit and price rules',()=>{
 it('Starter provides 40 monthly Tool Credits for $12',()=>{expect(paymentCatalog.starter_monthly).toMatchObject({credits:40,amount:1200,recurring:true});});
 it('Pro provides 100 monthly Tool Credits for $24',()=>{expect(paymentCatalog.pro_monthly).toMatchObject({credits:100,amount:2400,recurring:true});});
 it('All-Access provides 250 monthly Tool Credits for $35',()=>{expect(paymentCatalog.all_access_monthly).toMatchObject({credits:250,amount:3500,recurring:true});});
 it('Small Pack provides 25 credits for $5 once',()=>{expect(paymentCatalog.small_pack).toMatchObject({credits:25,amount:500,recurring:false});});
 it('Boost Pack provides 70 credits for $10 once',()=>{expect(paymentCatalog.boost_pack).toMatchObject({credits:70,amount:1000,recurring:false});});
 it('Power Pack provides 150 credits for $20 once',()=>{expect(paymentCatalog.power_pack).toMatchObject({credits:150,amount:2000,recurring:false});});
 it('rejects unknown purchases',()=>{expect(isPaymentPriceId('__proto__')).toBe(false);expect(isPaymentPriceId('starter_monthly')).toBe(true);});
});
