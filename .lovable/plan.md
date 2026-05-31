# Smoke Test: All 21 AI Edge Functions

Goal: invoke every AI edge function once with a minimal valid payload (as the logged-in preview user) and confirm each returns a non-empty, well-shaped response rather than an `extractContent` throw, an upstream gateway error, or a blank body.

## Approach

For each function, call it via the authenticated edge-function HTTP path using a tiny but schema-valid input. Capture:
- HTTP status
- whether the response body has the expected content field (text/array/object)
- any `error` field
- approximate latency

Then report a pass/fail table. Failures will include the error message so we know whether it's a 402/429 (credits/rate), a missing input field, a gateway timeout, or a real bug.

## Functions to test (21)

`act-it`, `study-it`, `speak-it`, `career-advisor`, `business-mentor`, `career-assessment`, `personality-assessment`, `skills-assessment`, `tech-readiness-assessment`, `enhanced-assessment-analyzer`, `startup-checklist`, `social-media-content`, `business-resources`, `name-checker`, `grant-finder`, `generate-grant-content`, `generate-launch-strategy`, `generate-legal-docs`, `generate-business-content`, `generate-teaching-content`, `interview-questions`, `interview-feedback`, `resume-analyzer`.

(That's the full set with `extractContent` rolled out; minor pruning if any function isn't user-callable on its own.)

## Inputs

Use the smallest realistic payload each function accepts. I'll read each function's input validator (zod schema or manual checks) first, then build the minimum body. Examples:
- `act-it`: short scene prompt
- `name-checker`: one candidate business name
- `grant-finder`: brief org description + region
- `interview-questions`: role + level

## Cost note

Each call consumes 1+ Tool Credits on your account. Total: ~25-30 credits across the run. Calls run sequentially with a 1s gap to avoid IP throttle.

## Deliverable

A single pass/fail table in chat, plus the raw error string for any failure. No code changes in this phase — if a function fails, we'll triage in a follow-up.
