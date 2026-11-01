import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLOR_PALETTES, COLOR_SWATCHES } from "@/lib/designIt/categories";
import { addColor, hexColors, removeColor } from "@/lib/designIt/logic";

/**
 * Visual color picking for people who don't know HEX codes: ready-made
 * palettes, named swatches and a free color picker. Picks are written into the
 * same color preferences text as "Name #HEX", so typing still works too.
 */
export function ColorChooser({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState("#1E63D6");
  const picked = hexColors(value);
  const nameFor = (hex: string) =>
    [...COLOR_SWATCHES, ...COLOR_PALETTES.flatMap((p) => p.colors)].find((c) => c.hex.toUpperCase() === hex)?.name;
  const toggle = (name: string, hex: string) =>
    onChange(picked.includes(hex.toUpperCase()) ? removeColor(value, hex) : addColor(value, name, hex));

  return (
    <div className="space-y-3 rounded-lg border p-3">
      {picked.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1">Your colors</p>
          <div className="flex flex-wrap gap-2">
            {picked.map((h) => (
              <span key={h} className="inline-flex items-center gap-1.5 rounded-full border pl-1 pr-1.5 py-0.5 text-xs">
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: h }} />
                {nameFor(h) ?? ""} {h}
                <button type="button" aria-label={`Remove ${h}`} onClick={() => onChange(removeColor(value, h))} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <details open={!picked.length}>
        <summary className="text-sm font-medium cursor-pointer">Not sure? Choose a ready-made palette</summary>
        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {COLOR_PALETTES.map((p) => {
            const all = p.colors.every((c) => picked.includes(c.hex.toUpperCase()));
            return (
              <button key={p.name} type="button"
                onClick={() => onChange(all ? p.colors.reduce((t, c) => removeColor(t, c.hex), value) : p.colors.reduce((t, c) => addColor(t, c.name, c.hex), value))}
                className={`rounded-md border p-2 text-left hover:border-primary ${all ? "border-primary ring-1 ring-primary" : ""}`}>
                <div className="flex h-7 overflow-hidden rounded">
                  {p.colors.map((c) => <span key={c.hex} className="flex-1" style={{ backgroundColor: c.hex }} title={`${c.name} ${c.hex}`} />)}
                </div>
                <p className="mt-1 text-xs font-medium flex items-center gap-1">{all && <Check className="h-3 w-3" />}{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.feel}</p>
              </button>
            );
          })}
        </div>
      </details>

      <details>
        <summary className="text-sm font-medium cursor-pointer">Pick individual colors</summary>
        <div className="mt-2 grid grid-cols-6 gap-2 sm:grid-cols-8">
          {COLOR_SWATCHES.map((c) => {
            const on = picked.includes(c.hex.toUpperCase());
            return (
              <button key={c.hex} type="button" aria-pressed={on} aria-label={c.name} title={`${c.name} ${c.hex}`} onClick={() => toggle(c.name, c.hex)}
                className={`flex flex-col items-center gap-1 rounded-md p-1 text-[10px] leading-tight hover:bg-muted ${on ? "ring-2 ring-primary" : ""}`}>
                <span className="h-8 w-8 rounded-full border flex items-center justify-center" style={{ backgroundColor: c.hex }}>
                  {on && <Check className="h-4 w-4 text-white drop-shadow" />}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="di-color-custom" className="text-xs">Or choose any color:</label>
          <input id="di-color-custom" type="color" value={custom} onChange={(e) => setCustom(e.target.value)} className="h-9 w-12 cursor-pointer rounded border bg-transparent" />
          <span className="text-xs font-mono">{custom.toUpperCase()}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange(addColor(value, "", custom))}><Plus className="h-3 w-3 mr-1" /> Add</Button>
        </div>
      </details>
      <p className="text-xs text-muted-foreground">Still unsure? Leave colors empty and your concept and summary will suggest a palette.</p>
    </div>
  );
}
