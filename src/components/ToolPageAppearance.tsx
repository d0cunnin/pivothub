import type { ReactNode } from "react";
import "@/styles/tool-page-appearance.css";

/** Presentation only: no state, routing, guards, or changes to tool children. */
export default function ToolPageAppearance({ children }: { children: ReactNode }) {
  return <div className="tool-page-appearance">{children}</div>;
}