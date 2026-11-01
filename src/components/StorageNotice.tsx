import { Link } from "react-router-dom";
import { Info } from "lucide-react";

/**
 * Shared, presentation-only storage and retention notice for tools that save
 * projects (Design It, Write It, Publish It). It must never promise permanent,
 * unlimited or guaranteed storage.
 */
export function StorageNotice({ extra }: { extra?: React.ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
      <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div className="space-y-1">
        <p>
          Saved projects are kept in your account subject to PivotHub's current storage capacity, your plan and our{" "}
          <Link to="/privacy" className="underline">data retention policy</Link>. Storage is not guaranteed for any set period.
          Any changes to storage limits or retention will be communicated.{" "}
          <strong className="font-medium text-foreground">Download your work to keep your own copy.</strong>{" "}
          Viewing or downloading saved work never uses credits.
        </p>
        {extra}
      </div>
    </div>
  );
}
