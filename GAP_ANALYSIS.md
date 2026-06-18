# PivotHub — Gap Analysis ("app is not working")

**Date:** 2026-06-18
**Reported symptoms:** (1) Published site shows a blank screen / won't load; (2) AI tools error out.
**Scope:** React/Vite frontend + ~50 Supabase Edge Functions (Lovable project `xkeczmvrrjqucfzaxtrz`).

## Method
- `npm install` → clean. `tsc --noEmit` → **0 errors**. `vite build` → **succeeds**.
- Therefore the failure is **not** a compile/build problem. It is a **runtime + configuration** problem in the published environment and in the edge-function/AI layer.

---

## Symptom 1 — Blank screen on the published site

A clean build that renders blank in production is almost always a **runtime throw during boot with no error boundary to catch it**.

### Gap 1.1 — No top-level ErrorBoundary (HIGH, confirmed in code)
- `src/App.tsx` wraps the app in `QueryClientProvider → HelmetProvider → TooltipProvider → AuthProvider → UsageProvider → BrowserRouter`. **None** of these is wrapped in an error boundary.
- A `ReportErrorBoundary` exists (`src/components/ReportErrorBoundary.tsx`) but is used in **exactly one place** (`src/pages/EarnIt.tsx:502`).
- **Consequence:** any exception thrown while a provider mounts (or any page renders) takes down the **entire** React tree → white screen, no message. This is why a single backend/runtime error presents as "the whole app is down."
- **Fix:** wrap `<App>` (or the `<Routes>`) in a global error boundary that renders a fallback UI instead of unmounting everything.

### Gap 1.2 — Supabase client throws synchronously if env vars are missing (HIGH, verify in prod)
- `src/integrations/supabase/client.ts` calls `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)` **at module load**. This module is imported by virtually every page/provider.
- If either `VITE_*` variable is undefined in the **published** build, `createClient` throws immediately → blank screen (combined with Gap 1.1).
- `.env` in the repo has correct values for project `xkeczmvrrjqucfzaxtrz`, and the local build inlines them. **But the published build may use Lovable-injected env, not this file.**
- **Verify:** open the published site, check the browser console for the first thrown error (e.g. `supabaseUrl is required`) and confirm `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are present in the deployed bundle.

> The blank screen is the visible result of **Gap 1.1 turning some runtime error into a full crash.** The console's first error on the live site will pinpoint which one (env var, a throwing provider, etc.). Capturing that console output is the single highest-value next step.

---

## Symptom 2 — AI tools error out

All 40+ AI functions call the **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`) authenticated with the **`LOVABLE_API_KEY`** edge secret. There is **no OpenAI/Gemini key used directly** (`grep`: 44 functions reference `LOVABLE_API_KEY`, 0 reference `OPENAI_API_KEY`). This single dependency is the common point of failure.

### Gap 2.1 — Single point of failure: LOVABLE_API_KEY / gateway state (HIGH, verify in dashboard)
- If `LOVABLE_API_KEY` is **not set** in this project's edge-function secrets → every tool returns `"AI key not configured"` (see `generate-create-it-blueprint/index.ts:276`).
- If the **Lovable AI workspace is paused or out of credits** → gateway returns `402` (`CREDITS_EXHAUSTED`) and tools surface "AI credits exhausted." `_shared/aiTimeout.ts` literally documents this: *"Prevents indefinite hangs when Lovable AI workspace is paused."*
- **Verify:** Supabase Dashboard → Edge Functions → Secrets: is `LOVABLE_API_KEY` present? Lovable workspace: is AI enabled and funded? Check function logs for `402` / `AI key not configured`.

### Gap 2.2 — Slow `openai/gpt-5` primary model causes edge-timeout 502s (HIGH, confirmed in code)
- Recent commit #4 ("drop GPT-5 to stay under edge timeout") fixed **only** `generate-teaching-content` (TeachIt). The same latency problem remains in **17 other functions** that still use `openai/gpt-5` as their model:
  `business-resources, career-assessment, deploy-it, enhanced-assessment-analyzer, generate-business-content, generate-legal-docs, grant-finder, interview-feedback, interview-questions, name-checker, personality-assessment, resume-analyzer, skills-assessment, social-media-content, speak-it, startup-checklist, tech-readiness-assessment`.
- `gpt-5` is slow; large generations exceed the edge function wall-clock limit → the gateway/edge returns `408/502/504`, which the client shows as "AI service temporarily unavailable." This matches the pattern of the earlier CreateIt/TeachIt 502 fixes.
- **Fix:** apply the same remediation pattern already proven on CreateIt/TeachIt to these 17 — i.e. switch the primary to a faster model (`gpt-5-mini` / `gemini-2.5-flash`), and/or chunk the generation, with a fast fallback and retry on transient statuses.

### Gap 2.3 — CORS allowlist may reject the live domain (MEDIUM, verify)
- `_shared/guard.ts` `ALLOWED_ORIGINS` = localhost, an **old** supabase domain, `pivothub.io / www / app.pivothub.io`, plus any `*.lovable.app` / `*.lovableproject.com`.
- If the published site is served from a domain **not** in this list (e.g. a custom domain or a different preview host), `guard()` throws `403 Origin not allowed` on **every** AI call → all tools fail even though the gateway is healthy.
- **Verify:** confirm the live domain is covered by `ALLOWED_ORIGINS`.

### Gap 2.4 — Client-side credit gate depends on DB objects existing (MEDIUM, verify)
- `UsageContext.checkAndIncrementUsage` calls RPC `check_and_increment_ai_usage` and reads `subscribers_public`; tools are gated on this **before** the function is invoked (deduction is intentionally client-side, see `generate-create-it-blueprint/index.ts:335`).
- If the RPC or tables (`subscribers_public`, `user_roles`, `create_it_blueprints`, etc.) are missing in the active project, tools are blocked/error before ever reaching the gateway.
- **Verify:** confirm these DB objects + RLS exist in project `xkeczmvrrjqucfzaxtrz`.

---

## Cross-cutting gap — Stale references to an OLD Supabase project

The frontend/config point to **`xkeczmvrrjqucfzaxtrz`**, but several files still reference a **different, old project `fkvjsgqjgissolpdqbdh`**, indicating an incomplete project migration:

| File | Reference | Impact |
|------|-----------|--------|
| `src/components/LearningDashboard.tsx:443,526` | hardcoded `fkvjsgqjgissolpdqbdh…/course-media/…mp4` video URLs | **Broken course videos** (404) |
| `supabase/functions/_shared/guard.ts:25` | old project in `ALLOWED_ORIGINS` | stale; harmless unless relied upon |
| `src/components/SupabaseUsageMonitor.tsx:213` | admin dashboard link to old project | cosmetic (admin only) |

**Fix:** repoint these to `xkeczmvrrjqucfzaxtrz` (and migrate the `course-media` storage assets to the new project's bucket).

---

## Prioritized remediation checklist

**P0 — restore the site / unblock tools**
1. Capture the **published site's browser-console error** (root cause of the blank screen — Gap 1.2 vs a throwing provider).
2. Add a **global ErrorBoundary** around the app so a single error no longer blanks everything (Gap 1.1).
3. Confirm **`LOVABLE_API_KEY`** is set in edge secrets and the Lovable AI workspace is **active + funded** (Gap 2.1).
4. Confirm the **live domain** is in `guard.ts` `ALLOWED_ORIGINS` (Gap 2.3).

**P1 — stop the 502/timeout errors**
5. Migrate the **17 `gpt-5` functions** to a faster primary model / chunked generation, mirroring the CreateIt + TeachIt fixes (Gap 2.2).

**P2 — correctness / migration cleanup**
6. Verify DB objects + RLS exist in the new project (`check_and_increment_ai_usage`, `subscribers_public`, …) (Gap 2.4).
7. Repoint stale `fkvjsgqjgissolpdqbdh` references and migrate `course-media` assets (Cross-cutting).

---

## What still needs runtime/dashboard access to confirm
These cannot be determined from source alone and require the live site / Supabase dashboard:
- The exact first console error on the published site (Gap 1.2).
- Whether `LOVABLE_API_KEY` is set and the AI workspace is funded (Gap 2.1).
- The published domain vs the CORS allowlist (Gap 2.3).
- Whether the DB schema/RLS was fully migrated to `xkeczmvrrjqucfzaxtrz` (Gap 2.4).
