export function PaymentTestModeBanner(){
 const token=import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
 if(token?.startsWith('pk_live_'))return null;
 return <div className="bg-muted border-b border-border px-4 py-3 text-center text-sm text-foreground" role="status">{token?.startsWith('pk_test_')?'Test payments only — no real money will be charged. Test purchases do not change your live Tool Credits.':'Purchases are not available yet. Live payments are being activated.'}</div>;
}
