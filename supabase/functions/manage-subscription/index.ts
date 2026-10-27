import { createStripeClient } from '../_shared/stripe.ts';
import { syncSubscription } from '../_shared/paymentFulfillment.ts';
import { corsHeaders,z,environmentSchema,json,userFor,validReturnUrl } from '../_shared/paymentHttp.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 try{
  const user=await userFor(req);
  const parsed=z.object({environment:environmentSchema,action:z.enum(['cancel','portal']),returnUrl:z.string().url().optional()}).safeParse(await req.json());
  if(!parsed.success)return json({error:'Invalid request'},400);
  const {environment,action,returnUrl}=parsed.data;
  const stripe=createStripeClient(environment);
  const customers=await stripe.customers.search({query:`metadata['userId']:'${user.id}'`,limit:1});
  const customer=customers.data[0];
  if(!customer)return json({error:'No billing account found'},404);
  if(action==='portal')return json({url:(await stripe.billingPortal.sessions.create({customer:customer.id,...(returnUrl?{return_url:validReturnUrl(returnUrl)}:{})})).url});
  const list=await stripe.subscriptions.list({customer:customer.id,status:'all',limit:100});
  const active=list.data.filter(s=>['active','past_due','trialing'].includes(s.status));
  if(!active.length)return json({error:'No active subscription found'},404);
  for(const sub of active)await syncSubscription(await stripe.subscriptions.update(sub.id,{cancel_at_period_end:true}),environment);
  return json({cancelled:true});
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to manage subscription'},500);}
});
