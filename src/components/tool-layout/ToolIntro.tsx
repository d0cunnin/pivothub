import type { LucideIcon } from "lucide-react";
import { WhatYouGet, type WhatYouGetItem } from "./WhatYouGet";

interface ToolIntroProps {
  about: string;
  forWho?: string;
  steps?: string[];
  heading?: string;
  items: WhatYouGetItem[];
  icon?: LucideIcon;
}

const DEFAULT_STEPS = [
  "Sign in and fill in a few details about your situation.",
  "PivotHub's AI builds a result tailored to your answers.",
  "Review, copy, or download your results and put them to work.",
];

/** Presentation only: explains a tool and lists what the user receives. */
export function ToolIntro({ about, forWho, steps = DEFAULT_STEPS, heading, items }: ToolIntroProps) {
  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-bold text-foreground mb-3">About this tool</h2>
          <p className="text-muted-foreground leading-relaxed">{about}</p>
          {forWho && (
            <p className="mt-3 text-sm text-foreground">
              <span className="font-semibold">Who it's for: </span>
              <span className="text-muted-foreground">{forWho}</span>
            </p>
          )}
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <WhatYouGet heading={heading} items={items} />
      </div>
    </section>
  );
}
