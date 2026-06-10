/**
 * Shared AI generation helper.
 *
 * Generalizes the timeout/retry/fallback pattern proven in
 * generate-teaching-content into a single reusable module so every tool stays
 * under the ~150s edge runtime limit instead of dying with a silent 504.
 *
 * Strategy: a fast primary model (Gemini 2.5 Flash) with a budgeted timeout,
 * falling back to a secondary model (gpt-5-mini) only if the primary fails.
 * Transient gateway errors are retried once; timeouts are NOT retried on the
 * same model (they fall through to the fallback) so the total request time
 * stays bounded:  primary (~50s) + fallback (~70s) = ~120s < 150s.
 */

import { extractContent, extractJson } from "./aiResponse.ts";

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const DEFAULT_PRIMARY_MODEL = "google/gemini-2.5-flash";
export const DEFAULT_FALLBACK_MODEL = "openai/gpt-5-mini";

const DEFAULT_PRIMARY_TIMEOUT_MS = 50_000;
const DEFAULT_FALLBACK_TIMEOUT_MS = 70_000;

// Gateway statuses worth a single quick retry (transient: rate limit / upstream blips).
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface GenerateOptions {
  maxTokens?: number;
  /** Pass { type: "json_object" } for JSON tools. */
  responseFormat?: { type: string };
  primaryModel?: string;
  fallbackModel?: string;
  primaryTimeoutMs?: number;
  fallbackTimeoutMs?: number;
  /** Number of retries on transient errors per model (default 1). */
  retries?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Single chat-completion call wrapped in an AbortController timeout.
 * Returns the parsed gateway response body. Thrown errors are tagged with
 * `err.status` when the failure came from an HTTP status.
 */
export async function callChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  timeoutMs: number,
  opts: { maxTokens?: number; responseFormat?: { type: string } } = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body: Record<string, unknown> = { model, messages };
    if (opts.maxTokens) body.max_completion_tokens = opts.maxTokens;
    if (opts.responseFormat) body.response_format = opts.responseFormat;

    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[aiGenerate] ${model} error:`, response.status, errorText.slice(0, 300));
      const err: any = new Error(`AI error: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retry once on transient gateway statuses. Timeouts (AbortError) are NOT
 * retried on the same model — they propagate so the caller can fall back to a
 * different model, keeping the total request under the edge runtime limit.
 */
export async function callChatWithRetry(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  timeoutMs: number,
  opts: { maxTokens?: number; responseFormat?: { type: string }; retries?: number } = {},
): Promise<unknown> {
  const retries = opts.retries ?? 1;
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callChat(apiKey, model, messages, timeoutMs, opts);
    } catch (err: any) {
      lastErr = err;
      if (err?.status === 402) throw err; // never retry "out of credits"
      const retryable = err?.status !== undefined && TRANSIENT_STATUSES.has(err.status);
      if (!retryable || attempt === retries) break;
      await sleep(400 * 2 ** attempt);
    }
  }
  throw lastErr;
}

/**
 * Run the full primary→fallback flow and return the raw gateway response body.
 * Most callers want generateText/generateJson instead.
 */
export async function generateRaw(
  apiKey: string,
  messages: ChatMessage[],
  opts: GenerateOptions = {},
): Promise<unknown> {
  const primaryModel = opts.primaryModel ?? DEFAULT_PRIMARY_MODEL;
  const fallbackModel = opts.fallbackModel ?? DEFAULT_FALLBACK_MODEL;
  const primaryTimeout = opts.primaryTimeoutMs ?? DEFAULT_PRIMARY_TIMEOUT_MS;
  const fallbackTimeout = opts.fallbackTimeoutMs ?? DEFAULT_FALLBACK_TIMEOUT_MS;
  const callOpts = {
    maxTokens: opts.maxTokens,
    responseFormat: opts.responseFormat,
    retries: opts.retries,
  };

  try {
    return await callChatWithRetry(apiKey, primaryModel, messages, primaryTimeout, callOpts);
  } catch (err: any) {
    if (err?.status === 402) throw err; // out of credits — fallback won't help
    console.warn(`[aiGenerate] Primary model ${primaryModel} failed, falling back to ${fallbackModel}: ${err?.message}`);
    return await callChatWithRetry(apiKey, fallbackModel, messages, fallbackTimeout, callOpts);
  }
}

/** Generate text content. Throws AI errors tagged with `.status`. */
export async function generateText(
  apiKey: string,
  messages: ChatMessage[],
  opts: GenerateOptions = {},
): Promise<string> {
  const data = await generateRaw(apiKey, messages, opts);
  return extractContent(data);
}

/** Generate and parse a JSON response. Sets response_format automatically. */
export async function generateJson<T = unknown>(
  apiKey: string,
  messages: ChatMessage[],
  opts: GenerateOptions = {},
): Promise<T> {
  const data = await generateRaw(apiKey, messages, {
    responseFormat: { type: "json_object" },
    ...opts,
  });
  return extractJson<T>(data);
}

/** Convenience for the common system + user single-shot prompt. */
export function systemUser(systemMsg: string, userPrompt: string): ChatMessage[] {
  return [
    { role: "system", content: systemMsg },
    { role: "user", content: userPrompt },
  ];
}
