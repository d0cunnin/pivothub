import type jsPDF from 'jspdf';
import { PdfWriter, asText, toList } from '../pdfWriter';
import { reportHeader, renderAiText } from '../pdf-reports/reportBlocks';

interface CapabilityResult {
  companyData: string;
  coreCompetencies: string;
  differentiators: string;
  pastPerformance: string;
}

interface CapabilityFormData {
  businessName: string;
  address: string;
  website: string;
  phone: string;
  email: string;
  pocName: string;
  pocTitle: string;
  pocPhone: string;
  pocEmail: string;
}

/** AI sections arrive as bullet text, but may also be an array or object. */
function renderContent(w: PdfWriter, content: unknown) {
  if (Array.isArray(content) || (content && typeof content === 'object')) {
    w.bullets(toList(content));
    return;
  }
  renderAiText(w, typeof content === 'string' ? content : asText(content));
}

export function generateCapabilityStatementPDF(
  result: CapabilityResult,
  formData: CapabilityFormData
): jsPDF {
  const w = new PdfWriter();
  // Sent to funders/agencies/clients under the user's name: no PivotHub branding.
  w.brand = false;
  const businessName = asText(formData?.businessName);
  reportHeader(w, businessName || 'Capability Statement', businessName ? 'Capability Statement' : '');

  const poc = [asText(formData?.pocName), asText(formData?.pocTitle)].filter(Boolean).join(', ');
  const contactRows: [string, string][] = [
    ['Address', asText(formData?.address)],
    ['Phone', asText(formData?.phone)],
    ['Email', asText(formData?.email)],
    ['Website', asText(formData?.website)],
    ['Point of contact', poc],
    ['Contact phone', asText(formData?.pocPhone)],
    ['Contact email', asText(formData?.pocEmail)],
  ];
  if (contactRows.some(([, v]) => v)) {
    w.section('Contact Information');
    w.facts(contactRows);
    w.y += 1;
  }

  const sections: [string, unknown][] = [
    ['Company Data and Codes', result?.companyData],
    ['Core Competencies', result?.coreCompetencies],
    ['Differentiators', result?.differentiators],
    ['Past Performance', result?.pastPerformance],
  ];
  sections.forEach(([title, content]) => {
    if (!asText(content).trim()) return;
    w.section(title);
    renderContent(w, content);
    w.y += 2;
  });

  w.footer(`${businessName ? `${businessName} - ` : ''}Capability Statement | Generated with PivotHub`);
  return w.doc;
}
