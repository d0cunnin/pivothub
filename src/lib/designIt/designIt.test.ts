import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

// Any accidental network/AI call from these free operations would hit this mock.
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke }, from: vi.fn(), storage: { from: vi.fn() } } }));

import { DESIGN_CATEGORIES, categoryById } from './categories';
import {
  affordability, changeCategory, diffConcepts, emptyBrief, latestOf, missingBrief, refineOperation, storageUsage, userSpecifications,
  type DesignProject, type DesignVersion,
} from './logic';
import {
  ARCHITECTURE_NOTICE, DEFAULT_DESIGN_IT_COSTS, DESIGN_CATEGORY_IDS, PENDING_TIMEOUT_MS, briefProblem, briefText, categoryRules, cleanBrief,
  duplicateDecision, evaluateStorage, hexColors, operationFor, producesImage, projectBusy, resolveCosts, resolveStorageLimits,
} from '../../../supabase/functions/design-it/designLogic';
import { generateDesignItPDF } from '../pdf-reports/design-it';

const brief = (over: Partial<ReturnType<typeof emptyBrief>> = {}) => ({
  ...emptyBrief('product'),
  concept: 'A stackable bamboo desk organizer', purpose: 'Reduce clutter in small home offices', audience: 'Remote workers',
  details: { intendedUse: 'Holding pens, cables and notebooks' }, ...over,
});

let n = 0;
const version = (kind: DesignVersion['kind'], content: any = {}, extra: Partial<DesignVersion> = {}): DesignVersion => ({
  id: `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`, project_id: 'p', version_number: n, kind, label: kind,
  parent_version_id: null, content, image_path: null, image_bytes: 0, credits_charged: 0, created_at: new Date().toISOString(), ...extra,
});

describe('1-2: categories and conditional questions', () => {
  it('has all nine categories, matching the server list', () => {
    expect(DESIGN_CATEGORIES.map((c) => c.id)).toEqual([...DESIGN_CATEGORY_IDS]);
    expect(DESIGN_CATEGORIES.map((c) => c.name)).toEqual([
      'Product Design', 'Brand and Graphic Design', 'Fashion and Apparel Design', 'Interior and Space Design', 'Digital and Interface Design',
      'Event and Experience Design', 'Architectural Concepts', 'Creative and Visual Projects', 'Other',
    ]);
  });

  it('shows category-specific questions instead of one generic form', () => {
    const keys = (id: string) => categoryById(id).details.map((d) => d.key);
    expect(keys('product')).toEqual(expect.arrayContaining(['intendedUse', 'primaryFunction', 'components', 'portability', 'manufacturing']));
    expect(keys('brand')).toEqual(expect.arrayContaining(['businessName', 'industry', 'brandPersonality', 'application', 'visualElements']));
    expect(keys('fashion')).toEqual(expect.arrayContaining(['garmentType', 'collectionOrPiece', 'fabric', 'silhouette', 'occasion']));
    expect(keys('interior')).toEqual(expect.arrayContaining(['roomType', 'existingFeatures', 'furniture', 'lighting']));
    expect(keys('digital')).toEqual(expect.arrayContaining(['appType', 'requiredFunctionality', 'layout', 'navigation', 'devices']));
    expect(keys('event')).toEqual(expect.arrayContaining(['eventType', 'venue', 'attendance', 'theme', 'atmosphere']));
    expect(keys('architecture')).toEqual(expect.arrayContaining(['structureType', 'generalSize', 'floors', 'architecturalStyle', 'siteConsiderations']));
    expect(categoryById('product').general.dimensions).toBeTruthy();
    expect(categoryById('digital').general.materials).toBeUndefined();
    expect(categoryById('interior').general.dimensions).toBe('Room dimensions');
  });

  it('requires the core answers plus the category key question', () => {
    expect(missingBrief(brief())).toBeNull();
    expect(missingBrief(brief({ concept: '' }))).toMatch(/concept/);
    expect(missingBrief(brief({ details: {} }))).toMatch(/Intended use/);
    expect(missingBrief({ ...brief(), category: 'brand', details: {} })).toMatch(/Business or organization name/);
    expect(missingBrief(brief({ style: 'Custom' }))).toMatch(/custom style/);
    for (const c of DESIGN_CATEGORIES) {
      const req = c.details.filter((d) => d.required).map((d) => d.key);
      const b = { ...brief(), category: c.id, details: Object.fromEntries(req.map((k) => [k, 'x'])) };
      expect(missingBrief(b)).toBeNull();
    }
  });

  it('switching category drops the old category answers (no cross-category leakage)', () => {
    const b = changeCategory(brief({ materials: 'Bamboo', dimensions: '30cm' }), 'digital');
    expect(b.details).toEqual({});
    expect(b.materials).toBe('');
    expect(b.dimensions).toBe('');
    expect(b.concept).toBe('A stackable bamboo desk organizer');
  });

  it('server keeps only valid fields and an allowed category', () => {
    const c = cleanBrief({ category: 'hacker', concept: ' x ', details: { 'bad key!': 'no', good: 'yes', __proto__x: 'no' }, extra: 'ignored' });
    expect(c.category).toBe('other');
    expect(c.details).toEqual({ good: 'yes' });
    expect((c as any).extra).toBeUndefined();
    expect(briefProblem(c)).toMatch(/purpose/);
  });

  it('passes HEX colours and only provided fields to the AI', () => {
    expect(hexColors('navy #1b2a4a and gold #C9A227, not #12')).toEqual(['#1B2A4A', '#C9A227']);
    const t = briefText(cleanBrief({ ...brief(), colors: 'navy #1b2a4a' }));
    expect(t).toContain('Exact HEX colours to use: #1B2A4A');
    expect(t).toContain('Intended Use: Holding pens');
    expect(t).not.toMatch(/Budget/);
  });

  it('labels architectural output as conceptual only', () => {
    expect(categoryRules('architecture')).toContain(ARCHITECTURE_NOTICE);
    expect(ARCHITECTURE_NOTICE).toMatch(/not construction drawings, engineering approvals or professional architectural certifications/);
  });
});

describe('3-7: paid operations and their prices', () => {
  it('classifies every paid operation', () => {
    expect(operationFor('concept')).toBe('concept');
    expect(operationFor('directions')).toBe('directions');
    expect(operationFor('image')).toBe('image');
    expect(operationFor('compare')).toBe('compare');
    expect(operationFor('summary')).toBe('summary');
    expect(operationFor('refine', 'text')).toBe('refine_text');
    expect(operationFor('refine', 'image')).toBe('refine_image');
    expect(operationFor('refine', 'both')).toBe('refine_both');
    expect(operationFor('refine')).toBeNull();
    expect(operationFor('refine_text')).toBeNull();
    expect(operationFor('config')).toBeNull();
    expect(operationFor('anything')).toBeNull();
    expect(refineOperation('both')).toBe('refine_both');
    expect(['image', 'refine_image', 'refine_both'].every((o) => producesImage(o as any))).toBe(true);
    expect(producesImage('refine_text')).toBe(false);
  });

  it('prices are configurable, with safe fallbacks', () => {
    expect(resolveCosts()).toEqual(DEFAULT_DESIGN_IT_COSTS);
    expect(resolveCosts('{"image":5,"concept":0,"summary":"9","directions":1.5}')).toEqual({ ...DEFAULT_DESIGN_IT_COSTS, image: 5 });
    expect(resolveCosts('not json')).toEqual(DEFAULT_DESIGN_IT_COSTS);
    expect(Object.values(DEFAULT_DESIGN_IT_COSTS).every((c) => c >= 1)).toBe(true);
  });
});

describe('8-12: versions, comparisons and downloads are free', () => {
  const a = version('concept', { overview: 'Bamboo tiers', keyElements: ['Tiers', 'Cable slot'] });
  const img = version('image', {}, { image_path: 'u/p/1.png', image_bytes: 2048 });
  const b = version('refinement', { overview: 'Walnut tiers', keyElements: ['Tiers', 'Cable slot'], changes: ['Material'] });

  it('keeps multiple versions and finds the latest of each kind', () => {
    expect(latestOf([a, img, b], ['concept', 'refinement'])?.id).toBe(b.id);
    expect(latestOf([a, img, b], ['image'])?.id).toBe(img.id);
    expect(latestOf([a], ['summary'])).toBeNull();
  });

  it('compares saved versions locally, showing what changed, without any AI call', () => {
    const rows = diffConcepts(a, b);
    expect(rows.find((r) => r.key === 'overview')).toMatchObject({ left: 'Bamboo tiers', right: 'Walnut tiers', changed: true });
    expect(rows.find((r) => r.key === 'keyElements')?.changed).toBe(false);
    userSpecifications(brief());
    expect(invoke).not.toHaveBeenCalled();
  });

  it('builds the summary PDF from saved content only (no AI call)', () => {
    const p: DesignProject = {
      id: 'p', user_id: 'u', project_name: 'Desk organizer', category: 'product', status: 'Final', brief: brief({ colors: '#1B2A4A' }),
      selected_direction: null, created_at: '', updated_at: '',
    };
    const s = version('summary', { finalConcept: 'A calm, modular organizer.', nextSteps: ['Prototype', 'Get quotes'], palette: [{ name: 'Navy', hex: '#1B2A4A', use: 'Base' }], basedOn: b.version_number });
    const out = generateDesignItPDF(p, [a, b, s], []).output();
    expect(out).toContain('Your Specifications');
    expect(out).toContain('AI Design Suggestions');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('user specifications are exactly what the user typed', () => {
    const specs = Object.fromEntries(userSpecifications(brief({ budget: 'Under $40' })));
    expect(specs['Concept']).toBe('A stackable bamboo desk organizer');
    expect(specs['Budget or target price']).toBe('Under $40');
    expect(specs['Intended use']).toBe('Holding pens, cables and notebooks');
    expect(specs['Materials']).toBeUndefined();
  });
});

describe('13: insufficient credits', () => {
  it('blocks the request before it is sent', () => {
    expect(affordability(2, 3, false)).toMatchObject({ ok: false });
    expect(affordability(2, 3, false).message).toMatch(/needs 3 credits and you have 2/);
    expect(affordability(3, 3, false).ok).toBe(true);
    expect(affordability(0, 3, true).ok).toBe(true);
  });
});

describe('15-16: duplicate submissions and failed requests', () => {
  const now = Date.parse('2026-11-01T12:00:00Z');
  const at = (msAgo: number) => new Date(now - msAgo).toISOString();
  it('a repeated request id never runs (or charges) twice', () => {
    expect(duplicateDecision(null, now)).toBe('run');
    expect(duplicateDecision({ status: 'succeeded', created_at: at(1000), version_id: 'v' }, now)).toBe('return-existing');
    expect(duplicateDecision({ status: 'pending', created_at: at(1000) }, now)).toBe('in-progress');
    expect(duplicateDecision({ status: 'failed', created_at: at(1000) }, now)).toBe('already-failed');
    expect(duplicateDecision({ status: 'pending', created_at: at(PENDING_TIMEOUT_MS + 1) }, now)).toBe('already-failed');
  });
  it('a second request for the same project waits while one is running', () => {
    expect(projectBusy([{ created_at: at(5000) }], now)).toBe(true);
    expect(projectBusy([{ created_at: at(PENDING_TIMEOUT_MS + 1) }], now)).toBe(false);
    expect(projectBusy([], now)).toBe(false);
  });
  it('the server only charges after the result is saved, and rolls back on failure', () => {
    const src = readFileSync(path.resolve(__dirname, '../../../supabase/functions/design-it/index.ts'), 'utf8');
    const charge = src.indexOf('await deductCreditsOnSuccess(');
    expect(charge).toBeGreaterThan(src.lastIndexOf('await insertVersion('));
    expect(src.indexOf('await assertCredits(')).toBeLessThan(src.indexOf('generateJson<any>(apiKey'));
    expect(src).toMatch(/if \(created\.length\) await svc\.from\('design_it_versions'\)\.delete\(\)/);
    expect(src).toMatch(/if \(uploaded\.length\) await svc\.storage\.from\(BUCKET\)\.remove\(uploaded\)/);
    expect(src).toContain('withCreditRequest'); // releases the credit hold when a request fails
  });
});

describe('17-18: ownership and data isolation (migration)', () => {
  const sql = readFileSync(path.resolve(__dirname, '../../../supabase/migrations/20261101000200_design_it.sql'), 'utf8');
  it('enables row level security on every Design It table', () => {
    for (const t of ['design_it_projects', 'design_it_versions', 'design_it_operations']) {
      expect(sql).toContain(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toMatch(new RegExp(`ON public\\.${t}\\s+FOR SELECT TO authenticated USING \\(auth\\.uid\\(\\) = user_id\\)`));
    }
  });
  it('users cannot write AI versions or operation logs themselves', () => {
    expect(sql).not.toMatch(/ON public\.design_it_versions\s+FOR (INSERT|UPDATE)/);
    expect(sql).not.toMatch(/ON public\.design_it_operations\s+FOR (INSERT|UPDATE)/);
    expect(sql).toContain('GRANT SELECT ON public.design_it_versions TO authenticated;');
  });
  it('images are private and readable only from the owner folder', () => {
    expect(sql).toMatch(/'design-it', 'design-it', false/);
    expect(sql).toContain("(storage.foldername(name))[1] = auth.uid()::text");
    expect(sql).not.toMatch(/storage\.objects\s+FOR INSERT/);
  });
  it('admin storage summary requires the admin role', () => {
    expect(sql).toMatch(/get_design_it_storage_summary[\s\S]*has_role\(auth\.uid\(\), 'admin'\)/);
  });
  it('the edge function checks ownership before any AI call', () => {
    const src = readFileSync(path.resolve(__dirname, '../../../supabase/functions/design-it/index.ts'), 'utf8');
    expect(src).toMatch(/project\.user_id !== userId\) return json\(\{ error: 'Project not found\.' \}, 404\)/);
    expect(src.indexOf("'Project not found.'")).toBeLessThan(src.indexOf('await assertCredits('));
  });
});

describe('19-20: storage tracking and downgrade policy', () => {
  it('tracks stored image count and size', () => {
    expect(storageUsage([{ image_path: 'a', image_bytes: 100 }, { image_path: null, image_bytes: 0 }, { image_path: 'b', image_bytes: 50 }])).toEqual({ images: 2, bytes: 150 });
  });
  it('has no storage limit unless one is configured', () => {
    expect(resolveStorageLimits()).toEqual({ maxImagesPerUser: null, maxBytesPerUser: null });
    expect(resolveStorageLimits('{"maxImagesPerUser":-1}')).toEqual({ maxImagesPerUser: null, maxBytesPerUser: null });
    expect(evaluateStorage({ images: 10_000, bytes: 1e12 }, resolveStorageLimits()).canStoreNewImage).toBe(true);
  });
  it('a lower limit (for example after a downgrade) only blocks NEW images; existing work stays viewable and downloadable', () => {
    const limits = resolveStorageLimits('{"maxImagesPerUser":20}');
    const status = evaluateStorage({ images: 35, bytes: 5_000_000 }, limits);
    expect(status.canStoreNewImage).toBe(false);
    expect(status.canViewAndDownloadExisting).toBe(true);
    expect(status.message).toMatch(/existing work is still available to view and download/);
    expect(evaluateStorage({ images: 5, bytes: 0 }, limits).canStoreNewImage).toBe(true);
  });
  it('never promises permanent storage anywhere in Design It', () => {
    const files = ['src/pages/DesignIt.tsx', 'src/components/StorageNotice.tsx', 'src/pages/PrivacyPolicy.tsx', 'src/pages/WriteIt.tsx', 'src/pages/PublishIt.tsx'];
    for (const f of files) {
      const text = readFileSync(path.resolve(__dirname, '../../..', f), 'utf8');
      expect(text).not.toMatch(/saved forever|keep your work indefinitely|always be available|unlimited storage/i);
    }
  });
});

describe('visual color picking', () => {
  it('adds picked colors as "Name #HEX" without duplicates and removes them cleanly', async () => {
    const { addColor, removeColor } = await import('./logic');
    let t = addColor('', 'Navy', '#1b2a4a');
    expect(t).toBe('Navy #1B2A4A');
    t = addColor(t, 'Gold', '#C9A227');
    expect(addColor(t, 'Navy', '#1B2A4A')).toBe(t);
    expect(hexColors(t)).toEqual(['#1B2A4A', '#C9A227']);
    expect(removeColor(t, '#1B2A4A')).toBe('Gold #C9A227');
    expect(removeColor('warm tones, Navy #1B2A4A', '#1B2A4A')).toBe('warm tones');
    expect(removeColor('navy #1B2A4A and gold #C9A227', '#C9A227')).toBe('navy #1B2A4A and gold');
    expect(addColor('warm and calm, ', '', '#ff0000')).toBe('warm and calm, #FF0000');
  });
  it('every swatch and palette color is a valid HEX the AI will receive', async () => {
    const { COLOR_SWATCHES, COLOR_PALETTES } = await import('./categories');
    [...COLOR_SWATCHES, ...COLOR_PALETTES.flatMap((p) => p.colors)].forEach((c) => expect(hexColors(c.hex)).toEqual([c.hex.toUpperCase()]));
  });
});
