import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_DESIGN_IT_COSTS, evaluateStorage, hexColors, type DesignBrief, type DesignCosts, type DesignOperation,
  type RefineMode, type StorageLimits, type StorageUsage,
} from "../../../supabase/functions/design-it/designLogic";
import { categoryById, type DesignCategoryId } from "./categories";

export { DEFAULT_DESIGN_IT_COSTS, evaluateStorage, hexColors };
export type { DesignBrief, DesignCosts, DesignOperation, RefineMode, StorageLimits, StorageUsage };

export const DESIGN_STATUSES = ["Brief", "Concept", "Exploring", "Visualizing", "Refining", "Final"] as const;
export type DesignStatus = (typeof DESIGN_STATUSES)[number];
export type VersionKind = "concept" | "directions" | "refinement" | "image" | "comparison" | "summary";

export interface SelectedDirection { versionId: string; index: number; name: string }

export interface DesignProject {
  id: string;
  user_id: string;
  project_name: string;
  category: DesignCategoryId;
  status: DesignStatus;
  brief: DesignBrief;
  selected_direction: SelectedDirection | null;
  created_at: string;
  updated_at: string;
}

export interface DesignVersion {
  id: string;
  project_id: string;
  version_number: number;
  kind: VersionKind;
  label: string;
  parent_version_id: string | null;
  content: any;
  image_path: string | null;
  image_bytes: number;
  credits_charged: number;
  created_at: string;
}

export const emptyBrief = (category: DesignCategoryId = "product"): DesignBrief => ({
  category, concept: "", purpose: "", audience: "", style: "", customStyle: "", colors: "", functional: "",
  materials: "", dimensions: "", environment: "", budget: "", instructions: "", details: {},
});

/** Switch category, keeping shared answers and dropping the old category's own questions. */
export function changeCategory(brief: DesignBrief, category: DesignCategoryId): DesignBrief {
  const cat = categoryById(category);
  const keep = new Set(cat.details.map((d) => d.key));
  const details = Object.fromEntries(Object.entries(brief.details).filter(([k]) => keep.has(k)));
  const general = { ...brief };
  (["materials", "dimensions", "environment", "budget"] as const).forEach((k) => {
    if (!cat.general[k]) general[k] = "";
  });
  return { ...general, category, details };
}

/** First missing required answer, or null when the brief can be submitted. */
export function missingBrief(b: DesignBrief): string | null {
  if (!b.concept.trim()) return "Please describe your design concept or idea.";
  if (!b.purpose.trim()) return "Please describe the purpose of the design.";
  if (!b.audience.trim()) return "Please describe who the design is for.";
  if (b.style === "Custom" && !b.customStyle.trim()) return "Please describe your custom style.";
  const field = categoryById(b.category).details.find((d) => d.required && !b.details[d.key]?.trim());
  return field ? `Please fill in "${field.label}".` : null;
}

/** The user's own specifications, exactly as given (never AI output). */
export function userSpecifications(b: DesignBrief): [string, string][] {
  const cat = categoryById(b.category);
  const rows: [string, string][] = [
    ["Category", cat.name], ["Concept", b.concept], ["Purpose", b.purpose], ["Audience", b.audience],
    ["Style", b.style === "Custom" ? b.customStyle : b.style], ["Colors", b.colors], ["Functional requirements", b.functional],
    ...(Object.entries(cat.general) as [keyof DesignBrief, string][]).map(([k, label]) => [label, String(b[k] ?? "")] as [string, string]),
    ...cat.details.map((d) => [d.label, b.details[d.key] ?? ""] as [string, string]),
    ["Additional instructions", b.instructions],
  ];
  return rows.filter(([, v]) => v && v.trim());
}

// ---------------------------------------------------------------- versions
export const latestOf = (versions: DesignVersion[], kinds: VersionKind[]) =>
  [...versions].sort((a, b) => b.version_number - a.version_number).find((v) => kinds.includes(v.kind)) ?? null;

export const conceptVersions = (versions: DesignVersion[]) => versions.filter((v) => v.kind === "concept" || v.kind === "refinement");
export const imageVersions = (versions: DesignVersion[]) => versions.filter((v) => v.kind === "image" && v.image_path);

export const refineOperation = (mode: RefineMode): DesignOperation =>
  mode === "text" ? "refine_text" : mode === "image" ? "refine_image" : "refine_both";

export const REFINE_MODE_LABELS: Record<RefineMode, string> = {
  text: "Text-only refinement",
  image: "Image revision",
  both: "Text and image refinement",
};

/** Free, local comparison of two written versions: no AI and no credits. */
export function diffConcepts(a: DesignVersion, b: DesignVersion) {
  const fields: [string, string][] = [
    ["overview", "Overview"], ["creativeDirection", "Creative direction"], ["objectives", "Objectives"],
    ["keyElements", "Key elements"], ["materials", "Materials and components"], ["functional", "Functional considerations"],
    ["improvements", "Suggested improvements"], ["challenges", "Challenges"],
  ];
  const show = (v: unknown) => (Array.isArray(v) ? v.join("\n") : String(v ?? ""));
  return fields.map(([key, label]) => {
    const left = show(a.content?.[key]);
    const right = show(b.content?.[key]);
    return { key, label, left, right, changed: left.trim() !== right.trim() };
  });
}

export function storageUsage(rows: { image_path: string | null; image_bytes: number }[]): StorageUsage {
  const imgs = rows.filter((r) => r.image_path);
  return { images: imgs.length, bytes: imgs.reduce((t, r) => t + Number(r.image_bytes || 0), 0) };
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Can the user start this paid operation? Admins are never charged. */
export function affordability(balance: number, cost: number, isAdmin: boolean) {
  if (isAdmin) return { ok: true, message: null as string | null };
  if (balance >= cost) return { ok: true, message: null };
  return { ok: false, message: `This needs ${cost} credit${cost === 1 ? "" : "s"} and you have ${balance}. Add credits on the Pricing page to continue.` };
}

/** A fresh id per confirmed request, so a repeated submit is never charged twice. */
export const newRequestId = () => crypto.randomUUID();

// ---------------------------------------------------------------- storage
// deno-lint-ignore no-explicit-any
const db = () => supabase as any;
export const DESIGN_BUCKET = "design-it";

const normalize = (row: any): DesignProject => ({
  ...row,
  brief: { ...emptyBrief(row?.category ?? "other"), ...(row?.brief ?? {}), details: row?.brief?.details ?? {} },
  selected_direction: row?.selected_direction ?? null,
});

export async function listDesignProjects(): Promise<DesignProject[]> {
  const { data, error } = await db().from("design_it_projects").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function createDesignProject(userId: string, name: string, brief: DesignBrief): Promise<DesignProject> {
  const { data, error } = await db().from("design_it_projects")
    .insert({ user_id: userId, project_name: name.slice(0, 200) || "Untitled design", category: brief.category, status: "Brief", brief })
    .select("*").single();
  if (error) throw error;
  return normalize(data);
}

export async function saveDesignProject(p: DesignProject): Promise<DesignProject> {
  const { data, error } = await db().from("design_it_projects")
    .update({ project_name: p.project_name.slice(0, 200) || "Untitled design", category: p.brief.category, brief: p.brief, selected_direction: p.selected_direction })
    .eq("id", p.id).select("*").single();
  if (error) throw error;
  return normalize(data);
}

export async function listVersions(projectId: string): Promise<DesignVersion[]> {
  const { data, error } = await db().from("design_it_versions").select("*").eq("project_id", projectId).order("version_number");
  if (error) throw error;
  return data ?? [];
}

/** Images stored across all of the user's projects (for the storage display). */
export async function myStorageUsage(): Promise<StorageUsage> {
  const { data, error } = await db().from("design_it_versions").select("image_path, image_bytes").not("image_path", "is", null);
  if (error) throw error;
  return storageUsage(data ?? []);
}

/** Delete a project, its versions and its stored images. */
export async function deleteDesignProject(id: string): Promise<void> {
  const versions = await listVersions(id).catch(() => [] as DesignVersion[]);
  const paths = versions.map((v) => v.image_path).filter(Boolean) as string[];
  if (paths.length) await supabase.storage.from(DESIGN_BUCKET).remove(paths);
  const { error } = await db().from("design_it_projects").delete().eq("id", id);
  if (error) throw error;
}

export async function signedImageUrls(paths: string[]): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { data, error } = await supabase.storage.from(DESIGN_BUCKET).createSignedUrls(paths, 60 * 60);
  if (error) throw error;
  return Object.fromEntries((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

/** Download an existing visual (no AI call, no credits). */
export async function downloadImage(path: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage.from(DESIGN_BUCKET).download(path);
  if (error || !data) throw error ?? new Error("Download failed");
  const ext = path.split(".").pop() || "png";
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName.replace(/[^a-z0-9-_ ]/gi, "").trim() || "design"}.${ext}`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read an image as a data URL (for PDF export). */
export async function imageDataUrl(path: string): Promise<{ dataUrl: string; format: string } | null> {
  const { data } = await supabase.storage.from(DESIGN_BUCKET).download(path);
  if (!data) return null;
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(data);
  });
  const format = data.type === "image/jpeg" ? "JPEG" : data.type === "image/webp" ? "WEBP" : "PNG";
  return { dataUrl, format };
}

export function designStorageError(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? "";
  if (/design_it_|relation .* does not exist|schema cache/i.test(msg)) {
    return "Design It projects are not available yet. Please try again later.";
  }
  return "We couldn't save your project. Please try again.";
}
