## Goal

Stop guessing. Force any crash on `/earnit` to surface as a readable error (not a white screen), reproduce it live in the browser, then apply one surgical fix.

## Why we keep missing it

Current state of the code (verified):
- `EarnIt.tsx` only wraps the `step === 'report'` branch in `ReportErrorBoundary`. If the crash happens in `Header`, a context, a hook, or during the intro/assessment branches, the boundary never mounts → white screen.
- `SideIncomeReport.tsx` already has the `JSON.parse` try/catch, defensive `renderText`/`toStringArray` helpers, and Array.isArray guards on `recommended_paths`.
- `src/lib/pdf-generator.ts` line 126 has an unguarded `report.recommended_paths.forEach(...)` — but that only runs on PDF download, not on render.

So the boundary needs to be higher to actually catch what's killing the page.

## Plan (4 small steps)

### Step 1 — Force the error to surface
In `src/pages/EarnIt.tsx`:
- Add `console.log("EarnIt render start")` at the top of the component
- Wrap **all three** return branches (intro, assessment, report) in `<ReportErrorBoundary>`, not just `report`
- Remove the redundant inner `<ReportErrorBoundary>` from `SideIncomeReport.tsx` (lines 397 and 616) — the outer one will cover it

### Step 2 — Reproduce live
Use browser tools to:
1. `navigate_to_sandbox` → `/earnit`
2. Check console for `"EarnIt render start"` (tells us if the module even loads)
3. Click "Get Your Blueprint", walk through the assessment
4. Capture the error: either the `ReportErrorBoundary` "Details:" text on screen, or the console stack

### Step 3 — Apply one surgical fix based on what we see

| Outcome | Fix |
|---|---|
| Boundary card shows specific message | Patch the exact line named (1–3 lines) |
| Still white + no `"EarnIt render start"` log | Module-load / import error — fix the import |
| Still white + log present | Crash is in `Header`/context above `EarnIt` — move boundary into `App.tsx` route |
| Page renders, PDF download crashes | Add `Array.isArray` guards in `pdf-generator.ts` line 126 + `ninety_day_plan` access |

### Step 4 — Confirm
Re-run the flow, screenshot the working report (or the now-readable error), report back.

## What I will NOT do
- Replace `SideIncomeReport.tsx` with a stub (the working helpers stay)
- Add more speculative defensive wrappers without evidence from Step 2
- Touch the PDF generator unless Step 3 outcome D occurs
