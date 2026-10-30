/**
 * Checks that a generated report addresses everything the user selected
 * (goals, channels, age groups...). Pure functions, no Deno APIs.
 */
const STOP = new Set(['the', 'and', 'for', 'with', 'your', 'you', 'how', 'from', 'into', 'about', 'that', 'this', 'what', 'our', 'are', 'other']);

const words = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

/** An item counts as covered if most of its meaningful words (loosely stemmed) appear. */
export function itemCovered(item: string, text: string): boolean {
  const ws = words(item);
  if (!ws.length) return true;
  const lower = text.toLowerCase();
  const found = ws.filter((w) => lower.includes(w.length > 5 ? w.slice(0, -2) : w)).length;
  return found / ws.length >= 0.6;
}

/** The selected items the report does not mention. */
export function missingItems(text: string, items: Array<string | null | undefined>): string[] {
  const unique = [...new Set(items.filter((i): i is string => typeof i === 'string' && i.trim().length > 0).map((i) => i.trim()))];
  return unique.filter((i) => !itemCovered(i, text));
}
