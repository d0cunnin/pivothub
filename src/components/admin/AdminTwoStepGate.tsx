import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Step = "loading" | "verified" | "enter-code" | "setup-start" | "setup-scan" | "error";

/**
 * Two-step verification for admin actions (granting credits requires it).
 * Sets up an authenticator app the first time, then asks for the 6-digit
 * code once per sign-in. Calls onVerifiedChange(true) once verified.
 */
export function AdminTwoStepGate({ onVerifiedChange }: { onVerifiedChange: (verified: boolean) => void }) {
  const [step, setStep] = useState<Step>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const check = useCallback(async () => {
    setMessage("");
    const [{ data: aal }, { data: factors, error }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
    if (error) { setStep("error"); setMessage(error.message); return; }
    const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
    if (aal?.currentLevel === "aal2") { setStep("verified"); onVerifiedChange(true); return; }
    onVerifiedChange(false);
    if (verifiedTotp) { setFactorId(verifiedTotp.id); setStep("enter-code"); } else { setStep("setup-start"); }
  }, [onVerifiedChange]);

  useEffect(() => { void check(); }, [check]);

  const startSetup = async () => {
    setBusy(true); setMessage("");
    try {
      // Remove any half-finished setup so a new QR code can be created.
      const { data: factors } = await supabase.auth.mfa.listFactors();
      for (const f of factors?.all ?? []) {
        if (f.factor_type === "totp" && f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `PivotHub admin ${Date.now()}` });
      if (error || !data) throw error ?? new Error("Could not start setup.");
      setFactorId(data.id); setQr(data.totp.qr_code); setSecret(data.totp.secret); setStep("setup-scan");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not start setup. Please try again.");
    } finally { setBusy(false); }
  };

  const verify = async () => {
    const clean = code.replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) { setMessage("Enter the 6-digit code from your authenticator app."); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: clean });
    setBusy(false);
    if (error) { setMessage("That code didn't work. Check the time on your phone and try the newest code."); return; }
    setCode("");
    await check();
  };

  if (step === "loading") {
    return <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking two-step verification...</p>;
  }
  if (step === "verified") {
    return <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Two-step verification confirmed.</p>;
  }

  const codeInput = (
    <div className="space-y-2">
      <Label htmlFor="admin-mfa-code">6-digit code</Label>
      <div className="flex gap-2">
        <Input id="admin-mfa-code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code}
          onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void verify(); }} placeholder="123456" />
        <Button type="button" onClick={verify} disabled={busy}>{busy ? "Checking..." : "Verify"}</Button>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="font-semibold">Two-step verification required</p>
      {step === "setup-start" && (
        <>
          <p className="text-sm text-muted-foreground">
            For security, granting credits needs a code from an authenticator app (for example Google Authenticator or Microsoft Authenticator). You set this up once.
          </p>
          <Button type="button" onClick={startSetup} disabled={busy}>{busy ? "Starting..." : "Set Up Two-Step Verification"}</Button>
        </>
      )}
      {step === "setup-scan" && (
        <>
          <p className="text-sm text-muted-foreground">1. Open your authenticator app and scan this code (or type the key below).</p>
          {qr && <img src={qr} alt="QR code for your authenticator app" className="h-44 w-44 bg-white p-2 rounded" />}
          <p className="text-xs text-muted-foreground break-all">Key: <span className="font-mono select-all">{secret}</span></p>
          <p className="text-sm text-muted-foreground">2. Enter the 6-digit code the app shows.</p>
          {codeInput}
        </>
      )}
      {step === "enter-code" && (
        <>
          <p className="text-sm text-muted-foreground">Open your authenticator app and enter the current code for PivotHub.</p>
          {codeInput}
        </>
      )}
      {step === "error" && <Button type="button" variant="outline" onClick={() => void check()}>Try Again</Button>}
      {message && <p className="text-sm text-destructive" role="alert">{message}</p>}
    </div>
  );
}
