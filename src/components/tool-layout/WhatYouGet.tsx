import type { LucideIcon } from "lucide-react";

export interface WhatYouGetItem {
  icon: LucideIcon;
  name: string;
  description: string;
}

/** Presentation only: a grid explaining what each tool on the page produces. */
export function WhatYouGet({ heading = "What you'll get", items }: { heading?: string; items: WhatYouGetItem[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold text-foreground mb-4">{heading}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, name, description }) => (
          <div key={name} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="font-semibold text-foreground">{name}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
