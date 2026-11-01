import type jsPDF from 'jspdf';
import { PdfWriter, asText, toList } from '../pdfWriter';
import { rawText, wrappedHeader } from './toolReportBlocks';
import { richMarkdown } from './markdownBlocks';

export interface AgentConfig {
  agentName: string;
  purpose: string;
  whoItHelps: string;
  tone?: string;
  tools?: string[];
  safetyRules?: string;
  platform?: string;
}

/** Deploy It: the user's agent details plus the generated setup guide (markdown). */
export function generateDeployItPDF(config: AgentConfig, guide: string): jsPDF {
  const w = new PdfWriter();
  wrappedHeader(w, 'AI Agent Setup Guide', asText(config?.agentName) || 'Your AI Agent');

  w.section('What You Asked For');
  w.facts([
    ['Agent name', asText(config?.agentName)],
    ['What it should do', asText(config?.purpose)],
    ['Who it helps', asText(config?.whoItHelps)],
    ['Platform', asText(config?.platform)],
    ['Tone', asText(config?.tone)],
    ['Tools to connect', toList(config?.tools).join(', ')],
    ['Safety rules', asText(config?.safetyRules)],
  ]);
  w.y += 2;

  // The guide's own "##" sections render as section titles; its copy-and-paste
  // instructions (a code block) render in a gray box.
  richMarkdown(w, rawText(guide));

  w.footer('Platform menus change often. If a step looks different, check the platform\'s help page.');
  return w.doc;
}
