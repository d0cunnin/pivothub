## Goal

Apply the same fixes Claude diagnosed locally, directly in Lovable, so you don't need the patch or GitHub push. Two categories: (1) broken backend AI calls returning 500/401, (2) frontend tools that white-screen instead of showing the error.

## Backend fixes (edge functions)

1. **`act-it/index.ts`, `study-it/index.ts`** — replace `google/gemini-3-flash-preview` (not valid on the gateway) with `google/gemini-2.5-flash`. Also make the fallback trigger on HTTP errors, not just timeouts.
2. **`generate-event-plan/index.ts`** — stop using `openai/gpt-4o` (invalid here). Use `openai/gpt-5-mini`.
3. **`_shared/providerRouter.ts`** — change default text model from `openai/gpt-4o` to `openai/gpt-5-mini` so other callers also stop returning invalid models.
4. **`career-advisor/index.ts`, `business-mentor/index.ts`** — moderation calls hit `api.openai.com` with the Lovable key (401, silently dead). Route through the Lovable AI Gateway (`google/gemini-2.5-flash-lite`, JSON `{flagged, categories}`), keep fail-open behavior.
5. **`_shared/moderation.ts`, `contact-chatbot/index.ts`, `generate-teaching-content/index.ts`** — already in `.lovable/plan.md`: remove `pivothub-openai-key` / `PIVOTHUB_OPENAI_KEY` references, route through the gateway with `LOVABLE_API_KEY`. Map `gpt-5-2025-08-07` → `openai/gpt-5`, `gpt-5-mini-2025-08-07` → `openai/gpt-5-mini`.

## Frontend fixes (error surfacing)

These tools dereference `data` without checking `data.error`, so a backend error renders as a blank page (and PDFs are blank because there's no content):

- `src/pages/ActIt.tsx`
- `src/pages/SpeakIt.tsx`
- `src/pages/StudyIt.tsx`
- `src/pages/DevelopIt.tsx`
- `src/pages/ContractIt.tsx`
- `src/components/LogoGenerator.tsx`
- `src/components/EnhancedInterviewCoach.tsx`
- `src/components/TechReadinessAssessment.tsx`

For each: after `supabase.functions.invoke(...)`, check `data?.error` and missing-result, surface via the existing toast pattern, and bail before rendering. No layout changes.

## Out of scope

- No schema, RLS, or config changes.
- Not touching the ~10 other tools defensively in this pass — we'll do that only if errors persist after this fix surfaces real messages.
- Rate-limit (5/min guard) behavior unchanged; with the new error surfacing, 429s will now show as a toast instead of a white screen.

## Validation

After implementation: open Act It, Study It, Speak It, Logo, Develop It, Contract It, Interview Coach, Tech Readiness in the preview, trigger one generation each, confirm either a result or a visible error toast (no white screens). Spot-check edge function logs for the four moderation-touching functions to confirm no more `api.openai.com` 401s.
