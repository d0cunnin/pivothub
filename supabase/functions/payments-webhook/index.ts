import { verifyWebhook } from '../_shared/stripe.ts';
import { syncSubscription, fulfillInvoice, fulfillSession } from '../_shared/paymentFulfillment.ts';
import { corsHeaders, json } from '../_shared/paymentHttp.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const env=new URL(req.url).searchParams.get('env');
 if(env!=='sandbox' && env!=='live')return json({error:'Invalid environment'},400);
 let event;
 try{event=await verifyWebhook(req,env);}catch(error){console.error('Webhook signature rejected');return json({error:'Invalid signature'},400);}
 try{
  if(event.type.startsWith('customer.subscription.')) {
   const stripe=(await import('../_shared/stripe.ts')).createStripeClient(env);
   await syncSubscription(await stripe.subscriptions.retrieve(event.data.object.id),env);
  } else if(event.type==='invoice.paid') await fulfillInvoice(event.data.object,env);
  else if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)) await fulfillSession(event.data.object,env);
  return json({received:true});
 }catch(error){console.error('Payment fulfillment failed',error instanceof Error?error.message:'Unknown failure');return json({error:'Payment fulfillment pending retry'},500);}
});
