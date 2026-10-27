import {useState} from 'react';
import {useAuth} from '@/contexts/AuthContext';
import {useUsage} from '@/contexts/UsageContext';
import {supabase} from '@/integrations/supabase/client';
import {getStripeEnvironment} from '@/lib/payments/stripe';
import {Button} from './ui/button';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from './ui/select';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from './ui/dialog';
import {useToast} from './ui/use-toast';
type Review={currentPlan:string;newPlan:string;effectiveDate:string;chargeCents:number;creditDelta:number;newAllowance:number;previewToken:string;cancelAtPeriodEnd:boolean};
export function PlanChange(){
 const {subscribed,refreshSubscription}=useAuth(),{refreshUsage}=useUsage(),{toast}=useToast();
 const [priceId,setPriceId]=useState(''),[review,setReview]=useState<Review|null>(null),[busy,setBusy]=useState(false);
 async function run(action:'preview'|'change'){
  setBusy(true);try{
   const {data,error}=await supabase.functions.invoke('manage-subscription',{body:{environment:getStripeEnvironment(),action,priceId,previewToken:review?.previewToken}});
   if(error||data?.error)throw new Error(data?.error??'Unable to change your plan. Please try again.');
   if(action==='preview')setReview(data);else{setReview(null);toast({title:data.scheduled?'Plan Change Scheduled':data.paymentPending?'Payment Confirmation Needed':'Plan Change Submitted',description:data.scheduled?`Effective ${new Date(data.effectiveDate).toLocaleDateString()}.`:data.paymentPending?'Complete the invoice payment from Billing History. Your paid allowance stays unchanged until payment succeeds.':'Your plan and credit allowance will update after Stripe confirms payment.'});await refreshSubscription();await refreshUsage();}
  }catch(e){toast({title:'Plan Change Unavailable',description:e instanceof Error?e.message:'Please try again.',variant:'destructive'});}finally{setBusy(false);}
 }
 if(!subscribed)return null;
 return <div className="space-y-3"><div className="flex flex-wrap gap-3"><Select value={priceId} onValueChange={setPriceId}><SelectTrigger className="w-full sm:w-64" aria-label="New plan"><SelectValue placeholder="Choose a new plan"/></SelectTrigger><SelectContent><SelectItem value="starter_monthly">Starter — $12 / 40 credits</SelectItem><SelectItem value="pro_monthly">Pro — $24 / 100 credits</SelectItem><SelectItem value="all_access_monthly">All-Access — $49 / 250 credits</SelectItem></SelectContent></Select><Button variant="outline" disabled={!priceId||busy} onClick={()=>run('preview')}>Review Plan Change</Button></div><Dialog open={!!review} onOpenChange={open=>{if(!open&&!busy)setReview(null);}}><DialogContent><DialogHeader><DialogTitle>Review Your Plan Change</DialogTitle><DialogDescription>{review?.currentPlan} to {review?.newPlan}</DialogDescription></DialogHeader>{review&&<dl className="space-y-3 text-sm"><div><dt className="text-muted-foreground">Effective</dt><dd>{review.effectiveDate.startsWith('After')?review.effectiveDate:new Date(review.effectiveDate).toLocaleDateString()}</dd></div><div><dt className="text-muted-foreground">Prorated charge now, including applicable tax</dt><dd>{(review.chargeCents/100).toLocaleString('en-US',{style:'currency',currency:'USD'})}</dd></div><div><dt className="text-muted-foreground">Tool Credits</dt><dd>{review.creditDelta>0?`${review.creditDelta} additional credits after payment succeeds.`:`${review.newAllowance} credits after the next paid renewal.`} Existing valid credits keep their expiry dates.</dd></div><div><dt className="text-muted-foreground">Renewal cancellation</dt><dd>{review.cancelAtPeriodEnd?'Currently scheduled to end. Contact support before changing this subscription.':'Not scheduled to cancel.'}</dd></div></dl>}<DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setReview(null)}>Keep Current Plan</Button><Button disabled={busy} onClick={()=>run('change')}>{busy?'Submitting…':'Confirm Plan Change'}</Button></DialogFooter></DialogContent></Dialog></div>;
}