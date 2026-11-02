import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AUDIENCE_EXAMPLES, BOOK_CATEGORIES, BOOK_LENGTHS, BOOK_PURPOSES, DEV_STATUSES, WRITING_STYLES, type BookInputs,
} from "@/lib/writeIt";

/** The Write It questions. Required fields are marked; optional ones stay optional. */
export function BookForm({ value, onChange }: { value: BookInputs; onChange: (v: BookInputs) => void }) {
  const set = <K extends keyof BookInputs>(k: K, v: BookInputs[K]) => onChange({ ...value, [k]: v });
  const togglePurpose = (p: string) =>
    set("purposes", value.purposes.includes(p) ? value.purposes.filter((x) => x !== p) : [...value.purposes, p]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="wi-author">Author name or pen name *</Label>
        <Input id="wi-author" maxLength={200} value={value.author} onChange={(e) => set("author", e.target.value)}
          placeholder="Name as it should appear on the book" className="sm:w-96" />
        <p className="text-xs text-muted-foreground">Carried over to Publish It when you send your book there.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wi-idea">What is your book about? *</Label>
        <Textarea id="wi-idea" rows={5} maxLength={4000} value={value.idea} onChange={(e) => set("idea", e.target.value)}
          placeholder="Describe your idea, subject, experience or concept. Rough notes are fine." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="wi-category">Book category *</Label>
          <Select value={value.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger id="wi-category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
            <SelectContent>{BOOK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wi-status">Where are you now? *</Label>
          <Select value={value.devStatus} onValueChange={(v) => set("devStatus", v)}>
            <SelectTrigger id="wi-status"><SelectValue placeholder="Choose one" /></SelectTrigger>
            <SelectContent>{DEV_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">What is the book's purpose? * <span className="text-muted-foreground font-normal">(choose one or more)</span></legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BOOK_PURPOSES.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={value.purposes.includes(p)} onCheckedChange={() => togglePurpose(p)} />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="wi-audience">Who do you want to read this book? *</Label>
        <Input id="wi-audience" maxLength={1000} value={value.audience} onChange={(e) => set("audience", e.target.value)}
          placeholder="For example: parents of teenagers, new entrepreneurs, church leaders" />
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCE_EXAMPLES.map((a) => (
            <button key={a} type="button" className="text-xs rounded-full border px-2.5 py-1 hover:bg-muted"
              onClick={() => set("audience", value.audience ? `${value.audience}, ${a}` : a)}>
              + {a}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wi-message">What do you want readers to understand, learn or take away? *</Label>
        <Textarea id="wi-message" rows={3} maxLength={2000} value={value.message} onChange={(e) => set("message", e.target.value)} />
      </div>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer font-medium">Optional details</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wi-title">Book title</Label>
            <Input id="wi-title" maxLength={200} value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="Leave blank for suggestions" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wi-subtitle">Subtitle</Label>
            <Input id="wi-subtitle" maxLength={300} value={value.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wi-style">Preferred writing style</Label>
            <Select value={value.style} onValueChange={(v) => set("style", v)}>
              <SelectTrigger id="wi-style"><SelectValue placeholder="Choose a style" /></SelectTrigger>
              <SelectContent>{WRITING_STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wi-length">Desired book length</Label>
            <Select value={value.length} onValueChange={(v) => set("length", v)}>
              <SelectTrigger id="wi-length"><SelectValue placeholder="Choose a length" /></SelectTrigger>
              <SelectContent>{BOOK_LENGTHS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wi-date">Target completion date</Label>
            <Input id="wi-date" type="date" value={value.completionDate} onChange={(e) => set("completionDate", e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="wi-notes">Additional instructions</Label>
            <Textarea id="wi-notes" rows={3} maxLength={2000} value={value.instructions} onChange={(e) => set("instructions", e.target.value)}
              placeholder="Anything else, such as chapters you already know you want" />
          </div>
        </div>
      </details>
    </div>
  );
}

export function missingRequired(v: BookInputs): string | null {
  if (!v.author?.trim()) return "Please enter the author name or pen name.";
  if (!v.idea.trim()) return "Please describe what your book is about.";
  if (!v.category) return "Please choose a book category.";
  if (!v.purposes.length) return "Please choose at least one purpose.";
  if (!v.audience.trim()) return "Please describe who you want to read the book.";
  if (!v.message.trim()) return "Please share what you want readers to take away.";
  if (!v.devStatus) return "Please choose where you are in the process.";
  return null;
}
