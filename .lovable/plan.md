# Fix REPORT_GEN_FAIL — missing API key variable

## Root cause (confirmed in logs)

```
ReferenceError: lovableApiKey is not defined
  at index.ts:388:38
```

Auth ✅, credits deducted ✅ (998 remaining), schema validated ✅ — then it crashes calling the AI Gateway because the variable `lovableApiKey` is referenced on lines 399 and 425 but never declared. The `LOVABLE_API_KEY` secret exists in the project; the code just never reads it.

## Fix

In `supabase/functions/generate-side-income-report/index.ts`, before the first AI Gateway fetch (around line 388), add:

```ts
const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
if (!lovableApiKey) {
  return new Response(
    JSON.stringify({ error: 'AI service is not configured.' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

Then redeploy the function.

## Credit refund consideration

The last failed attempt charged 2 credits. Admin currently has 998 — I'll restore those 2 so the balance returns to 1000 after the fix is in.

## Verification

After deploy, click "Try Generating Again" on /earnit. Expect a successful blueprint with no REPORT_GEN_FAIL.
