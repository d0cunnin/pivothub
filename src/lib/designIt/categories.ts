import type { DesignCategoryId } from "../../../supabase/functions/design-it/designLogic";

export type { DesignCategoryId };

/** Brief fields shared by every category. Some only show where they apply. */
export type GeneralOptionalField = "materials" | "dimensions" | "environment" | "budget";

export interface DetailField {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

export interface DesignCategory {
  id: DesignCategoryId;
  name: string;
  blurb: string;
  /** Which optional general fields apply, with category-specific labels. */
  general: Partial<Record<GeneralOptionalField, string>>;
  details: DetailField[];
}

export const DESIGN_STYLES = [
  "Modern", "Minimalist", "Contemporary", "Traditional", "Industrial", "Futuristic",
  "Elegant", "Classic", "Organic", "Playful", "Professional", "Custom",
] as const;

export const DESIGN_CATEGORIES: DesignCategory[] = [
  {
    id: "product", name: "Product Design", blurb: "Physical products, tools, gadgets and packaging.",
    general: { materials: "Materials", dimensions: "Dimensions", environment: "Where it will be used", budget: "Budget or target price" },
    details: [
      { key: "intendedUse", label: "Intended use", required: true, placeholder: "e.g. a desk organizer for small home offices" },
      { key: "primaryFunction", label: "Primary function" },
      { key: "components", label: "Components", type: "textarea" },
      { key: "portability", label: "Portability", type: "select", options: ["Stationary", "Portable", "Wearable", "Not sure"] },
      { key: "manufacturing", label: "Manufacturing considerations", type: "textarea", placeholder: "e.g. small-batch, 3D printed, injection moulded" },
    ],
  },
  {
    id: "brand", name: "Brand and Graphic Design", blurb: "Logos, brand identity, print and marketing graphics.",
    general: { budget: "Budget" },
    details: [
      { key: "businessName", label: "Business or organization name", required: true },
      { key: "industry", label: "Industry" },
      { key: "brandPersonality", label: "Brand personality", placeholder: "e.g. warm, trustworthy, bold" },
      { key: "application", label: "Intended application", placeholder: "e.g. logo, business cards, social media, signage" },
      { key: "visualElements", label: "Desired visual elements", type: "textarea" },
    ],
  },
  {
    id: "fashion", name: "Fashion and Apparel Design", blurb: "Garments, accessories and collections.",
    general: { budget: "Budget or price point" },
    details: [
      { key: "garmentType", label: "Garment or accessory type", required: true },
      { key: "collectionOrPiece", label: "Collection or individual piece", type: "select", options: ["Individual piece", "Collection"] },
      { key: "fabric", label: "Fabric preferences" },
      { key: "silhouette", label: "Silhouette" },
      { key: "garmentFunction", label: "Function", placeholder: "e.g. breathable, adaptive, waterproof" },
      { key: "occasion", label: "Intended occasion" },
    ],
  },
  {
    id: "interior", name: "Interior and Space Design", blurb: "Rooms, offices, retail and community spaces.",
    general: { dimensions: "Room dimensions", materials: "Materials", budget: "Budget" },
    details: [
      { key: "roomType", label: "Room or space type", required: true },
      { key: "existingFeatures", label: "Existing features to keep or work around", type: "textarea" },
      { key: "furniture", label: "Furniture requirements", type: "textarea" },
      { key: "lighting", label: "Lighting" },
    ],
  },
  {
    id: "digital", name: "Digital and Interface Design", blurb: "Websites, apps and dashboards.",
    general: {},
    details: [
      { key: "appType", label: "Website or application type", type: "select", required: true, options: ["Website", "Mobile app", "Web app", "Dashboard", "Other"] },
      { key: "requiredFunctionality", label: "Required functionality", type: "textarea" },
      { key: "layout", label: "Layout preferences" },
      { key: "navigation", label: "Navigation requirements" },
      { key: "devices", label: "Device considerations", placeholder: "e.g. mobile first, desktop, tablet" },
    ],
  },
  {
    id: "event", name: "Event and Experience Design", blurb: "Events, exhibitions and guest experiences.",
    general: { budget: "Budget" },
    details: [
      { key: "eventType", label: "Event type", required: true },
      { key: "venue", label: "Venue" },
      { key: "attendance", label: "Expected attendance" },
      { key: "theme", label: "Theme" },
      { key: "atmosphere", label: "Desired atmosphere" },
    ],
  },
  {
    id: "architecture", name: "Architectural Concepts", blurb: "Early concepts for buildings and structures.",
    general: { environment: "Environment or climate", materials: "Materials", budget: "Budget" },
    details: [
      { key: "structureType", label: "Structure type", required: true, placeholder: "e.g. tiny home, community centre, pavilion" },
      { key: "generalSize", label: "General size" },
      { key: "floors", label: "Number of floors (if applicable)" },
      { key: "architecturalStyle", label: "Architectural style" },
      { key: "siteConsiderations", label: "Site considerations", type: "textarea", placeholder: "e.g. sloped lot, views, sun direction" },
    ],
  },
  {
    id: "creative", name: "Creative and Visual Projects", blurb: "Art, illustration, murals, covers and visual ideas.",
    general: { dimensions: "Size or format", materials: "Medium or materials", environment: "Where it will be shown", budget: "Budget" },
    details: [
      { key: "projectType", label: "Project type", required: true, placeholder: "e.g. mural, book cover, poster, illustration" },
      { key: "mood", label: "Mood or feeling" },
    ],
  },
  {
    id: "other", name: "Other", blurb: "Anything else you want to design.",
    general: { materials: "Materials or components", dimensions: "Dimensions or size", environment: "Intended environment or use", budget: "Budget considerations" },
    details: [],
  },
];

export const categoryById = (id: string): DesignCategory =>
  DESIGN_CATEGORIES.find((c) => c.id === id) ?? DESIGN_CATEGORIES[DESIGN_CATEGORIES.length - 1];

/** Refinement types the user can pick (spec stage 4). */
export const REFINEMENT_TYPES = [
  "Color adjustments", "Material changes", "Style adjustments", "Layout changes", "Component modifications",
  "Proportion adjustments", "Additional visual elements", "Functional improvements",
] as const;

/** Named colors people can pick visually (no HEX knowledge needed). */
export const COLOR_SWATCHES: { name: string; hex: string }[] = [
  { name: "Black", hex: "#111111" }, { name: "Charcoal", hex: "#36454F" }, { name: "Gray", hex: "#9CA3AF" }, { name: "White", hex: "#FFFFFF" },
  { name: "Cream", hex: "#F5F0E1" }, { name: "Beige", hex: "#D8C3A5" }, { name: "Brown", hex: "#7B4B2A" }, { name: "Terracotta", hex: "#C8553D" },
  { name: "Red", hex: "#D62828" }, { name: "Burgundy", hex: "#7A1F3D" }, { name: "Pink", hex: "#F4A6C0" }, { name: "Coral", hex: "#FF7F6A" },
  { name: "Orange", hex: "#F77F00" }, { name: "Gold", hex: "#C9A227" }, { name: "Yellow", hex: "#FFD23F" }, { name: "Olive", hex: "#708238" },
  { name: "Sage", hex: "#A3B18A" }, { name: "Green", hex: "#2E7D32" }, { name: "Teal", hex: "#14808C" }, { name: "Sky blue", hex: "#7CC6FE" },
  { name: "Blue", hex: "#1E63D6" }, { name: "Navy", hex: "#1B2A4A" }, { name: "Lavender", hex: "#B8A9E3" }, { name: "Purple", hex: "#6A3FA0" },
];

/** Ready-made palettes for people who know the feeling, not the colors. */
export const COLOR_PALETTES: { name: string; feel: string; colors: { name: string; hex: string }[] }[] = [
  { name: "Calm and trustworthy", feel: "professional, clean", colors: [{ name: "Navy", hex: "#1B2A4A" }, { name: "Sky blue", hex: "#7CC6FE" }, { name: "Soft white", hex: "#F7F9FC" }, { name: "Slate", hex: "#64748B" }] },
  { name: "Warm and earthy", feel: "natural, welcoming", colors: [{ name: "Terracotta", hex: "#C8553D" }, { name: "Sand", hex: "#E9D8A6" }, { name: "Olive", hex: "#708238" }, { name: "Cocoa", hex: "#5C4033" }] },
  { name: "Fresh and natural", feel: "healthy, eco", colors: [{ name: "Leaf green", hex: "#4CAF50" }, { name: "Sage", hex: "#A3B18A" }, { name: "Cream", hex: "#F5F0E1" }, { name: "Forest", hex: "#1F4D2B" }] },
  { name: "Bold and energetic", feel: "youthful, lively", colors: [{ name: "Coral", hex: "#FF6B57" }, { name: "Sunshine", hex: "#FFD23F" }, { name: "Electric blue", hex: "#1E63D6" }, { name: "Ink", hex: "#111827" }] },
  { name: "Elegant and luxurious", feel: "premium, refined", colors: [{ name: "Black", hex: "#111111" }, { name: "Gold", hex: "#C9A227" }, { name: "Ivory", hex: "#FFFDF5" }, { name: "Burgundy", hex: "#7A1F3D" }] },
  { name: "Soft and gentle", feel: "caring, peaceful", colors: [{ name: "Blush", hex: "#F4C6CF" }, { name: "Lavender", hex: "#B8A9E3" }, { name: "Mint", hex: "#BDE6D3" }, { name: "Warm white", hex: "#FFF8F0" }] },
  { name: "Modern neutral", feel: "minimal, timeless", colors: [{ name: "Charcoal", hex: "#36454F" }, { name: "Stone", hex: "#D6D3D1" }, { name: "Off white", hex: "#FAFAF9" }, { name: "Warm gray", hex: "#A8A29E" }] },
  { name: "Vibrant and creative", feel: "playful, artistic", colors: [{ name: "Purple", hex: "#6A3FA0" }, { name: "Teal", hex: "#14808C" }, { name: "Orange", hex: "#F77F00" }, { name: "Pink", hex: "#E5487F" }] },
];
