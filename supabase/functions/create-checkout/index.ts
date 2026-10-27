import { createStripeClient } from '../_shared/stripe.ts';
import { paymentCatalog, isPaymentPriceId } from '../_shared/paymentCatalog.ts';
import { corsHeaders, z, environmentSchema, db, json, userFor, validReturnUrl } from '../_shared/paymentHttp.ts';
async function resolveOrCreateCustomer(stripe: ReturnType<typeof createStripeClient>, options: { email?: string; userId?: string }): Promise<string> {
 if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error('Invalid userId');
 if (options.userId) {
  const found=await stripe.customers.search({query:`metadata['userId']:'${options.userId}'`,limit:1});
  if(found.data.length) return found.data[0].id;
 }
 if(options.email) {
  const existing=await stripe.customers.list({email:options.email,limit:1});
  if(existing.data.length) {
   const customer=existing.data[0];
   if(options.userId && customer.metadata?.userId!==options.userId) await stripe.customers.update(customer.id,{metadata:{...customer.metadata,userId:options.userId}});
   return customer.id;
  }
 }
 const created=await stripe.customers.create({...(options.email && {email:options.email}),...(options.userId && {metadata:{userId:options.userId}})});
 return created.id;
}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
 if(req.method!=='POST') return json({error:'Method not allowed'},405);
 try {
  const user=await userFor(req);
  const parsed=z.object({priceId:z.string(),environment:environmentSchema,returnUrl:z.string().url()}).safeParse(await req.json());
  if(!parsed.success) return json({error:'Invalid checkout details'},400);
  const {priceId,environment,returnUrl}=parsed.data;
  if(!isPaymentPriceId(priceId)) return json({error:'Unknown purchase'},400);
  validReturnUrl(returnUrl);
  const item=paymentCatalog[priceId];
  const stripe=createStripeClient(environment);
  const customer=await resolveOrCreateCustomer(stripe,{email:user.email,userId:user.id});
  const subscriptions=await stripe.subscriptions.list({customer,status:'all',limit:100});
  const active=subscriptions.data.filter(s=>['active','trialing','past_due','incomplete'].includes(s.status));
  if(item.recurring && active.length) return json({error:'You already have a subscription. Manage it from Account Settings instead of starting another.'},409);
  if(!item.recurring && !active.some(s=>['active','trialing','past_due'].includes(s.status))) return json({error:'An active paid subscription is required for extra Tool Credits.'},403);
  const prices=await stripe.prices.list({lookup_keys:[priceId],active:true,limit:1});
  const price=prices.data[0];
  if(!price || price.unit_amount!==item.amount || price.currency!=='usd') throw new Error('Purchase pricing is unavailable. Please contact support.');
  const product=await stripe.products.retrieve(typeof price.product==='string'?price.product:price.product.id);
  const session=await stripe.checkout.sessions.create({
   customer,line_items:[{price:price.id,quantity:1}],mode:item.recurring?'subscription':'payment',ui_mode:'embedded_page',return_url:returnUrl,
   managed_payments:{enabled:true},metadata:{userId:user.id,priceId,managed_payments:'true'},
   ...(item.recurring?{subscription_data:{metadata:{userId:user.id,priceId}}}:{payment_intent_data:{description:product.name}}),
  });
  return json({clientSecret:session.client_secret});
 }catch(error){ const message=error instanceof Error?error.message:'Unable to start checkout';console.error('Checkout failed',message);return json({error:message},message.includes('sign in')?401:500); }
});
