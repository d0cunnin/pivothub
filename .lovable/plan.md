## Fix: Chunk blueprint generation into 3 parallel AI calls

**Root cause:** A single AI call must emit 11 long markdown sections in JSON. The output exceeds the token cap and truncates mid-string, producing unparseable JSON. Both primary and fallback hit the same wall → 502.

**Fix:** Split the 11 keys into 3 chunks, run in parallel, and merge.

### Changes to `supabase/functions/generate-create-it-blueprint/index.ts`

1. Define 3 chunks:
   - **A:** `executiveSummary`, `technologyStack`, `databaseArchitecture`, `applicationArchitecture`
   - **B:** `userFlow`, `integrations`, `monetizationStrategy`, `developmentRoadmap`
   - **C:** `buildInstructions`, `githubSetup`, `aiBuildPrompt`

2. `buildSystemPrompt(skillLevel, keys)` dynamically lists only the keys for that chunk, instructing the model to keep output under ~3500 tokens.

3. `callModel(...)` accepts the keys list; each call uses `max_completion_tokens: 4000`, `response_format: json_object`, timeout 60s.

4. Run all 3 chunks via `Promise.all` against `google/gemini-2.5-flash`. Per-chunk fallback to `google/gemini-2.5-flash-lite` if one chunk fails. End-to-end latency stays well under the 150s edge limit.

5. Merge the 3 partial objects into one `Blueprint` and feed into existing `validateBlueprint`.

No changes to client, DB, shared helpers, or credits flow.
