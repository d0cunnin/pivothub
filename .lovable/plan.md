# Fix Earn It "DEMO DATA" Parsing Failure

## What's happening

The AI generation succeeds (Lovable AI returned a 24,638-char response in ~37 seconds) but `JSON.parse` fails with:

> `Bad control character in string literal in JSON at position 22600`

The AI wrapped its output in a ```` ```json ```` fence (which the extractor handles), but inside one of the long string values it included a raw control character — most likely an unescaped newline, tab, or carriage return inside a quoted string. Strict `JSON.parse` rejects this even though the structure is otherwise valid. The function then falls through to the "DEMO DATA" mock response shown in the screenshot.

A second problem: every failed attempt still deducts 2 credits (admin went 1000 → 998 → 996 across the two attempts in the logs), because the credit deduction happens upfront and is never refunded when generation fails.

## Fix

### 1. Make JSON parsing tolerant of control characters (`supabase/functions/generate-side-income-report/index.ts`)

Add a sanitization step before each `JSON.parse` attempt:

- Strip the ```` ```json ```` / ```` ``` ```` fences if present.
- Walk the string and escape any raw control characters (`\n`, `\r`, `\t`, `\b`, `\f`, and other `\x00-\x1F`) **only when they appear inside a quoted string** (so we don't break structural newlines between fields).
- Then call `JSON.parse` on the cleaned text.

Order of attempts:
1. Direct parse of `message.content`.
2. Strip code fences → sanitize control chars → parse.
3. Substring from first `{` to last `}` → sanitize → parse.
4. Only then fall through to mock data.

Also request stricter output from the gateway by adding `response_format: { type: "json_object" }` to the request body so Gemini returns raw JSON without the markdown fence in the first place.

### 2. Refund credits when generation fails

Wherever the function returns the mock "DEMO DATA" response, the AI gateway error response, or hits the timeout fallback failure, call the existing usage RPC (or a small refund SQL via the service client) to add the 2 credits back to the user. This prevents users from being charged for unusable output.

Implementation: after credits are deducted at line 88, store `creditsCharged`. Before any non-success return, run a refund (`UPDATE` on the usage row to decrement `monthly_ai_requests` / `ai_credits_used` and increment `ai_credits_remaining` by `creditsCharged`).

### 3. Refund the 4 credits already lost by the admin

Reset `support@pivothub.io` (user id `6e213a88-5363-4b05-a58f-561f2a771170`) back to 1000 credits remaining, 0 used.

### 4. Redeploy

Deploy `generate-side-income-report` and verify by calling `curl_edge_functions` with a sample assessment payload, confirming the response contains a real `report` (no `_is_mock: true`).

## Technical notes

- The parsing fix is local to one file; no schema or client changes needed.
- The refund uses the existing `service_role` client already created in the function.
- `response_format: json_object` is supported by the Lovable AI Gateway for both Gemini and GPT-5 models and dramatically reduces this class of failure.
