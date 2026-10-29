import { MousePointerClick } from "lucide-react";

/** Presentation only: tells visitors the row of buttons below are switchable tabs. */
export function TabSwitchHint({ text }: { text?: string }) {
  return (
    <div className="mb-3 flex items-start gap-2 rounded-md border border-secondary/30 bg-secondary/5 px-4 py-3 text-sm text-foreground">
      <MousePointerClick className="h-4 w-4 mt-0.5 shrink-0 text-secondary" aria-hidden="true" />
      <p className="leading-relaxed">
        {text ?? "This page has several sections. Click any tab below to switch between them — you can move back and forth at any time."}
      </p>
    </div>
  );
}
