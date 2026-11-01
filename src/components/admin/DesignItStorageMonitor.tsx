import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes } from "@/lib/designIt/logic";

interface Summary {
  projects: number; users_with_projects: number; stored_images: number; stored_bytes: number; users_with_images: number;
  operations_30d: number; failed_operations_30d: number; credits_charged_30d: number; images_generated_30d: number;
}

/** Admin-only aggregate Design It storage and usage. No user content is shown. */
export function DesignItStorageMonitor() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (supabase as any).rpc("get_design_it_storage_summary").then(({ data, error }: any) => {
      if (error) setError("Design It storage data is not available yet (apply the Design It migration).");
      else setData(Array.isArray(data) ? data[0] : data);
    });
  }, []);

  const stats: [string, string][] = data ? [
    ["Stored images", `${data.stored_images} (${formatBytes(Number(data.stored_bytes))})`],
    ["Users with stored images", String(data.users_with_images)],
    ["Projects", `${data.projects} by ${data.users_with_projects} users`],
    ["Images generated (30 days)", String(data.images_generated_30d)],
    ["Paid requests (30 days)", `${data.operations_30d} (${data.failed_operations_30d} failed, not charged)`],
    ["Credits from successful requests (30 days)", String(data.credits_charged_30d)],
  ] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Design It Storage</CardTitle>
        <CardDescription>Aggregate image storage and usage, for cost monitoring. Compare stored size with your Supabase storage pricing.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-muted-foreground">{error}</p>}
        {!error && !data && <p className="text-sm text-muted-foreground">Loading...</p>}
        {data && (
          <dl className="grid gap-3 sm:grid-cols-3">
            {stats.map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="text-lg font-semibold">{v}</dd></div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
