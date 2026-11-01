import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BOOK_CATEGORIES } from "@/lib/writeIt";
import { AUDIOBOOK_QUESTIONS } from "@/lib/publishIt/content";
import {
  ANSWERS, COPYRIGHT_STATUSES, FORMATS, GOALS, ISBN_STATUSES, READINESS_QUESTIONS, hasPrint, type Answer, type Assessment, type PrintPlatform,
} from "@/lib/publishIt/logic";
import { ComparisonTable } from "./Guides";

function Section({ letter, title, children }: { letter: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t pt-5 first:border-t-0 first:pt-0">
      <h3 className="font-semibold">{letter}. {title}</h3>
      {children}
    </section>
  );
}

function AnswerRow({ id, label, value, onChange }: { id: string; label: string; value: Answer; onChange: (v: Answer) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center py-1.5 border-b last:border-b-0">
      <span className="text-sm" id={`${id}-label`}>{label}</span>
      <RadioGroup aria-labelledby={`${id}-label`} className="flex flex-wrap gap-3" value={value} onValueChange={(v) => onChange(v as Answer)}>
        {ANSWERS.map((a) => (
          <label key={a} className="flex items-center gap-1.5 text-sm cursor-pointer">
            <RadioGroupItem value={a} id={`${id}-${a}`} /> {a}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

/** Publishing assessment sections A to G, plus platform and audiobook questions. */
export function AssessmentForm({ value, onChange }: { value: Assessment; onChange: (v: Assessment) => void }) {
  const book = value.book;
  const setBook = (k: keyof Assessment["book"], v: string) => onChange({ ...value, book: { ...book, [k]: v } });
  const toggle = (k: "formats" | "goals", item: string) =>
    onChange({ ...value, [k]: value[k].includes(item) ? value[k].filter((x) => x !== item) : [...value[k], item] });

  return (
    <div className="space-y-6">
      <Section letter="A" title="Book information">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label htmlFor="pi-title">Book title *</Label><Input id="pi-title" maxLength={200} value={book.title} onChange={(e) => setBook("title", e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pi-subtitle">Subtitle</Label><Input id="pi-subtitle" maxLength={300} value={book.subtitle} onChange={(e) => setBook("subtitle", e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pi-author">Author name or pen name *</Label><Input id="pi-author" maxLength={200} value={book.author} onChange={(e) => setBook("author", e.target.value)} /></div>
          <div className="space-y-1">
            <Label htmlFor="pi-category">Book category</Label>
            <Select value={book.category} onValueChange={(v) => setBook("category", v)}>
              <SelectTrigger id="pi-category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
              <SelectContent>{BOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label htmlFor="pi-audience">Intended audience</Label><Input id="pi-audience" maxLength={500} value={book.audience} onChange={(e) => setBook("audience", e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pi-imprint">Publishing imprint (if any)</Label><Input id="pi-imprint" maxLength={200} value={book.imprint} onChange={(e) => setBook("imprint", e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pi-language">Language</Label><Input id="pi-language" maxLength={60} value={book.language} onChange={(e) => setBook("language", e.target.value)} /></div>
          <div className="space-y-1 sm:col-span-2"><Label htmlFor="pi-desc">Book description</Label><Textarea id="pi-desc" rows={3} maxLength={4000} value={book.description} onChange={(e) => setBook("description", e.target.value)} /></div>
        </div>
      </Section>

      <Section letter="B" title="Manuscript readiness *">
        <p className="text-sm text-muted-foreground">Answer honestly; nothing is uploaded or checked. Only items you mark Yes count as complete.</p>
        <div>
          {READINESS_QUESTIONS.map((q) => (
            <AnswerRow key={q.key} id={`pi-r-${q.key}`} label={q.label} value={value.readiness[q.key]}
              onChange={(v) => onChange({ ...value, readiness: { ...value.readiness, [q.key]: v } })} />
          ))}
        </div>
      </Section>

      <Section letter="C" title="Publishing formats *">
        <div className="flex flex-wrap gap-4">
          {FORMATS.map((f) => (
            <label key={f} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={value.formats.includes(f)} onCheckedChange={() => toggle("formats", f)} /> {f}</label>
          ))}
        </div>
        {hasPrint(value) && (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="font-medium text-sm">Where will you publish your print book? *</p>
            <details>
              <summary className="text-sm cursor-pointer text-primary">Compare IngramSpark and KDP before choosing</summary>
              <div className="mt-3"><ComparisonTable /></div>
            </details>
            <RadioGroup className="grid gap-2 sm:grid-cols-3" value={value.printPlatform} onValueChange={(v) => onChange({ ...value, printPlatform: v as PrintPlatform })}>
              {[["ingramspark", "IngramSpark"], ["kdp", "Amazon KDP"], ["both", "Both IngramSpark and KDP"]].map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 rounded-md border p-2 text-sm cursor-pointer"><RadioGroupItem value={v} /> {l}</label>
              ))}
            </RadioGroup>
          </div>
        )}
        {value.formats.includes("Audiobook") && (
          <div className="rounded-lg border p-4">
            <p className="font-medium text-sm mb-1">About your audiobook</p>
            {AUDIOBOOK_QUESTIONS.map((q) => (
              <AnswerRow key={q.key} id={`pi-a-${q.key}`} label={q.label} value={(value.audiobook[q.key] as Answer) ?? ""}
                onChange={(v) => onChange({ ...value, audiobook: { ...value.audiobook, [q.key]: v } })} />
            ))}
          </div>
        )}
      </Section>

      <Section letter="D" title="Publishing goals">
        <div className="grid gap-2 sm:grid-cols-2">
          {GOALS.map((g) => (
            <label key={g} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={value.goals.includes(g)} onCheckedChange={() => toggle("goals", g)} /> {g}</label>
          ))}
        </div>
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <Section letter="E" title="ISBN status *">
          <RadioGroup value={value.isbnStatus} onValueChange={(v) => onChange({ ...value, isbnStatus: v })}>
            {ISBN_STATUSES.map((s) => <label key={s} className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value={s} /> {s}</label>)}
          </RadioGroup>
        </Section>
        <Section letter="F" title="Copyright status *">
          <RadioGroup value={value.copyrightStatus} onValueChange={(v) => onChange({ ...value, copyrightStatus: v })}>
            {COPYRIGHT_STATUSES.map((s) => <label key={s} className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value={s} /> {s}</label>)}
          </RadioGroup>
        </Section>
      </div>

      <Section letter="G" title="Budget">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">$</span>
            <Input aria-label="Estimated publishing budget" type="number" min={0} className="w-40" disabled={value.budgetUndetermined}
              value={value.budget} onChange={(e) => onChange({ ...value, budget: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={value.budgetUndetermined} onCheckedChange={(c) => onChange({ ...value, budgetUndetermined: c === true, budget: c === true ? "" : value.budget })} />
            Not yet determined
          </label>
        </div>
      </Section>
    </div>
  );
}
