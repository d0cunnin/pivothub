/**
 * DESIGN IT: pure rules shared by the edge function and its tests.
 * No Deno or network imports here so vitest can load this file directly.
 */

export const DESIGN_CATEGORY_IDS = [
  'product', 'brand', 'fashion', 'interior', 'digital', 'event', 'architecture', 'creative', 'other',
] as const;
export type DesignCategoryId = (typeof DESIGN_CATEGORY_IDS)[number];

export const CATEGORY_NAMES: Record<DesignCategoryId, string> = {
  product: 'Product Design',
  brand: 'Brand and Graphic Design',
  fashion: 'Fashion and Apparel Design',
  interior: 'Interior and Space Design',
  digital: 'Digital and Interface Design',
  event: 'Event and Experience Design',
  architecture: 'Architectural Concepts',
  creative: 'Creative and Visual Projects',
  other: 'Other',
};

// ---------------------------------------------------------------- credit costs
/**
 * Every paid operation and its default credit cost. These are defaults only:
 * set the DESIGN_IT_CREDIT_COSTS secret (JSON, e.g. {"image":4}) to change any
 * price to match real provider costs without a code change. The page reads
 * the live prices from the edge function, so nothing else needs editing.
 */
export const DEFAULT_DESIGN_IT_COSTS = {
  concept: 3,       // initial concept development
  directions: 2,    // three more written creative directions
  refine_text: 2,   // text-only refinement
  image: 3,         // generate a visual
  refine_image: 3,  // revise an existing visual
  refine_both: 4,   // text refinement plus a new visual
  compare: 1,       // AI comparison of two saved versions
  summary: 2,       // final design summary and specifications
} as const;
export type DesignOperation = keyof typeof DEFAULT_DESIGN_IT_COSTS;
export type DesignCosts = Record<DesignOperation, number>;
export const DESIGN_OPERATIONS = Object.keys(DEFAULT_DESIGN_IT_COSTS) as DesignOperation[];

export function resolveCosts(override?: string | null): DesignCosts {
  const costs: DesignCosts = { ...DEFAULT_DESIGN_IT_COSTS };
  if (!override) return costs;
  try {
    const parsed = JSON.parse(override);
    for (const op of DESIGN_OPERATIONS) {
      const v = parsed?.[op];
      if (Number.isInteger(v) && v >= 1 && v <= 100) costs[op] = v;
    }
  } catch {
    // Ignore a malformed override and keep the defaults.
  }
  return costs;
}

export type RefineMode = 'text' | 'image' | 'both';

/** Which paid operation (and so which price) a request is. */
export function operationFor(action: string, mode?: string): DesignOperation | null {
  if (action === 'refine') {
    if (mode === 'text') return 'refine_text';
    if (mode === 'image') return 'refine_image';
    if (mode === 'both') return 'refine_both';
    return null;
  }
  return (DESIGN_OPERATIONS as string[]).includes(action) && !action.startsWith('refine_') ? (action as DesignOperation) : null;
}

export const producesImage = (op: DesignOperation) => op === 'image' || op === 'refine_image' || op === 'refine_both';

// ---------------------------------------------------------------- storage policy
/**
 * Optional storage limits, from the DESIGN_IT_STORAGE_LIMITS secret
 * (JSON, e.g. {"maxImagesPerUser":200,"maxBytesPerUser":524288000}).
 * No limit is set by default: PivotHub has not published one.
 * Limits only stop NEW images from being stored. Existing work is never
 * deleted, hidden or blocked from download because of a limit or downgrade.
 */
export interface StorageLimits { maxImagesPerUser: number | null; maxBytesPerUser: number | null }
export interface StorageUsage { images: number; bytes: number }

export function resolveStorageLimits(raw?: string | null): StorageLimits {
  const limits: StorageLimits = { maxImagesPerUser: null, maxBytesPerUser: null };
  if (!raw) return limits;
  try {
    const parsed = JSON.parse(raw);
    if (Number.isInteger(parsed?.maxImagesPerUser) && parsed.maxImagesPerUser > 0) limits.maxImagesPerUser = parsed.maxImagesPerUser;
    if (Number.isInteger(parsed?.maxBytesPerUser) && parsed.maxBytesPerUser > 0) limits.maxBytesPerUser = parsed.maxBytesPerUser;
  } catch {
    // Malformed setting: behave as "no limit configured".
  }
  return limits;
}

export interface StorageStatus {
  canStoreNewImage: boolean;
  canViewAndDownloadExisting: true;
  message: string | null;
}

export function evaluateStorage(usage: StorageUsage, limits: StorageLimits): StorageStatus {
  const overImages = limits.maxImagesPerUser !== null && usage.images >= limits.maxImagesPerUser;
  const overBytes = limits.maxBytesPerUser !== null && usage.bytes >= limits.maxBytesPerUser;
  if (overImages || overBytes) {
    return {
      canStoreNewImage: false,
      canViewAndDownloadExisting: true,
      message: 'You have reached the current image storage limit. Your existing work is still available to view and download. Download images you want to keep, then delete older projects to make room for new visuals.',
    };
  }
  return { canStoreNewImage: true, canViewAndDownloadExisting: true, message: null };
}

// ---------------------------------------------------------------- duplicate requests
export interface ExistingOperation { status: 'pending' | 'succeeded' | 'failed'; created_at: string; version_id?: string | null }
/** Pending requests older than this are treated as abandoned (the edge limit is about 150 seconds). */
export const PENDING_TIMEOUT_MS = 3 * 60 * 1000;

export type DuplicateDecision = 'run' | 'return-existing' | 'in-progress' | 'already-failed';

/** What to do when a request id has been seen before. */
export function duplicateDecision(existing: ExistingOperation | null, now = Date.now()): DuplicateDecision {
  if (!existing) return 'run';
  if (existing.status === 'succeeded') return 'return-existing';
  if (existing.status === 'failed') return 'already-failed';
  return now - new Date(existing.created_at).getTime() < PENDING_TIMEOUT_MS ? 'in-progress' : 'already-failed';
}

/** True when another paid request for the same project is still running. */
export function projectBusy(pending: { created_at: string }[], now = Date.now()): boolean {
  return pending.some((p) => now - new Date(p.created_at).getTime() < PENDING_TIMEOUT_MS);
}

// ---------------------------------------------------------------- brief
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

export interface DesignBrief {
  category: DesignCategoryId;
  concept: string;
  purpose: string;
  audience: string;
  style: string;
  customStyle: string;
  colors: string;
  functional: string;
  materials: string;
  dimensions: string;
  environment: string;
  budget: string;
  instructions: string;
  details: Record<string, string>;
}

const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Copy only known fields, trimmed and length-limited. */
export function cleanBrief(raw: any): DesignBrief {
  const details: Record<string, string> = {};
  if (raw?.details && typeof raw.details === 'object') {
    for (const [k, v] of Object.entries(raw.details).slice(0, 30)) {
      if (/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(k)) {
        const val = s(v, 1000);
        if (val) details[k] = val;
      }
    }
  }
  const category = (DESIGN_CATEGORY_IDS as readonly string[]).includes(raw?.category) ? raw.category : 'other';
  return {
    category: category as DesignCategoryId,
    concept: s(raw?.concept, 4000), purpose: s(raw?.purpose, 1500), audience: s(raw?.audience, 1000),
    style: s(raw?.style, 60), customStyle: s(raw?.customStyle, 200), colors: s(raw?.colors, 500),
    functional: s(raw?.functional, 2000), materials: s(raw?.materials, 1000), dimensions: s(raw?.dimensions, 500),
    environment: s(raw?.environment, 1000), budget: s(raw?.budget, 300), instructions: s(raw?.instructions, 2000),
    details,
  };
}

export function briefProblem(b: DesignBrief): string | null {
  if (!b.concept) return 'Please describe your design concept or idea.';
  if (!b.purpose) return 'Please describe the purpose of the design.';
  if (!b.audience) return 'Please describe who the design is for.';
  return null;
}

/** Valid #RGB / #RRGGBB codes found in the colour preferences. */
export function hexColors(text: string): string[] {
  const found = text.match(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g) ?? [];
  return [...new Set(found.map((h) => h.toUpperCase()))];
}

const humanize = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();

/** The brief as labelled lines for the AI. Only what the user gave. */
export function briefText(b: DesignBrief): string {
  const style = b.style === 'Custom' ? b.customStyle || 'Custom' : b.style;
  const rows: [string, string][] = [
    ['Design category', CATEGORY_NAMES[b.category]],
    ['Design concept or idea', b.concept], ['Purpose', b.purpose], ['Intended audience or user', b.audience],
    ['Desired style', style], ['Colour preferences', b.colors],
    ['Exact HEX colours to use', hexColors(b.colors).join(', ')],
    ['Functional requirements', b.functional], ['Materials or components', b.materials],
    ['Dimensions or size', b.dimensions], ['Intended environment or use', b.environment],
    ['Budget considerations', b.budget], ['Additional instructions', b.instructions],
    ...Object.entries(b.details).map(([k, v]) => [humanize(k), v] as [string, string]),
  ];
  return rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
}

export const ARCHITECTURE_NOTICE =
  'Conceptual design assistance only. These are not construction drawings, engineering approvals or professional architectural certifications. Work with a licensed architect and engineer, and check local building codes and permits, before building.';

export function categoryRules(category: DesignCategoryId): string {
  switch (category) {
    case 'architecture':
      return `This is an ARCHITECTURAL CONCEPT. Treat everything as early conceptual design. Never present output as construction drawings, structural calculations, code compliance or certification. Include the note: "${ARCHITECTURE_NOTICE}"`;
    case 'interior':
      return 'For interiors, respect the stated dimensions and existing features. Flag anything that may need a licensed contractor, electrician or building permit.';
    case 'product':
      return 'For products, think about manufacturability, safety, materials and cost. Flag where prototyping, testing or safety certification would be needed. Do not claim a design is patentable or safe.';
    case 'brand':
      return 'For brand work, do not copy or imitate existing trademarks or logos. Suggest a trademark search before the business commits to a name or mark.';
    case 'digital':
      return 'For digital interfaces, consider accessibility (contrast, text size, keyboard use), responsive layouts and the stated devices.';
    case 'event':
      return 'For events, consider guest flow, accessibility, venue rules and safety. Do not invent venue facts.';
    case 'fashion':
      return 'For fashion, consider fabric behaviour, fit, care and the stated occasion. Do not imitate a named designer\'s protected designs.';
    default:
      return '';
  }
}
