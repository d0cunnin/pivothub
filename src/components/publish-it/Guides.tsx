import { ExternalLink } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { COMPARISON, SOURCES, VERIFIED_ON, type GuideStep, type SourceKey } from "@/lib/publishIt/content";

/** An official link that opens in a new tab. */
export function SourceLink({ k }: { k: SourceKey }) {
  const s = SOURCES[k];
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline underline-offset-2 text-sm">
      {s.label} <ExternalLink className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

export function VerifiedNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Platform information last verified {VERIFIED_ON}. Requirements, fees and terms change, so always confirm on the official pages before you pay or submit.
    </p>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return <ul className="list-disc pl-5 space-y-1 text-sm">{items.map((i) => <li key={i}>{i}</li>)}</ul>;
}

/** Numbered, expandable platform steps, each with its official links. */
export function StepGuide({ steps, idPrefix }: { steps: GuideStep[]; idPrefix: string }) {
  return (
    <Accordion type="multiple" className="w-full">
      {steps.map((s, i) => (
        <AccordionItem key={s.title} value={`${idPrefix}-${i}`}>
          <AccordionTrigger className="text-left">Step {i + 1}: {s.title}</AccordionTrigger>
          <AccordionContent className="space-y-3">
            <p className="text-sm">{s.summary}</p>
            <BulletList items={s.points} />
            <div className="flex flex-wrap gap-x-4 gap-y-1">{s.sources.map((k) => <SourceLink key={k} k={k} />)}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

export function ComparisonTable() {
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted text-left">
              <th className="border p-2 w-40">Topic</th>
              <th className="border p-2">IngramSpark</th>
              <th className="border p-2">Amazon KDP</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((r) => (
              <tr key={r.topic} className="align-top">
                <td className="border p-2 font-medium">{r.topic}</td>
                <td className="border p-2">{r.ingram}</td>
                <td className="border p-2">{r.kdp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Neither platform is best for everyone. Printing costs and earnings are shown by each platform during setup, so compare them for your own book.</p>
      <div className="flex flex-wrap gap-x-4"><SourceLink k="ingramspark" /><SourceLink k="kdp" /><SourceLink k="ingramAndKdp" /></div>
      <VerifiedNote />
    </div>
  );
}
