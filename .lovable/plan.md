# Implementation Plan — 5 Gap Fixes (in order)

Executing all 5 items from the gap analysis sequentially.

---

## 1. Fix `packageAccess.ts` (highest ROI — unblocks paying users)

Rebuild `PACKAGE_TOOLS` so every tool that exists in the codebase is mapped to the correct paid tier. Currently many tools (Contract It, Develop It, Schedule It, Host It, Garden It, Act It, Study It, Speak It, Earn It, Prompt It, Code It, Deploy It, chatbots) are unmapped — tiered subscribers silently lose access.

**New mapping:**
- `assess-prep-learn` → add `tech-readiness-assessment`, `community-assessment`, `career-advisor`
- `build-teach-launch` → add `biography-generator`, `business-docs`, `business-mentor`
- `fund-it` → add `grant-finder`, `grant-readiness`, `grant-resources`
- **New package buckets** (or fold into existing): map Contract It, Develop It, Schedule It, Host It, Garden It, Speak It, Act It, Study It, Prompt It, Code It, Deploy It, Earn It tools to the appropriate Build/Launch/All-Access tier.
- Verify `hasToolAccess()` consumers (ToolGuard.tsx) still resolve correctly.

No DB changes. Pure TS edit + a quick sanity check by reading ToolGuard.

---

## 2. Rename / redescribe Study It and Act It

Fix the two worst UX mismatches without changing backend behavior.

- **Study It** → reposition as **"Scripture Study"** (or similar) in nav + page hero + home tool card. Update description to "Bible references, etymology, and scripture lookup for any term."
- **Act It** → reposition as **"Story Studio"** (or keep "Act It" but rewrite copy). Update description to "Generate story concepts, characters, and plot outlines."
- Update: `src/pages/StudyIt.tsx`, `src/pages/ActIt.tsx`, the home tool card list, and any nav/menu entries.
- Update `mem://features/act-it-tool` description if needed.

No route or edge-function changes.

---

## 3. Build Resume Builder

New tool that **generates** a resume (complements existing `resume-analyzer`).

**Backend:**
- New edge function `supabase/functions/resume-builder/index.ts`
- Pattern: copy `biography-generator` structure (verify_jwt=true, credit check via `check_and_increment_ai_usage`, OpenAI via `providerRouter`, moderation guard).
- Inputs: name, target role, years of experience, key skills, work history (array), education, optional tone.
- Output: structured JSON (summary, experience bullets, skills section, education) + plain-text rendered version.
- Credit cost: **5** (matches Biography Generator).

**Frontend:**
- New `src/components/ResumeBuilder.tsx` (form + result panel + copy/download buttons).
- Add to `PrepIt.tsx` next to Resume Analyzer.
- Register `resume-builder` in `toolCreditWeights.ts` (5 credits) and `packageAccess.ts` (`assess-prep-learn`).

---

## 4. Flesh out Teach It (add 3 educator tools)

Teach It currently has only Teaching Materials Generator. Add three sibling tools, each following the same edge-function pattern:

1. **Lesson Plan Generator** (`lesson-plan`, 5 credits) — inputs: subject, grade, duration, learning objectives → returns standards-aligned lesson plan with warm-up, activities, assessment, materials.
2. **Quiz Generator** (`quiz-generator`, 4 credits) — inputs: topic, grade, # questions, type (MC/short-answer/mixed) → returns questions + answer key.
3. **Rubric Builder** (`rubric-builder`, 3 credits) — inputs: assignment description, grade, criteria count → returns multi-level scoring rubric (table).

**Files per tool:**
- `supabase/functions/<name>/index.ts`
- `src/components/<Name>.tsx`
- Wire into `src/pages/TeachIt.tsx` (tabs or cards)
- Add to `toolCreditWeights.ts` and `packageAccess.ts` (`build-teach-launch`)

---

## 5. Convert Create It to a waitlist

Stop charging 70 credits for nothing.

- Remove credit cost from `toolCreditWeights.ts` for `create-it` (or set to 0).
- Replace `CreateIt.tsx` body with a "Coming Soon — Join the Waitlist" page: brief description, email capture form, primary CTA.
- New table `public.create_it_waitlist` (id, email, user_id nullable, created_at) with RLS: anyone can INSERT, only admins can SELECT. Includes GRANTs.
- New edge function `join-create-it-waitlist` (verify_jwt=false, accepts email, rate-limited by IP via `throttle_ip`, inserts row).
- Keep route in App.tsx; remove from any "billable tools" lists.

---

## Technical notes

- All new edge functions follow the project's standard pattern: `corsHeaders` import, JWT verify in code, moderation check, `check_and_increment_ai_usage` RPC for credits, `providerRouter` for model selection, structured JSON output.
- After each batch, deploy via `supabase--deploy_edge_functions` and smoke-test with `supabase--curl_edge_functions`.
- One migration only (for the Create It waitlist table) — runs once, gets approval, then code edits proceed.
- Memory updates: refresh `mem://features/home-page-tool-cards`, add new memory `mem://features/resume-builder`, update `mem://features/act-it-tool` if renamed.

## Execution order

1. `packageAccess.ts` edit + ToolGuard sanity check
2. Rename Study It + Act It (copy-only changes)
3. Resume Builder (edge function + component + wiring)
4. Teach It expansion (3 edge functions + 3 components + page wiring)
5. Create It waitlist (migration → component → edge function)

Estimated scope: ~5 edge functions, ~5 components, 1 migration, ~10 file edits.
