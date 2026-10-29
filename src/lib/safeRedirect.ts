/**
 * Returns `target` only if it is a same-site path ("/dashboard?tab=1"),
 * otherwise `fallback`. Blocks protocol-relative ("//evil.com"), backslash
 * ("/\evil.com", which browsers treat like "//") and scheme ("https:") tricks
 * that would send a user to another site after signing in.
 */
export function safeRedirect(target: string | null | undefined, fallback = '/'): string {
  if (!target) return fallback;
  const path = target.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return fallback;
  try {
    const url = new URL(path, 'https://pivothub.invalid');
    if (url.origin !== 'https://pivothub.invalid') return fallback;
  } catch {
    return fallback;
  }
  return path;
}
