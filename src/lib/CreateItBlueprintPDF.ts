import type jsPDF from "jspdf";
import {
  BLUEPRINT_SECTIONS,
  CreateItBlueprint,
  CreateItFormData,
} from "@/types/createit";
import { PdfWriter, asText, toList, pdfSafe, ACCENT, DIVIDER, HEADING, MUTED, BODY } from "./pdfWriter";
import { callout, richMarkdown } from "./pdf-reports/markdownBlocks";

interface GeneratePdfOptions {
  form: CreateItFormData;
  blueprint: CreateItBlueprint;
  userName?: string;
}

const BRAND = "PivotHub";
const TITLE = "Your AI Platform Blueprint";

// One friendly line under each section title.
const SECTION_NOTES: Partial<Record<keyof CreateItBlueprint, string>> = {
  executiveSummary: "What you are building and why it matters",
  technologyStack: "The tools and services to build on",
  databaseArchitecture: "Tables, relationships and who can see what",
  applicationArchitecture: "How the pieces of the app fit together",
  userFlow: "The path a user takes through your platform",
  integrations: "Outside services to connect",
  monetizationStrategy: "How the platform makes money",
  developmentRoadmap: "What to build first, and when",
  buildInstructions: "Step-by-step guidance for each AI builder",
  githubSetup: "Version control, deployment and secrets",
  aiBuildPrompt: "Ready to paste into your AI builder",
};

const joinList = (...parts: unknown[]) =>
  parts.flatMap((p) => toList(p)).filter(Boolean).join(", ");

/** Project details as label/value rows with a tinted label column. */
function summaryTable(w: PdfWriter, rows: [string, string][]) {
  const labelWidth = 44;
  const pad = 2.6;
  const size = 9.5;
  const lh = size * 0.5;
  rows
    .filter(([, v]) => v)
    .forEach(([label, value], idx) => {
      w.setStyle(size, BODY);
      const lines: string[] = w.doc.splitTextToSize(value, w.contentWidth - labelWidth - pad * 2);
      let start = 0;
      while (start < lines.length) {
        w.ensureSpace(pad * 2 + lh * Math.min(2, lines.length - start));
        const top = w.y - 3.4;
        const avail = Math.max(1, Math.floor((w.pageHeight - w.margin - 5 - top - pad * 2) / lh));
        const chunk = lines.slice(start, start + avail);
        const height = pad * 2 + chunk.length * lh;
        if (idx % 2 === 0) {
          w.doc.setFillColor(248, 250, 252);
          w.doc.rect(w.margin, top, w.contentWidth, height, "F");
        }
        w.doc.setDrawColor(...DIVIDER);
        w.doc.setLineWidth(0.2);
        w.doc.line(w.margin, top + height, w.margin + w.contentWidth, top + height);
        if (start === 0) {
          w.setStyle(size, HEADING, "bold");
          w.doc.text(pdfSafe(label), w.margin + pad, top + pad + 3.2);
        }
        w.setStyle(size, BODY);
        chunk.forEach((l, i) => w.doc.text(l, w.margin + labelWidth + pad, top + pad + 3.2 + i * lh));
        w.y = top + height + 3.4;
        start += chunk.length;
      }
    });
  w.y += 6;
}

export function generateCreateItBlueprintPDF({
  form,
  blueprint,
  userName,
}: GeneratePdfOptions): jsPDF {
  const w = new PdfWriter();
  const appName = asText(form?.appName) || "Your Platform";

  // ---------- Title block ----------
  w.setStyle(8.5, ACCENT, "bold");
  w.doc.text("CREATE IT  |  AI STARTUP ARCHITECT", w.margin, w.y);
  w.y += 9;
  w.header(TITLE, appName);
  w.y -= 2;

  const meta: [string, string][] = [
    ["Prepared for", asText(userName)],
    ["Platform", asText(form?.appName) || "-"],
    ["Category", asText(form?.primaryPurpose)],
    ["Type", asText(form?.platformType)],
  ];
  w.facts(meta);
  w.y += 2;

  // ---------- Project summary ----------
  w.section("Project Summary", "What you told us about your platform");
  summaryTable(w, [
    ["App Name", asText(form?.appName)],
    ["Description", asText(form?.platformDescription)],
    ["Target Audience", asText(form?.targetAudience)],
    ["Primary Purpose", asText(form?.primaryPurpose)],
    ["Platform Type", asText(form?.platformType)],
    ["Target Platforms", joinList(form?.targetPlatforms)],
    ["Core Features", joinList(form?.features, form?.customFeature)],
    ["Monetization", joinList(form?.monetizationTypes)],
    ["Pricing", asText(form?.pricingInfo)],
    ["User Journey", asText(form?.userJourney)],
    ["Integrations", joinList(form?.integrations, form?.customIntegration)],
    ["Skill Level", asText(form?.skillLevel)],
  ]);

  const sections = BLUEPRINT_SECTIONS.filter(({ key }) => asText(blueprint?.[key]).trim());

  // ---------- Contents (page numbers filled in at the end) ----------
  const toc: { title: string; page: number; y: number }[] = [];
  if (sections.length) {
    w.section("What's Inside");
    sections.forEach(({ title }, i) => {
      w.ensureSpace(7);
      w.setStyle(10, ACCENT, "bold");
      w.doc.text(String(i + 1).padStart(2, "0"), w.margin, w.y);
      w.setStyle(10, HEADING);
      w.doc.text(pdfSafe(title), w.margin + 10, w.y);
      toc.push({ title, page: w.doc.getNumberOfPages(), y: w.y });
      w.y += 7;
    });
    w.y += 4;
  }

  // ---------- Blueprint sections ----------
  const sectionPages: number[] = [];
  sections.forEach(({ key, title }, i) => {
    const value = blueprint[key];
    // Keep raw strings so list nesting and code indentation survive.
    const content = typeof value === "string" ? value : asText(value);
    w.y += 4;
    const before = w.doc.getNumberOfPages();
    w.ensureSpace(key === "aiBuildPrompt" ? 78 : 50);
    if (w.doc.getNumberOfPages() === before) w.divider();
    w.setStyle(8.5, ACCENT, "bold");
    w.doc.text(`PART ${i + 1} OF ${sections.length}`, w.margin, w.y);
    w.y += 7;
    sectionPages.push(w.doc.getNumberOfPages());
    w.section(title, SECTION_NOTES[key]);
    if (key === "aiBuildPrompt") {
      callout(
        w,
        "Copy everything in this section and paste it into Lovable, Claude Code, OpenAI Codex, Cursor or Bolt to generate the first version of your app.",
        { size: 9.5, color: BODY, title: "How to use this prompt" },
      );
    }
    richMarkdown(w, content, { demoteHeadings: true, dropTitle: title });
  });

  // Fill in contents page numbers with dotted leaders.
  toc.forEach((row, i) => {
    w.doc.setPage(row.page);
    const pageNo = String(sectionPages[i] ?? "");
    w.setStyle(10, HEADING);
    const titleEnd = w.margin + 10 + w.doc.getTextWidth(pdfSafe(row.title)) + 2;
    w.setStyle(10, MUTED);
    const numWidth = w.doc.getTextWidth(pageNo);
    const right = w.pageWidth - w.margin;
    const dotsWidth = right - numWidth - 2 - titleEnd;
    const dot = w.doc.getTextWidth(".");
    if (dotsWidth > dot * 3) {
      w.setStyle(10, DIVIDER.map((c) => c - 40) as [number, number, number]);
      w.doc.text(".".repeat(Math.floor(dotsWidth / dot)), right - numWidth - 2, row.y, { align: "right" });
    }
    w.setStyle(10, MUTED);
    w.doc.text(pageNo, right, row.y, { align: "right" });
  });
  w.doc.setPage(w.doc.getNumberOfPages());

  w.footer(`${TITLE} · ${appName} · ${BRAND}`);
  return w.doc;
}

export function downloadCreateItBlueprintPDF(options: GeneratePdfOptions): void {
  const doc = generateCreateItBlueprintPDF(options);
  const safeName = (options.form.appName || "platform")
    .replace(/[^a-z0-9]/gi, "_")
    .slice(0, 40);
  doc.save(`${safeName}_AI_Platform_Blueprint.pdf`);
}
