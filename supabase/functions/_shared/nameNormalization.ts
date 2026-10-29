// Shared, dependency-free name normalization used by both the browser
// (src/lib/nameNormalization.ts re-exports this) and the name-checker function.

export interface NormalizedName {
  /** User's input with outer whitespace trimmed and inner runs collapsed; casing preserved. */
  display: string;
  /** Case-insensitive comparison key. */
  comparison: string;
  /** Letters/digits only, lowercase — used for domain labels and handles. */
  slug: string;
}

export function normalizeBusinessName(input: string): NormalizedName {
  const display = (input ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
  const comparison = display.toLocaleLowerCase("en-US");
  const slug = comparison.replace(/[^a-z0-9]/g, "");
  return { display, comparison, slug };
}

/** Extracts a lowercase hostname from a URL or bare domain; null when invalid. */
export function normalizeDomain(input: string): string | null {
  let s = (input ?? "").trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  s = s.split(/[/?#]/)[0].split("@").pop()!.split(":")[0].replace(/\.$/, "");
  const label = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
  const parts = s.split(".");
  if (parts.length < 2 || !parts.every((p) => label.test(p))) return null;
  if (!/^[a-z]{2,63}$/.test(parts[parts.length - 1])) return null;
  return s;
}

export function buildDomainLabels(slug: string): string[] {
  if (!slug) return [];
  return [slug, `${slug}co`, `${slug}inc`, `${slug}llc`, `${slug}app`, `${slug}online`].filter(
    (l) => l.length <= 63,
  );
}

interface HandleRule { min: number; max: number; pattern: RegExp; strip: RegExp }
export const SOCIAL_PLATFORMS: Record<string, { url: string; rule: HandleRule }> = {
  Instagram: { url: "https://instagram.com/", rule: { min: 1, max: 30, pattern: /^[a-z0-9._]+$/, strip: /[^a-z0-9._]/g } },
  "X (Twitter)": { url: "https://x.com/", rule: { min: 4, max: 15, pattern: /^[a-z0-9_]+$/, strip: /[^a-z0-9_]/g } },
  Facebook: { url: "https://facebook.com/", rule: { min: 5, max: 50, pattern: /^[a-z0-9.]+$/, strip: /[^a-z0-9.]/g } },
  LinkedIn: { url: "https://linkedin.com/company/", rule: { min: 3, max: 100, pattern: /^[a-z0-9-]+$/, strip: /[^a-z0-9-]/g } },
  YouTube: { url: "https://youtube.com/@", rule: { min: 3, max: 30, pattern: /^[a-z0-9._-]+$/, strip: /[^a-z0-9._-]/g } },
  TikTok: { url: "https://tiktok.com/@", rule: { min: 2, max: 24, pattern: /^[a-z0-9._]+$/, strip: /[^a-z0-9._]/g } },
};

/** Platform-appropriate lowercase handle, or null when the name can't form a valid one. */
export function normalizeHandle(name: string, platform: keyof typeof SOCIAL_PLATFORMS | string): string | null {
  const cfg = SOCIAL_PLATFORMS[platform];
  if (!cfg) return null;
  const h = normalizeBusinessName(name).comparison.replace(/\s+/g, "").replace(cfg.rule.strip, "");
  if (h.length < cfg.rule.min || h.length > cfg.rule.max || !cfg.rule.pattern.test(h)) return null;
  return h;
}

export interface StateInfo { code: string; name: string; registryUrl: string }

const STATE_LIST: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"],
  ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"],
  ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

export const US_STATES: StateInfo[] = STATE_LIST.map(([code, name]) => ({
  code,
  name,
  // Official SOS search pages differ per state; this NASS directory links to each official registry.
  registryUrl: "https://www.nass.org/business-services/corporate-registration",
}));

/** Maps "MI", " michigan ", "new-york", "New York" to a canonical state; null if unsupported. */
export function normalizeState(input: string): StateInfo | null {
  const s = (input ?? "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
  if (!s) return null;
  return US_STATES.find((st) => st.code.toLowerCase() === s || st.name.toLowerCase() === s) ?? null;
}

export type CheckStatus = "taken" | "no_records" | "unverified";

/** Interprets a Google DNS-over-HTTPS JSON answer. Never reports confirmed availability. */
export function interpretDnsResult(dns: { Status?: number; Answer?: unknown[] } | null): CheckStatus {
  if (!dns || typeof dns.Status !== "number") return "unverified";
  if (dns.Status === 0 && Array.isArray(dns.Answer) && dns.Answer.length > 0) return "taken";
  if (dns.Status === 3) return "no_records"; // NXDOMAIN
  if (dns.Status === 0) return "no_records";
  return "unverified"; // SERVFAIL etc.
}
