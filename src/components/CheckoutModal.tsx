import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle } from "lucide-react";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  planName: string;
  price: string;
  isEbook?: boolean;
}

export const CheckoutModal = ({ open, onOpenChange, onConfirm, planName, price, isEbook = false }: CheckoutModalProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);

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
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Confirm Your Purchase
          </DialogTitle>
          <DialogDescription>
            You're about to purchase {planName} for {price}{isEbook ? '' : '/month'}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Important Information:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All purchases are final - no refunds offered</li>
              <li>• You'll be redirected to secure Stripe checkout</li>
              {!isEbook && <li>• Subscription will auto-renew monthly</li>}
              {!isEbook && <li>• Cancel anytime from your account settings</li>}
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
              <a href="/terms-and-conditions" className="text-primary hover:underline" target="_blank">
                Terms and Conditions
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" className="text-primary hover:underline" target="_blank">
                Privacy Policy
              </a>
              . I understand that due to the nature of digital services, no refunds are offered and all sales are final.
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