import { Loader2, Zap } from "lucide-react";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { affordability } from "@/lib/designIt/logic";

export interface PendingCharge {
  title: string;
  description: string;
  cost: number;
  run: () => Promise<void>;
}

/**
 * Confirm-before-charging dialog used for every paid Design It operation.
 * Shows the cost and balance and blocks when the balance is too low.
 */
export function ChargeDialog({ pending, balance, isAdmin, running, onCancel, onConfirm }: {
  pending: PendingCharge | null; balance: number; isAdmin: boolean; running: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  const check = pending ? affordability(balance, pending.cost, isAdmin) : { ok: true, message: null };
  return (
    <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o && !running) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pending?.title}</AlertDialogTitle>
          <AlertDialogDescription>{pending?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-lg border p-3 text-sm space-y-1">
          <p className="flex items-center gap-2 font-semibold"><Zap className="h-4 w-4 text-primary" /> Cost: {pending?.cost} credit{pending?.cost === 1 ? "" : "s"}</p>
          <p className="text-muted-foreground">{isAdmin ? "Admin account: no credits are deducted." : `Your balance: ${balance} credit${balance === 1 ? "" : "s"}`}</p>
          <p className="text-xs text-muted-foreground">You are only charged if a result is delivered.</p>
          {check.message && <p className="text-destructive">{check.message}</p>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
          <Button onClick={onConfirm} disabled={running || !check.ok}>
            {running ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Working...</> : `Confirm and use ${pending?.cost} credit${pending?.cost === 1 ? "" : "s"}`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
