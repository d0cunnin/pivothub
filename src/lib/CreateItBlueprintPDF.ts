import jsPDF from "jspdf";
import {
  BLUEPRINT_SECTIONS,
  CreateItBlueprint,
  CreateItFormData,
} from "@/types/createit";

interface GeneratePdfOptions {
  form: CreateItFormData;
  blueprint: CreateItBlueprint;
  userName?: string;
}

const BRAND = "PivotHub";
const TITLE = "Your AI Platform Blueprint";

// Light-weight markdown renderer for jsPDF. Handles headings (#, ##, ###),
// bullet lists, numbered lists, and inline **bold** by stripping the markers.
export function generateCreateItBlueprintPDF({
  form,
  blueprint,
  userName,
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxLineWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const stripInline = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/^\s*[-*]\s+/, "• ")
      .trimEnd();

  const writeLine = (
    text: string,
    fontSize: number,
    bold: boolean,
    color: [number, number, number] = [30, 30, 30],
    indent = 0,
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxLineWidth - indent);
    const lineHeight = fontSize * 1.35;
    lines.forEach((line: string) => {
      ensureSpace(lineHeight);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    });
  };

  const renderMarkdown = (markdown: string) => {
    const lines = (markdown || "").split("\n");
    for (const rawLine of lines) {
      const line = rawLine.replace(/\r$/, "");
      if (!line.trim()) {
        y += 6;
        continue;
      }
      if (/^###\s+/.test(line)) {
        y += 4;
        writeLine(stripInline(line.replace(/^###\s+/, "")), 11, true, [60, 60, 60]);
      } else if (/^##\s+/.test(line)) {
        y += 6;
        writeLine(stripInline(line.replace(/^##\s+/, "")), 13, true, [37, 99, 235]);
      } else if (/^#\s+/.test(line)) {
        y += 6;
        writeLine(stripInline(line.replace(/^#\s+/, "")), 14, true, [37, 99, 235]);
      } else if (/^\s*[-*]\s+/.test(line)) {
        writeLine(stripInline(line), 10, false, [40, 40, 40], 12);
      } else if (/^\s*\d+\.\s+/.test(line)) {
        writeLine(stripInline(line).replace(/^\s*/, ""), 10, false, [40, 40, 40], 12);
      } else {
        writeLine(stripInline(line), 10, false, [40, 40, 40]);
      }
    }
  };

  const sectionHeading = (title: string) => {
    ensureSpace(40);
    y += 10;
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, y - 12, 4, 18, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(title, margin + 12, y);
    y += 14;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  };

  // ---------- Cover Page ----------
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor(96, 165, 250);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("CREATE IT  ·  AI STARTUP ARCHITECT", pageWidth / 2, 150, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(34);
  doc.text(TITLE, pageWidth / 2, 230, { align: "center" });

  doc.setFontSize(20);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(226, 232, 240);
  const platformLines = doc.splitTextToSize(form.appName || "Your Platform", maxLineWidth);
  doc.text(platformLines, pageWidth / 2, 280, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  let coverMetaY = pageHeight - 160;
  const coverMeta = [
    userName ? `Prepared for: ${userName}` : null,
    `Platform: ${form.appName || "—"}`,
    form.primaryPurpose ? `Category: ${form.primaryPurpose}` : null,
    form.platformType ? `Type: ${form.platformType}` : null,
    `Generated: ${new Date().toLocaleString()}`,
  ].filter(Boolean) as string[];
  coverMeta.forEach((m) => {
    doc.text(m, pageWidth / 2, coverMetaY, { align: "center" });
    coverMetaY += 18;
  });

  doc.setFontSize(10);
  doc.setTextColor(96, 165, 250);
  doc.text(`Powered by ${BRAND}`, pageWidth / 2, pageHeight - 56, { align: "center" });

  // ---------- Project Summary ----------
  doc.addPage();
  y = margin;
  sectionHeading("Project Summary");
  const summaryRows: [string, string][] = [
    ["App Name", form.appName],
    ["Description", form.platformDescription],
    ["Target Audience", form.targetAudience],
    ["Primary Purpose", form.primaryPurpose],
    ["Platform Type", form.platformType],
    ["Target Platforms", (form.targetPlatforms || []).join(", ")],
    ["Core Features", [...(form.features || []), form.customFeature].filter(Boolean).join(", ")],
    ["Monetization", (form.monetizationTypes || []).join(", ")],
    ["Pricing", form.pricingInfo],
    ["Integrations", [...(form.integrations || []), form.customIntegration].filter(Boolean).join(", ")],
    ["Skill Level", form.skillLevel],
  ];
  summaryRows.forEach(([label, value]) => {
    if (!value) return;
    writeLine(label, 10, true, [37, 99, 235]);
    writeLine(value, 10, false, [40, 40, 40], 8);
    y += 4;
  });

  // ---------- Blueprint Sections ----------
  BLUEPRINT_SECTIONS.forEach(({ key, title }) => {
    const content = blueprint[key];
    if (!content) return;
    sectionHeading(title);
    renderMarkdown(content);
  });

  // ---------- Footer (page numbers + branding) ----------
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${TITLE} · ${form.appName || "Platform"} · ${BRAND}`,
      margin,
      pageHeight - 24,
    );
    doc.text(`Page ${i - 1}`, pageWidth - margin, pageHeight - 24, { align: "right" });
  }

  return doc;
}

export function downloadCreateItBlueprintPDF(options: GeneratePdfOptions): void {
  const doc = generateCreateItBlueprintPDF(options);
  const safeName = (options.form.appName || "platform")
    .replace(/[^a-z0-9]/gi, "_")
    .slice(0, 40);
  doc.save(`${safeName}_AI_Platform_Blueprint.pdf`);
}
