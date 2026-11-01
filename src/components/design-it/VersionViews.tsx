import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import type { DesignVersion } from "@/lib/designIt/logic";

const List = ({ title, items }: { title: string; items?: string[] }) =>
  items && items.length ? (
    <div>
      <p className="text-sm font-semibold mb-1">{title}</p>
      <ul className="list-disc pl-5 space-y-0.5 text-sm text-muted-foreground">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  ) : null;

export const Notice = ({ text }: { text?: string }) =>
  text ? <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{text}</p> : null;

/** A written concept or refinement version. Display only. */
export function ConceptView({ v }: { v: DesignVersion }) {
  const c = v.content ?? {};
  return (
    <div className="space-y-3">
      <Notice text={c.notice} />
      {c.understanding && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-sm font-semibold mb-1">Our understanding of your design</p>
          <p className="text-sm text-muted-foreground">{c.understanding}</p>
        </div>
      )}
      {c.changes?.length > 0 && <List title="What changed in this version" items={c.changes} />}
      {c.overview && <div><p className="text-sm font-semibold mb-1">Design concept overview</p><p className="text-sm text-muted-foreground">{c.overview}</p></div>}
      {c.creativeDirection && <div><p className="text-sm font-semibold mb-1">Creative direction</p><p className="text-sm text-muted-foreground">{c.creativeDirection}</p></div>}
      <div className="grid gap-3 md:grid-cols-2">
        <List title="Design objectives" items={c.objectives} />
        <List title="Key design elements" items={c.keyElements} />
        <List title="Suggested materials or components" items={c.materials} />
        <List title="Functional considerations" items={c.functional} />
        <List title="Suggested improvements" items={c.improvements} />
        <List title="Potential challenges or limitations" items={c.challenges} />
      </div>
    </div>
  );
}

export function DirectionCard({ d, selected, onSelect }: { d: any; selected: boolean; onSelect?: () => void }) {
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${selected ? "border-primary ring-1 ring-primary" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{d.name}</p>
        {selected && <Badge>Selected</Badge>}
      </div>
      <p className="text-sm text-muted-foreground">{d.concept}</p>
      {d.visualApproach && <p className="text-sm"><span className="font-medium">Visual approach: </span><span className="text-muted-foreground">{d.visualApproach}</span></p>}
      <List title="Distinguishing features" items={d.features} />
      <List title="Materials or components" items={d.materials} />
      <div className="grid gap-2 sm:grid-cols-2">
        <List title="Advantages" items={d.advantages} />
        <List title="Considerations" items={d.considerations} />
      </div>
      {onSelect && !selected && (
        <button type="button" onClick={onSelect} className="text-sm font-medium text-primary hover:underline">Select this direction (free)</button>
      )}
    </div>
  );
}

export function Markdown({ text }: { text: string }) {
  return <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown></div>;
}

export function versionKindLabel(kind: DesignVersion["kind"]): string {
  return { concept: "Concept", directions: "Directions", refinement: "Refinement", image: "Visual", comparison: "AI comparison", summary: "Summary" }[kind];
}
