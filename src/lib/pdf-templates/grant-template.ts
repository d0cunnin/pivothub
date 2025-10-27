import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GrantContactInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
}

interface BudgetExtraction {
  hasTable: boolean;
  beforeTable: string;
  tableData: Array<{ category: string; amount: string; isTotal: boolean; isMatching: boolean }> | null;
  afterTable: string;
}

// Extract and parse budget table from AI-generated text
function extractBudgetTable(text: string): BudgetExtraction {
  const budgetStartRegex = /BUDGET SUMMARY\s*[\n\r]+[═─]+/i;
  const budgetMatch = text.match(budgetStartRegex);
  
  if (!budgetMatch) {
    return { hasTable: false, beforeTable: text, tableData: null, afterTable: '' };
  }
  
  const startIndex = budgetMatch.index!;
  const endMarkerRegex = /AMOUNT REQUESTED:\s*\$[\d,]+/;
  const textFromBudget = text.substring(startIndex);
  const endMatch = textFromBudget.match(endMarkerRegex);
  
  if (!endMatch) {
    return { hasTable: false, beforeTable: text, tableData: null, afterTable: '' };
  }
  
  const endIndex = startIndex + endMatch.index! + endMatch[0].length;
  const beforeTable = text.substring(0, startIndex);
  const tableText = text.substring(startIndex, endIndex);
  const afterTable = text.substring(endIndex);
  
  const tableData = parseBudgetRows(tableText);
  
  return {
    hasTable: tableData.length > 0,
    beforeTable,
    tableData: tableData.length > 0 ? tableData : null,
    afterTable
  };
}

// Parse budget table rows into structured data
function parseBudgetRows(tableText: string): Array<{ category: string; amount: string; isTotal: boolean; isMatching: boolean }> {
  const rows: Array<{ category: string; amount: string; isTotal: boolean; isMatching: boolean }> = [];
  const lines = tableText.split('\n');
  
  for (const line of lines) {
    // Skip separator lines and empty lines
    if (line.match(/^[═─\s]+$/) || line.trim() === '') continue;
    
    // Skip header lines
    if (line.includes('Category') && line.includes('Amount')) continue;
    if (line.includes('BUDGET SUMMARY')) continue;
    
    // Parse data lines with various formats
    const patterns = [
      /^([A-Za-z\s\(\)&\/\-,]+?)\s{2,}(\$[\d,]+)$/,  // Multiple spaces separator
      /^([A-Za-z\s\(\)&\/\-,]+?):\s*(\$[\d,]+)$/,     // Colon separator
      /^([A-Za-z\s\(\)&\/\-,]+?)\s+(\$[\d,]+)$/       // Single space separator
    ];
    
    let matched = false;
    for (const pattern of patterns) {
      const match = line.trim().match(pattern);
      if (match) {
        const category = match[1].trim();
        const amount = match[2].trim();
        const isTotal = /TOTAL|AMOUNT REQUESTED/i.test(category);
        const isMatching = /Matching Funds|Less Matching/i.test(category);
        
        rows.push({ category, amount, isTotal, isMatching });
        matched = true;
        break;
      }
    }
  }
  
  return rows;
}

// Render budget table using jspdf-autotable
function renderBudgetTable(
  doc: jsPDF,
  budgetData: Array<{ category: string; amount: string; isTotal: boolean; isMatching: boolean }>,
  startY: number,
  margin: number,
  maxWidth: number
): number {
  autoTable(doc, {
    startY: startY,
    head: [['Category', 'Amount']],
    body: budgetData.map(row => [row.category, row.amount]),
    
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left'
    },
    
    bodyStyles: {
      fontSize: 10,
      cellPadding: 5,
      textColor: [0, 0, 0]
    },
    
    columnStyles: {
      0: { halign: 'left', cellWidth: maxWidth * 0.65 },
      1: { halign: 'right', cellWidth: maxWidth * 0.35 }
    },
    
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rowData = budgetData[data.row.index];
        
        if (rowData?.isTotal) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [220, 220, 220];
          data.cell.styles.fontSize = 11;
        } else if (rowData?.isMatching) {
          data.cell.styles.fontStyle = 'italic';
          data.cell.styles.textColor = [100, 100, 100];
        } else if (data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [245, 245, 245];
        }
      }
    },
    
    margin: { left: margin, right: margin }
  });
  
  return (doc as any).lastAutoTable.finalY + 10;
}

// Add formatted text with enhanced section header detection
function addFormattedText(
  doc: jsPDF,
  text: string,
  startY: number,
  margin: number,
  maxWidth: number,
  pageHeight: number
): number {
  let yPosition = startY;
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.trim() === '') {
      yPosition += 3;
      continue;
    }
    
    // Detect section headers
    const isHeader = line.match(/^[A-Z\s]{3,}:?\s*$/) || 
                     line.match(/^\d+\.\s+[A-Z]/) ||
                     line.match(/^[A-Z][A-Z\s]+[A-Z]$/);
    
    if (isHeader) {
      yPosition += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(41, 55, 72);
    } else {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    }
    
    if (yPosition > pageHeight - margin - 20) {
      doc.addPage();
      yPosition = margin;
    }
    
    const wrappedLines = doc.splitTextToSize(line, maxWidth);
    wrappedLines.forEach((wrappedLine: string) => {
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(wrappedLine, margin, yPosition);
      yPosition += isHeader ? 7 : 5.5;
    });
    
    if (isHeader) yPosition += 3;
  }
  
  return yPosition;
}

export function generateGrantProposalPDF(
  proposal: string,
  loi: string,
  organizationName: string,
  projectTitle: string,
  contactInfo: GrantContactInfo
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add footer
  const addFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Generated by PivotHub | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.setTextColor(0, 0, 0);
    }
  };

  // Header Section
  doc.setFillColor(41, 55, 72);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(organizationName, margin, 20);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(projectTitle, margin, 32);
  
  doc.setTextColor(0, 0, 0);
  yPosition = 55;

  // Contact Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Contact Information', margin, yPosition);
  yPosition += 7;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${contactInfo.name}, ${contactInfo.title}`, margin, yPosition);
  yPosition += 5.5;
  doc.text(`Email: ${contactInfo.email} | Phone: ${contactInfo.phone}`, margin, yPosition);
  yPosition += 12;

  // Full Grant Proposal Section
  doc.setFillColor(59, 130, 246);
  doc.rect(margin, yPosition, maxWidth, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Full Grant Proposal', margin + 5, yPosition + 6);
  doc.setTextColor(0, 0, 0);
  yPosition += 15;

  // Detect and handle budget table in proposal
  const budgetExtraction = extractBudgetTable(proposal);
  
  if (budgetExtraction.hasTable && budgetExtraction.tableData) {
    // Render text before budget table
    yPosition = addFormattedText(
      doc,
      budgetExtraction.beforeTable,
      yPosition,
      margin,
      maxWidth,
      pageHeight
    );
    
    // Render budget table
    yPosition = renderBudgetTable(
      doc,
      budgetExtraction.tableData,
      yPosition,
      margin,
      maxWidth
    );
    
    // Render text after budget table
    yPosition = addFormattedText(
      doc,
      budgetExtraction.afterTable,
      yPosition,
      margin,
      maxWidth,
      pageHeight
    );
  } else {
    // No budget table - render all as formatted text
    yPosition = addFormattedText(
      doc,
      proposal,
      yPosition,
      margin,
      maxWidth,
      pageHeight
    );
  }

  yPosition += 15;

  // Letter of Intent Section
  if (loi) {
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFillColor(16, 185, 129);
    doc.rect(margin, yPosition, maxWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Letter of Intent', margin + 5, yPosition + 6);
    doc.setTextColor(0, 0, 0);
    yPosition += 15;

    // Detect and handle budget table in LOI
    const loiBudgetExtraction = extractBudgetTable(loi);
    
    if (loiBudgetExtraction.hasTable && loiBudgetExtraction.tableData) {
      yPosition = addFormattedText(
        doc,
        loiBudgetExtraction.beforeTable,
        yPosition,
        margin,
        maxWidth,
        pageHeight
      );
      
      yPosition = renderBudgetTable(
        doc,
        loiBudgetExtraction.tableData,
        yPosition,
        margin,
        maxWidth
      );
      
      yPosition = addFormattedText(
        doc,
        loiBudgetExtraction.afterTable,
        yPosition,
        margin,
        maxWidth,
        pageHeight
      );
    } else {
      yPosition = addFormattedText(
        doc,
        loi,
        yPosition,
        margin,
        maxWidth,
        pageHeight
      );
    }
  }

  // Add footers to all pages
  addFooter();

  // Validate PDF size before returning (max 5MB)
  const pdfOutput = doc.output('arraybuffer');
  const pdfSize = pdfOutput.byteLength;
  const maxSize = 5 * 1024 * 1024; // 5MB limit
  
  if (pdfSize > maxSize) {
    throw new Error('Generated PDF exceeds maximum size limit (5MB). Please reduce content length.');
  }

  return doc;
}
