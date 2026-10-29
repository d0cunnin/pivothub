import { describe, it, expect, beforeEach, vi } from 'vitest';

// Minimal browser stand-ins (tests run in Node).
function setupBrowser(href: string, referrer = '') {
  const store = new Map<string, string>();
  const events: unknown[][] = [];
  const g = globalThis as any;
  g.window = {
    location: { href, hostname: new URL(href).hostname },
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
    gtag: (...args: unknown[]) => events.push(args),
  };
  g.document = { referrer, title: 'PivotHub', querySelector: () => null };
  return { events, store };
}

async function load() {
  vi.resetModules();
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');
  return import('./analytics');
}

const eventNames = (events: unknown[][]) => events.filter((e) => e[0] === 'event').map((e) => e[1]);
const eventParams = (events: unknown[][], name: string) => events.find((e) => e[0] === 'event' && e[1] === name)?.[2] as Record<string, unknown>;

describe('attribution', () => {
  beforeEach(() => setupBrowser('https://pivothub.io/'));

  it('reads UTM tags', async () => {
    const a = await load();
    const r = a.attributionFromLocation('https://pivothub.io/earnit?utm_source=Facebook&utm_medium=social&utm_campaign=fall_launch&utm_content=reel1', '');
    expect(r).toMatchObject({ source: 'facebook', medium: 'social', campaign: 'fall_launch', content: 'reel1', landing_page: '/earnit' });
  });

  it('recognises social referrers and click ids without UTMs', async () => {
    const a = await load();
    expect(a.attributionFromLocation('https://pivothub.io/', 'https://l.instagram.com/')?.source).toBe('instagram');
    expect(a.attributionFromLocation('https://pivothub.io/', 'https://www.tiktok.com/')?.source).toBe('tiktok');
    expect(a.attributionFromLocation('https://pivothub.io/?fbclid=abc', '')?.source).toBe('facebook');
  });

  it('treats direct and internal visits as no attribution', async () => {
    const a = await load();
    expect(a.attributionFromLocation('https://pivothub.io/', '')).toBeNull();
    expect(a.attributionFromLocation('https://pivothub.io/pricing', 'https://pivothub.io/')).toBeNull();
  });

  it('drops values that look like email addresses', async () => {
    const a = await load();
    expect(a.attributionFromLocation('https://pivothub.io/?utm_source=jane@example.com', '')).toBeNull();
  });

  it('keeps first touch and is not overwritten by a later direct visit', async () => {
    setupBrowser('https://pivothub.io/?utm_source=tiktok&utm_medium=social&utm_campaign=c1');
    let a = await load();
    a.captureAttribution();
    const g = globalThis as any;
    g.window.location.href = 'https://pivothub.io/';
    g.document.referrer = '';
    a = await load();
    a.captureAttribution();
    expect(a.getAttribution().first?.source).toBe('tiktok');
    expect(a.getAttribution().last?.campaign).toBe('c1');
    expect(a.signupAttributionMetadata()).toMatchObject({ signup_attribution: { source: 'tiktok', campaign: 'c1' } });
  });
});

describe('events', () => {
  it('sends one sign_up per account, with campaign but no personal data', async () => {
    const { events } = setupBrowser('https://pivothub.io/?utm_source=facebook&utm_medium=social');
    const a = await load();
    a.captureAttribution();
    a.trackSignUp('email', 'user-123');
    a.trackSignUp('email', 'user-123'); // refresh / retry
    expect(eventNames(events).filter((n) => n === 'sign_up')).toHaveLength(1);
    const params = eventParams(events, 'sign_up');
    expect(params).toMatchObject({ method: 'email', campaign_source: 'facebook' });
    expect(JSON.stringify(params)).not.toContain('user-123');
  });

  it('marks only the first completed tool run as first', async () => {
    const { events } = setupBrowser('https://pivothub.io/');
    const a = await load();
    a.trackToolComplete('career-assessment');
    a.trackToolComplete('generate-schedule');
    a.trackToolComplete('send-assessment-results'); // not a tool
    expect(eventNames(events)).toEqual(['tool_complete', 'first_tool_complete', 'tool_complete']);
    expect(eventParams(events, 'tool_complete')).toMatchObject({ tool_id: 'career-assessment', tool_category: 'assess_it', is_first: true });
  });

  it('tracks tool pages and strips non-campaign query params from page views', async () => {
    const { events } = setupBrowser('https://pivothub.io/earnit?utm_source=tiktok&token=secret');
    const a = await load();
    a.captureAttribution();
    a.trackPageView('/earnit');
    const pv = eventParams(events, 'page_view');
    expect(pv.page_location).toBe('https://pivothub.io/earnit?utm_source=tiktok');
    expect(eventNames(events)).toEqual(['page_view', 'tool_open', 'first_tool_open']);
  });
});
