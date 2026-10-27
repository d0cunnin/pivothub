import {db,json} from '../_shared/paymentHttp.ts';
Deno.serve(async(req)=>{
 const token=(req.headers.get('Authorization')??'').replace(/^Bearer\s+/i,'');if(!token||token!==Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))return json({error:'Forbidden'},403);
 const {error}=await db().rpc('reset_monthly_ai_requests');return error?json({error:'Credit refresh failed'},500):json({refreshed:true});
});
