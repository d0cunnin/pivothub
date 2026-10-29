import type { ReactNode } from "react";
import heroImage from "@/assets/hero-image.jpg";

interface ToolHeroProps {
  badge: string;
  title: string;
  subtitle: ReactNode;
  children?: ReactNode;
}

/** Presentation only: the shared blue tool banner used across tool pages. */
export function ToolHero({ badge, title, subtitle, children }: ToolHeroProps) {
  return (
    <section className="py-20 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/80" />
      </div>
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          <div className="inline-flex items-center justify-center px-8 py-4 rounded-3xl bg-primary-foreground/15 mb-8 backdrop-blur-sm border border-primary-foreground/20">
            <span className="text-3xl font-bold text-primary-foreground tracking-wider">{badge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-primary-foreground leading-tight">{title}</h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 font-light leading-relaxed max-w-4xl mx-auto">{subtitle}</p>
          {children && <div className="mt-8">{children}</div>}
        </div>
      </div>
    </section>
  );
}
