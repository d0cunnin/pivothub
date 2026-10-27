import {db} from './paymentHttp.ts';
import {createStripeClient,type StripeEnv} from './stripe.ts';
import {canOwnCustomer} from './billingPolicy.ts';
export async function billingLock(userId:string,environment:StripeEnv) {
 const {data,error}=await db().rpc('acquire_billing_lock',{p_user_id:userId,p_environment:environment});
 if(error)throw error;if(!data)throw new Error('Another billing update is in progress. Please try again.');return data as string;
}
export async function releaseBillingLock(userId:string,environment:StripeEnv,token:string) {
 const {error}=await db().from('billing_accounts').update({lock_until:null,lock_token:null}).eq('user_id',userId).eq('environment',environment).eq('lock_token',token); if(error)throw error;
}
export async function resolveBillingCustomer(stripe:ReturnType<typeof createStripeClient>,environment:StripeEnv,user:{id:string;email?:string}) {
 const {data:account,error}=await db().from('billing_accounts').select('stripe_customer_id').eq('user_id',user.id).eq('environment',environment).maybeSingle();if(error)throw error;
 if(account?.stripe_customer_id){const customer=await stripe.customers.retrieve(account.stripe_customer_id);if(customer.deleted||customer.metadata.userId!==user.id)throw new Error('Billing ownership could not be verified');return customer.id;}
 const found=await stripe.customers.search({query:`metadata['userId']:'${user.id}'`,limit:1});let customer:typeof found.data[number]|undefined=found.data[0];
 if(!customer&&user.email){const legacy=await stripe.customers.list({email:user.email,limit:100});customer=legacy.data.find(c=>canOwnCustomer(c.metadata,user.id));if(customer&&!customer.metadata.userId)customer=await stripe.customers.update(customer.id,{metadata:{...customer.metadata,userId:user.id}});}
 if(!customer)customer=await stripe.customers.create({email:user.email,metadata:{userId:user.id}},{idempotencyKey:`customer:${environment}:${user.id}`});
 const {error:write}=await db().from('billing_accounts').upsert({user_id:user.id,environment,stripe_customer_id:customer.id},{onConflict:'user_id,environment'});if(write)throw write;return customer.id;
}