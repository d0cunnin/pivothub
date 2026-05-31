/**
 * Shared helpers for safely reading Lovable AI Gateway chat-completion responses.
 *
 * The gateway can occasionally return a 200 with a malformed or empty body (model
 * timeouts, safety filtering, upstream truncation). Reading
 * `data.choices[0].message.content` directly then throws a cryptic
 * "Cannot read properties of undefined" that surfaces as a blank screen in the UI.
 *
 * Funnel every chat-completion response through these helpers so failures throw a
 * clear, user-facing error message instead.
 */

export function extractContent(data: unknown): string {
  const content = (data as any)?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("AI gateway returned an empty response");
  }

  return content;
}

/**
 * Extract a JSON object/array from a chat-completion response. Strips ```json
 * fences if the model wrapped output in a code block.
 */
export function extractJson<T = unknown>(data: unknown): T {
  const raw = extractContent(data);
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("AI gateway returned malformed JSON");
  }
}
