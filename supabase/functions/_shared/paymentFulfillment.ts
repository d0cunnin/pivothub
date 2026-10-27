import { createStripeClient, type StripeEnv } from './stripe.ts';
import { db } from './paymentHttp.ts';
import { isPaymentPriceId } from './paymentCatalog.ts';
export async function syncSubscription(sub: any, env: StripeEnv) {
 const userId=sub.metadata?.userId;
 if(!userId) throw new Error('Subscription owner missing');
 const item=sub.items?.data?.[0];
 const priceId=item?.price?.lookup_key ?? item?.price?.metadata?.lovable_external_id;
 if(!priceId || !isPaymentPriceId(priceId)) throw new Error('Unknown subscription price');
 const start=item.current_period_start ?? sub.current_period_start;
 const end=item.current_period_end ?? sub.current_period_end;
 const {error}=await db().from('payment_subscriptions').upsert({user_id:userId,environment:env,stripe_subscription_id:sub.id,stripe_customer_id:typeof sub.customer==='string'?sub.customer:sub.customer.id,price_id:priceId,status:sub.status,current_period_start:start?new Date(start*1000).toISOString():null,current_period_end:end?new Date(end*1000).toISOString():null,cancel_at_period_end:sub.cancel_at_period_end,updated_at:new Date().toISOString()},{onConflict:'environment,stripe_subscription_id'});
 if(error) throw error;
 return {userId,priceId,start,end};
}
export async function fulfillInvoice(invoice: any, env: StripeEnv) {
 if(invoice.status!=='paid') return;
 const subscriptionId=invoice.parent?.subscription_details?.subscription ?? invoice.subscription;
 if(!subscriptionId) return;
 const sub=await createStripeClient(env).subscriptions.retrieve(typeof subscriptionId==='string'?subscriptionId:subscriptionId.id);
 const {userId,priceId,start,end}=await syncSubscription(sub,env);
 const {error}=await db().rpc('fulfill_payment_credits',{p_user_id:userId,p_environment:env,p_payment_key:`invoice:${invoice.id}`,p_price_id:priceId,p_period_start:start?new Date(start*1000).toISOString():null,p_period_end:end?new Date(end*1000).toISOString():null});
 if(error) throw error;
}
export async function fulfillSession(session: any,env: StripeEnv) {
 if(!['paid','no_payment_required'].includes(session.payment_status)) return;
 const stripe=createStripeClient(env);
 if(session.mode==='subscription') {
  if(session.invoice) await fulfillInvoice(await stripe.invoices.retrieve(typeof session.invoice==='string'?session.invoice:session.invoice.id),env);
  return;
 }
 const {userId,priceId}=session.metadata ?? {};
 if(!userId || !priceId || !isPaymentPriceId(priceId)) throw new Error('Purchase details missing');
 const {error}=await db().rpc('fulfill_payment_credits',{p_user_id:userId,p_environment:env,p_payment_key:`checkout:${session.id}`,p_price_id:priceId});
 if(error) throw error;
}
