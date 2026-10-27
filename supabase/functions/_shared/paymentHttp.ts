import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
export { corsHeaders, z };
export const environmentSchema = z.enum(['sandbox','live']);
export function db() { return createClient(Deno.env.get('SUPABASE_URL') ?? '',Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',{auth:{persistSession:false}}); }
export function json(data: unknown,status=200) { return new Response(JSON.stringify(data),{status,headers:{...corsHeaders,'Content-Type':'application/json'}}); }
export async function userFor(req: Request) {
 const token=req.headers.get('Authorization')?.replace(/^Bearer /i,'');
 if (!token) throw new Error('Please sign in to continue.');
 const {data,error}=await db().auth.getUser(token);
 if(error || !data.user) throw new Error('Please sign in to continue.');
 return data.user;
}
export function validReturnUrl(value: string) {
 const url=new URL(value);
 const allowed=new Set(['http://localhost:8080','https://pivothub.io','https://www.pivothub.io','https://pivothub.lovable.app','https://id-preview--6269a448-ef4f-443f-95b6-1a69bd7c809c.lovable.app']);
 if(!allowed.has(url.origin)) throw new Error('Invalid return address.');
 return value;
}
