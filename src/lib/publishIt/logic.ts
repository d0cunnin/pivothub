import { supabase } from "@/integrations/supabase/client";
import { READINESS_HELP, SOURCES, type SourceKey } from "./content";

/** PUBLISH IT: assessment options, readiness, roadmap and project storage. */

export const ANSWERS = ["Yes", "No", "In Progress", "Not Sure"] as const;
export type Answer = (typeof ANSWERS)[number] | "";

export const READINESS_QUESTIONS = [
  { key: "manuscriptComplete", label: "Is your manuscript complete?" },
  { key: "edited", label: "Has your manuscript been edited?" },
  { key: "proofread", label: "Has it been proofread?" },
  { key: "formatted", label: "Has the interior been formatted?" },
  { key: "coverDone", label: "Is your book cover completed?" },
  { key: "trimSize", label: "Have you selected a trim size?" },
  { key: "pageCount", label: "Do you know your final page count?" },
  { key: "publisherChosen", label: "Have you selected a publisher or imprint?" },
] as const;
export type ReadinessKey = (typeof READINESS_QUESTIONS)[number]["key"];

export const FORMATS = ["Paperback", "Hardcover", "E-book", "Audiobook"] as const;
export const GOALS = [
  "Sell primarily through Amazon", "Reach bookstores", "Reach libraries", "Reach international readers",
  "Sell directly to readers", "Distribute through multiple channels", "Not sure",
] as const;
export const ISBN_STATUSES = [
  "I already have an ISBN.", "I need to purchase an ISBN.", "I want to explore a free platform-provided ISBN.", "I am not sure whether I need one.",
] as const;
export const COPYRIGHT_STATUSES = [
  "I have registered my copyright.", "I have not registered my copyright.", "I need copyright registration guidance.", "I am unsure.",
] as const;
export type PrintPlatform = "ingramspark" | "kdp" | "both" | "";

export const TASK_STATUSES = ["Not Started", "In Progress", "Completed", "Needs Attention"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type ReadinessStatus = "Complete" | "Needs Attention" | "In Progress" | "Not Started";

export interface BookInfo {
  title: string; subtitle: string; author: string; category: string; audience: string; description: string;
  imprint: string; language: string; concept: string; tableOfContents: { part: string; title: string }[];
}

export interface Assessment {
  book: BookInfo;
  readiness: Record<ReadinessKey, Answer>;
  formats: string[];
  goals: string[];
  isbnStatus: string;
  copyrightStatus: string;
  budget: string;
  budgetUndetermined: boolean;
  printPlatform: PrintPlatform;
  audiobook: Record<string, Answer>;
}

export const EMPTY_ASSESSMENT: Assessment = {
  book: { title: "", subtitle: "", author: "", category: "", audience: "", description: "", imprint: "", language: "English", concept: "", tableOfContents: [] },
  readiness: Object.fromEntries(READINESS_QUESTIONS.map((q) => [q.key, ""])) as Record<ReadinessKey, Answer>,
  formats: [], goals: [], isbnStatus: "", copyrightStatus: "", budget: "", budgetUndetermined: false, printPlatform: "", audiobook: {},
};

export const hasPrint = (a: Assessment) => a.formats.includes("Paperback") || a.formats.includes("Hardcover");

export function missingAssessment(a: Assessment): string | null {
  if (!a.book.title.trim()) return "Please enter your book title.";
  if (!a.book.author.trim()) return "Please enter the author name or pen name.";
  if (READINESS_QUESTIONS.some((q) => !a.readiness[q.key])) return "Please answer every manuscript readiness question.";
  if (!a.formats.length) return "Please choose at least one format.";
  if (hasPrint(a) && !a.printPlatform) return "Please choose IngramSpark, KDP or both for your print book.";
  if (!a.isbnStatus) return "Please choose your ISBN status.";
  if (!a.copyrightStatus) return "Please choose your copyright status.";
  return null;
}

// ---------------------------------------------------------------------------
// Readiness: only the author's own "Yes" marks something Complete.
// ---------------------------------------------------------------------------
const fromAnswer = (a: Answer | undefined): ReadinessStatus =>
  a === "Yes" ? "Complete" : a === "In Progress" ? "In Progress" : a === "Not Sure" ? "Needs Attention" : "Not Started";

export interface ReadinessItem { key: string; label: string; status: ReadinessStatus; help: string }

export function evaluateReadiness(a: Assessment, overrides: Record<string, ReadinessStatus> = {}): ReadinessItem[] {
  const r = a.readiness;
  const formattingAnswers = [r.formatted, r.trimSize, r.pageCount];
  const formatting: ReadinessStatus = formattingAnswers.every((x) => x === "Yes") ? "Complete"
    : formattingAnswers.some((x) => x === "Not Sure") ? "Needs Attention"
    : formattingAnswers.some((x) => x === "Yes" || x === "In Progress") ? "In Progress" : "Not Started";
  const isbn: ReadinessStatus = a.isbnStatus.startsWith("I already") ? "Complete"
    : a.isbnStatus.includes("not sure") ? "Needs Attention" : "Not Started";
  const copyright: ReadinessStatus = a.copyrightStatus.startsWith("I have registered") ? "Complete"
    : a.copyrightStatus.includes("unsure") || a.copyrightStatus.includes("guidance") ? "Needs Attention" : "Not Started";
  const base: Omit<ReadinessItem, "help">[] = [
    { key: "manuscript", label: "Manuscript completion", status: fromAnswer(r.manuscriptComplete) },
    { key: "editing", label: "Editing", status: fromAnswer(r.edited) },
    { key: "proofreading", label: "Proofreading", status: fromAnswer(r.proofread) },
    { key: "formatting", label: "Interior formatting", status: formatting },
    { key: "cover", label: "Cover design", status: fromAnswer(r.coverDone) },
    { key: "isbn", label: "ISBN", status: isbn },
    { key: "copyright", label: "Copyright registration", status: copyright },
    { key: "metadata", label: "Metadata (title, description, categories, keywords)", status: "Not Started" },
    { key: "accounts", label: "Publishing account preparation", status: "Not Started" },
    { key: "pricing", label: "Pricing", status: "Not Started" },
    { key: "distribution", label: "Distribution strategy", status: a.goals.length && !a.goals.includes("Not sure") ? "In Progress" : "Not Started" },
    { key: "marketing", label: "Marketing preparation", status: "Not Started" },
  ];
  return base.map((i) => ({ ...i, status: overrides[i.key] ?? i.status, help: READINESS_HELP[i.key] ?? "" }));
}

export const readinessPercent = (items: ReadinessItem[]) =>
  items.length ? Math.round((items.filter((i) => i.status === "Complete").length / items.length) * 100) : 0;

// ---------------------------------------------------------------------------
// Roadmap: sequential stages built from the author's answers.
// ---------------------------------------------------------------------------
export interface RoadmapTask {
  id: string;
  stage: string;
  task: string;
  explanation: string;
  why: string;
  instructions: string;
  source?: SourceKey;
  timing?: string;
}

export function buildRoadmap(a: Assessment): RoadmapTask[] {
  const t: RoadmapTask[] = [];
  const add = (stage: string, id: string, task: string, explanation: string, why: string, instructions: string, source?: SourceKey, timing?: string) =>
    t.push({ id, stage, task, explanation, why, instructions, source, timing });
  const r = a.readiness;
  const print = hasPrint(a);
  const ingram = a.printPlatform === "ingramspark" || a.printPlatform === "both";
  const kdp = a.printPlatform === "kdp" || a.printPlatform === "both";
  const ebook = a.formats.includes("E-book");
  const audio = a.formats.includes("Audiobook");
  const S1 = "1. Finish the manuscript", S2 = "2. ISBN and copyright", S3 = "3. Production files",
    S4 = "4. Accounts and book details", S5 = "5. Submit and review proofs", S6 = "6. Pricing and distribution", S7 = "7. Launch";

  if (r.manuscriptComplete !== "Yes") add(S1, "finish-manuscript", "Complete your manuscript", "Finish writing every chapter.", "Formatting, page count and cover all depend on the final manuscript.", "Set a weekly writing goal; Write It can help you outline and schedule.");
  if (r.edited !== "Yes") add(S1, "edit", "Edit the manuscript", "Revise for structure, clarity and flow, then line and copy editing.", "Editing has the biggest effect on reader experience and reviews.", "Self-edit first, then consider a professional editor if your budget allows.");
  if (r.proofread !== "Yes") add(S1, "proofread", "Proofread the final text", "A last check for typos and small errors.", "Errors are much harder to fix after printing.", "Proofread after all edits are finished, ideally with fresh eyes or a proofreader.");

  if (print || ebook) {
    if (a.isbnStatus.startsWith("I already")) add(S2, "isbn-record", "Record your ISBN(s) by format", "Note which ISBN belongs to which format.", "Each format is a separate edition.", "Use the ISBN tab to record each ISBN.", "bowker");
    else if (a.isbnStatus.includes("purchase") || a.printPlatform === "both") add(S2, "isbn-buy", "Buy your ISBN(s) from Bowker", "Purchase one ISBN for each print format (and the e-book if your platform requires one).", "Owning your ISBN lets you use your imprint and publish the same edition on more than one platform.", "Buy from Bowker, then record each number in the ISBN tab.", "bowker");
    else if (a.isbnStatus.includes("free")) add(S2, "isbn-free", "Understand free platform ISBN limits", "A free ISBN from KDP or IngramSpark is tied to that platform.", "It cannot be used for the same print edition elsewhere and lists the platform's imprint.", "Read the ISBN tab and your platform's ISBN terms before choosing.", kdp ? "kdpIsbn" : "ingramFreeIsbn");
    else add(S2, "isbn-decide", "Decide whether you need your own ISBN", "Compare owning an ISBN with a free platform ISBN.", "The choice affects your imprint and which platforms you can use.", "Read the ISBN tab, then decide.", "bowker");
  }
  if (!a.copyrightStatus.startsWith("I have registered")) add(S2, "copyright", "Decide on copyright registration", "Copyright is automatic; registration creates a public record of your claim.", "Registration is generally required before suing for infringement of a U.S. work.", "Read the Copyright tab and the Copyright Office's registration page.", "copyright");

  if (print) {
    if (r.trimSize !== "Yes") add(S3, "trim", "Choose your trim size", "Pick the finished book dimensions.", "Formatting and cover size depend on it.", "Compare trim sizes offered by your platform(s) and similar books in your category.", ingram ? "ingramHelp" : "kdpHelp");
    if (r.formatted !== "Yes") add(S3, "interior", "Format the print interior (PDF)", "Lay out the book for your trim size with margins, gutter and page numbers.", "Platforms reject files that do not meet print specifications.", "Format, export to PDF and check against your platform's file requirements.", ingram ? "ingramFileIssues" : "kdpHelp");
    if (r.pageCount !== "Yes") add(S3, "pagecount", "Confirm your final page count", "Know the exact number of pages after formatting.", "Spine width, printing cost and some options depend on it.", "Get the page count from your final formatted PDF.");
    if (r.coverDone !== "Yes") add(S3, "print-cover", "Create the print cover (back, spine, front)", "Design one cover file sized to your trim size and page count.", "The spine width must match your page count and paper.", ingram ? "Use IngramSpark's Cover Template Generator for exact dimensions." : "Use KDP's cover template and guidelines for exact dimensions.", ingram ? "ingramCoverTemplate" : "kdpHelp");
  }
  if (ebook) add(S3, "epub", "Create your e-book file (EPUB) and cover image", "Convert your manuscript to a clean, reflowable EPUB and prepare a front-cover image.", "E-book stores need a valid file and cover to accept your book.", "See the E-book tab for each platform's requirements.");
  if (audio) add(S3, "audio", "Plan and produce your audiobook", "Choose narration, then record, edit and master each chapter.", "ACX checks audio files against technical requirements.", "Follow the Audiobook tab checklist.", "acxAudio");

  if (r.publisherChosen !== "Yes") add(S4, "imprint", "Choose your publisher or imprint name", "Decide what name appears as publisher.", "It must match your ISBN records and platform details.", "Use the same imprint name everywhere.");
  add(S4, "metadata", "Prepare your book details (metadata)", "Title, subtitle, description, categories, keywords and contributors.", "Accurate details help readers and stores find your book.", "Write them once and reuse them on every platform.");
  if (ingram) add(S4, "acct-ingram", "Create your IngramSpark account", "Sign up and complete publisher, tax and payment details.", "You need a verified account to set up a title.", "See the Print tab, IngramSpark step 1.", "ingramspark");
  if (kdp || ebook) add(S4, "acct-kdp", "Create your KDP account", "Sign up and complete tax and payment details.", "You need it to publish on Amazon.", "See the Print or E-book tab.", "kdp");
  if (audio) add(S4, "acct-acx", "Create your ACX account", "Sign up and claim your title.", "Audiobooks for Audible are set up on ACX.", "See the Audiobook tab.", "acx");

  if (ingram) add(S5, "submit-ingram", "Set up your title on IngramSpark and review the proof", "Enter details, upload your files on IngramSpark and check the digital proof.", "Catching errors before approval saves time and reprint costs.", "Follow the Print tab, IngramSpark steps 6 to 8.", "ingramspark");
  if (kdp) add(S5, "submit-kdp", "Set up your book on KDP and check the Previewer", "Create the title on your KDP Bookshelf, upload files and review the online preview.", "KDP reviews each book; fixing issues first avoids delays.", "Follow the Print tab, KDP steps 6 to 8.", "kdp");
  if (ebook) add(S5, "submit-ebook", "Publish your e-book on your chosen platform(s)", "Upload your EPUB and cover and enter details.", "Each store reviews and lists your e-book separately.", "See the E-book tab, and decide on KDP Select first.");
  if (audio) add(S5, "submit-audio", "Submit your audiobook on ACX", "Upload chapter files, credits and sample.", "ACX reviews audio before distribution.", "See the Audiobook tab.", "acx");

  add(S6, "pricing", "Set your prices", "Choose list prices for each format and market.", "Price affects sales and what you earn per copy.", "Use the pricing pages on each platform; they show printing cost and your earnings.");
  if (a.printPlatform === "both") add(S6, "both", "Review using IngramSpark and KDP together", "Decide how the two services will share distribution.", "Expanded Distribution and free ISBNs can conflict with IngramSpark.", "Read the Print tab section on using both platforms.", "ingramAndKdp");
  add(S6, "copies", "Order proof and author copies", "Check a printed copy before launch and order copies for events.", "A printed proof shows issues screens can miss.", "Order from your platform dashboard.");

  add(S7, "listings", "Check your retailer listings", "Confirm every listing shows the right details.", "Listings can take time and occasionally need corrections.", "Search for your book on each store a few days after approval.");
  add(S7, "marketing", "Plan your launch and marketing", "Decide how readers will hear about your book.", "Availability does not guarantee sales.", "List 3 to 5 launch activities you can manage, such as an email to your contacts, social posts, or a local event.");
  return t;
}

// ---------------------------------------------------------------------------
// Projects (Row Level Security limits every query to the signed-in user)
// ---------------------------------------------------------------------------
export interface IsbnRecord { isbn: string; title: string; format: string; imprint: string; obtained: string; status: string }

export interface PublishProject {
  id: string;
  project_name: string;
  assessment: Assessment;
  progress: {
    tasks?: Record<string, TaskStatus>;
    readiness?: Record<string, ReadinessStatus>;
    copyright?: Record<string, boolean>;
    audiobook?: Record<string, boolean>;
  };
  isbn_records: IsbnRecord[];
  costs: Record<string, string>;
  ai_summary: string | null;
  write_it_project_id: string | null;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabase as any).from("publish_it_projects");

const normalize = (row: any): PublishProject => ({
  ...row,
  assessment: { ...EMPTY_ASSESSMENT, ...(row?.assessment ?? {}), book: { ...EMPTY_ASSESSMENT.book, ...(row?.assessment?.book ?? {}) } },
  progress: row?.progress ?? {},
  isbn_records: Array.isArray(row?.isbn_records) ? row.isbn_records : [],
  costs: row?.costs ?? {},
});

export async function listPublishProjects(): Promise<PublishProject[]> {
  const { data, error } = await table().select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function createPublishProject(userId: string, p: Partial<PublishProject>): Promise<PublishProject> {
  const { data, error } = await table().insert({
    user_id: userId,
    project_name: p.project_name || p.assessment?.book.title || "Untitled book",
    assessment: p.assessment ?? EMPTY_ASSESSMENT,
    progress: p.progress ?? {},
    isbn_records: p.isbn_records ?? [],
    costs: p.costs ?? {},
    ai_summary: p.ai_summary ?? null,
    write_it_project_id: p.write_it_project_id ?? null,
  }).select("*").single();
  if (error) throw error;
  return normalize(data);
}

export async function savePublishProject(p: PublishProject): Promise<PublishProject> {
  const { data, error } = await table().update({
    project_name: p.project_name, assessment: p.assessment, progress: p.progress, isbn_records: p.isbn_records,
    costs: p.costs, ai_summary: p.ai_summary, write_it_project_id: p.write_it_project_id,
  }).eq("id", p.id).select("*").single();
  if (error) throw error;
  return normalize(data);
}

export async function deletePublishProject(id: string): Promise<void> {
  const { error } = await table().delete().eq("id", id);
  if (error) throw error;
}

export function storageError(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? "";
  if (/publish_it_projects|relation .* does not exist|schema cache/i.test(msg)) {
    return "Saving publishing projects isn't available yet. Download your plan as a PDF to keep it.";
  }
  return "We couldn't save your project. Please try again.";
}

// ---------------------------------------------------------------------------
// Write It import: book details only. Manuscript readiness is always asked.
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function bookFromWriteIt(w: any): BookInfo {
  const pkg = w?.publish_package ?? null;
  const plan = w?.plan ?? {};
  const inputs = w?.inputs ?? {};
  const chapters: any[] = Array.isArray(w?.chapters) ? w.chapters : [];
  return {
    ...EMPTY_ASSESSMENT.book,
    title: pkg?.title || plan.selectedTitle || inputs.title || w?.project_name || "",
    subtitle: pkg?.subtitle || plan.selectedSubtitle || inputs.subtitle || "",
    author: pkg?.authorName || "",
    category: pkg?.category || inputs.category || "",
    audience: pkg?.audience || plan.concept?.intendedAudience || inputs.audience || "",
    description: pkg?.description || plan.concept?.refinedConcept || inputs.idea || "",
    concept: pkg?.concept || plan.concept?.refinedConcept || "",
    tableOfContents: pkg?.tableOfContents ?? chapters.map((c) => ({ part: c?.part ?? "", title: c?.title ?? "" })).filter((c) => c.title),
  };
}

export const sourceFor = (key?: SourceKey) => (key ? SOURCES[key] : undefined);
