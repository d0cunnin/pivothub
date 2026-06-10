import { supabase } from "@/integrations/supabase/client";
import type { FunctionInvokeOptions } from "@supabase/supabase-js";

/**
 * Normalized result shape for an edge-function call. Either `data` holds the
 * parsed response or `error` describes what went wrong — never an indefinite
 * hang.
 */
export interface InvokeResult<T = any> {
  data: T | null;
  error: { message: string; timedOut?: boolean } | null;
}

/**
 * Default client-side timeout. The edge functions are budgeted to finish well
 * under the platform's ~150s limit; this gives a little headroom and then
 * surfaces a clear message instead of leaving the UI spinning forever.
 */
const DEFAULT_TIMEOUT_MS = 150_000;

const TIMEOUT_MESSAGE =
  "The request took too long. Please try again — if it keeps happening, shorten your inputs.";

/**
 * Wraps supabase.functions.invoke with a client-side timeout and consistent
 * error normalization. supabase-js does not reliably forward an AbortSignal to
 * the underlying request, so we race the invoke against a timeout. A backend
 * `{ error }` payload is also surfaced through the `error` channel so callers
 * have a single shape to handle.
 */
export async function invokeFunction<T = any>(
  name: string,
  options?: FunctionInvokeOptions,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<InvokeResult<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<InvokeResult<T>>((resolve) => {
    timeoutId = setTimeout(
      () => resolve({ data: null, error: { message: TIMEOUT_MESSAGE, timedOut: true } }),
      timeoutMs,
    );
  });

  const invokePromise = (async (): Promise<InvokeResult<T>> => {
    try {
      const { data, error } = await supabase.functions.invoke(name, options);
      if (error) {
        return { data: null, error: { message: error.message || "Request failed" } };
      }
      // Edge functions return a 200 with an `{ error }` body for graceful
      // failures (rate limit, credits, timeout) — route those to the error channel.
      if (data && typeof data === "object" && "error" in data && (data as any).error) {
        return { data: null, error: { message: String((data as any).error) } };
      }
      return { data: data as T, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e?.message || "Request failed" } };
    }
  })();

  try {
    return await Promise.race([invokePromise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
