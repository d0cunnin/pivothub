# Fix remaining AI tool bugs + harden gateway calls

## Phase 1 — Real bugs (high priority)

### 1. `supabase/functions/contact-chatbot/index.ts`
- Remove the local duplicated `moderateContent()` function (lines ~10–48).
- Import the canonical helper: `import { moderateContent } from "../_shared/moderation.ts"`.
- Update the call site (~line 213) to the correct signature: `moderateContent(lastUserMessage.content, 'contact-chatbot', userId, 'low')`.
- This restores moderation logging + reputation updates.

### 2. `supabase/functions/study-it/index.ts`
- Fix wrong argument order at line 72.
- Change `moderateContent(topic, supabase, userId, 'study-it')` → `moderateContent(topic, 'study-it', userId, 'medium')`.
- Eliminates `[object Object]` log entries and a potential runtime throw.

## Phase 2 — Resilience migration (medium priority)

Migrate ~30 edge functions from bare `fetch()` against the Lovable AI Gateway to the shared `fetchWithTimeout()` + `handleAIError()` helpers in `_shared/aiTimeout.ts`. This converts opaque 500s on 402 (credits)/429 (rate limit)/timeout into structured errors the frontend already knows how to surface.

Pattern, applied identically per function:

```ts
import { fetchWithTimeout, handleAIError } from "../_shared/aiTimeout.ts";

try {
  const resp = await fetchWithTimeout(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    { method: "POST", headers: {...}, body: JSON.stringify({...}) },
    60000
  );
  // existing parsing
} catch (err) {
  return handleAIError(err, corsHeaders, "<function-name>");
}
```

Target functions (group by tool area):
- Build It: `generate-business-content`, `generate-logo`, `name-checker`, `startup-checklist`
- Fund It: `generate-grant-content`, `grant-finder`, `generate-grant-readiness`
- Contract It / Develop It: `generate-capability-statement`, `generate-program-design`, `generate-community-assessment`, `generate-stakeholder-plan`, `community-dev-coach`
- Host It / Garden It: `generate-garden-plan`
- Earn It / Teaching: `generate-side-income-report`, `generate-teaching-content`, `generate-legal-docs`, `generate-launch-strategy`, `social-media-content`, `business-resources`
- Story/Speak/Study: `act-it`, `speak-it`, `study-it`, `prompt-it`, `code-it`, `deploy-it`
- Prep It / Assess It: `resume-analyzer`, `interview-questions`, `interview-feedback`, `career-assessment`, `skills-assessment`, `personality-assessment`, `enhanced-assessment-analyzer`

## Phase 3 — Cleanup (low priority)
- Delete unused `src/lib/runware.ts` (no call sites, no key configured).

## Out of scope
- No DB schema, RLS, or `verify_jwt` changes.
- No model swaps beyond what's already fixed.
- No frontend changes (Phase 1's frontend error-surfacing landed in the previous pass).

## Validation
- After Phase 1: trigger Contact chatbot + Study It; confirm `moderation_log` rows have correct `function_name` and no `[object Object]`.
- After Phase 2: hit one migrated tool while gateway returns 429 (or simulate); confirm frontend toast shows "Rate limit" / "Credits exhausted" instead of generic error.

## Recommended scope for this build
Run **Phase 1 only** now (fast, fixes the 2 actual broken tools). Phase 2 is a larger sweep — confirm before I touch ~30 files.
