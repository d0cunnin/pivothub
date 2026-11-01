import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DESIGN_CATEGORIES, DESIGN_STYLES, categoryById, type DesignCategoryId, type GeneralOptionalField } from "@/lib/designIt/categories";
import { changeCategory, type DesignBrief } from "@/lib/designIt/logic";
import { ColorChooser } from "./ColorChooser";

/** Category picker: a compact grid of buttons. */
export function CategoryPicker({ value, onChange }: { value: DesignCategoryId | null; onChange: (c: DesignCategoryId) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Design category">
      {DESIGN_CATEGORIES.map((c) => (
        <button
          key={c.id} type="button" role="radio" aria-checked={value === c.id} onClick={() => onChange(c.id)}
          className={`rounded-lg border p-3 text-left transition-colors hover:border-primary ${value === c.id ? "border-primary bg-primary/5 ring-1 ring-primary" : ""}`}
        >
          <span className="block text-sm font-semibold">{c.name}</span>
          <span className="block text-xs text-muted-foreground">{c.blurb}</span>
        </button>
      ))}
    </div>
  );
}

function Field({ id, label, value, onChange, area, placeholder, required, max = 1000 }: {
  id: string; label: string; value: string; onChange: (v: string) => void; area?: boolean; placeholder?: string; required?: boolean; max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}{required && " *"}</Label>
      {area
        ? <Textarea id={id} rows={2} maxLength={max} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        : <Input id={id} maxLength={max} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

/** The guided design brief. Only the chosen category's questions are shown. */
export function BriefForm({ value, onChange }: { value: DesignBrief; onChange: (b: DesignBrief) => void }) {
  const cat = categoryById(value.category);
  const set = (k: keyof DesignBrief, v: string) => onChange({ ...value, [k]: v });
  const setDetail = (k: string, v: string) => onChange({ ...value, details: { ...value.details, [k]: v } });

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="di-category">Design category</Label>
        <Select value={value.category} onValueChange={(c) => onChange(changeCategory(value, c as DesignCategoryId))}>
          <SelectTrigger id="di-category" className="sm:w-80"><SelectValue /></SelectTrigger>
          <SelectContent>{DESIGN_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold text-sm">1. Your idea</h3>
        <Field id="di-concept" label="Design concept or idea" area required max={4000} value={value.concept} onChange={(v) => set("concept", v)}
          placeholder="Describe what you want to design in your own words." />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="di-purpose" label="Purpose of the design" required max={1500} value={value.purpose} onChange={(v) => set("purpose", v)} />
          <Field id="di-audience" label="Intended audience or user" required value={value.audience} onChange={(v) => set("audience", v)} />
        </div>
      </section>

      {cat.details.length > 0 && (
        <section className="space-y-3 border-t pt-4">
          <h3 className="font-semibold text-sm">2. {cat.name} details</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {cat.details.map((d) => d.type === "select" ? (
              <div key={d.key} className="space-y-1">
                <Label htmlFor={`di-d-${d.key}`}>{d.label}{d.required && " *"}</Label>
                <Select value={value.details[d.key] ?? ""} onValueChange={(v) => setDetail(d.key, v)}>
                  <SelectTrigger id={`di-d-${d.key}`}><SelectValue placeholder="Choose one" /></SelectTrigger>
                  <SelectContent>{d.options!.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : (
              <Field key={d.key} id={`di-d-${d.key}`} label={d.label} area={d.type === "textarea"} placeholder={d.placeholder} required={d.required}
                value={value.details[d.key] ?? ""} onChange={(v) => setDetail(d.key, v)} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold text-sm">{cat.details.length ? 3 : 2}. Look and requirements</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="di-style">Desired design style</Label>
            <Select value={value.style} onValueChange={(v) => set("style", v)}>
              <SelectTrigger id="di-style"><SelectValue placeholder="Choose a style" /></SelectTrigger>
              <SelectContent>{DESIGN_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {value.style === "Custom"
            ? <Field id="di-custom-style" label="Describe your style" required max={200} value={value.customStyle} onChange={(v) => set("customStyle", v)} />
            : <div className="hidden sm:block" />}
          <div className="space-y-1 sm:col-span-2">
            <p className="text-sm font-medium">Colors</p>
            <ColorChooser value={value.colors} onChange={(v) => set("colors", v)} />
            <Field id="di-colors" label="Describe colors in your own words or type HEX codes (optional)" max={500} value={value.colors} onChange={(v) => set("colors", v)}
              placeholder="e.g. warm and inviting, nothing too bright" />
          </div>
          <div className="sm:col-span-2">
            <Field id="di-functional" label="Functional requirements" area max={2000} value={value.functional} onChange={(v) => set("functional", v)} />
          </div>
          {(Object.entries(cat.general) as [GeneralOptionalField, string][]).map(([k, label]) => (
            <Field key={k} id={`di-${k}`} label={label} value={value[k]} onChange={(v) => set(k, v)} max={k === "budget" ? 300 : 1000} />
          ))}
        </div>
        <Field id="di-instructions" label="Anything else? (optional)" area max={2000} value={value.instructions} onChange={(v) => set("instructions", v)} />
      </section>
    </div>
  );
}
