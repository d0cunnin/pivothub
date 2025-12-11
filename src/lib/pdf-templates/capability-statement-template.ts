import jsPDF from 'jspdf';

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

export function generateCapabilityStatementPDF(
  result: CapabilityResult,
  formData: CapabilityFormData
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = margin;

  // Colors (using RGB for jsPDF)
  const primaryColor: [number, number, number] = [0, 57, 155]; // #00399b
  const secondaryColor: [number, number, number] = [0, 123, 64]; // #007b40
  const textColor: [number, number, number] = [33, 33, 33];
  const lightGray: [number, number, number] = [240, 240, 240];

  // Header with company name
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(formData.businessName || 'CAPABILITY STATEMENT', margin, 16);

  yPos = 32;

  // Contact info bar
  doc.setFillColor(...lightGray);
  doc.rect(margin, yPos, contentWidth, 18, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  let contactY = yPos + 5;
  if (formData.address) {
    doc.text(formData.address, margin + 3, contactY);
    contactY += 4;
  }
  
  const contactLine: string[] = [];
  if (formData.phone) contactLine.push(`Phone: ${formData.phone}`);
  if (formData.email) contactLine.push(`Email: ${formData.email}`);
  if (formData.website) contactLine.push(`Web: ${formData.website}`);
  
  if (contactLine.length > 0) {
    doc.text(contactLine.join('  |  '), margin + 3, contactY);
    contactY += 4;
  }
  
  if (formData.pocName) {
    const pocLine = `POC: ${formData.pocName}${formData.pocTitle ? `, ${formData.pocTitle}` : ''}`;
    doc.text(pocLine, margin + 3, contactY);
  }

  yPos = 55;

  // Helper function to add a section
  const addSection = (title: string, content: string, color: [number, number, number]) => {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = margin;
    }

    // Section header
    doc.setFillColor(...color);
    doc.rect(margin, yPos, contentWidth, 7, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 3, yPos + 5);
    
    yPos += 10;

    // Section content
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Split content into lines
    const lines = doc.splitTextToSize(content, contentWidth - 6);
    
    lines.forEach((line: string) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin + 3, yPos);
      yPos += 4;
    });

    yPos += 5;
  };

  // Add all sections
  addSection('COMPANY DATA & PERTINENT CODES', result.companyData, primaryColor);
  addSection('CORE COMPETENCIES', result.coreCompetencies, secondaryColor);
  addSection('DIFFERENTIATORS', result.differentiators, primaryColor);
  addSection('PAST PERFORMANCE', result.pastPerformance, secondaryColor);

  // Footer
  const footerY = pageHeight - 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(`${formData.businessName} - Capability Statement`, margin, footerY);
  doc.text('Generated with PivotHub', pageWidth - margin - 35, footerY);

  return doc;
}
