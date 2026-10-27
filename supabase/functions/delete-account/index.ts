import {createStripeClient} from '../_shared/stripe.ts';
import {billingLock,releaseBillingLock} from '../_shared/billingAccount.ts';
import {corsHeaders,z,db,json,userFor} from '../_shared/paymentHttp.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});if(req.method!=='POST')return json({error:'Method not allowed'},405);
 const locks:Array<{environment:'sandbox'|'live';token:string;userId:string}>=[];
 try{
  const user=await userFor(req);const body=z.object({confirmation:z.literal('DELETE'),reason:z.string().max(500).optional()}).safeParse(await req.json());if(!body.success)return json({error:'Type DELETE to confirm'},400);
  const {data:admin,error:roleError}=await db().from('user_roles').select('role').eq('user_id',user.id).eq('role','admin').maybeSingle();if(roleError)throw roleError;if(admin)return json({error:'Administrator accounts cannot be deleted here. Contact support for account ownership changes.'},403);
  for(const environment of ['sandbox','live'] as const){
   const token=await billingLock(user.id,environment);locks.push({environment,token,userId:user.id});const stripe=createStripeClient(environment);
   const {data:account,error}=await db().from('billing_accounts').select('stripe_customer_id,pending_session_id').eq('user_id',user.id).eq('environment',environment).maybeSingle();if(error)throw error;
   const customers=await stripe.customers.search({query:`metadata['userId']:'${user.id}'`,limit:100});const ids=new Set(customers.data.map(c=>c.id));if(account?.stripe_customer_id)ids.add(account.stripe_customer_id);
   const {data:legacy,error:legacyError}=await db().from('subscribers_secure').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();if(legacyError)throw legacyError;
   if(legacy?.stripe_customer_id&&!ids.has(legacy.stripe_customer_id)&&environment==='live')throw new Error('Legacy billing requires support review before deletion. No data has been deleted.');
   if(account?.pending_session_id){const session=await stripe.checkout.sessions.retrieve(account.pending_session_id);if(session.status==='open')await stripe.checkout.sessions.expire(session.id);if(session.status==='complete'&&session.payment_status==='unpaid')throw new Error('A payment is pending. Contact support before deleting your account.');}
   for(const id of ids){const customer=await stripe.customers.retrieve(id);if(customer.deleted||customer.metadata.userId!==user.id)throw new Error('Billing ownership cannot be verified');const list=await stripe.subscriptions.list({customer:id,status:'all',limit:100});for(const sub of list.data){if(sub.schedule)await stripe.subscriptionSchedules.cancel(typeof sub.schedule==='string'?sub.schedule:sub.schedule.id);else if(!['canceled','incomplete_expired'].includes(sub.status))await stripe.subscriptions.cancel(sub.id);}}
  }
  const {error:cleanup}=await db().rpc('delete_my_account_content',{p_user_id:user.id});if(cleanup)throw cleanup;
  const {error}=await db().auth.admin.deleteUser(user.id);if(error)throw error;return json({success:true,message:'Your account and saved content were deleted. Required financial and security records may be retained.'});
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to delete account safely'},500);}finally{for(const lock of locks)await releaseBillingLock(lock.userId,lock.environment,lock.token).catch(()=>{});}
});
