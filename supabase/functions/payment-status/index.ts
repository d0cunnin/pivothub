import { createStripeClient } from '../_shared/stripe.ts';
import { fulfillSession } from '../_shared/paymentFulfillment.ts';
import { corsHeaders,z,environmentSchema,db,json,userFor } from '../_shared/paymentHttp.ts';
import {billingLock,releaseBillingLock} from '../_shared/billingAccount.ts';
import type {StripeEnv} from '../_shared/stripe.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 let lock:{userId:string;environment:StripeEnv;token:string}|undefined;
 try{
  const user=await userFor(req);
  const parsed=z.object({environment:environmentSchema,sessionId:z.string().regex(/^cs_[A-Za-z0-9_]+$/)}).safeParse(await req.json());
  if(!parsed.success)return json({error:'Invalid payment reference'},400);
  const {environment,sessionId}=parsed.data;
  const session=await createStripeClient(environment).checkout.sessions.retrieve(sessionId);
  if(session.metadata?.userId!==user.id)return json({error:'Payment not found'},404);
  lock={userId:user.id,environment,token:await billingLock(user.id,environment)};
  await fulfillSession(session,environment);
  const {data,error}=await db().from('payment_credit_receipts').select('credits').eq('user_id',user.id).eq('environment',environment).eq('payment_key',session.mode==='subscription'?`invoice:${typeof session.invoice==='string'?session.invoice:session.invoice?.id}`:`checkout:${session.id}`).maybeSingle();
  if(error)throw error;
  return json({status:session.status,paymentStatus:session.payment_status,credits:data?.credits ?? 0,environment});
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to confirm payment'},500);}finally{if(lock)await releaseBillingLock(lock.userId,lock.environment,lock.token).catch(()=>{});}
});
