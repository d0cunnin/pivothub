import {createStripeClient,type StripeEnv} from './stripe.ts';
import {db} from './paymentHttp.ts';
import {paymentCatalog,isPaymentPriceId} from './paymentCatalog.ts';
import {validatePrice,shouldGrantInvoice} from './billingPolicy.ts';
const identifier=(value:any):string|undefined=>typeof value==='string'?value:value?.id;
export async function syncSubscription(sub:any,env:StripeEnv){
 const userId=sub.metadata?.userId;if(!userId)throw new Error('Subscription owner missing');
 const item=sub.items?.data?.[0],priceId=item?.price?.lookup_key??item?.price?.metadata?.lovable_external_id;
 if(!isPaymentPriceId(priceId)||!paymentCatalog[priceId].recurring)throw new Error('Unknown subscription price');validatePrice(item.price,priceId);
 const customer=await createStripeClient(env).customers.retrieve(identifier(sub.customer)??'');if(customer.deleted||customer.metadata.userId!==userId)throw new Error('Subscription ownership mismatch');
 const start=item.current_period_start??sub.current_period_start,end=item.current_period_end??sub.current_period_end;
 const {error}=await db().from('payment_subscriptions').upsert({user_id:userId,environment:env,stripe_subscription_id:sub.id,stripe_customer_id:customer.id,price_id:priceId,status:sub.status,current_period_start:start?new Date(start*1000).toISOString():null,current_period_end:end?new Date(end*1000).toISOString():null,cancel_at_period_end:sub.cancel_at_period_end??false,updated_at:new Date().toISOString()},{onConflict:'environment,stripe_subscription_id'});if(error)throw error;
 return {userId,priceId,start,end};
}
export async function fulfillInvoice(invoice:any,env:StripeEnv){
 if(invoice.status!=='paid'||!shouldGrantInvoice(invoice.billing_reason))return;
 const stripe=createStripeClient(env),subscriptionId=identifier(invoice.parent?.subscription_details?.subscription??invoice.subscription);if(!subscriptionId)return;
 const sub=await stripe.subscriptions.retrieve(subscriptionId);const {userId}=await syncSubscription(sub,env);
 if(identifier(invoice.customer)!==identifier(sub.customer))throw new Error('Invoice ownership mismatch');
 const lines=[];for await(const line of stripe.invoices.listLineItems(invoice.id,{limit:100}))lines.push(line);
 const candidates=[];
 for(const line of lines){if(line.amount<0)continue;const priceId=identifier(line.pricing?.price_details?.price??(line as any).price);if(!priceId)continue;const price=await stripe.prices.retrieve(priceId);const key=price.lookup_key??price.metadata?.lovable_external_id;if(!isPaymentPriceId(key)||!paymentCatalog[key].recurring)continue;validatePrice(price,key);if(line.quantity!==1)throw new Error('Unsupported invoice quantity');candidates.push({line,key});}
 if(candidates.length!==1)throw new Error('Invoice allowance requires one verified subscription line');
 const {line,key}=candidates[0];if(!line.period?.start||!line.period?.end)throw new Error('Invoice billing period missing');
 let credits=paymentCatalog[key].credits;
 if(invoice.billing_reason==='subscription_update'){
  const negative=lines.filter(l=>l.amount<0);if(negative.length!==1)throw new Error('Upgrade invoice lacks previous plan');
  const oldId=identifier(negative[0].pricing?.price_details?.price??(negative[0] as any).price);if(!oldId)throw new Error('Upgrade previous price missing');const old=await stripe.prices.retrieve(oldId);const oldKey=old.lookup_key??old.metadata?.lovable_external_id;if(!isPaymentPriceId(oldKey))throw new Error('Upgrade previous allowance missing');credits-=paymentCatalog[oldKey].credits;if(credits<=0)return;
 }
 const paidAt=invoice.status_transitions?.paid_at??invoice.created;
 let paymentIntent=identifier(invoice.payment_intent);if(!paymentIntent){const payments=await stripe.invoicePayments.list({invoice:invoice.id,limit:10});paymentIntent=identifier(payments.data.find(p=>p.status==='paid')?.payment?.payment_intent);}
 const {error}=await db().rpc('issue_payment_grant',{p_user_id:userId,p_environment:env,p_payment_key:`invoice:${invoice.id}`,p_price_id:key,p_credits:credits,p_issued_at:new Date(paidAt*1000).toISOString(),p_period_start:new Date(line.period.start*1000).toISOString(),p_period_end:new Date(line.period.end*1000).toISOString(),p_payment_intent_id:paymentIntent??null});if(error)throw error;
}
export async function fulfillSession(session:any,env:StripeEnv){
 if(!['paid','no_payment_required'].includes(session.payment_status))return;const stripe=createStripeClient(env);
 if(session.mode==='subscription'){if(session.invoice)await fulfillInvoice(await stripe.invoices.retrieve(identifier(session.invoice)??''),env);return;}
 const {userId,priceId,packEligibilityConfirmed}=session.metadata??{};
 if(!userId||!isPaymentPriceId(priceId)||paymentCatalog[priceId].recurring||packEligibilityConfirmed!=='true')throw new Error('Purchase details missing');
 const customer=await stripe.customers.retrieve(identifier(session.customer)??'');if(customer.deleted||customer.metadata.userId!==userId)throw new Error('Purchase ownership mismatch');
 const lines=await stripe.checkout.sessions.listLineItems(session.id,{limit:2});if(lines.data.length!==1||lines.data[0].quantity!==1)throw new Error('Invalid pack line');validatePrice(lines.data[0].price,priceId);
 const {error}=await db().rpc('issue_payment_grant',{p_user_id:userId,p_environment:env,p_payment_key:`checkout:${session.id}`,p_price_id:priceId,p_credits:paymentCatalog[priceId].credits,p_issued_at:new Date(session.created*1000).toISOString(),p_payment_intent_id:identifier(session.payment_intent)??null});if(error)throw error;
}
