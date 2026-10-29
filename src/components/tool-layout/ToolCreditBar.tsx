import { Zap } from "lucide-react";
import { useUsage } from "@/contexts/UsageContext";
import { useAuth } from "@/contexts/AuthContext";

/** Presentation only: shows how many Tool Credits a tool needs and how many the user has left. */
export function ToolCreditBar({ cost }: { cost: number | string }) {
  const { remainingRequests } = useUsage();
  const { user, isAdmin } = useAuth();
  if (isAdmin) return null;
  const label = typeof cost === "number" ? `${cost} credit${cost !== 1 ? "s" : ""} required` : cost;
  return (
    <div className="mb-6 flex justify-center">
      <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">
          <Zap className="h-4 w-4" aria-hidden="true" />
          {label}
        </span>
        <span className="hidden h-6 w-px bg-border sm:block" />
        <span className="text-sm font-medium text-muted-foreground">
          {user ? `${remainingRequests} credits remaining` : "Sign in to see your credits"}
        </span>
      </div>
    </div>
  );
}
