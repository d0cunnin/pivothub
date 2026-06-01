## Problem

The Create It "Generate Blueprint" call hits the edge function `generate-create-it-blueprint`, which:

1. Calls primary model `openai/gpt-5` → gateway returns an empty response (logged as "AI gateway returned an empty response").
2. Falls back to `google/gemini-2.5-flash` → returns content but `JSON.parse` fails → function throws `"AI gateway returned malformed JSON"` → client sees 500.

Two issues compound:
- gpt-5 frequently fails/empties on long JSON generations through the Lovable AI Gateway.
- The Gemini fallback response isn't being cleaned thoroughly before parsing (current cleaner only strips one leading/trailing fence; Gemini sometimes prepends prose or partial fences, and `max_completion_tokens: 8000` with a large prompt can truncate JSON).

Per project memory: prefer Gemini Flash for JSON tasks, and keep max tokens 3500–8000.

## Plan

### 1. Swap model order to prefer Gemini Flash for JSON
In `supabase/functions/generate-create-it-blueprint/index.ts`:
- `PRIMARY_MODEL = 'google/gemini-2.5-flash'`
- `FALLBACK_MODEL = 'openai/gpt-5-mini'` (smaller, more reliable than gpt-5 for structured JSON via gateway)

### 2. Make `extractJson` more tolerant
In `supabase/functions/_shared/aiResponse.ts`, replace the simple fence-strip with a robust extractor:
- Strip leading/trailing ```json / ``` fences anywhere in the string.
- If `JSON.parse` fails, locate the first `{` and the last `}` (or `[`/`]`) and parse that slice.
- Only throw "malformed JSON" if both attempts fail. Log first 300 chars of the raw content on failure to aid debugging.

### 3. Reduce truncation risk
- Keep `response_format: { type: 'json_object' }`.
- Keep `max_completion_tokens: 8000` (memory caps at 8000) but add a tightened reminder at the end of the system prompt: "Return ONLY the JSON object. No prose, no markdown fences."

### 4. Better error surfacing
- When the final fallback also fails, return a 502 with a clearer message ("AI service is temporarily unavailable, please try again") rather than the raw "malformed JSON" string, so the client toast is user-friendly.
- Keep server logs detailed (model used, first 300 chars of raw content).

## Files changed
- `supabase/functions/_shared/aiResponse.ts` — robust JSON extraction + logging.
- `supabase/functions/generate-create-it-blueprint/index.ts` — swap model order, tighten system prompt tail, friendlier final-error message.

No DB or client changes required. Function will be redeployed after edits.
