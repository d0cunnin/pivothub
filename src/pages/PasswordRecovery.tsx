import {useState,useEffect} from 'react';
import {supabase} from '@/integrations/supabase/client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useNavigate} from 'react-router-dom';
export default function PasswordRecovery(){
 const [password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false);const navigate=useNavigate();
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setReady(!!data.session);if(!data.session)setMessage('Open the password reset link from your email.');});const {data}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'&&session)setReady(true);});return()=>data.subscription.unsubscribe();},[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password)){setMessage('Use at least 10 characters with uppercase, lowercase, a number, and a symbol.');return;}setBusy(true);const {error}=await supabase.auth.updateUser({password});setBusy(false);if(error)setMessage(error.message);else{setPassword('');await supabase.auth.signOut();navigate('/auth');}}
 return <main className="min-h-screen flex items-center justify-center bg-background px-6"><form onSubmit={submit} className="w-full max-w-md space-y-5"><h1 className="text-2xl font-bold">Reset Your Password</h1><Label htmlFor="recovery-password">New password</Label><Input id="recovery-password" autoComplete="new-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/><p role="status" className="text-sm text-muted-foreground">{message}</p><Button type="submit" disabled={!ready||busy}>{busy?'Saving…':'Save Password'}</Button><Button variant="ghost" type="button" onClick={()=>navigate('/auth')}>Back to Sign In</Button></form></main>;
}