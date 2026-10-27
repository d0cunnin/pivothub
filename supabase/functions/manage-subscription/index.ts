import {createStripeClient,type StripeEnv} from '../_shared/stripe.ts';
import {syncSubscription} from '../_shared/paymentFulfillment.ts';
import {billingLock,releaseBillingLock,resolveBillingCustomer} from '../_shared/billingAccount.ts';
import {planChange,validatePrice} from '../_shared/billingPolicy.ts';
import {paymentCatalog,isPaymentPriceId} from '../_shared/paymentCatalog.ts';
import {corsHeaders,z,environmentSchema,json,userFor,validReturnUrl,db} from '../_shared/paymentHttp.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});if(req.method!=='POST')return json({error:'Method not allowed'},405);
 let lock:{userId:string;environment:StripeEnv;token:string}|undefined;
 try{
  const user=await userFor(req),parsed=z.object({environment:environmentSchema,action:z.enum(['cancel','portal','preview','change','resume']),priceId:z.string().optional(),previewToken:z.string().optional(),returnUrl:z.string().url().optional()}).safeParse(await req.json());if(!parsed.success)return json({error:'Invalid request'},400);
  const {environment,action,priceId,returnUrl,previewToken}=parsed.data;lock={userId:user.id,environment,token:await billingLock(user.id,environment)};
  const stripe=createStripeClient(environment),customer=await resolveBillingCustomer(stripe,environment,user);
  if(action==='portal'){
   const configs=await stripe.billingPortal.configurations.list({active:true,limit:100});let config=configs.data.find(c=>c.metadata?.pivothub==='history_only');
   if(!config)config=await stripe.billingPortal.configurations.create({metadata:{pivothub:'history_only'},features:{invoice_history:{enabled:true},payment_method_update:{enabled:true},subscription_cancel:{enabled:false},subscription_update:{enabled:false}}});
   return json({url:(await stripe.billingPortal.sessions.create({customer,configuration:config.id,...(returnUrl?{return_url:validReturnUrl(returnUrl)}:{})})).url});
  }
  const list=await stripe.subscriptions.list({customer,status:'all',limit:100}),active=list.data.filter(s=>['active','past_due','trialing','incomplete','unpaid','paused'].includes(s.status));
  if(active.length!==1)return json({error:'No single active subscription found. Contact support if billing needs review.'},409);let sub=active[0];
  const item=sub.items.data[0];if(!item)throw new Error('Subscription item missing');
  if(action==='cancel'||action==='resume'){
   if(sub.schedule){await stripe.subscriptionSchedules.release(typeof sub.schedule==='string'?sub.schedule:sub.schedule.id);sub=await stripe.subscriptions.retrieve(sub.id);}
   await syncSubscription(await stripe.subscriptions.update(sub.id,{cancel_at_period_end:action==='cancel'},{idempotencyKey:`${action}:${environment}:${sub.id}:${lock.token}`}),environment);
   await db().from('payment_subscriptions').update({pending_price_id:null,pending_effective_at:null}).eq('environment',environment).eq('stripe_subscription_id',sub.id);
   return json({cancelled:action==='cancel',effectiveDate:new Date(item.current_period_end*1000).toISOString()});
  }
  const current=item.price.lookup_key??item.price.metadata?.lovable_external_id;if(!isPaymentPriceId(current)||!priceId||!isPaymentPriceId(priceId))throw new Error('Invalid plan');
  if(priceId===current)return json({error:'You are already on this plan'},409);if(sub.status!=='active'||sub.pending_update)throw new Error('Resolve your pending or overdue payment before changing plans');
  const direction=planChange(current,priceId),prices=await stripe.prices.list({lookup_keys:[priceId],active:true,limit:1}),price=prices.data[0];if(!price)throw new Error('New price unavailable');validatePrice(price,priceId);
  if(sub.schedule)throw new Error('A plan change is already scheduled. Cancel the scheduled change before choosing another plan.');
  if(action==='preview'){
   const timestamp=Math.floor(Date.now()/1000);let amount=0;
   if(direction.upgrade){const preview=await stripe.invoices.createPreview({customer,subscription:sub.id,subscription_details:{items:[{id:item.id,price:price.id}],proration_behavior:'always_invoice',proration_date:timestamp}});amount=preview.amount_due;}
   const payload={subId:sub.id,current,next:priceId,timestamp,amount};const encoded=btoa(JSON.stringify(payload));const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(Deno.env.get('LOVABLE_API_KEY')??''),{name:'HMAC',hash:'SHA-256'},false,['sign']);const signature=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(encoded)))).map(v=>v.toString(16).padStart(2,'0')).join('');
   return json({currentPlan:paymentCatalog[current].name,newPlan:paymentCatalog[priceId].name,effectiveDate:direction.upgrade?'After payment confirmation':new Date(item.current_period_end*1000).toISOString(),chargeCents:amount,creditDelta:direction.creditDelta,newAllowance:paymentCatalog[priceId].credits,cancelAtPeriodEnd:sub.cancel_at_period_end,previewToken:encoded+'.'+signature});
  }
  if(!previewToken)throw new Error('Review your plan change first');const [encoded,signature]=previewToken.split('.');const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(Deno.env.get('LOVABLE_API_KEY')??''),{name:'HMAC',hash:'SHA-256'},false,['sign']);const expected=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(encoded)))).map(v=>v.toString(16).padStart(2,'0')).join('');if(expected!==signature)throw new Error('Invalid plan review');const review=JSON.parse(atob(encoded));if(review.subId!==sub.id||review.current!==current||review.next!==priceId||Math.abs(Date.now()/1000-review.timestamp)>300)throw new Error('Plan review expired. Review the charges again.');
  if(direction.upgrade){sub=await stripe.subscriptions.update(sub.id,{items:[{id:item.id,price:price.id}],proration_behavior:'always_invoice',proration_date:review.timestamp,payment_behavior:'pending_if_incomplete'},{idempotencyKey:`upgrade:${environment}:${sub.id}:${review.timestamp}:${priceId}`});await syncSubscription(sub,environment);return json({updated:!sub.pending_update,paymentPending:!!sub.pending_update});}
  const schedule=await stripe.subscriptionSchedules.create({from_subscription:sub.id},{idempotencyKey:`schedule:${environment}:${sub.id}:${review.timestamp}`});const phase=schedule.phases[0];if(!phase)throw new Error('Billing phase unavailable');
  await stripe.subscriptionSchedules.update(schedule.id,{end_behavior:'release',phases:[{start_date:phase.start_date,end_date:item.current_period_end,items:[{price:item.price.id,quantity:1}],proration_behavior:'none'},{items:[{price:price.id,quantity:1}],duration:{interval:'month',interval_count:1},proration_behavior:'none'}]});
  const {error}=await db().from('payment_subscriptions').update({pending_price_id:priceId,pending_effective_at:new Date(item.current_period_end*1000).toISOString()}).eq('environment',environment).eq('stripe_subscription_id',sub.id);if(error)throw error;return json({scheduled:true,effectiveDate:new Date(item.current_period_end*1000).toISOString()});
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to manage subscription'},500);}finally{if(lock)await releaseBillingLock(lock.userId,lock.environment,lock.token).catch(()=>{});}
});
