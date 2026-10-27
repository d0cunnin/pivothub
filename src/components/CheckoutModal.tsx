import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard } from "lucide-react";
import { getStripeEnvironment } from "@/lib/payments/stripe";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  planName: string;
  price: string;
  isEbook?: boolean;
  credits?: number;
  isOneTime?: boolean;
}

export const CheckoutModal = ({ open, onOpenChange, onConfirm, planName, price, isEbook = false, isOneTime = false, credits }: CheckoutModalProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const oneTime = isEbook || isOneTime;
  useEffect(() => { setTermsAccepted(false); }, [open, planName]);

  const handleConfirm = () => {
    if (!termsAccepted) return;
    onConfirm();
    onOpenChange(false);
    setTermsAccepted(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setTermsAccepted(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Review Your Purchase
          </DialogTitle>
          <DialogDescription>
            {planName}: {price}{oneTime ? ' one-time payment' : ' per month'}{credits ? ` for ${credits} Tool Credits${oneTime ? '' : ' each month'}` : ''}. Applicable taxes are shown at checkout.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Important Information:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• The secure payment form opens next. You are not charged until you complete it.</li>
              {oneTime
                ? <li>• This is a one-time payment. It does not renew.</li>
                : <li>• Renews monthly until you cancel. Cancel anytime in Settings and you keep your plan until the end of the month you paid for.</li>}
              <li>• Credits are added once your payment is confirmed and last 3 months. Credits are only used when a tool gives you results.</li>
              <li>• Questions about a charge or a refund? Contact support@pivothub.io. Refunds are not automatic; each request is reviewed individually. If a payment is refunded, its credits are removed.</li>
              {getStripeEnvironment() === 'sandbox' && <li>• Test mode: test purchases do not change your real credit balance.</li>}
            </ul>
          </div>
          
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="checkout-terms" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              className="mt-1"
            />
            <label htmlFor="checkout-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I acknowledge that I have read and agree to the{" "}
              <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </a>
              .{!oneTime && ' I understand that this subscription renews monthly until I cancel.'}
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!termsAccepted}
            className="min-w-[120px]"
          >
            Proceed to Checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};