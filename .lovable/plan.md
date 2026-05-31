# Phase B: Safe AI Response Parsing

Goal: eliminate `data.choices[0].message.content` crashes in edge functions by funneling every Lovable AI Gateway response through one helper that fails loudly with a clear error.

## 1. Create the shared helper

New file: `supabase/functions/_shared/aiResponse.ts`

```ts
export function extractContent(data: unknown): string {
  const content =
    (data as any)?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("AI gateway returned an empty response");
  }

  return content;
}

// For endpoints that expect JSON in the model output
export function extractJson<T = unknown>(data: unknown): T {
  const raw = extractContent(data);
  // Strip ```json fences if the model wrapped output
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("AI gateway returned malformed JSON");
  }
}
```

## 2. Roll out across edge functions

Scope: every function under `supabase/functions/*` that reads `choices[0].message.content` from a Lovable AI Gateway chat completion response. Expected ~19 call sites based on prior audit.

For each function:
- `import { extractContent } from "../_shared/aiResponse.ts";` (or `extractJson` when the call site immediately `JSON.parse`s the content).
- Replace `const content = data.choices[0].message.content;` (and variants) with `const content = extractContent(data);`.
- Replace manual `JSON.parse(data.choices[0].message.content)` with `extractJson<ShapeType>(data)` and remove the now-redundant fence-stripping / try-catch where it duplicates the helper.
- Leave upstream HTTP-status handling (429/402/5xx) untouched — the helper only addresses malformed/empty 200 bodies.

Out of scope:
- Functions that don't call the chat-completions endpoint (image generation, embeddings, non-AI utilities).
- Streaming responses (none of the current functions stream).
- Response envelope redesign (deferred per user instruction).

## 3. Verification

- Build passes (`npm run build`).
- Spot-check 3 representative functions by calling them through `supabase--curl_edge_functions`:
  1. `act-it` — happy path returns content.
  2. `fund-it` — JSON parsing path returns structured grant data.
  3. `career-advisor` — moderation + chat path still works.
- For each, confirm a thrown `extractContent` error surfaces as a clean JSON error envelope (already guaranteed by Phase A frontend guards → toast, no blank screen).

## Technical notes

- Helper lives in `_shared/` so every function can import it via relative path; matches the existing `_shared/moderation.ts` pattern.
- `extractJson` is additive — only adopted where the function was already doing `JSON.parse` on the content. Functions returning prose stay on `extractContent`.
- No DB migrations, no schema changes, no frontend changes.
