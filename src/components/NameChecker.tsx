import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { invokeFunction } from "@/lib/invokeFunction";
import { toast } from "sonner";
import { normalizeBusinessName, normalizeState, US_STATES, type StateInfo } from "@/lib/nameNormalization";

type Status = "taken" | "no_records" | "unverified" | "invalid" | "manual";

interface ResultRow {
  platform: string;
  label: string;
  status: Status;
  url?: string | null;
}

interface Conflict {
  name?: string;
  industry?: string;
  similarity?: string;
  risk?: string;
  reason?: string;
  recommendation?: string;
}

const STATUS_TEXT: Record<Status, string> = {
  taken: "In use (DNS records found)",
  no_records: "No DNS records — confirm with a registrar",
  unverified: "Unable to verify — check manually",
  invalid: "Not a valid handle on this platform",
  manual: "Check manually",
};

const STATUS_VARIANT: Record<Status, "destructive" | "secondary" | "outline"> = {
  taken: "destructive",
  no_records: "secondary",
  unverified: "outline",
  invalid: "outline",
  manual: "outline",
};

export const NameChecker = () => {
  const [businessName, setBusinessName] = useState("");
  const [state, setState] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [aiDone, setAiDone] = useState(false);
  const [checked, setChecked] = useState<{ name: string; state: StateInfo } | null>(null);

  const checkNameAvailability = async () => {
    const normalized = normalizeBusinessName(businessName);
    const stateInfo = normalizeState(state);
    if (!normalized.display || !stateInfo) return;

    setIsChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session - please log in again");

      const { data, error } = await invokeFunction("name-checker", {
        body: { businessName: normalized.display },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw new Error(error.message || "Failed to check name availability");
      if (data.error) {
        if (data.error.includes("RATE_LIMIT")) toast.error("Too many requests. Please wait a moment and try again.");
        else if (data.error.includes("credit")) toast.error("Insufficient credits. This tool costs 2 credits.");
        else toast.error(data.error);
        return;
      }

      const rows: ResultRow[] = [
        ...(data.domains ?? []).slice(0, 5).map((d: any) => ({
          platform: "Domain",
          label: d.domain,
          status: (d.status ?? "unverified") as Status,
          url: `https://lookup.icann.org/en/lookup?name=${encodeURIComponent(d.domain)}`,
        })),
        {
          platform: `${stateInfo.name} business registry`,
          label: `${normalized.display}`,
          status: "manual",
          url: stateInfo.registryUrl,
        },
        ...(data.socialMedia ?? []).map((s: any) => ({
          platform: s.platform,
          label: s.handle ? `@${s.handle}` : normalized.display,
          status: (s.status ?? "unverified") as Status,
          url: s.url,
        })),
      ];

      setResults(rows);
      setConflicts(Array.isArray(data.similarBusinesses) ? data.similarBusinesses : []);
      setAiDone(!!data.aiAnalysisSucceeded);
      setChecked({ name: normalized.display, state: stateInfo });
      toast.success("Name check complete!");
    } catch (error) {
      console.error("Error checking name availability:", error);
      const msg = error instanceof Error ? error.message : "Failed to check name availability";
      toast.error(msg.includes("JWT") ? "Please log in to use the Name Checker" : msg);
    } finally {
      setIsChecking(false);
    }
  };

  const canSubmit = !!businessName.trim() && !!normalizeState(state);

  return (
    <Card className="p-8 shadow-soft">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Search className="h-8 w-8 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Business Name Checker</h2>
        </div>
        <p className="text-xl text-muted-foreground mb-4">
          Check if your business name is available across domains, social platforms, and state records
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Capitalization doesn't matter — "Pivot", "pivot" and "PIVOT" are checked as the same name.
        </p>
      </div>

      <div className="space-y-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name * - e.g., TechCorp Solutions</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="text-lg"
              autoFocus
            />
            {!businessName.trim() && (
              <p className="text-sm text-muted-foreground">Enter a business name to check availability</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State * - Choose your state for business registry checks</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger className="text-lg">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent className="max-h-48 bg-background border shadow-lg z-50">
                {US_STATES.map((s) => (
                  <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          data-toolguard-trigger="true"
          onClick={checkNameAvailability}
          disabled={isChecking || !canSubmit}
          variant="hero"
          size="lg"
          className="w-full"
          title={!canSubmit ? "Please enter a business name and select a state to check availability" : ""}
        >
          {isChecking ? (
            <><AlertCircle className="mr-2 h-5 w-5 animate-pulse" />Checking Availability...</>
          ) : (
            <><Search className="mr-2 h-5 w-5" />Check Name Availability (2 Credits)</>
          )}
        </Button>
      </div>

      {checked && results.length > 0 && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-6 text-foreground">
              Results for "{checked.name}" in {checked.state.name}:
            </h3>
            <div className="grid gap-3">
              {results.map((r, i) => (
                <Card key={i} className="p-4 border-l-4 border-l-primary">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 min-w-0">
                      <div className="font-semibold text-foreground">{r.platform}</div>
                      <div className="text-muted-foreground break-all">{r.label}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_TEXT[r.status]}</Badge>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center text-sm hover:underline">
                          Check <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 text-foreground">Possible name conflicts (AI, preliminary)</h3>
            {!aiDone ? (
              <p className="text-muted-foreground">The conflict review couldn't run this time, so no credits were charged.</p>
            ) : conflicts.length === 0 ? (
              <p className="text-muted-foreground">No well-known conflicts were identified. This is not a trademark search.</p>
            ) : (
              <div className="grid gap-3">
                {conflicts.map((c, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{c.name}</span>
                      {c.risk && <Badge variant={c.risk === "High" ? "destructive" : "secondary"}>{c.risk} risk</Badge>}
                      {c.similarity && <Badge variant="outline">{c.similarity}</Badge>}
                    </div>
                    {c.industry && <p className="text-sm text-muted-foreground">{c.industry}</p>}
                    {c.reason && <p className="text-sm text-foreground mt-2">{c.reason}</p>}
                    {c.recommendation && <p className="text-sm text-primary mt-1">{c.recommendation}</p>}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Domain results come from live DNS lookups — "no DNS records" doesn't guarantee a domain is
              unregistered, so confirm with a registrar. Social platforms don't allow automatic checks, so open each link to
              confirm the handle. State registrations must be searched on your Secretary of State's site. Conflict findings are
              AI-generated and are not a USPTO search. Results can change as these sources change.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
