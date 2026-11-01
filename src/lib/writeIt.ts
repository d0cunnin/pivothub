import { supabase } from "@/integrations/supabase/client";

/** WRITE IT: shared types, options and project storage. Planning only, never manuscripts. */

export const BOOK_CATEGORIES = [
  "Nonfiction", "Fiction", "Memoir/Autobiography", "Devotional", "Workbook", "Journal", "Children's Book",
  "Educational/Instructional", "Academic", "Poetry", "Inspirational", "Technical/Professional", "Other",
] as const;

export const BOOK_PURPOSES = [
  "Educate", "Inform", "Inspire", "Teach", "Entertain", "Persuade", "Document personal experiences",
  "Provide instruction", "Explore a particular subject", "Other",
] as const;

export const DEV_STATUSES = [
  "I have an idea but need help organizing it.",
  "I have several ideas and notes.",
  "I have an established book concept.",
  "I have already developed a table of contents.",
  "I have chapter outlines and need help organizing them.",
  "I have started writing and need help structuring the remaining book.",
] as const;

export const WRITING_STYLES = ["Educational", "Conversational", "Academic", "Professional", "Inspirational", "Narrative", "Technical", "Reflective", "Other"] as const;
export const BOOK_LENGTHS = ["Short", "Medium", "Comprehensive", "Not sure"] as const;
export const AUDIENCE_EXAMPLES = ["General adult readers", "Parents", "Students", "Educators", "Entrepreneurs", "Church leaders", "Professionals", "Children", "Young adults"];
export const PROGRESS_STATUSES = ["Not Started", "Planning", "In Progress", "Completed"] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

export const WRITE_IT_COSTS = { plan: 3, outlines: 3, outline: 1, toc: 1, roadmap: 1 } as const;

export interface BookInputs {
  idea: string;
  category: string;
  purposes: string[];
  audience: string;
  message: string;
  devStatus: string;
  title: string;
  subtitle: string;
  style: string;
  length: string;
  completionDate: string;
  instructions: string;
}

export const EMPTY_INPUTS: BookInputs = {
  idea: "", category: "", purposes: [], audience: "", message: "", devStatus: "",
  title: "", subtitle: "", style: "", length: "", completionDate: "", instructions: "",
};

export interface BookConcept {
  refinedConcept?: string;
  centralTheme?: string;
  purposeStatement?: string;
  intendedAudience?: string;
  readerNeeds?: string[];
  mainMessage?: string;
  readerOutcomes?: string[];
  organizingApproach?: string;
}

export interface TitleOption { title: string; subtitle: string; why: string }

export interface BookPlan {
  understanding?: string;
  concept?: BookConcept;
  titles?: TitleOption[];
  structure?: { type: string; explanation: string };
  gaps?: string[];
  /** The author's chosen title and subtitle (never replaced automatically). */
  selectedTitle?: string;
  selectedSubtitle?: string;
  /** Section names in order (empty string = chapters without a part). */
  parts?: string[];
}

export interface Chapter {
  id: string;
  part: string;
  title: string;
  summary: string;
  outline: string;
  status: ProgressStatus;
}

export interface Roadmap {
  text?: string;
  hoursPerWeek?: string;
  daysPerWeek?: string;
  completionDate?: string;
}

export interface PublishPackage {
  title: string;
  subtitle: string;
  authorName: string;
  category: string;
  concept: string;
  description: string;
  audience: string;
  tableOfContents: { part: string; title: string }[];
  manuscriptStatus: "outline only";
}

export interface WriteItProject {
  id: string;
  project_name: string;
  status: ProgressStatus;
  inputs: BookInputs;
  plan: BookPlan;
  chapters: Chapter[];
  roadmap: Roadmap;
  publish_package: PublishPackage | null;
  sent_to_publish_at: string | null;
  created_at: string;
  updated_at: string;
}

export const newChapterId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/** Chapters from the AI's parts/chapters shape. */
export function chaptersFromParts(parts: { name: string; chapters: { title: string; summary: string }[] }[]): { chapters: Chapter[]; partNames: string[] } {
  const chapters: Chapter[] = [];
  const partNames: string[] = [];
  for (const p of parts) {
    if (!partNames.includes(p.name)) partNames.push(p.name);
    for (const c of p.chapters) {
      chapters.push({ id: newChapterId(), part: p.name, title: c.title, summary: c.summary, outline: "", status: "Not Started" });
    }
  }
  return { chapters, partNames };
}

/** Chapters grouped by part, keeping the order of `parts`, then any part only seen on chapters. */
export function groupByPart(chapters: Chapter[], parts: string[] = []): { part: string; chapters: Chapter[] }[] {
  const order = [...parts];
  chapters.forEach((c) => { if (!order.includes(c.part)) order.push(c.part); });
  return order.map((part) => ({ part, chapters: chapters.filter((c) => c.part === part) })).filter((g) => g.chapters.length || g.part);
}

/** Overall progress: share of chapters marked Completed. */
export function progressPercent(chapters: Chapter[]): number {
  if (!chapters.length) return 0;
  return Math.round((chapters.filter((c) => c.status === "Completed").length / chapters.length) * 100);
}

export function conceptToText(c?: BookConcept): string {
  if (!c) return "";
  return [c.refinedConcept, c.centralTheme && `Central theme: ${c.centralTheme}`, c.mainMessage && `Main message: ${c.mainMessage}`].filter(Boolean).join("\n");
}

export function buildPublishPackage(p: WriteItProject, authorName: string): PublishPackage {
  const c = p.plan.concept ?? {};
  return {
    title: p.plan.selectedTitle || p.inputs.title || p.project_name,
    subtitle: p.plan.selectedSubtitle || p.inputs.subtitle || "",
    authorName,
    category: p.inputs.category,
    concept: c.refinedConcept || p.inputs.idea,
    description: [c.refinedConcept, c.mainMessage].filter(Boolean).join(" ") || p.inputs.idea,
    audience: c.intendedAudience || p.inputs.audience,
    tableOfContents: p.chapters.map((ch) => ({ part: ch.part, title: ch.title })),
    // An outline is not a manuscript; Publish It must still ask about readiness.
    manuscriptStatus: "outline only",
  };
}

// ---------------------------------------------------------------------------
// Storage (Row Level Security limits every query to the signed-in user)
// ---------------------------------------------------------------------------
// The generated Supabase types do not include this table yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as any).from("write_it_projects");

const normalize = (row: any): WriteItProject => ({
  ...row,
  inputs: { ...EMPTY_INPUTS, ...(row?.inputs ?? {}) },
  plan: row?.plan ?? {},
  chapters: Array.isArray(row?.chapters) ? row.chapters : [],
  roadmap: row?.roadmap ?? {},
});

export async function listProjects(): Promise<WriteItProject[]> {
  const { data, error } = await table().select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function createProject(userId: string, fields: Partial<WriteItProject>): Promise<WriteItProject> {
  const { data, error } = await table().insert({
    user_id: userId,
    project_name: fields.project_name || "Untitled book",
    status: fields.status || "Planning",
    inputs: fields.inputs ?? EMPTY_INPUTS,
    plan: fields.plan ?? {},
    chapters: fields.chapters ?? [],
    roadmap: fields.roadmap ?? {},
  }).select("*").single();
  if (error) throw error;
  return normalize(data);
}

export async function saveProject(p: WriteItProject): Promise<WriteItProject> {
  const { data, error } = await table().update({
    project_name: p.project_name,
    status: p.status,
    inputs: p.inputs,
    plan: p.plan,
    chapters: p.chapters,
    roadmap: p.roadmap,
    publish_package: p.publish_package,
    sent_to_publish_at: p.sent_to_publish_at,
  }).eq("id", p.id).select("*").single();
  if (error) throw error;
  return normalize(data);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await table().delete().eq("id", id);
  if (error) throw error;
}

/** Friendly message when the table has not been created yet. */
export function storageErrorMessage(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? "";
  if (/write_it_projects|relation .* does not exist|schema cache/i.test(msg)) {
    return "Saving projects isn't available yet. Your plan is still shown here; download the PDF to keep it.";
  }
  return "We couldn't save your project. Please try again.";
}
