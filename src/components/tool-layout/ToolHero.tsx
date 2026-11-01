import type { ReactNode } from "react";
import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-image.jpg";

interface ToolHeroProps {
  /** Small frosted pill above the title, e.g. "DESIGN IT · CONCEPT STUDIO". */
  badge: string;
  title: string;
  subtitle: ReactNode;
  /** Credit bubble text, e.g. "3 Credits". Omit to hide the bubble. */
  credits?: string;
  /** Optional actions (for example a "Get started" button) under the credit bubble. */
  children?: ReactNode;
}

/** Presentation only: the standard tool banner used on every tool page. */
export function ToolHero({ badge, title, subtitle, credits, children }: ToolHeroProps) {
  return (
    <section className="relative flex min-h-[340px] md:min-h-[360px] items-center justify-center overflow-hidden py-12">
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80" />
      </div>
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <Badge className="mb-4 border-white/30 bg-white/15 text-sm font-semibold text-white hover:bg-white/15 md:text-base">{badge}</Badge>
        <h1 className="mb-4 text-5xl font-bold leading-tight text-white md:text-6xl">{title}</h1>
        <p className="mb-5 text-xl text-white/90 md:text-2xl">{subtitle}</p>
        {credits && (
          <Badge variant="secondary" className="inline-flex items-center px-4 py-2 text-base">
            <Zap className="mr-2 h-4 w-4" aria-hidden="true" /> {credits}
          </Badge>
        )}
        {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
      </div>
    </section>
  );
}
