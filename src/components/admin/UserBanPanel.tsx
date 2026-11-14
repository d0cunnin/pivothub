import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { adminBan, type UserIp } from "@/lib/adminBans";

/** Ban or unban one user, optionally with the IP addresses they used. */
export function UserBanPanel({ userId, userEmail }: { userId: string; userEmail: string }) {
  const verified = true; // admin role is checked by the server
  const [ips, setIps] = useState<UserIp[]>([]);
  const [ban, setBan] = useState<{ reason: string; banned_at: string } | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminBan<{ ips: UserIp[]; ban: any }>({ action: "user-ips", userId });
      setIps(data.ips); setBan(data.ban); setPicked([]);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { if (verified) void load(); }, [verified, load]);

  const doBan = async () => {
    if (!window.confirm(`Ban ${userEmail}${picked.length ? ` and ${picked.length} IP address${picked.length > 1 ? "es" : ""}` : ""}? They will be signed out of all tools and unable to sign in.`)) return;
    setBusy(true);
    try { await adminBan({ action: "ban-user", userId, reason, ips: picked }); toast.success("User banned"); await load(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  const doUnban = async () => {
    setBusy(true);
    try { await adminBan({ action: "unban-user", userId, liftIps: true }); toast.success("User unbanned"); await load(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Ban className="h-4 w-4" /> Ban</h3>
      {verified && loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>}
      {verified && !loading && ban && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm space-y-2">
          <p><span className="font-semibold">Banned</span> on {new Date(ban.banned_at).toLocaleDateString()}{ban.reason ? `: ${ban.reason}` : ""}</p>
          <Button size="sm" variant="outline" disabled={busy} onClick={doUnban}><ShieldOff className="h-4 w-4 mr-1" /> Unban (also lifts their IP bans)</Button>
        </div>
      )}
      {verified && !loading && !ban && (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-sm">IP addresses used by this account {ips.length ? "(tick to ban them too)" : ""}</p>
            {!ips.length && <p className="text-xs text-muted-foreground">No IP addresses recorded for this account.</p>}
            {ips.map((x) => (
              <label key={x.ip} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={picked.includes(x.ip) || x.banned} disabled={x.banned}
                  onCheckedChange={() => setPicked((p) => (p.includes(x.ip) ? p.filter((y) => y !== x.ip) : [...p, x.ip]))} />
                <span className="font-mono">{x.ip}</span>
                <span className="text-xs text-muted-foreground">{x.source} · {x.count} request{x.count === 1 ? "" : "s"}{x.banned ? " · already banned" : ""}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1">
            <Label htmlFor={`ban-reason-${userId}`}>Reason</Label>
            <Input id={`ban-reason-${userId}`} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. spam signups" />
          </div>
          <Button variant="destructive" size="sm" disabled={busy} onClick={doBan}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />} Ban this user{picked.length ? ` and ${picked.length} IP${picked.length > 1 ? "s" : ""}` : ""}
          </Button>
        </div>
      )}
    </div>
  );
}
