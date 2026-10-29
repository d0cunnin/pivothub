/**
 * Google Analytics 4 for the organic marketing funnel:
 * landing (with UTM attribution) -> sign_up -> first tool opened -> tool completed.
 *
 * Privacy: only non-personal values are ever sent (page paths, tool ids, tool
 * categories, campaign source/medium/name/content). Never emails, names,
 * user ids, tokens or anything a user typed. Ads features are disabled.
 *
 * Everything is a no-op until GA_MEASUREMENT_ID is set, so the app works the
 * same without analytics.
 */

/** GA4 Measurement ID ("G-XXXXXXXXXX"), from GA Admin > Data streams > Web. */
export const GA_MEASUREMENT_ID: string = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || 'G-SWJ68P86C8';

const FIRST_TOUCH_KEY = 'ph_attr_first';
const LAST_TOUCH_KEY = 'ph_attr_last';
const CONSENT_KEY = 'ph_analytics_consent';
const SENT_KEY = 'ph_ga_sent';

type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

// ---------------------------------------------------------------------------
// Storage helpers (storage can be blocked; analytics must never throw)
// ---------------------------------------------------------------------------
function readJson<T>(storage: Storage | undefined, key: string): T | null {
  try {
    const raw = storage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJson(storage: Storage | undefined, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}
const local = (): Storage | undefined => {
  try { return window.localStorage; } catch { return undefined; }
};

// ---------------------------------------------------------------------------
// Attribution
// ---------------------------------------------------------------------------
export interface Attribution {
  source: string;
  medium: string;
  campaign?: string;
  content?: string;
  landing_page: string;
  captured_at: string;
}

const SOCIAL_REFERRERS: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|(^|\.)fb\.com$|(^|\.)fb\.me$/, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, 'x'],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, 'linkedin'],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, 'youtube'],
  [/(^|\.)pinterest\.[a-z.]+$/, 'pinterest'],
];
const SEARCH_REFERRERS = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia)\.[a-z.]+$/;

/** Keeps campaign values short and free of anything that looks like personal data. */
function cleanParam(value: string | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim().slice(0, 100);
  if (!v || /@/.test(v)) return undefined;
  return v;
}

/** Reads UTM tags or, failing that, the referring site. Returns null for direct/internal visits. */
export function attributionFromLocation(href: string, referrer: string): Attribution | null {
  let url: URL;
  try { url = new URL(href); } catch { return null; }
  const p = url.searchParams;
  const landing_page = url.pathname;
  const captured_at = new Date().toISOString();
  const source = cleanParam(p.get('utm_source'));
  if (source) {
    return {
      source: source.toLowerCase(),
      medium: (cleanParam(p.get('utm_medium')) ?? 'unknown').toLowerCase(),
      campaign: cleanParam(p.get('utm_campaign')),
      content: cleanParam(p.get('utm_content')),
      landing_page,
      captured_at,
    };
  }
  if (p.get('fbclid')) return { source: 'facebook', medium: 'social', landing_page, captured_at };
  if (p.get('ttclid')) return { source: 'tiktok', medium: 'social', landing_page, captured_at };
  if (!referrer) return null;
  let host: string;
  try { host = new URL(referrer).hostname.toLowerCase(); } catch { return null; }
  if (host === url.hostname.toLowerCase() || /(^|\.)pivothub\.(io|lovable\.app)$/.test(host)) return null;
  for (const [pattern, name] of SOCIAL_REFERRERS) {
    if (pattern.test(host)) return { source: name, medium: 'social', landing_page, captured_at };
  }
  if (SEARCH_REFERRERS.test(host)) return { source: host.replace(/^www\./, '').split('.')[0], medium: 'organic', landing_page, captured_at };
  return { source: host.replace(/^www\./, ''), medium: 'referral', landing_page, captured_at };
}

let bootHref = '';

/**
 * Call once at startup, before the router can redirect, so UTM tags survive
 * redirects to sign-in. First touch is never overwritten; last touch only
 * changes when a new campaign/referral visit happens (a direct visit keeps it).
 */
export function captureAttribution() {
  if (typeof window === 'undefined') return;
  bootHref = window.location.href;
  const touch = attributionFromLocation(window.location.href, document.referrer);
  if (!touch) return;
  const store = local();
  if (!readJson<Attribution>(store, FIRST_TOUCH_KEY)) writeJson(store, FIRST_TOUCH_KEY, touch);
  writeJson(store, LAST_TOUCH_KEY, touch);
}

export function getAttribution(): { first: Attribution | null; last: Attribution | null } {
  const store = local();
  return { first: readJson<Attribution>(store, FIRST_TOUCH_KEY), last: readJson<Attribution>(store, LAST_TOUCH_KEY) };
}

/** Saved on the new account (Supabase user metadata) so sign-ups can be counted by source server-side. */
export function signupAttributionMetadata(): Record<string, unknown> {
  const { first, last } = getAttribution();
  if (!first && !last) return { signup_attribution: { source: 'direct', medium: 'none' } };
  return { signup_attribution: { ...(last ?? first), first_touch: first ?? undefined } };
}

/** Campaign params attached to conversion events. */
function campaignParams() {
  const a = getAttribution().last ?? getAttribution().first;
  return {
    campaign_source: a?.source ?? 'direct',
    campaign_medium: a?.medium ?? 'none',
    ...(a?.campaign ? { campaign_name: a.campaign } : {}),
    ...(a?.content ? { campaign_content: a.content } : {}),
  };
}

// ---------------------------------------------------------------------------
// Consent (notice + opt-out; opt-in in the EEA/UK/Switzerland)
// ---------------------------------------------------------------------------
export type ConsentChoice = 'granted' | 'denied';
const CONSENT_REQUIRED_REGIONS = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH',
];

export function getConsentChoice(): ConsentChoice | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function setConsentChoice(choice: ConsentChoice) {
  try { window.localStorage.setItem(CONSENT_KEY, choice); } catch { /* ignore */ }
  window.gtag?.('consent', 'update', { analytics_storage: choice });
}

// ---------------------------------------------------------------------------
// GA loading and events
// ---------------------------------------------------------------------------
export const analyticsEnabled = () => typeof window !== 'undefined' && /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID);

/** Loads gtag.js once (skips if a GA tag is already on the page). */
export function initAnalytics() {
  if (!analyticsEnabled()) return;
  if (window.gtag || document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
  window.dataLayer = window.dataLayer || [];
  // gtag must push the arguments object itself.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  const g = window.gtag;
  const denied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  g('consent', 'default', { ...denied, analytics_storage: 'denied', region: CONSENT_REQUIRED_REGIONS });
  g('consent', 'default', { ...denied, analytics_storage: 'granted' });
  const choice = getConsentChoice();
  if (choice) g('consent', 'update', { analytics_storage: choice });
  g('js', new Date());
  g('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

function sendEvent(name: string, params: Record<string, unknown> = {}) {
  if (!analyticsEnabled() || !window.gtag) return;
  window.gtag('event', name, params);
}

let firstPageView = true;

/** SPA page view. The first one uses the original landing URL so UTM tags count even after a redirect. */
export function trackPageView(path: string) {
  const href = firstPageView && bootHref ? bootHref : window.location.href;
  firstPageView = false;
  let location = href;
  try {
    // Drop anything but campaign tags from the query string (no tokens or ids).
    const url = new URL(href);
    const keep = new URLSearchParams();
    url.searchParams.forEach((v, k) => { if (/^utm_/.test(k)) keep.set(k, v); });
    url.search = keep.toString();
    url.hash = '';
    location = url.toString();
  } catch { /* use as-is */ }
  sendEvent('page_view', { page_location: location, page_path: path, page_title: document.title });
  const tool = TOOL_PAGES[path];
  if (tool) trackToolOpen(tool);
}

/** Remembers which one-time events this browser has sent, keyed by an opaque key. */
function onceKey(key: string): boolean {
  const store = local();
  const sent = readJson<string[]>(store, SENT_KEY) ?? [];
  if (sent.includes(key)) return false;
  sent.push(key);
  writeJson(store, SENT_KEY, sent.slice(-200));
  return true;
}

/**
 * Successful account creation. `accountKey` (the new user's id) is only used
 * locally to prevent duplicates on refresh/retry; it is never sent to GA.
 */
export function trackSignUp(method: 'email' | 'google', accountKey: string) {
  if (!accountKey || !onceKey(`signup:${accountKey}`)) return;
  sendEvent('sign_up', { method, ...campaignParams() });
}

// Tool pages (route -> category) for "tool opened".
const TOOL_PAGES: Record<string, string> = {
  '/assessit': 'assess_it', '/prepit': 'prep_it', '/buildit': 'build_it', '/earnit': 'earn_it',
  '/fundit': 'fund_it', '/launchit': 'launch_it', '/teachit': 'teach_it', '/scheduleit': 'schedule_it',
  '/hostit': 'host_it', '/gardenit': 'garden_it', '/speakit': 'speak_it', '/actit': 'act_it',
  '/studyit': 'study_it', '/promptit': 'prompt_it', '/codeit': 'code_it', '/deployit': 'deploy_it',
  '/createit': 'create_it', '/contractit': 'contract_it', '/developit': 'develop_it',
};

/** Opening a tool page. Sends `tool_open` each time and `first_tool_open` once per browser. */
export function trackToolOpen(category: string) {
  const params = { tool_category: category, ...campaignParams() };
  sendEvent('tool_open', params);
  if (onceKey('first_tool_open')) sendEvent('first_tool_open', params);
}

// Edge function -> tool category, for completed tool runs.
const TOOL_FUNCTIONS: Record<string, string> = {
  'career-assessment': 'assess_it', 'enhanced-assessment-analyzer': 'assess_it', 'tech-readiness-assessment': 'assess_it',
  'career-advisor': 'prep_it', 'interview-questions': 'prep_it', 'interview-feedback': 'prep_it',
  'resume-analyzer': 'prep_it', 'resume-builder': 'prep_it',
  'generate-business-content': 'build_it', 'business-mentor': 'build_it', 'business-resources': 'build_it',
  'name-checker': 'build_it', 'generate-logo': 'build_it', 'startup-checklist': 'build_it',
  'social-media-content': 'build_it', 'generate-legal-docs': 'build_it',
  'generate-side-income-report': 'earn_it', 'generate-grant-content': 'fund_it', 'generate-launch-strategy': 'launch_it',
  'generate-teaching-content': 'teach_it', 'lesson-plan': 'teach_it', 'quiz-generator': 'teach_it', 'rubric-builder': 'teach_it',
  'generate-schedule': 'schedule_it', 'generate-event-plan': 'host_it', 'generate-garden-plan': 'garden_it',
  'speak-it': 'speak_it', 'act-it': 'act_it', 'study-it': 'study_it', 'prompt-it': 'prompt_it', 'code-it': 'code_it',
  'deploy-it': 'deploy_it', 'generate-create-it-blueprint': 'create_it',
  'generate-capability-statement': 'contract_it', 'generate-contract-readiness': 'contract_it',
  'community-dev-coach': 'develop_it', 'generate-community-assessment': 'develop_it', 'generate-grant-readiness': 'develop_it',
  'generate-program-design': 'develop_it', 'generate-stakeholder-plan': 'develop_it',
};

/**
 * A tool returned results successfully (the server has charged for it).
 * Sends `tool_complete` every time and `first_tool_complete` once per browser.
 */
export function trackToolComplete(functionName: string) {
  const category = TOOL_FUNCTIONS[functionName];
  if (!category) return;
  const params = { tool_id: functionName, tool_category: category, ...campaignParams() };
  const first = onceKey('first_tool_complete');
  sendEvent('tool_complete', { ...params, is_first: first });
  if (first) sendEvent('first_tool_complete', params);
}
