## What I checked

- `SideIncomeReport.tsx` (current code, all 609 lines) — the object-safe helpers (`renderText`, `toStringArray`, `SkillsAnalysisBlock`, `IncomePotentialBlock`, `ResourcesBlock`, `MonthBlock`) are in place, and the report state is set via `setReport(data.report)` only after a success path that handles `error`, missing `data`, and missing `data.report`.
- `src/lib/pdf-generator.ts` — the side-income PDF section already coerces objects (`JSON.stringify` fallbacks, dual array/object month handling).
- `src/pages/EarnIt.tsx` — the only caller; renders `<SideIncomeReport assessmentId={assessmentId} />` after the assessment completes. The PDF generator runs only inside `downloadReport`, triggered by a button click — never on mount — so a PDF crash cannot blank the page.
- Live console (browser tool, logged-out session): no React errors, no uncaught exceptions. Just harmless `postMessage` warnings from the Lovable iframe.
- Edge function logs: most recent run completed cleanly (200, 19.5 KB, schema validation passed).
- `/earnit` rendered correctly in the browser. Forcing the report path with junk data produced the proper "Unable to Generate Your Blueprint" fallback card — not a white screen.

## Diagnosis

The report code path is now defensive everywhere I can audit it. If you're still seeing a white screen, it's almost certainly a render crash on a field shape we haven't met yet (the AI occasionally returns nested objects in `recommended_paths[].pros/cons/steps/platforms/skillsNeeded` instead of strings, or wraps `executive_summary` in an object). One unguarded `{someObject}` in JSX will unmount the whole tree → blank page.

To pin this down without more guessing, I need either (a) the actual console error text from when it goes blank, or (b) a guarantee that no future shape mismatch can ever produce a blank page. Plan (b) is the right structural fix and also surfaces the exact field that broke for next time.

## Plan

### 1. Add `ReportErrorBoundary` (new file)

`src/components/ReportErrorBoundary.tsx` — small class component:

- Catches render errors in its children via `componentDidCatch`.
- Logs `error.message`, `error.stack`, and `errorInfo.componentStack` to `console.error` so the failing field is identifiable.
- Renders the same "Unable to Generate Your Blueprint" card style already in `SideIncomeReport.tsx`, with:
  - Message: "Something in this blueprint couldn't be displayed."
  - Error code shown to the user: `RENDER_FAIL`.
  - Buttons: "Try Generating Again" (calls `onRetry` prop) and "Go Back" (router back).
- Resets `hasError` when the `resetKey` prop changes, so a successful re-generation re-renders cleanly.

### 2. Wrap the report render in `SideIncomeReport.tsx`

Wrap only the final success-path JSX (the `<div className="container mx-auto px-4 py-8 max-w-5xl">…</div>` block, lines ~390–607) with `<ReportErrorBoundary onRetry={generateReport} resetKey={report ? 'loaded' : 'empty'}>`. The loading and empty-report fallbacks already render safely and stay outside the boundary.

### 3. Harden the last few raw renders inside `SideIncomeReport.tsx`

Convert any direct `{path.foo}` or `{report.bar}` JSX that isn't already wrapped through `renderText` / `toStringArray`:

- `{path.rank ?? index + 1}` (line ~432) → `{renderText(path.rank ?? index + 1)}`.
- Spot-check `{action}` and `{step}` mappings — already strings via `toStringArray`, leave alone.
- Any other field accessed directly on `report.*` or `path.*` that isn't a string — wrap in `renderText`.

### 4. Tiny PDF-generator hardening

`src/lib/pdf-generator.ts`:

- `path.title` and `path.description` (lines 131, 137) currently assume strings — wrap with a local `asText(v)` helper that does `typeof v === 'string' ? v : JSON.stringify(v ?? '')` so a stray object can't crash `doc.splitTextToSize`.
- `report.executive_summary` (line 70) — same `asText` wrap.
- This is purely defensive; it only runs when the user clicks Download PDF, so it doesn't affect the white-screen issue, but it prevents the same class of bug in the PDF path.

## Files touched

- `src/components/ReportErrorBoundary.tsx` (new, ~70 lines)
- `src/components/SideIncomeReport.tsx` (wrap return JSX, harden `path.rank`, audit raw renders)
- `src/lib/pdf-generator.ts` (add `asText` helper for `title`, `description`, `executive_summary`)

## Outcome

- A white screen becomes impossible: any future shape mismatch shows the "Unable to display" card with a Retry button.
- The console will print the exact field that broke (component stack), so if it happens again you can paste that and we fix the specific field in one edit.
- No backend or schema changes — the edge function already returns valid JSON.

After approval I'll make the changes and ask you to re-run the assessment once. If it still blanks, the new console error will tell us the exact culprit instantly.
