import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { newChapterId, type Chapter } from "@/lib/writeIt";

const NO_PART = "__none__";

/**
 * Edit the table of contents: rename, add, delete and reorder chapters, and
 * create, rename or remove parts and move chapters between them.
 */
export function TocEditor({
  chapters, parts, onChange,
}: {
  chapters: Chapter[];
  parts: string[];
  onChange: (chapters: Chapter[], parts: string[]) => void;
}) {
  const allParts = [...parts.filter((p) => p), ...chapters.map((c) => c.part).filter((p) => p && !parts.includes(p))];

  const update = (id: string, patch: Partial<Chapter>) => onChange(chapters.map((c) => (c.id === id ? { ...c, ...patch } : c)), parts);
  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= chapters.length) return;
    const next = [...chapters];
    [next[index], next[j]] = [next[j], next[index]];
    // Moving across a part boundary moves the chapter into that part.
    next[j] = { ...next[j], part: chapters[j].part };
    next[index] = { ...next[index], part: chapters[index].part };
    onChange(next, parts);
  };
  const remove = (id: string) => onChange(chapters.filter((c) => c.id !== id), parts);
  const addChapter = (part = "") =>
    onChange([...chapters, { id: newChapterId(), part, title: "New chapter", summary: "", outline: "", status: "Not Started" }], parts);

  const addPart = () => {
    let n = allParts.length + 1;
    let name = `Part ${n}`;
    while (allParts.includes(name)) name = `Part ${++n}`;
    onChange(chapters, [...parts, name]);
  };
  const renamePart = (oldName: string, name: string) =>
    onChange(chapters.map((c) => (c.part === oldName ? { ...c, part: name } : c)), parts.map((p) => (p === oldName ? name : p)));
  const removePart = (name: string) =>
    onChange(chapters.map((c) => (c.part === name ? { ...c, part: "" } : c)), parts.filter((p) => p !== name));

  return (
    <div className="space-y-4">
      {allParts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Parts / sections</p>
          {allParts.map((p) => (
            <div key={p} className="flex gap-2">
              <Input aria-label={`Part name ${p}`} defaultValue={p} onBlur={(e) => e.target.value.trim() && e.target.value !== p && renamePart(p, e.target.value.trim())} />
              <Button variant="ghost" size="icon" aria-label={`Remove ${p}`} onClick={() => removePart(p)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}

      <ol className="space-y-3">
        {chapters.map((c, i) => (
          <li key={c.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold w-8 shrink-0">{i + 1}.</span>
              <Input className="flex-1 min-w-[12rem]" aria-label={`Chapter ${i + 1} title`} value={c.title} maxLength={300}
                onChange={(e) => update(c.id, { title: e.target.value })} />
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label="Move down" disabled={i === chapters.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" aria-label={`Delete chapter ${i + 1}`} onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-10">
              <Input className="flex-1 min-w-[12rem]" aria-label={`Chapter ${i + 1} summary`} placeholder="One-line summary" value={c.summary} maxLength={600}
                onChange={(e) => update(c.id, { summary: e.target.value })} />
              {allParts.length > 0 && (
                <Select value={c.part || NO_PART} onValueChange={(v) => update(c.id, { part: v === NO_PART ? "" : v })}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Part"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PART}>No part</SelectItem>
                    {allParts.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => addChapter(allParts.at(-1) ?? "")}><Plus className="h-4 w-4 mr-1" /> Add chapter</Button>
        <Button variant="outline" size="sm" onClick={addPart}><Plus className="h-4 w-4 mr-1" /> Add part or section</Button>
      </div>
    </div>
  );
}
