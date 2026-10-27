import { corsHeaders,db,json,userFor,z,environmentSchema } from '../_shared/paymentHttp.ts';
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 try{
  const user=await userFor(req);
  const parsed=z.object({environment:environmentSchema}).safeParse(await req.json());
  if(!parsed.success)return json({error:'Invalid environment'},400);
  const {data,error}=await db().from('payment_subscriptions').select('price_id,status,current_period_end,cancel_at_period_end').eq('user_id',user.id).eq('environment',parsed.data.environment).order('updated_at',{ascending:false});
  if(error)throw error;
  const sub=data?.find(s=>['active','trialing','past_due'].includes(s.status) && (!s.current_period_end || new Date(s.current_period_end).getTime()>Date.now()));
  const plans:Record<string,string>={starter_monthly:'starter',pro_monthly:'pro',all_access_monthly:'all-access'};
  return json({subscribed:!!sub,subscription_tier:sub?plans[sub.price_id]:null,subscription_package:sub?plans[sub.price_id]:null,subscription_end:sub?.current_period_end ?? null,cancel_at_period_end:sub?.cancel_at_period_end ?? false});
 }catch(error){return json({error:error instanceof Error?error.message:'Unable to check subscription'},401);}
});
