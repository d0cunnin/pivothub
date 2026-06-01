/**
 * Shared helpers for safely reading Lovable AI Gateway chat-completion responses.
 */

export function extractContent(data: unknown): string {
  const content = (data as any)?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new Error("AI gateway returned an empty response");
  }

  return content;
}

/**
 * Extract a JSON object/array from a chat-completion response. Tolerant to:
 *  - ```json / ``` code fences (anywhere)
 *  - leading or trailing prose
 *  - partial fences
 */
export function extractJson<T = unknown>(data: unknown): T {
  const raw = extractContent(data);

  // Strip code fences anywhere in the string.
  let cleaned = raw
    .replace(/```(?:json)?\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  // First attempt: parse as-is.
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // fall through
  }

  // Second attempt: slice between the first { or [ and last } or ].
  const objStart = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  let start = -1;
  let end = -1;
  const isArray =
    arrStart !== -1 && (objStart === -1 || arrStart < objStart);
  if (isArray) {
    start = arrStart;
    end = cleaned.lastIndexOf("]");
  } else {
    start = objStart;
    end = cleaned.lastIndexOf("}");
  }

  if (start !== -1 && end > start) {
    const slice = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {
      // fall through
    }
  }

  console.error(
    "[extractJson] Failed to parse AI response. First 300 chars:",
    raw.slice(0, 300),
  );
  throw new Error("AI gateway returned malformed JSON");
}
