# Remediation plan review + targeted fixes

I checked Claude Code's plan against the current codebase. **Most of Phase 0 is already done** (work from our previous passes). Below is what's actually still outstanding, organized by risk so we can stop at any point.

## Already done — skip
- **0.1** `act-it` / `study-it` already use `google/gemini-2.5-flash` (no `gemini-3-flash-preview` anywhere).
- **0.2** `providerRouter.ts` already returns `openai/gpt-5-mini` (no `gpt-4o`).
- **0.4** `data?.error` guard already added in ActIt, SpeakIt, StudyIt, LogoGenerator, EnhancedInterviewCoach, TechReadinessAssessment, DevelopIt (all 5), ContractIt (both).

## Phase A — Remaining real bugs (do now, low risk)

1. **`career-advisor/index.ts` + `business-mentor/index.ts` moderation (0.3)**
   Both still have a local `moderateContent(text, apiKey)` that POSTs to `api.openai.com/v1/moderations` with the Lovable key (401, silently dead). Replace each local function with an import from `_shared/moderation.ts` (canonical pattern, fails open). Update call sites to the shared signature `moderateContent(text, '<function-name>', userId, 'low')`. No other behavior change.

2. **Frontend `data?.error` guards still missing (0.4 tail)**
   Add the same one-liner already used elsewhere:
   ```ts
   if ((data as any)?.error) throw new Error((data as any).error);
   ```
   plus a guard on the specific field, in:
   - `src/pages/FundIt.tsx` (line ~230, generate-grant-content)
   - `src/components/InterviewQuestionsCoach.tsx` (both invokes ~88, ~135)
   - `src/components/CareerAssessment.tsx` (~317) + guard `data.analysis.recommendations` before `.forEach`
   - `src/components/StartupChecklist.tsx` (~44) + guard `data.checklist.phases` / `phase.tasks` before `.forEach`
   - `src/components/BusinessResourceFinder.tsx` (~49) + guard `category.resources` before `.forEach`

**Acceptance:** with backend forced to error, every tool shows a toast, never a blank screen; moderation log shows entries for career-advisor and business-mentor.

## Phase B — Backend robustness (mechanical, medium effort)

3. **Shared `extractContent()` helper (1.1)** — create `_shared/aiResponse.ts` and replace unguarded `data.choices[0].message.content` reads in the 19 functions Claude listed. Pure refactor; converts gateway weirdness from 500 into a clean error.

4. **Shared `_shared/http.ts` (1.2)** — `jsonResponse` / `errorResponse` with CORS + JSON headers. Migrate error returns only (keep success shapes to avoid frontend coupling).

5. **Migrate inline auth to `guard.ts` (1.3)** — 14 functions, one per commit, tested individually. Higher risk because it touches auth/rate limiting.

## Phase C — Deferred (require test scaffolding first)

Phases 2–5 from Claude's doc (Vitest setup, strict TS, logger, response envelope, folder-by-feature, perf splitting, a11y/docs, `.env` hygiene) — all reasonable, but multi-day work and risky without tests. Recommend not starting these until Phase A + B are in.

## Recommendation
Run **Phase A only** in the next build (small, finishes Phase 0 cleanly). Decide on Phase B after that; skip Phase C unless you want to commit to a longer hardening sprint.
