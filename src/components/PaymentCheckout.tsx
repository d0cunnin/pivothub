import { useEffect, useState } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { getStripe, getStripeEnvironment } from '@/lib/payments/stripe';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
export function PaymentCheckout({priceId,onClose}:{priceId:string;onClose:()=>void}){
 const [secret,setSecret]=useState<string|null>(null);
 const [error,setError]=useState('');
 useEffect(()=>{
  let active=true;
  async function start(){try{
   const environment=getStripeEnvironment();
   const {data,error}=await supabase.functions.invoke('create-checkout',{body:{priceId,environment,returnUrl:`${window.location.origin}/pricing?session_id={CHECKOUT_SESSION_ID}`}});
   if(error || data?.error || !data?.clientSecret)throw new Error(data?.error ?? 'Unable to start checkout. Please try again.');
   if(active)setSecret(data.clientSecret);
  }catch(e){if(active)setError(e instanceof Error?e.message:'Unable to start checkout');}}
  start();return()=>{active=false;};
 },[priceId]);
 return <Dialog open onOpenChange={open=>{if(!open)onClose();}}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Secure Checkout</DialogTitle></DialogHeader>{error?<p role="alert" className="text-destructive">{error}</p>:secret?<EmbeddedCheckoutProvider stripe={getStripe()} options={{clientSecret:secret}}><EmbeddedCheckout/></EmbeddedCheckoutProvider>:<p role="status" className="text-muted-foreground">Preparing your checkout…</p>}</DialogContent></Dialog>;
}
