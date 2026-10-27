import { createStripeClient, type StripeEnv } from '../_shared/stripe.ts';
import { isPaymentPriceId } from '../_shared/paymentCatalog.ts';
import { validatePrice } from '../_shared/billingPolicy.ts';
import { billingLock,releaseBillingLock,resolveBillingCustomer } from '../_shared/billingAccount.ts';
import { corsHeaders,z,environmentSchema,db,json,userFor,validReturnUrl } from '../_shared/paymentHttp.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST')return json({error:'Method not allowed'},405);
 let lock:{userId:string;environment:StripeEnv;token:string}|undefined;
 try{
  const user=await userFor(req);const parsed=z.object({priceId:z.string(),environment:environmentSchema,returnUrl:z.string().url()}).safeParse(await req.json());
  if(!parsed.success)return json({error:'Invalid checkout details'},400);
  const {priceId,environment,returnUrl}=parsed.data;if(!isPaymentPriceId(priceId))return json({error:'Unknown purchase'},400);validReturnUrl(returnUrl);
  lock={userId:user.id,environment,token:await billingLock(user.id,environment)};
  const stripe=createStripeClient(environment),customer=await resolveBillingCustomer(stripe,environment,user);
  const prices=await stripe.prices.list({lookup_keys:[priceId],active:true,limit:1});const price=prices.data[0];if(!price)throw new Error('Price unavailable');const item=validatePrice(price,priceId);
  const subscriptions=await stripe.subscriptions.list({customer,status:'all',limit:100});
  const active=subscriptions.data.filter(s=>['active','trialing','past_due','incomplete','paused','unpaid'].includes(s.status));
  if(item.recurring&&active.length)return json({error:'You already have a subscription. Change your plan in Account Settings.'},409);
  if(!item.recurring){const {data:paid,error}=await db().from('payment_subscriptions').select('paid_period_end').eq('user_id',user.id).eq('environment',environment).gt('paid_period_end',new Date().toISOString()).limit(1);if(error)throw error;if(!paid?.length)return json({error:'A current paid subscription is required for extra Tool Credits.'},403);}
  const {data:account,error}=await db().from('billing_accounts').select('pending_session_id,pending_price_id').eq('user_id',user.id).eq('environment',environment).single();if(error)throw error;
  if(account.pending_session_id){const existing=await stripe.checkout.sessions.retrieve(account.pending_session_id);if(existing.status==='open'){if(account.pending_price_id===priceId)return json({clientSecret:existing.client_secret});await stripe.checkout.sessions.expire(existing.id);}else if(existing.status==='complete'&&existing.payment_status==='unpaid')return json({error:'Your previous payment is still pending. Wait for confirmation before buying again.'},409);}
  const product=await stripe.products.retrieve(typeof price.product==='string'?price.product:price.product.id);
  const sessionParams:NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>{customer,line_items:[{price:price.id,quantity:1}],mode:item.recurring?'subscription':'payment',ui_mode:'embedded_page',return_url:returnUrl,metadata:{userId:user.id,priceId,managed_payments:'true',packEligibilityConfirmed:!item.recurring?'true':'false'},...(item.recurring?{subscription_data:{metadata:{userId:user.id,priceId}}}:{payment_intent_data:{description:product.name,metadata:{userId:user.id,priceId}}})};
  // managed_payments is sent by the pinned API version but missing from the installed SDK types.
  (sessionParams as unknown as Record<string,unknown>).managed_payments={enabled:true};
  const session=await stripe.checkout.sessions.create(sessionParams,{idempotencyKey:`checkout:${environment}:${user.id}:${lock.token}`});
  const {error:save}=await db().from('billing_accounts').update({pending_session_id:session.id,pending_price_id:priceId}).eq('user_id',user.id).eq('environment',environment);if(save)throw save;
  return json({clientSecret:session.client_secret});
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to start checkout'},500);}
 finally{if(lock)await releaseBillingLock(lock.userId,lock.environment,lock.token).catch(e=>console.error('Billing lock release failed',e.message));}
});
