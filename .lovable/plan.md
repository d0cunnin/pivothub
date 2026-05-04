## Goal

Eliminate the only confirmed bug from the Codex audit: three edge functions reference OpenAI secrets (`pivothub-openai-key` / `PIVOTHUB_OPENAI_KEY`) that **do not exist** in the project's secret store. Today only `LOVABLE_API_KEY` is configured, so any code path hitting these references will 500.

## Files changed

### 1. `supabase/functions/_shared/moderation.ts`
- Remove `Deno.env.get('pivothub-openai-key')`.
- Replace direct `https://api.openai.com/v1/moderations` call with a Lovable AI Gateway call using `LOVABLE_API_KEY` against `https://ai.gateway.lovable.dev/v1/chat/completions`, model `google/gemini-2.5-flash-lite`, with a short system prompt asking for JSON `{flagged: bool, categories: string[]}`.
- Keep the existing fail-open / fail-closed risk logic and `logModeration` / `updateUserReputation` helpers unchanged.

### 2. `supabase/functions/contact-chatbot/index.ts`
- Replace the inline `moderateContent` (lines 10–45) with the same gateway-based moderation pattern using `LOVABLE_API_KEY`. Keep "fail open on error" behavior.
- Remove the `pivothub-openai-key` reference.

### 3. `supabase/functions/generate-teaching-content/index.ts`
- Remove the `PIVOTHUB_OPENAI_KEY` env check (lines 83–90).
- Switch both `fetch('https://api.openai.com/v1/chat/completions', ...)` calls (lines 676 and 699) to the Lovable AI Gateway: `https://ai.gateway.lovable.dev/v1/chat/completions` with `Authorization: Bearer ${lovableApiKey}`.
- Map models: `gpt-5-2025-08-07` → `openai/gpt-5`, `gpt-5-mini-2025-08-07` → `openai/gpt-5-mini` (gateway-supported names).
- Keep the existing 120s/60s abort timeouts and 429/402 handling.

## Why this is safe

- `LOVABLE_API_KEY` is already configured and used by every other AI function in the project (verified in `_shared/providerRouter.ts`).
- No schema, RLS, frontend, or config changes.
- Removes broken code paths rather than adding new behavior.

## Out of scope

- The broader "standardize env keys + startup validation across all 50 functions" Codex proposed. No log evidence supports it; we'll revisit if real failures appear after you start using the app again.
