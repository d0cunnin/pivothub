# Fix Earn It blank-screen render crash

## Root cause

The edge function now succeeds (logs show `✅ Successfully parsed AI JSON response`, 200 OK, ~22k chars). The white screen is a **React render crash** in `src/components/SideIncomeReport.tsx`.

The AI prompt in `generate-side-income-report/index.ts` instructs the model to return:

- `skills_analysis` as an **object** `{ marketableSkills, undervaluedSkills, quickMonetization, skillGaps, learningPriority }`
- `ninety_day_plan.month_1` / `month_2` / `month_3` as **objects** `{ goal, weeklyActions: [...] }`
- `resources` as an **object** `{ platforms, learningResources, tools, communities }`

But the React component still renders the old shape:

```tsx
<p>{report.skills_analysis}</p>                       // ← object as React child → THROWS
report.ninety_day_plan.month_1?.map(...)              // ← .map on object → silently nothing
report.resources?.map((category) => category.items)   // ← old [{category, items}] shape
```

`{report.skills_analysis}` rendering an object throws "Objects are not valid as a React child", which unwinds the whole tree → blank white page. The other two just render nothing silently and would only result in missing sections, not a crash.

## Fix

Update `src/components/SideIncomeReport.tsx` to render the new structured shape, with backwards-compatible fallbacks in case an older string shape ever comes back.

### 1. Skills Analysis card

Replace the single `<p>` with a structured renderer that handles both string and object:

- If `skills_analysis` is a string → render as `<p>` (legacy fallback).
- If it's an object → render labeled subsections:
  - Marketable Skills (bulleted list of `marketableSkills`)
  - Undervalued Skills (bulleted list of `undervaluedSkills`)
  - Quick Monetization (`quickMonetization` paragraph)
  - Skill Gaps (bulleted list of `skillGaps`)
  - Learning Priority (`learningPriority` paragraph)

### 2. Recommended Paths card

Add the new fields the AI now returns (still optional):

- Show `whyRecommended` paragraph under description.
- Render `income_potential` correctly: it can be a string or an object `{ month1, month3, month6, year1 }`. If object, show a small grid of the four ranges; if string, show as-is.
- Render `pros` / `cons` lists (if present).
- Show `timeToFirstDollar` next to startup cost / time / income chips.

### 3. Resources card

Handle the new `resources` shape:

- If array of `{ category, items }` → keep current rendering (legacy).
- If object → render four labeled sections: Platforms, Learning Resources, Tools, Communities, each as a bulleted list.

### 4. 90-Day Implementation Plan card

Each month is now `{ goal, weeklyActions: string[] }` instead of a string array. Render:

- The month's `goal` as a one-line subtitle under the Month badge.
- `weeklyActions` as the bulleted list (current map target).
- Fall back to mapping the month directly if it's still an array (legacy).

### 5. Quick Wins (new, optional)

If `report.quickWinOpportunities` exists, render it as a small card between Immediate Actions and Resources.

### 6. PDF generator

`src/lib/pdf-generator.ts` already types these fields as `any`, but the actual rendering inside the PDF likely assumes the old shapes too. Update it to handle the same dual shapes (object or string/array) so PDF download doesn't throw after the UI is fixed. Verify the relevant blocks (skills_analysis, resources, ninety_day_plan, income_potential) and add the same conditional handling.

## Technical notes

- Pure UI change in two files: `src/components/SideIncomeReport.tsx` and `src/lib/pdf-generator.ts`. No edge function or schema changes.
- Edge function output is correct and matches the prompt — do not change the prompt.
- All new fields are optional in the renderer so older cached responses still display.
- After the change, regenerate the report once to verify; no credits are charged for a re-render of an already-fetched report.
