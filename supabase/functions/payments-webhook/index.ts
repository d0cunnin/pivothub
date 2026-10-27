import {verifyWebhook,createStripeClient} from '../_shared/stripe.ts';
import {syncSubscription,fulfillInvoice,fulfillSession} from '../_shared/paymentFulfillment.ts';
import {corsHeaders,json,db} from '../_shared/paymentHttp.ts';
import {billingLock,releaseBillingLock} from '../_shared/billingAccount.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const env=new URL(req.url).searchParams.get('env');if(env!=='sandbox'&&env!=='live')return json({error:'Invalid environment'},400);
 let event;try{event=await verifyWebhook(req,env);}catch{return json({error:'Invalid signature'},400);}
 let lock:{userId:string;token:string}|undefined;
 try{
  const object=event.data.object;const stripe=createStripeClient(env);
  let customerId=typeof object.customer==='string'?object.customer:object.customer?.id;
  if(!customerId&&object.charge){const charge=await stripe.charges.retrieve(typeof object.charge==='string'?object.charge:object.charge.id);customerId=typeof charge.customer==='string'?charge.customer:charge.customer?.id;}
  if(customerId){const customer=await stripe.customers.retrieve(customerId);if(!customer.deleted&&customer.metadata.userId)lock={userId:customer.metadata.userId,token:await billingLock(customer.metadata.userId,env)};}
  const {data:done,error:read}=await db().from('payment_event_receipts').select('event_id').eq('environment',env).eq('event_id',event.id).maybeSingle();if(read)throw read;if(done)return json({received:true,duplicate:true});
  if(event.type.startsWith('customer.subscription.'))await syncSubscription(await stripe.subscriptions.retrieve(object.id),env);
  else if(event.type==='invoice.paid')await fulfillInvoice(await stripe.invoices.retrieve(object.id),env);
  else if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type))await fulfillSession(await stripe.checkout.sessions.retrieve(object.id),env);
  else if(['checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type)){const {error}=await db().from('billing_accounts').update({pending_session_id:null,pending_price_id:null}).eq('environment',env).eq('pending_session_id',object.id);if(error)throw error;}
  else if(['charge.refunded','charge.refund.updated','refund.updated','refund.created'].includes(event.type)){
   const charge=await stripe.charges.retrieve(typeof object.charge==='string'?object.charge:object.object==='charge'?object.id:object.charge?.id);
   for await(const refund of stripe.refunds.list({charge:charge.id,limit:100})){if(refund.status!=='succeeded')continue;const {error}=await db().rpc('reconcile_credit_refund',{p_environment:env,p_refund_id:refund.id,p_payment_intent_id:typeof charge.payment_intent==='string'?charge.payment_intent:charge.payment_intent?.id,p_fraction:refund.amount/charge.amount});if(error)throw error;}
  }else if(event.type.startsWith('charge.dispute.')){const {error}=await db().from('billing_reviews').upsert({environment:env,provider_key:object.id,reason:'Payment dispute requires review',details:{status:object.status,charge:object.charge}},{onConflict:'environment,provider_key'});if(error)throw error;}
  else if(event.type==='invoice.payment_failed'){const subscription=object.parent?.subscription_details?.subscription??object.subscription;if(subscription)await syncSubscription(await stripe.subscriptions.retrieve(typeof subscription==='string'?subscription:subscription.id),env);}
  const {error}=await db().from('payment_event_receipts').upsert({environment:env,event_id:event.id,event_type:event.type},{onConflict:'environment,event_id'});if(error)throw error;
  return json({received:true});
 }catch(error){console.error('Payment processing failed',error instanceof Error?error.message:error);return json({error:'Payment processing pending retry'},500);}finally{if(lock)await releaseBillingLock(lock.userId,env,lock.token).catch(()=>{});}
});
