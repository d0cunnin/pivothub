import { useCallback, useEffect, useState } from "react";
import { Ban, Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdminTwoStepGate } from "./AdminTwoStepGate";
import { adminBan, validIp, type IpBan, type UserBan } from "@/lib/adminBans";

/** Admin: see and lift bans, and ban an IP address by hand. */
export function BanManager() {
  const [verified, setVerified] = useState(false);
  const [users, setUsers] = useState<UserBan[]>([]);
  const [ips, setIps] = useState<IpBan[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [newIp, setNewIp] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminBan<{ users: UserBan[]; ips: IpBan[] }>({ action: "list" });
      setUsers(data.users); setIps(data.ips);
    } catch (e) { toast.error((e as Error).message); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (verified) void load(); }, [verified, load]);

  const run = async (key: string, body: Record<string, unknown>, done: string) => {
    setBusy(key);
    try { await adminBan(body); toast.success(done); await load(); } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Ban className="h-5 w-5" /> Bans</CardTitle>
        <CardDescription>Banned accounts can't sign in or use any tool. Banned IP addresses can't use tools or the contact form, and new accounts from them are banned automatically. To ban a specific person, open them from the Users tab.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AdminTwoStepGate onVerifiedChange={setVerified} />
        {verified && (
          <>
            <div className="space-y-2">
              <p className="font-medium text-sm">Ban an IP address</p>
              <div className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
                <div><Label htmlFor="ban-ip" className="sr-only">IP address</Label><Input id="ban-ip" placeholder="e.g. 203.0.113.7" value={newIp} onChange={(e) => setNewIp(e.target.value)} /></div>
                <div><Label htmlFor="ban-reason" className="sr-only">Reason</Label><Input id="ban-reason" placeholder="Reason (e.g. contact form spam)" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
                <Button disabled={busy !== null || !validIp(newIp)} onClick={() => run("add", { action: "ban-ip", ip: newIp.trim(), reason }, "IP address banned").then(() => { setNewIp(""); setReason(""); })}>
                  {busy === "add" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ban IP"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Tip: the contact form emails now show the sender's IP. IP bans can be dodged with a VPN, and a shared IP (school, office, mobile network) may block other people too.</p>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Banned accounts ({users.length})</p>
              {loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>}
              {!loading && !users.length && <p className="text-sm text-muted-foreground">No banned accounts.</p>}
              <div className="divide-y rounded-lg border">
                {users.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-2 p-2 text-sm">
                    <span className="font-medium flex-1 min-w-[12rem]">{u.email ?? u.user_id}</span>
                    <span className="text-muted-foreground flex-1 min-w-[10rem]">{u.reason || "No reason given"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(u.banned_at).toLocaleDateString()}</span>
                    {u.ips.map((ip) => <Badge key={ip} variant="outline">{ip}</Badge>)}
                    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run(u.id, { action: "unban-user", userId: u.user_id, liftIps: true }, "Account unbanned")}>
                      <ShieldOff className="h-4 w-4 mr-1" /> Unban
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Banned IP addresses ({ips.length})</p>
              {!loading && !ips.length && <p className="text-sm text-muted-foreground">No banned IP addresses.</p>}
              <div className="divide-y rounded-lg border">
                {ips.map((b) => (
                  <div key={b.ip} className="flex flex-wrap items-center gap-2 p-2 text-sm">
                    <span className="font-mono w-44">{b.ip}</span>
                    <span className="text-muted-foreground flex-1 min-w-[10rem]">{b.reason || "No reason given"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(b.banned_at).toLocaleDateString()}</span>
                    <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run(b.ip, { action: "unban-ip", ip: b.ip }, "IP address unbanned")}>
                      <ShieldOff className="h-4 w-4 mr-1" /> Unban
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
