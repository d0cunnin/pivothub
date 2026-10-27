import {useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {supabase} from '@/integrations/supabase/client';
import {Button} from './ui/button';
import {Input} from './ui/input';
import {Label} from './ui/label';
import {useToast} from './ui/use-toast';
export function IdentitySettings(){
 const {user}=useAuth(),{toast}=useToast();const [name,setName]=useState(user?.user_metadata?.display_name??''),[email,setEmail]=useState(user?.email??''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false);
 async function save(kind:'name'|'email'|'password'){
  setBusy(true);try{if(kind==='password'&&!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password))throw new Error('Use at least 10 characters with uppercase, lowercase, a number, and a symbol.');
   if(kind==='name'){const {error}=await supabase.from('profiles').update({display_name:name.trim()}).eq('id',user?.id??'');if(error)throw error;}
   const {error}=await supabase.auth.updateUser(kind==='name'?{data:{display_name:name.trim()}}:kind==='email'?{email:email.trim()}:{password},{emailRedirectTo:window.location.origin+'/auth/callback'});if(error)throw error;
   setPassword('');toast({title:kind==='email'?'Confirm Email Change':'Account Updated',description:kind==='email'?'Follow the confirmation instructions sent to your email addresses.':'Your changes have been saved.'});
  }catch(e){toast({title:'Account Update Unavailable',description:e instanceof Error?e.message:'Please sign in again and retry.',variant:'destructive'});}finally{setBusy(false);}
 }
 return <section className="space-y-4"><h2 className="text-xl font-semibold">Your Account</h2><div className="space-y-2"><Label htmlFor="account-name">Display name</Label><Input id="account-name" value={name} maxLength={100} onChange={e=>setName(e.target.value)}/><Button variant="outline" disabled={busy||!name.trim()} onClick={()=>save('name')}>Save Name</Button></div><div className="space-y-2"><Label htmlFor="account-email">Email</Label><Input id="account-email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/><Button variant="outline" disabled={busy||email===user?.email} onClick={()=>save('email')}>Change Email</Button></div><div className="space-y-2"><Label htmlFor="account-password">New password</Label><Input id="account-password" type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/><Button variant="outline" disabled={busy||!password} onClick={()=>save('password')}>Change Password</Button></div></section>;
}